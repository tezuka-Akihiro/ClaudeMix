/**
 * DeleteAccountModal.tsx
 * Purpose: Modal for account deletion
 *
 * @layer UI層 (components)
 * @responsibility アカウント削除モーダル
 */

import { Form, useNavigation } from '@remix-run/react';
import { useEffect, useRef } from 'react';

export interface DeleteAccountModalSpec {
  title: string;
  warning_message: string;
  fields: {
    current_password: {
      label: string;
      placeholder: string;
    };
    confirmation: {
      label: string;
    };
  };
  submit_button: {
    label: string;
    loading_label: string;
  };
  cancel_button: {
    label: string;
  };
}

export interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  spec: DeleteAccountModalSpec;
  errors?: {
    currentPassword?: string;
    confirmation?: string;
  };
}

export function DeleteAccountModal({ isOpen, onClose, spec, errors }: DeleteAccountModalProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';
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

    // Get all focusable elements (excluding hidden inputs)
    const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Set initial focus to first element without scrolling
    if (firstElement) {
      firstElement.focus({ preventScroll: true });
    }

    // Trap focus within modal
    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        // Shift+Tab: moving backwards
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus({ preventScroll: true });
        }
      } else {
        // Tab: moving forwards
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus({ preventScroll: true });
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="profile-modal-overlay profile-modal-overlay-structure"
      onClick={onClose}
      data-testid="delete-account-modal"
    >
      <div
        ref={modalRef}
        className="profile-modal profile-modal-structure"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-account-modal-title"
      >
        <h2 id="delete-account-modal-title" className="profile-modal__title">
          {spec.title}
        </h2>

        <div className="profile-modal__warning">
          {spec.warning_message}
        </div>

        <Form method="post" className="auth-form-structure">
          <input type="hidden" name="intent" value="delete-account" />

          <div className="form-field-structure">
            <label htmlFor="currentPassword">{spec.fields.current_password.label}</label>
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              className="form-field__input"
              placeholder={spec.fields.current_password.placeholder}
              required
              aria-invalid={errors?.currentPassword ? true : undefined}
              aria-describedby={errors?.currentPassword ? 'current-password-error' : undefined}
              data-testid="current-password-input"
            />
            {errors?.currentPassword && (
              <span id="current-password-error" className="error-message-structure" role="alert">
                {errors.currentPassword}
              </span>
            )}
          </div>

          <div className="profile-form__checkbox-wrapper">
            <input
              id="confirmation"
              name="confirmation"
              type="checkbox"
              value="true"
              className="profile-form__checkbox"
              required
              data-testid="confirmation-checkbox"
            />
            <label htmlFor="confirmation" className="profile-form__checkbox-label">
              {spec.fields.confirmation.label}
            </label>
          </div>
          {errors?.confirmation && (
            <span className="error-message-structure" role="alert">
              {errors.confirmation}
            </span>
          )}

          <div className="profile-modal-buttons-structure">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-danger"
              data-testid="delete-button"
            >
              {isSubmitting ? spec.submit_button.loading_label : spec.submit_button.label}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              data-testid="cancel-button"
            >
              {spec.cancel_button.label}
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}
