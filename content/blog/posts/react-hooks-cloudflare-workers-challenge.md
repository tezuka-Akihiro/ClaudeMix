---
slug: "react-hooks-cloudflare-workers-challenge"
title: "Cloudflare Workers における React Hooks エラーとの戦い：重複バンドル問題の深堀り"
publishedAt: "2025-11-22"
category: "ClaudeMix 考察"
summary: "Remix × Cloudflare Workers 環境で発生した React Hooks エラーの原因究明から、一時的な回避策の実装まで。React の重複バンドル問題がもたらす影響と、その解決に向けた試行錯誤の記録。"
description: "Remix × Cloudflare Workers 環境で発生した React Hooks エラーの原因究明から、一時的な回避策の実装まで。React の重複バンドル問題がもたらす影響と、その解決に向けた試行錯誤の記録。"
tags: ["React", "Pages", "Vite", "SSR", "troubleshooting"]
author: "ClaudeMix Team"
freeContentHeading: "💡 根本原因の特定"
---
## はじめに

### React × Cloudflare環境でこんなことありませんか？

- ローカルでは完璧に動いていたRemixアプリが、デプロイした途端に謎のHooksエラーで動かなくなった。
- `useState` が `null` という意味不明なメッセージに対し、ライブラリのバージョンを疑って数時間を浪費した。
- 対症療法で一時的に回避はしたが、根本原因が分からず再発の不安を抱えたまま開発を続けている。

### この記事をお勧めしない人

- ローカル環境と本番環境の違いを意識せず、とりあえず動けば良いと考える人。
- ビルドツールの設定や依存関係の解決といった、複雑な問題の探究を非効率だと考える人。
- AIとの協調開発を通じて、真のデバッグスキルを磨くことに関心がない人。

もし一つでも当てはまらないなら、読み進める価値があるかもしれません。

### 蓄積される「環境依存の技術的負債」

- 環境依存の問題を放置すると、プロジェクトには「再現性のないバグ」が静かに蓄積されていく。
- ライブラリのアップデートをきっかけに潜在していた不整合が爆発し、デプロイが完全に不可能になる。
- 最終的に本番環境の制約を恐れるようになり、技術革新から取り残された保守不可能な負債へと変わる。

### 開発環境の完全同期という明るい未来

- この記事を読めば、Cloudflare Workers環境におけるReactの「重複バンドル問題」の根本原因と、正しい解決策が手に入る。
- 具体的には、Viteプラグインを活用してローカル開発環境を本番と完全に一致させる設計図を手に入れられる。
- この方法は、本ブログ自身が直面し、解決した実証済みのプロセスであり、同様の課題を持つ開発者への福音となる。
- この情報は、サーバーレス環境特有の依存関係問題を体系的に突破するための、未来の開発現場から得られた一次情報である。

### 私も同じでした

筆者も過去に同じエラーで悩み抜き、このブログを「AIによる実装」と「人間による設計」で作り上げる過程でこの解決策を見つけました。
この記事で、サーバーレス環境における依存関係の問題を理解するための基本的な考え方と、明日から試せるTipsを持ち帰れるように書きました。
さらに深掘りして、AIに高品質なコードを生成させるための"ガードレール設計"を知りたい方は、その詳細な実装方法を確認できます。

## 📝 概要

モダンなWeb標準フレームワークとエッジ環境を組み合わせたブログアプリを動作させる際に、予期せぬ **React Hooks（※）** エラーに遭遇しました。この記事では、問題の発見から原因の特定、そして最終的に**開発環境設定の誤り**を突き止め、解決に至るまでの全プロセスを記録します。

> ※ **React Hooks**: Reactのコンポーネントに状態管理や副作用といった機能を追加するための仕組み。`useState`や`useEffect`が代表的。

### 発生環境の特徴

- **アーキテクチャ**: モダンフレームワーク + エッジランタイム
- **レンダリング**: サーバーサイドレンダリング（SSR）
- **環境差異**: ローカル: ✅ 動作、本番: ❌ エラー

## ⚠️ 問題の発見と症状

ローカル開発環境では問題なく動作するアプリが、エッジランタイム環境にデプロイすると、**React Hooks** を使用している全てのコンポーネントでエラーが発生し、ページが正常に表示されなくなりました。

**症状:**

- 特定のページを開くと500エラーになる
- ローカル開発環境では再現せず、デプロイ後にのみ発生する
- エラーメッセージが「Reactの重複」を示唆している

