---
slug: "react-hooks-cloudflare-workers-challenge"
title: "Cloudflare Workers における React Hooks エラーとの戦い：重複バンドル問題の深堀り"
author: "ClaudeMix Team"
publishedAt: "2025-11-22"
category: "ClaudeMix Philosophy"
summary: "Remix × Cloudflare Workers 環境で発生した React Hooks エラーの原因究明から、一時的な回避策の実装まで。React の重複バンドル問題がもたらす影響と、その解決に向けた試行錯誤の記録。"
tags: ["React", "Workers", "Vite", "SSR", "troubleshooting"]
---
## 📝 概要

Remix v2 + Vite で構築したブログアプリケーションを Cloudflare Workers 環境で動作させる際に、予期せぬ React Hooks エラーに遭遇しました。この記事では、問題の発見から原因の特定、そして一時的な回避策の実装までのプロセスを詳細に記録します。

## 🎯 背景

- **環境**: Remix v2 + Vite + Cloudflare Workers
- **問題**: ブログ記事詳細ページでコードブロックが正しく表示されない
- **初期症状**: `__CODE_BLOCK_` というプレースホルダーテキストが表示される

## ⚠️ 問題の発見

### フェーズ1: コードブロック表示の不具合

**症状:**

```text
記事本文のコードブロックが "__CODE_BLOCK_0__" のようなプレースホルダーとして表示される
```

**原因:**

- `markdownConverter.ts` がプレースホルダーベースの非同期処理を使用
- Shiki によるシンタックスハイライトが Cloudflare Workers 環境で正しく動作しない

**解決策:**
レンダラーベースの同期処理に変更し、基本的な HTML エスケープのみを使用

```typescript
// ❌ Before: プレースホルダーベース（非同期）
const codeBlocks = [];
marked.use({
  walkTokens: async (token) => {
    if (token.type === 'code') {
      const html = await shiki.codeToHtml(token.text, {
        lang: token.lang || 'text',
        theme: 'github-dark'
      });
      codeBlocks.push(html);
    }
  }
});

// ✅ After: レンダラーベース（同期）
const renderer = new marked.Renderer();
renderer.code = function(token: any): string {
  const escaped = token.text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return `<pre><code class="language-${token.lang}">${escaped}</code></pre>`;
};
```

**結果:**
✅ コードブロックが正常に表示される

---

### フェーズ2: React Hooks エラーの発生

コードブロックの問題を修正後、サーバーを起動すると新たなエラーが発生しました。

**エラーメッセージ:**

```text
TypeError: Cannot read properties of null (reading 'useState')
at useState (react.development.js:1634:21)
at BlogHeader (BlogHeader.tsx:17:3)

Warning: Invalid hook call. Hooks can only be called inside of the body
of a function component. This could happen for one of the following reasons:
1. You might have mismatching versions of React and the renderer
   (such as React DOM)
2. You might be breaking the Rules of Hooks
3. You might have more than one copy of React in the same app
```

**影響範囲:**

- ブログ詳細ページ: 500 Internal Server Error
- ブログインデックスページ: ページ読み込み時のハング
- 全ての React Hooks を使用するコンポーネントが失敗

**該当コンポーネント:**

- `BlogHeader` - メニュー状態管理に `useState` を使用
- `PostDetailSection` - Mermaid 図のレンダリングに `useEffect` を使用
- `PostCard` - ルーティングに `<Link>` を使用（内部で `useHref` などの Hooks を使用）
- `Pagination` - ページネーションリンクに `<Link>` を使用

## 🔍 原因の深堀り

### React 重複バンドル問題とは

エラーメッセージの「You might have more than one copy of React in the same app」が示す通り、アプリケーション内に **React が複数回バンドルされている** ことが問題の根本原因でした。

**問題の構造:**

```text
アプリケーション
├─ SSR Bundle (build/server/index.js)
│  └─ React (バージョン X)
└─ .wrangler/node_modules/
   └─ React (バージョン X または Y)
```

React Hooks は内部で React のインスタンスに依存していますが、複数の React インスタンスが存在すると、以下のような問題が発生します：

1. コンポーネントが React インスタンス A で定義される
2. Hooks 呼び出しが React インスタンス B で実行される
3. インスタンス B は呼び出し元のコンポーネント情報を持っていない
4. `Cannot read properties of null` エラーが発生

### Vite SSR 設定の影響

最初の試み：**React を外部化する**

```typescript
// vite.config.ts
ssr: {
  noExternal: true,
  external: ['react', 'react-dom', 'react/jsx-runtime'],
}
```

