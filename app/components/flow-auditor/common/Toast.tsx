// Toast - app/components: トースト通知コンポーネント
// flow-auditor内で共通利用されるトースト通知（成功/エラーメッセージ表示用）

import { useEffect, useState } from 'react';

export interface ToastProps {
  /** 表示するメッセージ */
  message: string;
  /** トーストの種類（success: 緑、error: 赤） */
  type: 'success' | 'error';
  /** 表示時間（ミリ秒）デフォルト: 2000ms */
  duration?: number;
  /** 非表示時のコールバック */
  onClose: () => void;
  /** data-testid属性 */
  testId?: string;
}

/**
 * トースト通知コンポーネント
 *
 * - 右上に表示され、指定時間後に自動的にフェードアウト
 * - success: 緑色背景、error: 赤色背景
 * - アニメーション: フェードイン/フェードアウト（0.3秒）
 *
 * @example
 * // 成功通知
 * <Toast
 *   message="Copied: develop/flow-auditor/common/func-spec.md"
 *   type="success"
 *   onClose={() => setShowToast(false)}
 *   testId="toast-notification"
 * />
 *
 * @example
 * // エラー通知
 * <Toast
 *   message="Failed to copy path"
 *   type="error"
 *   duration={3000}
 *   onClose={() => setShowToast(false)}
 *   testId="toast-error"
 * />
 */
export default function Toast({
  message,
  type,
  duration = 2000,
  onClose,
  testId,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // duration後にフェードアウト開始
    const fadeOutTimer = setTimeout(() => {
      setIsVisible(false);
    }, duration);

    // フェードアウトアニメーション完了後にonClose実行（0.3秒後）
    const closeTimer = setTimeout(() => {
      onClose();
    }, duration + 300);

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(closeTimer);
    };
  }, [duration, onClose]);

  return (
    <div
      data-testid={testId}
      className={`toast toast-${type} ${isVisible ? 'toast-visible' : 'toast-hidden'}`}
      role="alert"
      aria-live="polite"
    >
      {message}
    </div>
  );
}
