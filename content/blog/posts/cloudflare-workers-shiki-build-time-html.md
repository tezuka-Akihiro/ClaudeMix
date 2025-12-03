---
slug: "cloudflare-workers-shiki-build-time-html"
title: "Cloudflare WorkersのWebAssembly制約をビルド時HTML変換で乗り越える"
description: "Cloudflare Workers環境でShikiのWebAssemblyが動作せず、ブログ記事詳細ページがエラーになる問題に遭遇。ビルド時にマークダウンをHTMLに変換する戦略と、並列処理の競合を防ぐShiki事前初期化の実装を解説します。"
author: "ClaudeMix Team"
publishedAt: "2025-12-02"
category: "Claude Best Practices"
tags: ["Workers", "troubleshooting", "Vite"]
---

## 📝 概要

Cloudflare Pages（Workers環境）にデプロイしたRemixブログで、記事詳細ページを開くと「Application Error!」が表示される問題に遭遇しました。ローカル開発環境では正常に動作していたため、Cloudflare Workers特有の制約が原因でした。この記事では、問題の発見から原因の特定、そしてビルド時HTML変換による解決に至るまでの全プロセスを記録します。

### 発生環境
- **フレームワーク**: Remix v2
- **ホスティング**: Cloudflare Pages/Workers
- **ビルドツール**: Vite
- **シンタックスハイライター**: Shiki
- **記事数**: 21記事

---

## ⚠️ 問題の発見と症状

stg環境（`https://stg.claudemix.pages.dev/blog`）にデプロイ後、記事一覧ページは表示されるが、記事詳細ページ（例: `/blog/welcome`）を開くと「Application Error!」が表示される。

**エラーメッセージ:**
```
CompileError: WebAssembly.instantiate(): Wasm code generation disallowed by embedder
  at shiki/engine-oniguruma
```

**症状:**
- ✅ ホーム画面: 正常表示
- ✅ ブログ一覧ページ: 正常表示
- ❌ 記事詳細ページ: Application Error
- ローカル開発環境では再現せず、デプロイ後にのみ発生

