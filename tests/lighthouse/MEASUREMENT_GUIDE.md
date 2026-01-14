# Lighthouse測定ガイド

## 測定環境のセットアップ

### オプションA: ローカル環境（開発サーバー）

#### 1. 開発サーバーの起動

```bash
npm run dev:wrangler
```

サーバーが起動したら、ブラウザで `http://localhost:8788` にアクセスして正常に表示されることを確認してください。

**メリット**:
- 最新のコード変更をすぐに反映できる
- デバッグが容易

**デメリット**:
- ローカル環境特有の問題（ポート占有など）がある
- 本番に近い環境とは異なる場合がある

### オプションB: プレビュー環境（Cloudflare Pages）

#### 1. プレビュー環境のURL

このブランチ（`claude/lighthouse-impact-assessment-TiiGh`）でpushすると、自動的に以下のURLにデプロイされます：

```
https://claude-lighthouse-impact-ass.claudemix.pages.dev/
```

#### 2. テストアカウント

認証ページの測定には、以下のテストアカウントを使用してください：

- **Email**: `tizuhanpen8+preview@gmail.com`
- **Password**: `14801250At`

**メリット**:
- 本番環境に近い状態で測定できる
- ローカル環境の問題を避けられる
- デプロイされた状態での実測が可能

**デメリット**:
- コード変更後、デプロイ完了まで待つ必要がある（3-5分程度）
- ビルド最適化が適用されるため、開発時とは異なる結果になる場合がある

**推奨**: より本番に近い測定結果を得るため、**プレビュー環境での測定を推奨**します。

### 2. Chrome DevToolsでLighthouse測定

#### 手順

1. **Google Chromeでページを開く**
   - 測定対象のページ（例: `http://localhost:8788/blog`）を開く

2. **DevToolsを開く**
   - `F12` キーを押す
   - または右クリック → 「検証」を選択

3. **Lighthouseタブを開く**
   - DevToolsの上部タブから「Lighthouse」を選択
   - タブが見つからない場合は、`>>` アイコンをクリックして探す

4. **測定設定**
   - **Mode**: Navigation（デフォルト）
   - **Device**: Mobile または Desktop を選択
   - **Categories**: すべてにチェック
     - ✅ Performance
     - ✅ Accessibility
     - ✅ Best Practices
     - ✅ SEO

5. **測定実行**
   - 「Analyze page load」ボタンをクリック
   - 測定完了まで待機（30秒～1分程度）

6. **レポートの保存**
   - 測定完了後、右上の「💾」アイコンをクリック
   - HTMLレポートをダウンロード
   - ファイル名: `blog-posts-mobile-YYYYMMDD.html` のように命名
   - 保存先: `tests/lighthouse/reports/` ディレクトリ

## 測定対象ページ

以下のページで測定を実施してください：

### 公開ページ（ログイン不要）

| ページ | ローカル環境 | プレビュー環境 | 優先度 |
|--------|------------|--------------|--------|
| ブログ一覧 | http://localhost:8788/blog | https://claude-lighthouse-impact-ass.claudemix.pages.dev/blog | ⭐⭐⭐ 必須 |
| ブログ記事詳細 | http://localhost:8788/blog/welcome | https://claude-lighthouse-impact-ass.claudemix.pages.dev/blog/welcome | ⭐⭐⭐ 必須 |
| トップページ | http://localhost:8788 | https://claude-lighthouse-impact-ass.claudemix.pages.dev/ | ⭐⭐ 推奨 |

### 認証ページ（ログイン必須）

| ページ | ローカル環境 | プレビュー環境 | 優先度 |
|--------|------------|--------------|--------|
| プロフィール | http://localhost:8788/profile | https://claude-lighthouse-impact-ass.claudemix.pages.dev/profile | ⭐⭐ 推奨 |
| アカウント設定 | http://localhost:8788/account/settings | https://claude-lighthouse-impact-ass.claudemix.pages.dev/account/settings | ⭐ 任意 |

**推奨**: より本番に近い結果を得るため、**プレビュー環境での測定を推奨**します。

