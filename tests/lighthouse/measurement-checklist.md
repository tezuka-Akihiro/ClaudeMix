# Lighthouse測定チェックリスト

このチェックリストを使って、測定を確実に実施してください。

## 事前準備

### 測定環境の選択

**オプションA: ローカル環境**
- [ ] 開発サーバーが起動している（`npm run dev:wrangler`）
- [ ] ブラウザで http://localhost:8788 にアクセスできる

**オプションB: プレビュー環境（推奨）**
- [ ] プレビューURLにアクセスできる: https://claude-lighthouse-impact-ass.claudemix.pages.dev/
- [ ] テストアカウント情報を確認済み（Email: `tizuhanpen8+preview@gmail.com` / Password: `14801250At`）

### 共通準備
- [ ] Google Chromeを使用している
- [ ] 他のタブやアプリケーションを閉じている（正確な測定のため）
- [ ] 測定環境（ローカル/プレビュー）を決定している

## Phase 1: 公開ページの測定（必須）

### ブログ一覧ページ（Mobile）⭐⭐⭐

- [ ] URLにアクセス
  - ローカル: http://localhost:8788/blog
  - プレビュー: https://claude-lighthouse-impact-ass.claudemix.pages.dev/blog
- [ ] F12でDevToolsを開く
- [ ] Lighthouseタブを選択
- [ ] Device: **Mobile** を選択
- [ ] すべてのカテゴリにチェック
- [ ] 「Analyze page load」をクリック
- [ ] 測定完了を待つ
- [ ] レポートを保存: `tests/lighthouse/reports/blog-posts-mobile-YYYYMMDD.html`
- [ ] スコアを記録: Performance, Accessibility, Best Practices, SEO
- [ ] パフォーマンス指標を記録: FCP, LCP, TBT, CLS, Speed Index
- [ ] リソースサイズを記録: JavaScript, CSS, 未使用量

### ブログ一覧ページ（Desktop）⭐⭐

- [ ] 同じページで測定
- [ ] Device: **Desktop** を選択
- [ ] 同様に測定・保存・記録

### ブログ記事詳細ページ（Mobile）⭐⭐⭐

- [ ] URLにアクセス
  - ローカル: http://localhost:8788/blog/welcome
  - プレビュー: https://claude-lighthouse-impact-ass.claudemix.pages.dev/blog/welcome
- [ ] Device: **Mobile** を選択
- [ ] 測定・保存・記録

### ブログ記事詳細ページ（Desktop）⭐⭐

- [ ] 同じページで測定
- [ ] Device: **Desktop** を選択
- [ ] 測定・保存・記録

## Phase 2: 認証ページの測定（推奨）

### プロフィールページ（Mobile）⭐⭐

- [ ] テストアカウントでログイン（Email: `tizuhanpen8+preview@gmail.com` / Password: `14801250At`）
- [ ] URLにアクセス
  - ローカル: http://localhost:8788/profile
  - プレビュー: https://claude-lighthouse-impact-ass.claudemix.pages.dev/profile
- [ ] DevToolsを開く
- [ ] Lighthouseタブで「Clear storage」のチェックを**外す**
- [ ] Device: **Mobile** を選択
- [ ] 測定・保存・記録

### プロフィールページ（Desktop）⭐

- [ ] 同じページで測定
- [ ] Device: **Desktop** を選択
- [ ] 測定・保存・記録

## Phase 3: 結果の比較分析

### 基準値との比較

- [ ] `LIGHTHOUSE_RESULTS.md` に測定結果を記入
- [ ] 基準値との差分を計算
- [ ] 許容範囲内かを判定

### 評価基準

**合格ライン**

- [ ] Performanceスコア ≥ 95点
- [ ] Accessibilityスコア = 100点
- [ ] Best Practicesスコア = 100点
- [ ] SEOスコア = 100点
- [ ] JavaScript増加 ≤ +5 KiB
- [ ] CSS増加 ≤ +2 KiB
- [ ] FCP/LCP悪化 ≤ +0.5s

**要対応ライン**

- [ ] Performanceスコア < 95点 → 原因調査と改善策の検討
- [ ] その他スコア < 100点 → 原因調査と改善策の検討
- [ ] JavaScript増加 > +5 KiB → バンドルサイズの最適化検討
- [ ] CSS増加 > +2 KiB → スタイリングの最適化検討

## Phase 4: 報告とネクストアクション

### レポート作成

- [ ] `LIGHTHOUSE_RESULTS.md` を完成させる
- [ ] 影響評価を記述
- [ ] 改善が必要な項目をリストアップ

### ブログ記事の作成（任意）

- [ ] 測定結果をブログ記事にまとめる
- [ ] ログイン導入による影響を分析
- [ ] 改善計画を記載（必要な場合）

### 次のステップ

- [ ] 測定結果をチームに共有
- [ ] 改善が必要な場合、優先順位を決定
- [ ] 改善施策の実装計画を立案

## メモ欄

### 気づいた点・課題

（自由記述）

### 改善アイデア

（自由記述）

### 疑問点・確認事項

（自由記述）
