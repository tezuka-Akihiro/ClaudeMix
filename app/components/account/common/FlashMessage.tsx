/**
 * FlashMessage.tsx
 * Purpose: Display temporary flash messages (success, error, info)
 *
 * @layer UI層 (components)
 * @responsibility フラッシュメッセージの表示と自動非表示
 */

import { useEffect, useState } from 'react';

export interface FlashMessageProps {
  message: string;
  type?: 'error' | 'warning' | 'info';
  autoDismiss?: boolean;
  autoDismissDelay?: number;
  onClose?: () => void;
}

export function FlashMessage({
  message,
  type = 'info',
  autoDismiss = true,
  autoDismissDelay = 5000,
  onClose,
}: FlashMessageProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!autoDismiss) return;

    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, autoDismissDelay);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoDismiss, autoDismissDelay]);

  if (!isVisible) {
    return null;
  }

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) {
      onClose();
    }
  };

  return (
    <div
      className={`flash-message-${type}`}
      data-testid="flash-message"
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      <span className="flash-message__text">{message}</span>
      <button
        className="flash-message__close"
        onClick={handleClose}
        aria-label="メッセージを閉じる"
        data-testid="flash-message-close"
      >
        ×
      </button>
    </div>
  );
}
