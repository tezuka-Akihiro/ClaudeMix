// ogp-constants - OGP画像生成に関する定数定義
// フォント取得URLなどのハードコード値を一元管理

/**
 * Google Fonts APIのエンドポイント
 * Noto Sans JP (Regular 400) のCSSを取得
 */
export const GOOGLE_FONTS_CSS_URL = 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400&display=swap';

/**
 * User-Agentヘッダー
 * Google Fonts APIがTTFフォーマットを返すために必要
 */
export const FONT_FETCH_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

/**
 * Cache API名前空間
 * OGPフォント用のキャッシュストレージ識別子
 */
export const OGP_FONT_CACHE_NAME = 'ogp-fonts-v1';

/**
 * フォントファイルのContent-Type
 */
export const FONT_CONTENT_TYPE = 'font/ttf';

/**
 * フォントキャッシュのCache-Controlヘッダー
 * 1年間のimmutableキャッシュを設定
 */
export const FONT_CACHE_CONTROL = 'public, max-age=31536000, immutable';

/**
 * CSSからフォントURLを抽出する正規表現
 * url(https://.../*.ttf) の形式にマッチ
 */
export const FONT_URL_REGEX = /url\((https:\/\/[^)]+\.ttf)\)/;
