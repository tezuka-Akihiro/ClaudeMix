# 測定対象パスリスト

## 設定

- **baseUrl**: `http://localhost:3000`（`npm run dev:wrangler` で起動）

## 測定対象

| ページ | パス | デバイス | 優先度 |
|--------|------|----------|--------|
| ブログ一覧 | /blog | mobile | 必須 |
| ブログ一覧 | /blog | desktop | 必須 |
| ブログ記事詳細 | /blog/about-claudemix | mobile | 必須 |
| ブログ記事詳細 | /blog/about-claudemix | desktop | 必須 |
| ログイン | /login | mobile | 必須 |
| ログイン | /login | desktop | 必須 |
| 会員登録 | /register | mobile | 必須 |
| 会員登録 | /register | desktop | 必須 |

## パス追加時の手順

1. このファイルにページ情報を追記
2. `scripts/measure.ts` の `measurements` 配列に対応するエントリを追加