## 🔍 原因の絞り込みプロセス

複数の仮説を立てて検証しました：

1. **ライブラリのバージョン不整合**: 関連ライブラリのバージョンを確認
2. **ビルド設定の不備**: SSR設定を見直し
3. **開発コマンドの誤用**: 開発用とプレビュー用のコマンドを混同していないか調査

調査の結果、エラーメッセージが示唆していた「ライブラリの重複バンドル」が根本原因であることが判明しました。

## 💡 根本原因の特定

調査の結果、エラーメッセージが示唆していた**「ライブラリの重複バンドル（※）」**が根本原因であると特定しました。

> ※ **バンドル**: 複数のファイルを1つにまとめること。Webサイトの表示を速くするためによく使われます。

これは、2つの異なるビルドプロセスがそれぞれコアライブラリをバンドルに含めてしまうことで発生していました。

1. **開発用ビルドツール**: サーバー用のコード（SSRバンドル）を生成する際にライブラリがバンドルされる
2. **プレビューコマンド**: 別のプロセスとしてサーバーを起動する際、内部で再度ライブラリを含む依存関係をバンドルする

結果として、1つのアプリケーション内に2つの同じライブラリが存在する状態となり、Hooksが正しく動作しなくなっていたのです。

### 開発環境の統一戦略

この問題を解決するため、「開発コマンドの誤用を正す」というアプローチを採用しました。

具体的には、以下の戦略でローカル開発環境を本番と一致させます：

1. **公式プラグインの活用**: フレームワーク公式のプラグインで、ビルドツール内部でエッジ環境をシミュレート
2. **開発コマンドの正しい理解**: プレビューコマンドと開発コマンドを区別
3. **単一プロセス管理**: ビルドツールによってライブラリのバンドルを単一化し、重複を防止

このアプローチにより、単に「ライブラリをexternalにする」という対症療法ではなく、**開発環境と本番環境の一致を保証する構造的な解決**を実現しました。

### 達成した成果

| 改善項目 | Before | After |
| :--- | :--- | :--- |
| React Hooksエラー | デプロイ後に全てのページで発生 | ✅ 完全に解消 |
| 開発環境 | wrangler pages devで重複バンドル | Viteプラグインで単一バンドル |
| 環境一致性 | ローカルと本番で挙動が異なる | 両環境で一貫した動作 |

その結果、**「ローカルで動くのに本番で動かない」という環境依存問題を、開発コマンドの正しい使い分けで解消する**ことに成功しました。

AIに「ライブラリの重複エラーを解決して」と頼むと、高確率で以下のような提案が返ってきます：

- 「とりあえずライブラリをexternalにしましょう」
- 「別のビルド設定を試してみましょう」
- 対症療法を繰り返す

しかし、これは**アプローチの間違い**です。一時的にエラーは変化しますが、「なぜ重複が発生するのか」という原因に届いていないため、同じ問題が形を変えて再発します。

根本原因は、**開発コマンドとプレビューコマンドを誤用していた**ことにありました。プレビューコマンドはビルド後の確認用であり、開発サーバーとは別のプロセスとして動作するため、ライブラリが二重にバンドルされます。

ここから先は、公式ドキュメントにも明記されていない**「公式プラグインによる開発環境統一」という解決策**の全貌と、具体的なvite.config.tsとpackage.jsonの修正差分、使用したプラグイン名、そして開発コマンドとプレビューコマンドの正しい使い分けパターンを、すべて公開します。

この設定と使い分けをコピーすれば、ライブラリの重複バンドル問題ループを回避し、**初回からローカルと本番で一貫した動作**を実現できます。私が実践で確立した開発環境の設定パターンと、実装済みのvite.config.ts構成、具体的なエラーメッセージと検証手順を、ここで全て公開します。

## 🔧 解決策: 開発環境の正しい設定

では、実際に私が修正したvite.config.tsとpackage.jsonの具体的な差分と、使用した具体的なプラグイン名（cloudflareDevProxyVitePlugin）、発生した実際のエラーメッセージ、そして開発コマンドとプレビューコマンドの正しい使い分けパターンを公開します。

