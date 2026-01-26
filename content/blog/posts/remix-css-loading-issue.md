---
slug: "remix-css-loading-issue"
title: "Remix + Cloudflare WorkersでCSS読み込み問題を解決: パスエイリアスとSSRの落とし穴"
author: "ClaudeMix Team"
publishedAt: "2025-11-21"
category: "記録"
description: "RemixとCloudflare Workers環境で発生したCSS読み込み問題を解決するデバッグプロセスを解説。パスエイリアス、SSRレンダリングの不整合、開発環境設定の誤りといった複数の原因を特定し、`wrangler pages dev`とViteプラグインを使った正しい開発方法を明らかにします。"
tags: ["SSR", "Vite", "Workers", "troubleshooting"]
freeContentHeading: "💡 根本原因の特定"
---

## はじめに

### Remix開発でこんなことありませんか？

RemixとCloudflare Workersで最新のWebアプリを作ろうとした。
しかし、ビルドは成功するのにCSSが読み込まれず、スタイルが全く適用されない状態になってしまった。
なんとかパスを修正してみたが、根本的な原因が分からず、同じ問題が何度も発生してしまった。

### この記事をお勧めしない人

- ローカルで動けばそれで十分で、エッジ環境（※Cloudflare Workersのような、世界中に分散配置されたサーバー環境）の制約など気にしない人。
- SSR（Server-Side Rendering、サーバー側でHTMLを生成する仕組み）とクライアントレンダリングの違いは、単なる実装の詳細でしかないと考える人。
- パスエイリアスとビルドツールの関係性を理解する必要性を、全く感じていない人。

もし一つでも当てはまらないなら、読み進める価値があるかもしれません。

### このままでは危険です

パスエイリアスやSSRの設定を曖昧なまま開発を続けることで、あなたのプロジェクトには「環境依存の見えない爆弾」が静かに蓄積されていきます。
やがて、デプロイ直前になって「ローカルでは動いていたのに」という事態が発生し、リリーススケジュールが大幅に遅れるでしょう。
ついに、チームメンバーからの信頼を失い、プロジェクトは炎上し、あなたのサイトは「表示が崩れた」という評判だけが残る"デジタル廃墟"と化すかもしれません。

### こんな未来が手に入ります

この記事を読めば、RemixとCloudflare Workers環境での正しいCSS読み込み方法と、SSRに対応した開発環境設定の知識が手に入ります。
具体的には、パスエイリアスの落とし穴とエッジランタイム（※Cloudflare Workersのような、Node.jsとは異なる実行環境）での正しいレンダリング方式を理解し、`wrangler pages dev`を使った開発環境の**設計図**を手に入れられます。
この方法は、机上の空論ではありません。まさに**このブログ自身のアーキテクチャとして実証済み**です。
この情報は、単なる「エラーを消す」という対処療法ではなく、環境の違いを理解し、適切なツールと設定を使用する**未来の開発現場から得られた一次情報**です。

### 私も同じでした

筆者も過去に同じCSS読み込み問題で悩み抜き、このブログを「エッジランタイムに最適化された設計」で作り上げることで解決しました。
この記事で、あなたのプロジェクトのビルドエラーを発見する基本的な考え方と、明日から試せるデバッグ手法を持ち帰れるように書きました。
さらに深掘りして、RemixとCloudflare Workers環境でのベストプラクティスを知りたい方は、その詳細な実装方法を確認できます。

## 📝 概要

コミット `0c1c665` でCSSが突然読み込まれなくなる問題が発生しました。この記事では、問題の発見から原因特定、そして解決に至るまでのデバッグプロセスを詳細に記録します。特に、Remix + Cloudflare Workers環境特有の注意点について解説します。

### 発生環境

- **フレームワーク**: Remix v2
- **ホスティング**: Cloudflare Workers
- **ビルドツール**: Vite

## ⚠️ 問題の発見と症状

### 症状

- コミット `0c1c665` 以降、CSSが読み込まれない
- ビルドは成功するが、ブラウザでスタイルが適用されない
- 開発サーバー起動時にエラーが発生

### 初期調査

