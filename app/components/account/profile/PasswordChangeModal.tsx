/**
 * PasswordChangeModal.tsx
 * Purpose: Modal for changing password
 *
 * @layer UI層 (components)
 * @responsibility パスワード変更モーダル
 */

import { Form, useNavigation } from '@remix-run/react';
import { useEffect, useRef } from 'react';

export interface PasswordChangeModalSpec {
  title: string;
  fields: {
    current_password: {
      label: string;
      placeholder: string;
    };
    new_password: {
      label: string;
      placeholder: string;
    };
    new_password_confirm: {
      label: string;
      placeholder: string;
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

export interface PasswordChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  spec: PasswordChangeModalSpec;
  errors?: {
    currentPassword?: string;
    newPassword?: string;
    newPasswordConfirm?: string;
  };
}

export function PasswordChangeModal({ isOpen, onClose, spec, errors }: PasswordChangeModalProps) {
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
      data-testid="password-change-modal"
    >
      <div
        ref={modalRef}
        className="profile-modal profile-modal-structure"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="password-change-modal-title"
      >
        <h2 id="password-change-modal-title" className="profile-modal__title">
          {spec.title}
        </h2>

        <Form method="post" className="auth-form-structure">
          <input type="hidden" name="intent" value="password-change" />

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

          <div className="form-field-structure">
            <label htmlFor="newPassword">{spec.fields.new_password.label}</label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              className="form-field__input"
              placeholder={spec.fields.new_password.placeholder}
              required
              aria-invalid={errors?.newPassword ? true : undefined}
              aria-describedby={errors?.newPassword ? 'new-password-error' : undefined}
              data-testid="new-password-input"
            />
            {errors?.newPassword && (
              <span id="new-password-error" className="error-message-structure" role="alert">
                {errors.newPassword}
              </span>
            )}
          </div>

          <div className="form-field-structure">
            <label htmlFor="newPasswordConfirm">{spec.fields.new_password_confirm.label}</label>
            <input
              id="newPasswordConfirm"
              name="newPasswordConfirm"
              type="password"
              className="form-field__input"
              placeholder={spec.fields.new_password_confirm.placeholder}
              required
              aria-invalid={errors?.newPasswordConfirm ? true : undefined}
              aria-describedby={errors?.newPasswordConfirm ? 'new-password-confirm-error' : undefined}
              data-testid="new-password-confirm-input"
            />
            {errors?.newPasswordConfirm && (
              <span id="new-password-confirm-error" className="error-message-structure" role="alert">
                {errors.newPasswordConfirm}
              </span>
            )}
          </div>

          <div className="profile-modal-buttons-structure">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
              data-testid="save-button"
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