**結果:**
❌ サーバー起動時にハング（全ページが応答しない）

**原因:**
Cloudflare Workers 環境では、`external` に指定されたモジュールを実行時に解決できません。Workers は Node.js の `node_modules` にアクセスできないため、React が見つからずにアプリケーション全体が動作不能になります。

### Wrangler の.wrangler ディレクトリ

Wrangler は独自のビルドプロセスで `.wrangler` ディレクトリに依存関係をコピーします：

```text
.wrangler/
├── node_modules/
│   ├── react/
│   └── react-dom/
└── tmp/
    └── pages-xxxxx/
        └── functionsWorker-*.mjs  # ここで React が再度バンドルされる
```

**問題:**

- SSR バンドルに React が含まれる（3,150 KB）
- Wrangler が独自に React をバンドルする
- 結果として React が重複する

## 💡 解決策の検討

### オプション1: React の外部化（採用不可）

**アプローチ:**

```typescript
ssr: {
  external: ['react', 'react-dom']
}
```

**メリット:**

- SSR バンドルサイズが削減される
- React の重複が理論上避けられる

**デメリット:**

- ❌ Cloudflare Workers 環境で実行時に React が解決できない
- ❌ サーバーが起動しない
- ❌ 全ページが応答不能になる

**結論:** 不採用

---

### オプション2: Wrangler の設定変更（調査中）

**アプローチ:**
Wrangler の `compatibility_flags` や `node_compat` フラグを調整して、React の解決方法を変更する

**課題:**

- Cloudflare Workers の制約により、完全な Node.js 互換性は提供されない
- `nodejs_compat` フラグは既に有効化済み
- これ以上の設定変更では解決困難

**結論:** 現時点では実現不可

---

### オプション3: React Hooks を使用しない（暫定採用）

**アプローチ:**
React Hooks や Hooks を内部で使用するコンポーネント（`<Link>`）の使用を一時的に回避する

**具体的な変更:**

1. **`<Link>` → `<a>` タグに置き換え**

```typescript
// ❌ Before: Link コンポーネント使用
import { Link } from '@remix-run/react';

<Link to="/blog" className="blog-header__title">
  {blogTitle}
</Link>

// ✅ After: 標準の <a> タグ使用
<a href="/blog" className="blog-header__title">
  {blogTitle}
</a>
```

**影響:**

- ✅ クライアントサイドナビゲーション（SPA 的な画面遷移）が失われる
- ✅ 各ページ遷移で完全なリロードが発生
- ✅ パフォーマンスが若干低下

2. **`useEffect` のコメントアウト**

```typescript
// ❌ Before: useEffect 使用
useEffect(() => {
  if (typeof window !== 'undefined' && window.mermaid) {
    window.mermaid.contentLoaded();
  }
}, [post.htmlContent]);

// ✅ After: コメントアウト
// TEMPORARY: Mermaid図のレンダリングを無効化（React Hooks エラー回避）
// useEffect(() => {
//   if (typeof window !== 'undefined' && window.mermaid) {
//     window.mermaid.contentLoaded();
//   }
// }, [post.htmlContent]);
```

**影響:**

- ❌ Mermaid 図の動的レンダリングが無効化
- ❌ 既存の Mermaid 図が表示されない

**メリット:**

- ✅ React Hooks エラーが完全に回避される
- ✅ 全ページが正常に動作する
- ✅ 比較的シンプルな実装

**デメリット:**

- ❌ 機能の一部が失われる
- ❌ ユーザー体験が低下する
- ❌ 一時的な回避策であり、根本解決ではない

**結論:** 暫定的に採用（将来的には別の解決策を検討）

## 🔧 実装した回避策

### 変更したファイル

1. **BlogHeader.tsx**

```typescript
// TEMPORARY: Link コンポーネントを <a> タグに置き換え（React Hooks エラー回避）
const BlogHeader: React.FC<BlogHeaderProps> = ({ blogTitle }) => {
  return (
    <header className="blog-header blog-header-structure">
      <a href="/blog" className="blog-header__title">
        {blogTitle}
      </a>
    </header>
  );
};
```

2. **PostCard.tsx**

```typescript
// TEMPORARY: Link コンポーネントを <a> タグに置き換え（React Hooks エラー回避）
return (
  <a
    href={`/blog/${slug}`}
    className="post-card post-card-structure"
  >
    {/* ... */}
  </a>
);
```

3. **Pagination.tsx**