この設定をそのままコピーすれば、「どのプラグインを追加すべきか」「開発とプレビューの違いは何か」「React 重複エラーの具体的な解決手順」を毎回調べることなく、**再現可能な開発環境統一**を実現できます。また、なぜViteプラグインが重複バンドルを防ぐのか、公式プラグインが環境差異を吸収する仕組み、そして今後同じ環境依存問題に遭遇したときの判断基準も解説します。

### 使用した技術スタック

- **フレームワーク**: Remix v2
- **ホスティング**: Cloudflare Pages/Workers
- **ビルドツール**: Vite
- **公式プラグイン**: cloudflareDevProxyVitePlugin

### 発生した実際のエラーメッセージ

```text
Warning: Invalid hook call. Hooks can only be called inside of the body
of a function component. This could happen for one of the following reasons:
...
3. You might have more than one copy of React in the same app
```

### 問題の本質

**開発用のコマンドとして、プレビュー用の `wrangler pages dev` を誤って使用していた**ことでした。

RemixとCloudflare Workersを連携させるための正しい開発方法は、Viteの開発サーバー内でCloudflare環境をシミュレートする公式プラグイン（cloudflareDevProxyVitePlugin）を利用することです。

### ステップ1: vite.config.tsの修正

`@remix-run/dev` から `cloudflareDevProxyVitePlugin` をインポートし、Viteのプラグインに追加します。

```diff
--- a/vite.config.ts
+++ b/vite.config.ts
@@ -1,11 +1,16 @@
-import { vitePlugin as remix } from "@remix-run/dev";
+import { vitePlugin as remix, cloudflareDevProxyVitePlugin } from "@remix-run/dev";
 import { defineConfig } from "vite";
 import tsconfigPaths from "vite-tsconfig-paths";
 import path from "path";
 
 export default defineConfig({
   plugins: [
-    remix({
-      future: {
-        v3_relativeSplatPath: true,
-      },
-    }),
+    cloudflareDevProxyVitePlugin(),
+    remix({
+      future: {
+        v3_relativeSplatPath: true,
+      },
+      serverModuleFormat: "esm",
+    }),
     tsconfigPaths(),
   ],
   resolve: {
```

### ステップ2: package.jsonの修正

開発用の `dev` スクリプトを、Wranglerを使わない `remix vite:dev` に変更します。

```diff
--- a/package.json
+++ b/package.json
@@ -17,8 +17,7 @@
     "test:e2e:ui": "playwright test --ui -c tests/e2e/playwright.config.ts",
     "test:e2e:headed": "playwright test --headed -c tests/e2e/playwright.config.ts",
     "test:e2e:debug": "playwright test --debug -c tests/e2e/playwright.config.ts",
-    "test:e2e:report": "playwright show-report --config tests/e2e/playwright.config.ts",
-    "dev": "cross-env NODE_OPTIONS=--max-old-space-size=4096 remix vite:dev",
-    "dev:wrangler": "npm run build && wrangler pages dev ./build/client --compatibility-date=2024-09-23 --compatibility-flags=nodejs_compat",
+    "test:e2e:report": "playwright show-report --config tests/e2e/playwright.config.ts",    
+    "dev": "remix vite:dev",
     "preview": "npm run build && wrangler pages dev ./build/client --compatibility-date=2024-09-23 --compatibility-flags=nodejs_compat --port=8788",
     "start": "cross-env NODE_ENV=production node ./server.js",
     "typecheck": "tsc && tsc -p tests/e2e/tsconfig.json",
```

この修正により、開発サーバーはViteによって単一のプロセスで管理され、Reactの重複バンドル問題が解消されます。

---

## 🎓 学んだこと・まとめ

### 技術的な学び

- **Reactの重複バンドル問題**: SSR環境、特に複数のビルドプロセスが絡むサーバーレス環境では、Reactが複数回バンドルされることでHooksエラーが発生しやすい。
- **開発コマンドの正しい理解**: `wrangler pages dev` は本番ビルド後の「プレビュー」用であり、Viteと連携する「開発」用コマンドではない。

### 今後のベストプラクティス

- **公式プラグインを信頼する**: `cloudflareDevProxyVitePlugin` のような公式の連携プラグインは、複雑な環境差異を吸収してくれるため、積極的に利用する。
- **開発環境と本番環境を一致させる**: ローカル開発の段階から、本番に近い環境をシミュレートすることで、デプロイ後の予期せぬエラーを未然に防ぐことができる。

---

## 関連リソース

- Remix Vite Guide - Cloudflare
