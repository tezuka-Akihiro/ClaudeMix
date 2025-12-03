---
slug: "remix-css-loading-issue"
title: "Remix + Cloudflare WorkersでCSS読み込み問題を解決: パスエイリアスとSSRの落とし穴"
author: "ClaudeMix Team"
publishedAt: "2025-11-21"
category: "Tutorials & Use Cases"
description: "RemixとCloudflare Workers環境で発生したCSS読み込み問題を解決するデバッグプロセスを解説。パスエイリアス、SSRレンダリングの不整合、開発環境設定の誤りといった複数の原因を特定し、`wrangler pages dev`とViteプラグインを使った正しい開発方法を明らかにします。"
tags: ["SSR", "Vite", "Workers", "troubleshooting"]
---

# Remix + Cloudflare WorkersでCSS読み込み問題を解決: パスエイリアスとSSRの落とし穴

## 📝 概要

コミット `0c1c665` でCSSが突然読み込まれなくなる問題が発生しました。この記事では、問題の発見から原因特定、そして解決に至るまでのデバッグプロセスを詳細に記録します。特に、Remix + Cloudflare Workers環境特有の注意点について解説します。

## 🎯 問題の発見

### 症状

- コミット `0c1c665` 以降、CSSが読み込まれない
- ビルドは成功するが、ブラウザでスタイルが適用されない
- 開発サーバー起動時にエラーが発生

### 初期調査

```bash
git show 0c1c665 --stat
```

このコミットで変更されたファイル:
- `app/entry.client.tsx`: CSSインポートの追加
- `app/entry.server.tsx`: レンダリング方式の変更
- `app/styles/globals.css`: `@import`文の削除

## 🔍 根本原因の特定

### 原因1: パスエイリアスの解決失敗

**問題のコード** (`app/entry.client.tsx`):
```typescript
import "~/styles/globals.css";
import "~/styles/service-name/layer2.css";
import "~/styles/blog/layer2.css";
```

**なぜ問題なのか:**
- `entry.client.tsx`はクライアントサイドでのみ実行される
- SSR時にはこれらのCSSが含まれない
- `~`エイリアスがビルド時に解決されない場合がある

**正しいアプローチ:**
```typescript
import "./styles/globals.css";
import "./styles/service-name/layer2.css";
import "./styles/blog/layer2.css";
```

相対パスを使用することで、Viteが確実にパスを解決できます。

### 原因2: レンダリング環境の不整合

**問題のコード** (`app/entry.server.tsx`):
```typescript
// Node.js用のレンダリング
import { renderToPipeableStream } from "react-dom/server";
import { PassThrough } from "node:stream";
```

**なぜ問題なのか:**
- プロジェクトはCloudflare Workers向けに設定
- `vite.config.ts`で`ssr.noExternal: true`が設定されている
- `wrangler.toml`にCloudflare Workers設定が存在
- Node.js APIは使用できない

**正しいアプローチ:**
```typescript
// Cloudflare Workers用のレンダリング
import { renderToReadableStream } from "react-dom/server";
import type { AppLoadContext, EntryContext } from "@remix-run/cloudflare";

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
  loadContext: AppLoadContext
) {
  const body = await renderToReadableStream(
    <RemixServer
      context={remixContext}
      url={request.url}
      abortDelay={ABORT_DELAY}
    />,
    {
      signal: controller.signal,
      onError(error: unknown) {
        if (!controller.signal.aborted) {
          console.error(error);
        }
        responseStatusCode = 500;
      },
    }
  );

  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
```

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
```
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

## 💡 学んだこと

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
|------|----------------|-------------------|
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

## 🎓 まとめ

今回のCSS読み込み問題から学んだ重要なポイント:

1. **環境の整合性**: 開発環境とデプロイ環境を一致させる
2. **パス解決**: CSSには相対パスを使用し、ビルド時の解決を確実にする
3. **SSR考慮**: クライアントサイドだけでなく、SSR時の動作も考慮する
4. **段階的デバッグ**: git diff → build → 検証の順で問題を特定
5. **ドキュメント確認**: Remix、Vite、Cloudflare Workersのドキュメントを参照

## 🔗 参考リソース

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

---

**教訓**: 環境の違いを理解し、適切なツールと設定を使用することで、多くのデバッグ時間を節約できます。
