---
slug: "cloudflare-workers-shiki-build-time-html"
title: "Cloudflare WorkersのWebAssembly制約をビルド時HTML変換で乗り越える"
description: "Cloudflare Workers環境でShikiのWebAssemblyが動作せず、ブログ記事詳細ページがエラーになる問題に遭遇。ビルド時にマークダウンをHTMLに変換する戦略と、並列処理の競合を防ぐShiki事前初期化の実装を解説します。"
author: "ClaudeMix Team"
publishedAt: "2025-12-02"
category: "Claude Best Practices"
tags: ["Workers", "troubleshooting", "Vite"]
---

## はじめに

### Cloudflare Workersへのデプロイでこんなことありませんか？

ローカル環境では完璧に動くブログ。特に、Shikiで実装したコードブロックのシンタックスハイライトも綺麗に表示されて満足していた。
しかし、いざCloudflare Pagesにデプロイしてみると、記事ページだけが「Application Error」で真っ白に。ログには `WebAssembly.instantiate(): Wasm code generation disallowed` という謎のエラーが…。
とりあえずシンタックスハイライトを無効にしたら動いたけど、技術ブログとして致命的だし、根本的な解決にはなっていない。

### この記事をお勧めしない人

- ローカル環境と本番環境の違いなんて、その場でググって解決すればいいと思っている人。
- シンタックスハイライトのためだけにビルドプロセスを複雑にするなんて、馬鹿げていると考える人。
- サーバーレス環境の制約は、単なる技術選定のミスであり、アーキテクチャで乗り越える課題ではないと考える人。

もし一つでも当てはまらないなら、読み進める価値があるかもしれません。

### このままでは危険です

- その場しのぎの修正を続けることで、あなたのコードベースには「環境依存の地雷」が静かに埋め込まれていきます。
- やがて、新しいライブラリを導入した途端、別のWASM関連エラーが再発し、デプロイが失敗するでしょう。
- ついに、あなたは本番環境の制約に怯え、新しい技術の導入をためらうようになり、あなたのプロダクトは時代遅れの技術スタックに取り残されてしまいます。

### こんな未来が手に入ります

- この記事を読めば、Cloudflare Workersの制約を逆手に取り、パフォーマンスを向上させる設計思想が手に入ります。
- 具体的には、重い処理をビルド時に完了させる「プレビルドHTML変換」というアプローチで、サーバーレス環境の制約を回避しつつ、高速な表示を実現する**設計図**を手に入れられます。
- この方法は、机上の空論ではありません。まさに**このブログ自身のシンタックスハイライト機能として実証済み**です。
- この情報は、単なるエラー解決策ではなく、実行環境の制約を「最適化の機会」に変える**未来の開発現場から得られた一次情報**です。

### 私も同じでした

筆者も過去に同じWASMエラーで悩み抜き、このブログを「AIによる実装」と「人間による設計」で作り上げる過程でこの解決策を見つけました。
この記事で、サーバーレス環境の制約を理解し、安定したデプロイを実現するための基本的な考え方と、明日から試せるTipsを持ち帰れるように書きました。
さらに深掘りして、ビルドプロセスを最適化する具体的なアーキテクチャ設計を知りたい方は、その詳細な実装方法を確認できます。

## 📝 概要

Cloudflare Pages（Workers環境）にデプロイしたRemixブログで、記事詳細ページを開くと「Application Error!」が表示される問題に遭遇しました。
ローカル開発環境では正常に動作していたため、Cloudflare Workers特有の制約が原因でした。
この記事では、問題の発見から原因の特定、そして**ビルド時（※）**にHTMLへ変換するというアプローチで解決するまでの全プロセスを記録します。

> ※ **ビルド時**: ウェブサイトを公開する前の準備段階のこと。

### 発生環境

- **フレームワーク**: Remix v2
- **ホスティング**: Cloudflare Pages/Workers
- **ビルドツール**: Vite
- **シンタックスハイライター**: Shiki（※）
- **記事数**: 21記事

> ※ **Shiki**: ソースコードを綺麗に色付けしてくれるライブラリ（道具）。

---

## ⚠️ 問題の発見と症状

stg環境（テスト用の公開環境）にデプロイ後、記事一覧ページは表示されるものの、記事詳細ページ（例: `/blog/welcome`）を開くと「Application Error!」と表示されてしまいました。

**エラーメッセージ:**

~~~text
CompileError: WebAssembly.instantiate(): Wasm code generation disallowed by embedder
  at shiki/engine-oniguruma
~~~

**症状:**

- ✅ ホーム画面: 正常表示
- ✅ ブログ一覧ページ: 正常表示
- ❌ 記事詳細ページ: Application Error
- ローカル開発環境では再現せず、デプロイ後にのみ発生

---

## 🔍 調査と試行錯誤のプロセス

### 仮説1: Cloudflare Workersの制約が原因ではないか？

