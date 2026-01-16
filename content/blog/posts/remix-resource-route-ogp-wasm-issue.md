---
slug: "remix-resource-route-ogp-wasm-issue"
title: "RemixのResource RouteでOGP画像を生成する際にハマったWASM問題とその解決法"
description: "RemixでOGP画像生成を実装したらローカルは動くのにCloudflare Workersでビルドエラー。workers-ogのWASM読み込みが原因で発生した「Could not resolve」エラーを、vite.config.tsのssr.external設定で解決した全プロセスを記録します。"
author: "ClaudeMix Team"
publishedAt: "2025-12-16"
category: "Claude Best Practices"
tags: ["Workers", "troubleshooting", "Vite"]
freeContentHeading: "💡 根本原因の特定"
---

RemixでOGP画像生成を実装しようとして、`workers-og`ライブラリをインストールしました。
ローカル開発環境（`npm run dev`）では完璧に動作していたので、本番ビルドも問題ないだろうと思っていました。
しかし、Wrangler（Cloudflare Workers環境）でビルドすると、`Could not resolve "workers-og"`というエラーが発生し、動かなくなってしまいました。

## この記事をお勧めしない人

ローカル開発環境と本番環境で動作が異なることを、当然のこととして受け入れられる人。
エラーメッセージを読まずに、Stack Overflowで解決策を探し続けることに時間を使える人。
Viteの`ssr.external`設定の意味を理解する必要性を、全く感じていない人。

もし一つでも当てはまらないなら、読み進める価値があるかもしれません。

## 行動しないリスク

ビルドエラーを放置することで、あなたのプロジェクトには「開発環境と本番環境の差異」という見えない技術的負債が静かに蓄積されていきます。
やがて、デプロイ直前になってビルドエラーに気づき、リリーススケジュールが大幅に遅れる事態が発生します。
ついに、チームメンバーからの信頼を失い、プロジェクトは炎上し、あなたは「なぜローカルで動いていたのに」と後悔することになります。

## この記事を読めば得られる未来

この記事を読めば、Viteの`ssr.external`設定を使ってCloudflare Workers専用ライブラリのビルドエラーを解決する知識が手に入ります。
具体的には、`workers-og`のWASM読み込み問題を、vite.config.tsの1行で解決する設計図を手に入れられます。
この方法は、机上の空論ではありません。まさにこのブログのOGP画像生成で実証済みです。
この情報は、単なる「エラーを消す」という対処療法ではなく、Cloudflare Workers環境のWASM制約を理解した上での根本的な解決策という、実践から得られた一次情報です。

## なぜこの記事が信頼できるのか

筆者も過去に同じビルドエラーで悩み抜き、このブログのOGP画像生成を「vite.config.tsの適切な設定」で作り上げることで解決しました。
この記事では、あなたのプロジェクトのビルドエラーを発見する基本的な考え方と、明日から試せるssr.external設定の使い方を持ち帰れるように書きました。
さらに深掘りして、Cloudflare Workers環境でのWASM制約の全体像を知りたい方は、以降の詳細な実装方法を確認できます。

## 📝 概要

Web標準に基づくフレームワークと最新のエッジ環境を組み合わせてOGP画像を動的生成する機能を実装した際、ローカル開発環境では正常に動作するのに、本番ビルドでエラーが発生するという典型的な環境依存問題に遭遇しました。

エラーメッセージは一見複雑でしたが、原因はシンプルで、解決策も明快でした。この記事では、エラーの発見から原因特定、そして解決に至るまでのプロセスを記録します。

### 発生環境の特徴

- **アーキテクチャ**: モダンフレームワーク + エッジランタイム
- **画像生成**: サーバーサイドでの動的生成
- **環境差異**: ローカル: ✅ 動作、本番ビルド: ❌ エラー

## ⚠️ 問題の発見と症状

ローカル開発サーバーをエッジ環境のエミュレータで起動すると、ビルドエラーが発生しました。

### 症状の整理

- ✅ ローカル開発サーバー: 正常動作
- ❌ エッジ環境エミュレータ: エラー
- ❌ 本番ビルド: ビルドエラー

**重要な気づき:**

Node.js環境の開発サーバーでは動作するが、エッジランタイム環境向けのビルドでは失敗するという環境依存の問題でした。

## 🔍 原因の絞り込みプロセス

複数の仮説を立てて検証しました：

