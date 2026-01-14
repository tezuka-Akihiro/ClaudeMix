# Lighthouse測定 クイックスタートガイド

このガイドに従って、すぐに測定を開始できます。

## ステップ1: プレビュー環境にアクセス

### URL

```
https://claude-lighthouse-impact-ass.claudemix.pages.dev/
```

ブラウザでこのURLを開いて、正常に表示されることを確認してください。

### テストアカウント

認証ページの測定には、以下のアカウントを使用してください：

- **Email**: `tizuhanpen8+preview@gmail.com`
- **Password**: `14801250At`

## ステップ2: 最小限の測定（5分で完了）

最低限、以下の2つのページで測定を実施してください：

### 1. ブログ一覧ページ（Mobile）⭐⭐⭐ 必須

1. URLを開く: `https://claude-lighthouse-impact-ass.claudemix.pages.dev/blog`
2. `F12` を押してDevToolsを開く
3. 「Lighthouse」タブをクリック
4. Device: **Mobile** を選択
5. すべてのカテゴリにチェック（Performance, Accessibility, Best Practices, SEO）
6. 「Analyze page load」をクリック
7. 測定完了を待つ（30秒～1分）
8. 結果を確認:
   - **Performance**: ？点（目標: 95点以上）
   - **Accessibility**: ？点（目標: 100点）
   - **Best Practices**: ？点（目標: 100点）
   - **SEO**: ？点（目標: 100点）
9. レポート保存: 右上の「💾」アイコンをクリック
10. ファイル名: `blog-posts-mobile-20260113.html`

### 2. ブログ記事詳細ページ（Mobile）⭐⭐⭐ 必須

1. URLを開く: `https://claude-lighthouse-impact-ass.claudemix.pages.dev/blog/welcome`
2. 同様の手順で測定
3. ファイル名: `blog-detail-mobile-20260113.html`

## ステップ3: 結果の確認

### 基準値（ログイン導入前）

| 指標 | 基準値 | 許容範囲 |
|------|--------|----------|
| Performance | 100点 | 95点以上 |
| Accessibility | 100点 | 100点 |
| Best Practices | 100点 | 100点 |
| SEO | 100点 | 100点 |
| 未使用JavaScript | 39 KiB | +5 KiB以内 |
| 未使用CSS | 11.8 KiB | +2 KiB以内 |

### 測定結果の記録

測定が完了したら、以下の情報を記録してください：

#### ブログ一覧ページ（Mobile）

```
測定日時: 2026-01-13 HH:MM

【スコア】
Performance: ？点
Accessibility: ？点
Best Practices: ？点
SEO: ？点

【パフォーマンス指標】
FCP: ？ms
LCP: ？ms
TBT: ？ms
CLS: ？
Speed Index: ？ms

【リソースサイズ】
未使用JavaScript: ？ KiB
未使用CSS: ？ KiB
```

#### ブログ記事詳細ページ（Mobile）

```
測定日時: 2026-01-13 HH:MM

【スコア】
Performance: ？点
Accessibility: ？点
Best Practices: ？点
SEO: ？点

【パフォーマンス指標】
FCP: ？ms
LCP: ？ms
TBT: ？ms
CLS: ？
Speed Index: ？ms

【リソースサイズ】
未使用JavaScript: ？ KiB
未使用CSS: ？ KiB
```

## ステップ4: 結果の評価

### 合格判定

- ✅ すべてのスコアが目標値を満たしている
- ✅ リソースサイズの増加が許容範囲内

### 要対応判定

- ❌ Performanceスコアが95点未満
- ❌ その他のスコアが100点未満
- ❌ JavaScript増加が+5 KiBを超過
- ❌ CSS増加が+2 KiBを超過

## ステップ5: 次のアクション

### 結果が良好な場合

1. 測定結果を`LIGHTHOUSE_RESULTS.md`に記録
2. ブログ記事を作成（成功事例として）
3. 他のページも測定（推奨）

### 改善が必要な場合

1. 問題のある項目を特定
2. 原因を分析
3. 改善策を検討
4. ブログ記事を作成（改善プロセスとして）

## トラブルシューティング

### プレビュー環境にアクセスできない

- デプロイ完了まで数分待つ（通常3-5分）
- ブラウザのキャッシュをクリア
- URLが正しいか確認

### Lighthouseタブが見つからない

- DevToolsの右上の「>>」アイコンをクリック
- 「Lighthouse」を選択

### 測定が失敗する

- ページが正常に表示されているか確認
- 他のタブやアプリケーションを閉じる
- ブラウザを再起動して再試行

## 完全な測定を実施する場合

時間に余裕がある場合は、以下のドキュメントを参照して、より詳細な測定を実施してください：

- `MEASUREMENT_GUIDE.md`: 詳細な測定手順
- `measurement-checklist.md`: 完全なチェックリスト
- `LIGHTHOUSE_RESULTS.md`: 結果記録テンプレート

---

**準備完了！**

プレビュー環境が利用可能になったら、すぐに測定を開始できます。
