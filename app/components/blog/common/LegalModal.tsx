/**
 * LegalModal.tsx
 * Purpose: Modal for displaying Commercial Transaction Act
 *
 * @layer UI層 (components)
 * @responsibility 特定商取引法表示用モーダル（個人情報保護のため検索エンジンから隠蔽）
 */

import { useEffect, useRef } from 'react';

export interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
}

export default function LegalModal({ isOpen, onClose, content }: LegalModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Focus trap implementation
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    // Get all focusable elements
    const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
      'button, [href], [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Set initial focus to close button
    if (firstElement) {
      firstElement.focus();
    }

    // Trap focus within modal
    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        // Shift+Tab: moving backwards
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab: moving forwards
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Store original overflow value
      const originalOverflow = document.body.style.overflow;
      // Disable scroll
      document.body.style.overflow = 'hidden';

      return () => {
        // Restore original overflow value
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="legal-modal__overlay legal-modal__overlay-structure"
      onClick={onClose}
      data-testid="legal-modal-overlay"
    >
      <div
        ref={modalRef}
        className="legal-modal__dialog legal-modal__dialog-structure"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-modal-title"
      >
        <div className="legal-modal__header legal-modal__header-structure">
          <h2 id="legal-modal-title" className="legal-modal__title">
            特定商取引法に基づく表記
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="legal-modal__close-button legal-modal__close-button-structure"
            aria-label="閉じる"
            data-testid="close-button"
          >
            ×
          </button>
        </div>

        <div className="legal-modal__content">
          {/* Render content as HTML (ensure content is sanitized before passing) */}
          <div dangerouslySetInnerHTML={{ __html: content }} />
        </div>
      </div>
    </div>
  );
}
