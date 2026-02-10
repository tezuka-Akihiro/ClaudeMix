/**
 * サーバーフラグ定義（概念的な機能制御）
 * ボイラープレート基盤機能
 */

/**
 * 概念的なサーバーフラグ（実際の外部連携なし）
 * UI演出のための制御フラグ
 */
export const SERVER_FLAGS = {
  /**
   * 夜間アクセス不可のUI演出を有効化
   * true: 夜間アクセス時に `/closed` ページを表示
   * false: 常時アクセス可能
   *
   * 将来の拡張例（コメントのみ）:
   * - 実際の夜間制御はCronやCloudflare Workersで実装可能
   * - このフラグは環境変数から読み込むよう変更可能
   * - タイムゾーン対応、営業時間設定などの拡張が可能
   */
  AUTOSHUTDOWN_NIGHT: false,
} as const;

/**
 * 夜間アクセス制御の判定（概念実装）
 * 将来の拡張用プレースホルダー
 */
export function isNightTime(): boolean {
  if (!SERVER_FLAGS.AUTOSHUTDOWN_NIGHT) return false;

  // 現状は常にfalseを返す（UI演出のみ）
  // 将来的には実際の時刻判定を実装可能
  // const hour = new Date().getHours();
  // return hour >= 22 || hour < 6; // 22:00-6:00を夜間とする例

  return false;
}
