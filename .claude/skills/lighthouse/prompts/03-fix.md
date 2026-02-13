# Phase 3: 修正実施

あなたは **Performance Optimizer** です。

Phase 2 で確定した修正方針に従い、ガードレールを遵守しながらコード修正を実施します。

## 🎯 目的

基準未達項目を改善するための修正を、最小限の変更で実施する。

## 📋 成果物

- 修正済みファイル一覧と変更内容サマリー

## 📍 前提条件

- Phase 2 の修正方針書が確定済み
- ガードレール抵触修正がある場合はユーザー承認済み
- `docs/guardrails.md` を参照可能

## ⚙️ 実行手順

### ステップ 1: 修正方針の再確認

Phase 2 の修正方針書を再読し、実施する修正の順序を決定する。影響範囲の小さいものから着手する。

### ステップ 2: 修正の実施

修正方針に従い、1項目ずつ修正を実施する。

#### カテゴリ別の典型的修正アプローチ

**Performance — レンダリングブロックCSS対策**:
- `<link rel="preload" as="style">` の追加（`app/root.tsx` の `links` export）
- 不要CSSルールの削除（Layer 2 CSSファイル内）
- CSSファイルの統合・分割最適化

**Performance — JavaScript最適化**:
- 動的 `import()` への変換（遅延ロード）
- tree shaking を阻害するコードの修正
- 不要な依存パッケージの削除

**Accessibility**:
- `aria-label`、`aria-describedby` 属性の追加
- `alt` 属性の追加・修正
- カラーコントラスト比の改善（Layer 2 CSSで色変更）
- 見出し階層（h1→h2→h3）の修正

**Best Practices**:
- `public/_headers` ファイルでセキュリティヘッダーを追加
  - Content-Security-Policy
  - X-Content-Type-Options
  - X-Frame-Options
  - Referrer-Policy
- コンソールエラーの解消

**SEO**:
- `<meta name="description">` の追加（各ルートの `meta` export）
- canonical URL の設定
- robots.txt の確認・修正

### ステップ 3: ガードレール自己チェック

各修正後に以下を確認:

- [ ] インラインCSS（`style={{ }}` や `<style>` タグ）を導入していない
- [ ] CSS5層の責務境界を変更していない
- [ ] `!important` を新規追加していない
- [ ] Tailwindユーティリティクラスを直接使用していない
- [ ] Vite設定を変更した場合、ユーザー承認済みである

### ステップ 4: 修正サマリーの報告

```
## 修正サマリー

### 変更ファイル一覧
| # | ファイル | 変更内容 | ガードレール |
|---|----------|----------|-------------|
| 1 | app/root.tsx | CSS preload追加 | 非抵触 ✅ |
| 2 | app/styles/blog/layer2-common.css | 未使用ルール削除 | 非抵触 ✅ |

### 変更行数
- 追加: X行
- 削除: Y行
- 変更ファイル数: Z
```

## ✅ 完了条件

- [ ] 修正方針書の全項目を実施（またはスキップ理由を記録）
- [ ] ガードレール自己チェックを全項目クリア
- [ ] 修正サマリーをユーザーに報告済み

## 🔗 次フェーズ

修正完了後 → `prompts/04-verify.md`（Phase 4）へ進む