1. **パッケージのインストール問題**: 依存関係が正しくインストールされているか確認
2. **ビルドツールの設定不足**: バンドラーの設定を見直し
3. **エラーメッセージの精読**: エラーが示唆する解決策を分析

調査の結果、エラーメッセージが重要なヒントを含んでいることに気づきました。

## 💡 根本原因の特定

調査の結果、以下の問題が根本原因であると特定しました。

### 画像生成ライブラリの内部構造

使用した画像生成ライブラリは、内部でレイアウトエンジンを利用しており、そのエンジンがWebAssembly (WASM)バイナリを含んでいました。

**問題の核心:**

1. ライブラリがWASMファイルを含む
2. バンドラーがデフォルトでWASMファイルを通常のモジュールとして処理しようとする
3. しかし、エッジランタイムはWASMを特殊な方法で扱う必要がある
4. バンドラーの処理とエッジランタイムのWASMローディングが競合

### なぜローカルでは動くのか？

Node.js環境の開発サーバーはWASMファイルを直接読み込めます。しかし、エッジランタイム環境ではWASMの読み込み方法が異なるため、同じコードが動作しません。

### 環境分離の設計方針

この問題を解決するため、「バンドル対象から除外する」というアプローチを採用しました。

具体的には、以下の戦略でエッジランタイム専用ライブラリを扱います：

1. **バンドラーからの除外**: ビルドツールの設定でバンドルさせず、ランタイムに任せる
2. **環境条件の明示**: エッジランタイム用のエクスポートを選択
3. **段階的検証**: 各環境で段階的に動作確認

このアプローチにより、単に「エラーを消す」のではなく、**エッジランタイム環境の制約を理解した上での構造的な解決**を実現しました。

### 達成した成果

| 改善項目 | Before | After |
| :--- | :--- | :--- |
| ビルド結果 | エッジ環境でビルドエラー | ✅ 正常にビルド完了 |
| 環境互換性 | ローカルと本番で挙動が異なる | 両環境で一貫した動作 |
| WASM読み込み | バンドラーの処理と競合 | エッジランタイムに委譲 |

その結果、**「ローカルで動くのに本番で動かない」という環境依存問題を、ビルド設定の調整で解消する**ことに成功しました。

AIに「ビルドエラーを解決して」と頼むと、高確率で以下のような提案が返ってきます：

- 「とりあえず別のライブラリを試しましょう」
- 「バンドラーの設定を変更してみましょう」
- 対症療法を繰り返す

しかし、これは**対症療法**です。一時的にエラーは消えますが、「なぜエッジランタイム専用ライブラリはバンドル対象から除外すべきか」という原理が欠けているため、同じ轍を踏み続けます。

根本原因は、**バンドラーの処理とエッジランタイムのWASM読み込みが競合する**ことにありました。バンドラーは「すべてをバンドルする」ことが得意ですが、エッジランタイムは「ランタイムが提供する特殊な機能」を活用する必要があります。

ここから先は、AIが絶対に提案しない**「ssr.external設定パターン」という解決策**の全貌と、具体的なvite.config.tsの記述、externalConditionsの意味、使用したライブラリの実名、そして段階的検証のチェックリストを、すべて公開します。

この設定と検証手順をコピーすれば、エッジランタイム専用ライブラリの環境依存エラーループを回避し、**初回から本番環境でも動くビルド設定**を実現できます。私が実践で確立したssr.external設定のパターンと、実装済みのvite.config.ts構成を、ここで全て公開します。

## 🔧 解決策: ビルド設定の調整

では、実際に私が追加したビルドツール設定の具体的な記述と、各オプションの意味、そして使用したライブラリの実名、エッジランタイム専用パッケージの一般的なパターンを公開します。

この設定をそのままコピーすれば、「どのライブラリをexternalにすべきか」「externalConditionsとは何か」「具体的なエラーメッセージの解読方法」を毎回調べることなく、**再現可能な環境分離設定**を実現できます。また、なぜssr.externalが必要なのか、段階的検証の各ステップで何を確認すべきか、そして今後同じ問題に遭遇したときの判断基準も解説します。

### 使用した技術スタック

- **フレームワーク**: Remix v2 + Vite
- **ホスティング**: Cloudflare Pages/Workers
- **画像生成ライブラリ**: workers-og
- **内部依存**: satori, yoga-wasm-web

### 発生したエラーメッセージ

Wrangler（Cloudflare Workers エミュレータ）でビルドすると、以下のエラーが発生しました：

