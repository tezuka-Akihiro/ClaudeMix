// LegalModal - Component (components層)
// 法的表記（特定商取引法など）を表示するモーダル

import React, { useEffect } from 'react';
import { data as defaultSpec } from '~/generated/specs/blog/common';
import type { BlogCommonSpec } from '~/specs/blog/types';
import { extractTestId } from '~/lib/utils/extractTestId';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  spec?: BlogCommonSpec;
}

const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  content,
  spec = defaultSpec
}) => {
  const { ui_selectors, accessibility, legal_modal } = spec;

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="legal-modal__overlay"
      onClick={onClose}
      data-testid={extractTestId(ui_selectors.legal_modal.modal_overlay)}
    >
      <div
        className="legal-modal__dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ui_selectors.legal_modal.modal_title.replace('#', '')}
        data-testid={extractTestId(ui_selectors.legal_modal.modal_dialog)}
      >
        <div className="legal-modal__header">
          <h2
            id={ui_selectors.legal_modal.modal_title.replace('#', '')}
            className="legal-modal__title"
            data-testid={extractTestId(ui_selectors.legal_modal.modal_title)}
          >
            {legal_modal.title}
          </h2>
          <button
            className="legal-modal__close-button"
            onClick={onClose}
            aria-label={accessibility.aria_labels.legal_modal_close}
            data-testid={extractTestId(ui_selectors.legal_modal.close_button)}
          >
            ×
          </button>
        </div>
        <div
          className="legal-modal__content"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </div>
  );
};

export default LegalModal;