### 測定パターン

各ページについて、以下の2パターンで測定してください：

1. **Mobile**（モバイル）
2. **Desktop**（デスクトップ）

最低限、**ブログ一覧ページ（Mobile）** と **ブログ記事詳細ページ（Mobile）** を測定してください。

## 測定結果の記録

測定結果は `LIGHTHOUSE_RESULTS.md` に記録してください（テンプレートを参照）。

### 記録する項目

1. **基本情報**
   - 測定日時
   - ページURL
   - デバイス種別（Mobile/Desktop）

2. **スコア**
   - Performance（パフォーマンス）
   - Accessibility（アクセシビリティ）
   - Best Practices（おすすめの方法）
   - SEO

3. **パフォーマンス指標**
   - FCP (First Contentful Paint)
   - LCP (Largest Contentful Paint)
   - TBT (Total Blocking Time)
   - CLS (Cumulative Layout Shift)
   - Speed Index

4. **リソースサイズ**
   - JavaScript総サイズ
   - CSS総サイズ
   - 画像サイズ
   - 未使用JavaScript（削減可能量）
   - 未使用CSS（削減可能量）

## 以前の測定結果との比較

### ログイン導入前の基準値（2025-12-18測定）

**ブログ一覧ページ（Mobile）**

| 指標 | スコア/値 |
|------|-----------|
| Performance | 100 |
| Accessibility | 100 |
| Best Practices | 100 |
| SEO | 100 |
| FCP | 0.5s |
| LCP | 0.8s |
| TBT | 0ms |
| CLS | 0 |
| Speed Index | 0.5s |
| 未使用JavaScript | 39 KiB |
| 未使用CSS | 11.8 KiB |

※ 詳細は `content/blog/posts/lighthouse-mobile-optimization-perfect-score.md` を参照

### 比較の観点

ログイン導入後の測定結果を上記の基準値と比較し、以下を確認してください：

1. **スコアの変化**
   - 各カテゴリのスコアが維持されているか
   - Performance スコアが 95点以上を維持しているか

2. **パフォーマンス指標の変化**
   - FCP、LCPが大幅に悪化していないか（+0.5s以内が理想）
   - TBTが増加していないか

3. **リソースサイズの変化**
   - JavaScriptサイズの増加量（+5 KiB以内が目標）
   - CSSサイズの増加量（+2 KiB以内が目標）

4. **想定される影響**
   - ヘッダーのログインボタン追加による軽微な増加
   - セッションチェックロジックによる軽微なJavaScript増加
   - 認証状態によるUI分岐の処理

### 許容範囲の判断基準

| 項目 | 許容範囲 | 対応要否 |
|------|----------|----------|
| Performanceスコア | 95点以上 | 95点未満なら要対応 |
| その他スコア | 100点 | 100点未満なら要対応 |
| JavaScript増加 | +5 KiB以内 | 超過時は原因調査 |
| CSS増加 | +2 KiB以内 | 超過時は原因調査 |
| FCP/LCP悪化 | +0.5s以内 | 超過時は要対応 |

## トラブルシューティング

### ページが正しく表示されない

```bash
# 開発サーバーを再起動
npm run dev:wrangler:clean
```

### 測定結果が不安定

- 複数回測定して平均値を取る（3回推奨）
- 他のタブやアプリケーションを閉じて測定する
- ブラウザのキャッシュをクリアしてから測定する

### 認証ページの測定方法

1. ログインしてからDevToolsを開く
2. Lighthouseタブで「Clear storage」のチェックを**外す**
3. 測定を実行（ログイン状態が維持される）

## 参考資料

- [Lighthouse公式ドキュメント](https://developer.chrome.com/docs/lighthouse/)
- [Web Vitals](https://web.dev/vitals/)
- プロジェクト内の過去のLighthouse改善記事
  - `content/blog/posts/lighthouse-mobile-optimization-perfect-score.md`
  - `content/blog/posts/lighthouse-css-optimization-route-splitting.md`
  - `content/blog/posts/lighthouse-javascript-optimization-challenges.md`