まず、Cloudflare Workers環境の制約を確認しました。公式ドキュメントによると、**動的なWebAssembly（※）生成は許可されていない**ことが判明。Shikiはコードの色付けのために内部でWebAssembly（oniguruma正規表現エンジン）を使っているため、これが原因でエラーになっている可能性が高いと推測しました。

**判明した事実:**

- Cloudflare Workersは事前コンパイルされたWASMのみサポート
- ランタイムでの動的WASM生成は禁止
- Shikiは初期化時に動的にWASMを生成

> ※ **WebAssembly (WASM)**: ウェブブラウザで高速に動くプログラムの形式。

### 仮説2: ブラウザ側での変換を試す

次に、サーバー側での処理を諦め、マークダウンをそのままブラウザに送り、ユーザーの画面でHTMLに変換する方法を検討しました。しかし、この方法には以下の問題がありました。

**問題点:**

- 初回表示が遅くなる（クライアント側で毎回変換）
- SEO的に不利（HTMLが初期状態では存在しない）
- ユーザー体験の低下

この方法はデメリットが大きいため、最終手段として保留しました。

### 仮説3: ビルド時にHTML変換するアプローチ

最終的に、「ビルド時にあらかじめマークダウンをHTMLに変換しておけば、サーバー（Workers環境）では完成したHTMLを配信するだけで済む」というアプローチに行き着きました。

**メリット:**

- Workers環境でWASMを使用しない
- 高速な初期表示（HTML配信のみ）
- SEO最適化
- Node.js環境（ビルド時）ではShikiが正常動作

---

## 💡 根本原因の特定

調査の結果、根本原因は以下の3つの組み合わせでした。

1. **Workers環境のWASM制約**: Cloudflare Workersはセキュリティとパフォーマンスのため、動的なWebAssembly生成を禁止している。
2. **Shikiの依存関係**: Shikiは内部でonigurumaというWebAssembly実装に依存している。
3. **ランタイム変換の試み**: アプリケーションが、ユーザーからのリクエスト時に（ランタイムで）マークダウンからHTMLへの変換を実行しようとしていた。

**問題の本質:**
サーバーレス環境の制約に対して、**処理の実行タイミング（ランタイム vs ビルド時）**を見直す必要があったのです。

---

## 🔧 解決策

### プレビルドスクリプトの実装

`scripts/prebuild/generate-blog-posts.js` に、ビルド時にMarkdownをHTMLに変換するロジックを追加しました。

~~~javascript
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';
import { createHighlighter } from 'shiki/bundle/full';

// Shikiハイライターをシングルトン（※）で管理
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
  // ...（markedとShikiを連携させてHTMLに変換する処理）...
  const rawHtml = await marked.parse(markdown);
  return sanitizeHtml(rawHtml, { /* サニタイズ設定 */ });
}
~~~

> ※ **シングルトン**: プログラム全体でインスタンス（実体）が1つしか作られないことを保証するデザインパターン。

#### 並列処理の最適化

**ぶつかった壁:** 21記事を並列処理（`Promise.all`）すると、複数の処理が同時に`getHighlighter()`を呼び出してしまい、リソースの競合が起きてハングアップしました。

**解決方法:** 並列処理を開始する前に、一度だけShikiの初期化処理を呼び出すように修正しました。

~~~diff
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
~~~

**効果:**

- ✅ ハング問題を完全解決
- ✅ 並列処理の高速性を維持
- ✅ シングルトンパターンで1つのインスタンスのみ生成されることを保証

---

## 🎓 学んだこと・まとめ

### 技術的な学び

- **実行環境の制約を理解する**: Cloudflare Workersは軽量・高速ですが、WebAssemblyの動的生成は禁止されています。制約を回避するには「実行タイミングをずらす」という発想が有効です。
- **ビルド時 vs ランタイムのトレードオフ**: ビルド時に重い処理を済ませることで、ユーザーアクセス時（ランタイム）のパフォーマンスを最大化できます。
- **並列処理とシングルトンの重要性**: 重い初期化処理を伴うリソースを並列処理で使う場合、処理の開始前に一度だけ初期化を行うことでリソースの競合を防げます。

### パフォーマンス結果

~~~text
📊 ビルド時変換の結果:
- 最速: 1ms (welcome)
- 最長: 322ms (cloudflare-pages-deployment-challenge)
- 平均: 約30-40ms
- 合計: 21記事を数秒で変換完了
~~~

### 今後のベストプラクティス

- **サーバーレス環境の制約を事前確認する**: ライブラリを選定する際は、デプロイ先の実行環境（Cloudflare Workers, AWS Lambdaなど）との互換性を確認することが重要です。
- **ビルド時生成を積極的に活用する**: 静的サイトジェネレーション（SSG）の考え方を応用し、ビルド時に可能な処理はできる限り前倒しで実行することで、パフォーマンスと安定性が向上します。

---

## 🔗 関連リソース

- [Cloudflare Workers - WebAssembly制約](https://developers.cloudflare.com/workers/runtime-apis/webassembly/)
- [Shiki公式ドキュメント](https://shiki.style/)
- [Marked.js - マークダウンパーサー](https://marked.js.org/)
