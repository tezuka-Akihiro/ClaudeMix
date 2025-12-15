// logger - 環境変数ベースのログユーティリティ
// 本番環境ではdebugログを抑制し、開発環境でのみ詳細ログを出力

/**
 * デバッグモードかどうかを判定
 * 開発環境、またはDEBUG_OGP環境変数がtrueの場合にデバッグログを有効化
 */
export const DEBUG_MODE = process.env.NODE_ENV === 'development' || process.env.DEBUG_OGP === 'true';

/**
 * デバッグログを出力（開発環境のみ）
 * @param message - ログメッセージ
 * @param args - 追加の引数
 */
export function debugLog(message: string, ...args: unknown[]): void {
  if (DEBUG_MODE) {
    console.log(message, ...args);
  }
}

/**
 * エラーログを出力（常に出力）
 * @param message - エラーメッセージ
 * @param error - エラーオブジェクト
 */
export function errorLog(message: string, error: unknown): void {
  console.error(message, error);
  if (error instanceof Error && DEBUG_MODE) {
    console.error('Stack:', error.stack);
    if ('cause' in error) {
      console.error('Cause:', error.cause);
    }
  }
}