問題のコミットを調査したところ、以下の変更が行われていました：

- クライアント側のエントリーポイント: CSSインポートの追加
- サーバー側のエントリーポイント: レンダリング方式の変更
- グローバルスタイル: インポート文の削除

## 🔍 調査と試行錯誤のプロセス

### 仮説1: パスエイリアスの問題ではないか？

クライアント側のエントリーポイントで、パスエイリアスを使ってCSSをインポートしていました。しかし、このアプローチには3つの問題がありました：

1. **クライアント専用実行**: このファイルはクライアントサイドでのみ実行されるため、SSR時にCSSが含まれない
2. **パス解決の不確実性**: ビルドツールがエイリアスを解決できない場合がある
3. **環境依存の挙動**: 開発環境とビルド環境でパス解決の挙動が異なる

### 仮説2: レンダリング環境の不整合を疑う

サーバー側のエントリーポイントで、異なるランタイム向けのレンダリングAPIを使用していました。プロジェクトはCloudflare Workers向けに設定されているにもかかわらず、Node.js専用のAPIを使用していたため、以下の問題が発生：

1. **ランタイムの不一致**: Workers環境ではNode.js専用のAPIが使用できない
2. **設定の矛盾**: ビルド設定はWorkers向けなのに、レンダリングコードはNode.js向け
3. **開発環境の誤り**: 開発サーバーがデプロイ環境と異なるランタイムで動作

## 💡 根本原因の特定

調査の結果、以下の2つの根本原因が特定されました。

1. **パスエイリアスの解決失敗**: クライアント側のエントリーポイントでパスエイリアスを使用していたため、ビルドツールがビルド時にパスを解決できませんでした。
2. **レンダリング環境の不整合**: サーバー側のエントリーポイントでNode.js用のレンダリングAPIを使用していたため、Cloudflare Workers環境では動作しませんでした。

これらの問題は、開発環境とデプロイ環境の違いを理解せず、設定を曖昧なままにしていたことが原因でした。

では、実際にどのようにこれらの問題を解決したのか。パスエイリアスと相対パスの違い、Node.js用とWorkers用のレンダリングAPIの具体的な書き分け、そして`wrangler pages dev`を使った正しい開発環境のセットアップ方法まで、すべて公開します。また、ビルド出力の検証方法や、curlを使ったCSS読み込み確認の具体的なコマンドも紹介します。

## 🔧 解決策

### ステップ1: CSSインポートの修正

`app/entry.client.tsx`でチルダエイリアスを相対パスに変更:

```diff
- import "~/styles/globals.css";
- import "~/styles/service-name/layer2.css";
- import "~/styles/blog/layer2.css";
+ import "./styles/globals.css";
+ import "./styles/service-name/layer2.css";
+ import "./styles/blog/layer2.css";
```

### ステップ2: レンダリング方式の復元

`app/entry.server.tsx`をCloudflare Workers用に復元しました。

### ステップ3: 開発環境の修正

`package.json`の`dev`スクリプトを更新:

```diff
- "dev": "remix dev",
+ "dev": "npm run build && wrangler pages dev ./build/client --compatibility-flag=nodejs_compat --port=3000",
```

**理由:**

- `remix dev`はNode.js環境で実行される
- Cloudflare Workers向けプロジェクトは`wrangler`を使用すべき
- これにより`renderToReadableStream`が正しく動作する

## ✅ 検証

### CSSバンドルの確認

```bash
npm run build
```

ビルド出力:

```text
build/client/assets/entry-DSeiBC_g.css  41.61 kB │ gzip:  6.68 kB
```

すべてのCSSが正しく1つのファイルにバンドルされています。

### HTMLの確認

```bash
curl -s http://localhost:3000/ | grep stylesheet
```

出力:

```html
<link rel="stylesheet" href="/assets/entry-DSeiBC_g.css"/>
```

CSSファイルが正しくリンクされています。

### CSSファイルのアクセス確認

```bash
curl -s http://localhost:3000/assets/entry-DSeiBC_g.css | head -20
```

CSSの内容:

- Googleフォント
- Tailwind CSS
- `globals.css`のカスタム変数
- `service-name/layer2.css`
- `blog/layer2.css`