```typescript
// TEMPORARY: Link コンポーネントを <a> タグに置き換え（React Hooks エラー回避）
{currentPage > 1 && (
  <a
    href={`/blog?page=${currentPage - 1}`}
    className="pagination-button pagination-button--prev"
  >
    ← 前へ
  </a>
)}
```

4. **PostDetailSection.tsx**

```typescript
// TEMPORARY: useEffect削除（React Hooks エラー回避）
// useEffect(() => {
//   if (typeof window !== 'undefined' && window.mermaid) {
//     window.mermaid.contentLoaded();
//   }
// }, [post.htmlContent]);
```

5. **vite.config.ts**

```typescript
// React の external 設定を削除（Cloudflare Workers で解決不可のため）
ssr: {
  noExternal: true,  // すべてをバンドル
  resolve: {
    conditions: ["worker", "browser"],
    externalConditions: ["worker", "browser"],
  },
}
```

### 動作確認

```bash
# 全ページが正常に応答
✅ GET / 200 OK (38ms)
✅ GET /blog 200 OK (13ms)
✅ GET /blog/sample-reference-post 200 OK (55ms)
```

**SSR バンドルサイズ:**

```text
build/server/index.js: 3,150.26 kB
```

（React が完全にバンドルされているため、サイズは大きめ）

## 📊 トレードオフの整理

### 現在の状態

| 項目 | 状態 | 影響 |
|------|------|------|
| **ページ表示** | ✅ 正常 | すべてのページが表示される |
| **コードブロック** | ✅ 正常 | マークダウンのコードが表示される |
| **クライアントサイドナビゲーション** | ❌ 無効 | 各ページ遷移で完全リロード |
| **Mermaid 図** | ❌ 無効 | 動的レンダリングが動作しない |
| **React Hooks** | ❌ 使用不可 | 状態管理や副作用の制限 |
| **SSR バンドル** | ⚠️ 肥大化 | 3,150 KB（理想は 1,371 KB） |

### 失われた機能

1. **SPA 的な高速ページ遷移**
   - 従来: クライアントサイドルーティングで即座に画面遷移
   - 現在: 毎回サーバーリクエストが発生

2. **Mermaid 図の動的レンダリング**
   - 従来: useEffect でマークダウン内の Mermaid 記法を図に変換
   - 現在: Mermaid 図が表示されない

3. **React の状態管理機能**
   - 従来: useState/useContext などで動的 UI を実装可能
   - 現在: 静的な UI のみ

## 🔮 将来的な解決策

### アプローチ1: Remix の設定を見直す

Remix 公式ドキュメントや Cloudflare Workers 向けのベストプラクティスを再調査し、React の重複バンドルを避ける正しい設定方法を探る。

**調査項目:**

- Remix の `serverBuildTarget` 設定
- Cloudflare Pages Functions の最新仕様
- Vite SSR の `resolve.conditions` の最適化

### アプローチ2: Wrangler の依存関係解決を制御

Wrangler がどのように依存関係をバンドルしているかを詳しく調査し、React の重複を避ける方法を見つける。

**調査項目:**

- Wrangler の `rules` 設定
- `wrangler.toml` の高度な設定オプション
- esbuild プラグインによるカスタマイズ

### アプローチ3: プリレンダリングの活用

ブログのような静的コンテンツが中心のサイトでは、プリレンダリング（静的サイト生成）を活用し、クライアントサイドでのみ React Hooks を使用する。

**利点:**

- SSR 時には React Hooks を使用しない
- クライアントサイドで動的機能を実装
- Cloudflare Workers の制約を回避

**課題:**

- アーキテクチャの大幅な変更が必要
- Remix の SSR 機能を十分に活用できない

## 🎓 学んだこと

### 1. Cloudflare Workers の制約を理解する

**V8 Isolate の特性:**

- Node.js ランタイムではない
- `node_modules` への実行時アクセスが制限される
- `external` 指定されたモジュールは解決できない

**教訓:**
サーバーレス環境では、従来のサーバーサイド開発の常識が通用しないことがある。環境の制約を事前に理解し、それに適したアーキテクチャを選択することが重要。

### 2. React の内部実装に依存した機能の脆弱性

**React Hooks の動作原理:**

- Hooks は React インスタンスのグローバル状態に依存
- 複数の React インスタンスがあると正しく動作しない
- SSR 環境では特に注意が必要

**教訓:**
フレームワークの内部実装に依存した機能は、環境が変わると予期せぬ問題を引き起こす可能性がある。可能な限り、標準的な Web API や環境に依存しない実装を心がけるべき。

