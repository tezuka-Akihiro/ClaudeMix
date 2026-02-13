# 測定対象パスリスト（オペレータ向け）

base_url: https://claudemix.dev

## 測定方法

1. **PageSpeed Insights**: https://pagespeed.web.dev/ にデプロイ済みURLを入力
2. **Chrome DevTools**: シークレットモード（拡張機能なし）→ F12 → Lighthouse タブ → 全カテゴリチェック → Analyze

**注意**: ローカル dev サーバー（localhost）での測定はノイズが大きく不正確。必ずデプロイ版で測定すること。

## 測定対象ページ

| ページ | パス | デバイス | 優先度 |
|--------|------|----------|--------|
| ブログ一覧 | /blog | mobile | 必須 |
| ブログ記事詳細 | /blog/about-claudemix | mobile | 必須 |
| ログイン | /login | mobile | 必須 |
| 会員登録 | /register | mobile | 必須 |

**デバイス**: PageSpeed Insights の「携帯電話」（mobile）を基準とする。デスクトップはモバイルより高スコアになるため省略可。

## パス追加時の手順

1. このファイルにページ情報を追記