すべてのCSSが含まれています！

## 🎓 学んだこと・まとめ

### 技術的な学び

### 1. Remixでのスタイリング方法

Remixには複数のスタイリング方法があります:

**方法A: entry.client.tsxでインポート** (今回の解決策)

```typescript
import "./styles/globals.css";
import "./styles/service-name/layer2.css";
import "./styles/blog/layer2.css";
```

利点:

- シンプル
- Viteが自動的にバンドル
- SSRとクライアントの両方で動作

注意点:

- 相対パスを使用すること
- `~`エイリアスはビルド時に解決されない場合がある

**方法B: root.tsxのlinks関数** (試したが複雑)

```typescript
import globalStyles from "~/styles/globals.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: globalStyles },
];
```

利点:

- Remixの推奨方法
- ルートごとにCSSを分離できる

欠点:

- `?url`クエリパラメータが必要
- パス解決が複雑

**方法C: globals.cssで@import** (最初に試したがエラー)

```css
@import './service-name/layer2.css';
@import './blog/layer2.css';
```

問題:

- Viteが`@import`を`file`ローダーで処理しようとする
- CSSファイルとして認識されない

### 2. Cloudflare Workers vs Node.js

開発環境とデプロイ環境の整合性が重要:

| 環境 | レンダリングAPI | モジュールシステム |
| --- | --- | --- |
| Node.js | `renderToPipeableStream` | CommonJS/ESM |
| Cloudflare Workers | `renderToReadableStream` | ESM only |

**教訓:**

- `vite.config.ts`と`wrangler.toml`の設定を確認
- 開発環境をデプロイ環境に合わせる
- `wrangler pages dev`を使用する

### 3. パスエイリアスの使用

TypeScriptのパスエイリアス設定(`tsconfig.json`):

```json
{
  "compilerOptions": {
    "paths": {
      "~/*": ["./app/*"]
    }
  }
}
```

これは**型チェック用**であり、ビルド時の解決は保証されません。

**ベストプラクティス:**

- CSSインポートには相対パスを使用
- TypeScript/JSXコードでは`~`エイリアスを使用可能
- `vite-tsconfig-paths`プラグインが解決を支援

### 4. デバッグのアプローチ

効果的なデバッグステップ:

1. **git showで変更を確認**

   ```bash
   git show <commit-hash>
   ```

2. **ビルド出力を確認**

   ```bash
   npm run build
   # CSSファイルがバンドルされているか確認
   ```

3. **ビルド済みファイルを検証**

   ```bash
   grep -n 'from "~' build/index.js
   # パスエイリアスが解決されていない場合に検出
   ```

4. **curlでHTMLとCSSを確認**

   ```bash
   curl -s http://localhost:3000/ | grep stylesheet
   curl -s http://localhost:3000/assets/entry-xxx.css | head -20
   ```

5. **設定ファイルの整合性確認**
   - `vite.config.ts`
   - `wrangler.toml`
   - `package.json` (devスクリプト)

### 今後のベストプラクティス

今回のCSS読み込み問題から学んだ重要なポイント:

1. **環境の整合性**: 開発環境とデプロイ環境を一致させる
2. **パス解決**: CSSには相対パスを使用し、ビルド時の解決を確実にする
3. **SSR考慮**: クライアントサイドだけでなく、SSR時の動作も考慮する
4. **段階的デバッグ**: git diff → build → 検証の順で問題を特定
5. **ドキュメント確認**: Remix、Vite、Cloudflare Workersのドキュメントを参照

## 🔗 関連リソース

- [Remix Styling Documentation](https://remix.run/docs/en/main/guides/styling)
- [Vite CSS Code Splitting](https://vitejs.dev/guide/features.html#css-code-splitting)
- [Cloudflare Workers Compatibility](https://developers.cloudflare.com/workers/runtime-apis/)
- [Wrangler Pages Dev](https://developers.cloudflare.com/pages/functions/local-development/)

## 📌 関連コミット

- 問題のコミット: `0c1c665`
- 修正コミット: `523247d`

```bash
git show 523247d
```
