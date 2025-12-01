// copyToClipboard - app/lib: クリップボードコピーユーティリティ
// navigator.clipboard APIを使用し、非対応ブラウザではdocument.execCommand('copy')にフォールバック

/**
 * テキストをクリップボードにコピーする
 *
 * - 優先: navigator.clipboard.writeText() (モダンClipboard API)
 * - フォールバック: document.execCommand('copy') (レガシーブラウザ対応)
 *
 * @param text - コピーするテキスト
 * @returns Promise<boolean> - 成功時true、失敗時false
 *
 * @example
 * // 成功時
 * const success = await copyToClipboard('develop/flow-auditor/common/func-spec.md');
 * if (success) {
 *   console.log('Copied successfully');
 * }
 *
 * @example
 * // エラーハンドリング
 * try {
 *   const success = await copyToClipboard(path);
 *   if (!success) {
 *     console.error('Failed to copy');
 *   }
 * } catch (error) {
 *   console.error('Copy error:', error);
 * }
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // モダンClipboard APIを試行
  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.warn('Clipboard API failed, trying fallback:', error);
      // フォールバックに進む
    }
  }

  // フォールバック: document.execCommand('copy')
  try {
    // 一時的なテキストエリアを作成
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed'; // スクロール防止
    textarea.style.opacity = '0'; // 非表示
    document.body.appendChild(textarea);

    // テキストを選択
    textarea.select();
    textarea.setSelectionRange(0, text.length);

    // コピー実行
    const success = document.execCommand('copy');

    // クリーンアップ
    document.body.removeChild(textarea);

    return success;
  } catch (error) {
    console.error('Fallback copy failed:', error);
    return false;
  }
}