```text
X [ERROR] Could not resolve "workers-og"

    app/routes/ogp.$slug[.png].tsx:5:31:
      5 │ import { ImageResponse } from 'workers-og';
        ╵                                ~~~~~~~~~~~~

  The package "workers-og" wasn't found on the file system but is built into node.
  Add "workers-og" to the "external" option to exclude it from the bundle, which
  will remove this error and leave the unresolved path in the bundle.
```

さらに詳細なエラー：

```text
X [ERROR] Could not load yoga-ZMNYPE6Z.wasm (imported by /__vite-browser-external:yoga-wasm-web):
    Reading from "yoga-wasm-web" is not handled by any plugin
```

### workers-ogの内部アーキテクチャ

`workers-og`は以下のライブラリを使用しています：

```text
workers-og
  └─ satori (SVG生成)
      └─ yoga-wasm-web (レイアウトエンジン)
          └─ yoga.wasm (WebAssembly バイナリ)
```

この依存関係が、WASM読み込みの競合を引き起こしていました。

### vite.config.tsの修正

エラーメッセージのヒントに従い、`ssr.external`設定を追加しました。

[vite.config.ts:1](vite.config.ts#L1)

```diff
export default defineConfig({
  plugins: [
    remix({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        v3_singleFetch: true,
        v3_lazyRouteDiscovery: true,
      },
    }),
    tsconfigPaths(),
  ],
  ssr: {
    resolve: {
      externalConditions: ["workerd", "worker"],
    },
+   external: ["workers-og"],
  },
});
```

### 設定の意味

**`ssr.external: ["workers-og"]`**

- Viteに`workers-og`パッケージをバンドル対象から除外するよう指示
- `workers-og`はCloudflare Workersのランタイムが提供するものとして扱う
- WASMファイルの読み込みはCloudflare Workersに任せる

**`externalConditions: ["workerd", "worker"]`**

- Cloudflare Workers環境（workerd）用のパッケージ解決条件を指定
- `workers-og`がCloudflare Workers用のエクスポートを選択できるようにする

---

## 🎓 学んだこと・まとめ

### 技術的な学び

1. **エラーメッセージを丁寧に読む重要性**
   - エラーメッセージに解決策が書かれていることが多い
   - 焦らず、一語一句確認することが大切

2. **開発環境と本番環境の違いを理解する**
   - **Vite開発サーバー**: Node.js環境、柔軟
   - **Cloudflare Workers**: V8 Isolates、制約あり
   - ローカルで動いても本番で動かないのは、環境の違いが原因

3. **プラットフォーム専用ライブラリの扱い方**
   - Cloudflare Workers専用ライブラリは、バンドラーから除外するのが定石
   - `ssr.external`設定でランタイムに任せる

4. **WASMの扱いは環境依存**
   - Cloudflare Workersは事前コンパイル済みWASMのみサポート
   - 動的WASM生成は禁止
   - ランタイムがWASMを適切に読み込む仕組みを壊さない

### 今後のベストプラクティス

1. **エラーメッセージは宝の山**
   - エラーメッセージに解決策が書かれていることを意識する
   - Stack Overflowに飛ぶ前に、まずエラーを丁寧に読む

2. **段階的なデバッグアプローチ**
   - ローカル開発（Vite）で動作確認
   - Wranglerで動作確認
   - ビルドで動作確認
   - デプロイで動作確認
   - 各段階で問題を切り分けることで、原因特定が容易に

3. **Cloudflare Workers専用ライブラリのパターン**

   ```typescript
   // vite.config.ts のパターン
   ssr: {
     external: [
       "workers-og",           // OGP画像生成
       "@cloudflare/ai",       // Cloudflare AI
       // その他のWorkers専用パッケージ
     ],
   }
   ```

---

## 🔗 関連リソース

- [Vite - SSR External](https://vitejs.dev/config/ssr-options.html#ssr-external)
- [Cloudflare Workers - WebAssembly](https://developers.cloudflare.com/workers/runtime-apis/webassembly/)
- [workers-og GitHub](https://github.com/kvnang/workers-og)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- [Remix × Cloudflare Workers で実現する動的OGP画像生成](./remix-cloudflare-workers-ogp-generation)
- [Cloudflare WorkersのWebAssembly制約をビルド時HTML変換で乗り越える](./cloudflare-workers-shiki-build-time-html)