**問題箇所:**
[app/lib/blog/post-detail/markdownConverter.ts:16](app/lib/blog/post-detail/markdownConverter.ts#L16) でShikiのハイライター初期化時にエラー発生。

```typescript
// 問題のコード
import { createHighlighter } from 'shiki/bundle/full';

async function getHighlighter() {
  if (!highlighter) {
    highlighter = await createHighlighter({ // ← ここでWASMエラー
      themes: [theme],
      langs: ['javascript', 'typescript', ...],
    });
  }
  return highlighter;
}
```

---

## 🔍 調査と試行錯誤のプロセス

### 仮説1: Cloudflare Workersの制約を調査

まず、Cloudflare Workers環境の制約を確認しました。公式ドキュメントによると、**動的なWebAssembly生成は許可されていない**ことが判明。Shikiはシンタックスハイライトのために内部でWebAssembly（oniguruma正規表現エンジン）を使用しているため、Workers環境では動作しない。

**判明した事実:**
- Cloudflare Workersは事前コンパイルされたWASMのみサポート
- ランタイムでの動的WASM生成は禁止
- Shikiは初期化時に動的にWASMを生成

### 仮説2: クライアントサイドレンダリングを検討

次に、マークダウンをそのまま配信し、ブラウザ側でHTMLに変換する方法を検討しました。しかし、この方法には以下の問題がありました:

**問題点:**
- 初回表示が遅くなる（クライアント側で毎回変換）
- SEO的に不利（HTMLが初期状態では存在しない）
- ユーザー体験の低下

結論: **クライアントサイドレンダリングは最終手段として保留**

### 仮説3: ビルド時HTML変換を試す

最終的に、「ビルド時にマークダウンをHTMLに変換すれば、Workers環境ではHTMLを配信するだけでよい」というアプローチに行き着きました。

**メリット:**
- Workers環境でWASMを使用しない
- 高速な初期表示（HTML配信のみ）
- SEO最適化
- Node.js環境（ビルド時）ではShikiが正常動作

---

## 💡 根本原因の特定

調査の結果、根本原因は以下の通りでした:

1. **Workers環境のWASM制約**: Cloudflare WorkersはセキュリティとパフォーマンスのためWASM動的生成を禁止
2. **Shikiの依存関係**: Shikiはoniguruma（WASM実装）に依存
3. **ランタイム変換の試み**: アプリケーションがランタイムでマークダウン→HTML変換を実行していた

**問題の本質:**
Workers環境の制約に対して、**実行タイミング（ランタイム vs ビルド時）**を見直す必要があった。

---

## 🔧 解決策

### 1. プレビルドスクリプトの実装

[scripts/prebuild/generate-blog-posts.js](scripts/prebuild/generate-blog-posts.js) にHTML変換ロジックを追加:

```javascript
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';
import { createHighlighter } from 'shiki/bundle/full';

// Shikiハイライターをシングルトンで管理
let highlighter = null;

async function getHighlighter() {
  if (!highlighter) {
    console.log('⚡ Initializing Shiki highlighter...');
    highlighter = await createHighlighter({
      themes: ['github-dark'],
      langs: ['javascript', 'typescript', 'html', 'css', 'markdown', 'bash', 'json', 'tsx', 'diff', 'yaml', 'xml'],
    });
  }
  return highlighter;
}

async function convertMarkdownToHtml(markdown) {
  const hl = await getHighlighter();

  // marked設定とShiki統合
  const walkTokens = (token) => {
    if (token.type === 'code') {
      const lang = token.lang || 'text';
      try {
        token.text = hl.codeToHtml(token.text, { lang, theme: 'github-dark' });
        token.escaped = true;
      } catch (error) {
        // サポートされていない言語はtextにフォールバック
        console.warn(`⚠️ Language "${lang}" not supported, using plain text`);
        token.text = hl.codeToHtml(token.text, { lang: 'text', theme: 'github-dark' });
        token.escaped = true;
      }
    }
  };

  marked.use({ walkTokens, async: true });
  const rawHtml = await marked.parse(markdown);
  return sanitizeHtml(rawHtml, { /* サニタイズ設定 */ });
}
```

### 2. 並列処理の最適化（重要）

**問題:** 21記事を`Promise.all`で並列処理すると、複数のプロセスが同時に`getHighlighter()`を呼び出し、競合が発生してハング。

**解決策:** 並列処理前に事前初期化:

```diff
async function generateBlogPosts() {
  try {
    console.log('🚀 Starting blog posts generation...');
+
+   // 並列処理前にShikiを初期化（競合防止）
+   await getHighlighter();

    // Markdownファイルを読み込む
    const posts = await Promise.all(
      markdownFiles.map(async (file) => {
        // HTML変換処理（既に初期化済みのhighlighterを使用）
        const htmlContent = await convertMarkdownToHtml(content);
        return { slug, content: htmlContent, ... };
      })
    );
```

**効果:**
- ✅ ハング問題を完全解決
- ✅ 並列処理の高速性を維持
- ✅ シングルトンパターンで1つのインスタンスのみ生成



---

## 🎓 学んだこと・まとめ

### 技術的な学び

1. **実行環境の制約を理解する**
   - Cloudflare Workersは軽量・高速だが、WebAssembly動的生成は禁止
   - 制約を回避するには「実行タイミングをずらす」発想が有効

2. **ビルド時 vs ランタイムのトレードオフ**
   - ビルド時処理: 初期コスト高、ランタイム高速
   - ランタイム処理: 柔軟性高、実行環境の制約を受けやすい

3. **並列処理とシングルトンの重要性**
   - 並列処理前の事前初期化でリソースの競合を防止
   - グローバル変数のシングルトンパターンが有効

4. **エラーハンドリングの重要性**
   - サポートされていない言語のフォールバック機構
   - try-catchでビルドを止めずに警告表示

### パフォーマンス結果

```
📊 ビルド時変換の結果:
- 最速: 1ms (welcome)
- 最長: 322ms (cloudflare-pages-deployment-challenge)
- 平均: 約30-40ms
- 合計: 21記事を数秒で変換完了
```

### 今後のベストプラクティス

1. **サーバーレス環境での開発時は制約を事前確認**
   - Cloudflare Workers、AWS Lambda、Vercel Edge Functionsなど、それぞれ異なる制約がある
   - ライブラリ選定時に実行環境との互換性を確認

2. **ビルド時生成を積極的に活用**
   - 静的サイトジェネレーション（SSG）の考え方を応用
   - ビルド時に可能な処理はできる限りビルド時に実行

3. **並列処理の競合対策**
   - リソースの初期化は並列処理の外で実行
   - シングルトンパターンで唯一のインスタンスを保証

---

## 🔗 関連リソース

- [Cloudflare Workers - WebAssembly制約](https://developers.cloudflare.com/workers/runtime-apis/webassembly/)
- [Shiki公式ドキュメント](https://shiki.style/)
- [Marked.js - マークダウンパーサー](https://marked.js.org/)
- [Remix - Server-Side Rendering](https://remix.run/docs/en/main/guides/streaming)

---

**関連記事:**
- [Cloudflare Pagesデプロイで遭遇した3つの壁とその解決策](./cloudflare-pages-deployment-challenge)
- [React HooksのCloudflare Workers互換性チャレンジ](./react-hooks-cloudflare-workers-challenge)