### 3. ビルドツールの設定の重要性

**Vite の `ssr.external` vs `ssr.noExternal`:**

- 設定の意味を正しく理解しないと、重大な問題を引き起こす
- Cloudflare Workers 環境では、特定の設定が機能しない

**教訓:**
ビルドツールの設定は、単なるパフォーマンスチューニングではなく、アプリケーションの動作を根本的に変える可能性がある。設定変更時は、その影響範囲を十分に理解する必要がある。

### 4. 段階的な問題解決の重要性

**今回のプロセス:**

1. コードブロック表示の問題を修正
2. React Hooks エラーが発生
3. 原因を特定（React 重複バンドル）
4. 理想的な解決策を試行（失敗）
5. 暫定的な回避策を実装（成功）

**教訓:**
複雑な問題に直面した際は、すぐに完璧な解決策を求めるのではなく、まずアプリケーションを動作可能な状態に戻すことが重要。その後、段階的により良い解決策を探ることができる。

## 🚀 まとめ

### 重要なポイント

1. **React Hooks エラーの根本原因は React の重複バンドル**
   - SSR バンドルと Wrangler バンドルで React が二重に含まれる
   - Cloudflare Workers 環境では `external` 設定が使用できない

2. **一時的な回避策は機能を犠牲にする**
   - `<Link>` を `<a>` に置き換え → SPA 機能の喪失
   - `useEffect` をコメントアウト → 動的機能の喪失
   - アプリケーションは動作するが、理想的な状態ではない

3. **根本的な解決には更なる調査が必要**
   - Remix + Cloudflare Workers の正しい設定方法を探る
   - Wrangler のバンドル動作を深く理解する
   - 代替アーキテクチャ（プリレンダリングなど）を検討する

### 今後の方針

- ✅ 短期: 現在の回避策でアプリケーションを安定稼働させる
- 🔍 中期: React 重複バンドル問題の根本解決を調査
- 🎯 長期: Cloudflare Workers に最適化されたアーキテクチャへの移行を検討

---

## ✅ 【2025-11-23 更新】問題解決

### 根本的な解決に成功

React 重複バンドル問題の根本原因を特定し、**完全に解決**しました。

### 解決策

**問題の本質:**

- `wrangler pages dev` は**開発用コマンドではなく、プレビュー用コマンド**だった
- Vite でバンドル後、Wrangler が再度バンドルすることで React が重複していた

**正しい開発方法:**

1. **vite.config.ts に cloudflareDevProxyVitePlugin を追加**

```typescript
import { vitePlugin as remix, cloudflareDevProxyVitePlugin } from "@remix-run/dev";
import path from "path";

export default defineConfig({
  plugins: [
    cloudflareDevProxyVitePlugin(),  // Cloudflare環境をシミュレート
    remix(),
    tsconfigPaths()
  ],
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./app")  // モジュール解決を明示的に設定
    }
  },
  ssr: {
    resolve: {
      externalConditions: ["workerd", "worker"]
    }
  }
});
```

2. **package.json の dev スクリプトを変更**

```json
{
  "scripts": {
    "dev": "remix vite:dev"  // wrangler pages dev ではない！
  }
}
```

3. **wrangler を devDependencies にインストール**

```bash
npm install -D wrangler
```

### 結果

✅ **React Hooks が完全に復旧**

- `useEffect` が正常に動作
- `<Link>` コンポーネントが正常に動作
- すべてのページが 200 OK を返す
- React 重複バンドルエラーが完全に解消

**動作確認:**

```text
✅ GET / 200 OK
✅ GET /blog 200 OK
✅ GET /blog/sample-reference-post 200 OK (useEffect 動作確認済み)
```

### 重要な学び

**`wrangler pages dev` の正しい使い方:**

- ❌ 開発用: `npm run build && wrangler pages dev ./build/client`
- ✅ 開発用: `remix vite:dev`（cloudflareDevProxyVitePlugin 使用）
- ✅ プレビュー用: `wrangler pages dev ./build/client`（本番ビルド後）

**`cloudflareDevProxyVitePlugin` の役割:**

- Vite 開発サーバー内で Wrangler を自動起動
- Cloudflare 環境をシミュレート
- **Wrangler の再バンドルを回避**（これが重要！）

---

**作成日**: 2025-11-22
**最終更新**: 2025-11-23
**ステータス**: ✅ **完全解決**
**関連ドキュメント**: [Remix Vite Guide](https://v2.remix.run/docs/guides/vite/)
