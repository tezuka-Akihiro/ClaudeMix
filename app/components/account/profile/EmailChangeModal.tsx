/**
 * EmailChangeModal.tsx
 * Purpose: Modal for changing email address
 *
 * @layer UI層 (components)
 * @responsibility メールアドレス変更モーダル
 */

import { Form, useNavigation } from '@remix-run/react';
import { useEffect, useRef } from 'react';

export interface EmailChangeModalSpec {
  title: string;
  fields: {
    new_email: {
      label: string;
      placeholder: string;
    };
    current_password: {
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

export interface EmailChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  spec: EmailChangeModalSpec;
  error?: string;
  errors?: {
    newEmail?: string;
    currentPassword?: string;
  };
}

export function EmailChangeModal({ isOpen, onClose, spec, error, errors }: EmailChangeModalProps) {
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
      data-testid="email-change-modal"
    >
      <div
        ref={modalRef}
        className="profile-modal profile-modal-structure"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="email-change-modal-title"
      >
        <h2 id="email-change-modal-title" className="profile-modal__title">
          {spec.title}
        </h2>

        {error && (
          <div className="profile-error" role="alert" data-testid="modal-error-message">
            {error}
          </div>
        )}

        <Form method="post" className="auth-form-structure">
          <input type="hidden" name="intent" value="email-change" />

          <div className="form-field-structure">
            <label htmlFor="newEmail">{spec.fields.new_email.label}</label>
            <input
              id="newEmail"
              name="newEmail"
              type="email"
              className="form-field__input"
              placeholder={spec.fields.new_email.placeholder}
              required
              aria-invalid={errors?.newEmail ? true : undefined}
              aria-describedby={errors?.newEmail ? 'new-email-error' : undefined}
              data-testid="new-email-input"
            />
            {errors?.newEmail && (
              <span id="new-email-error" className="error-message-structure" role="alert">
                {errors.newEmail}
              </span>
            )}
          </div>

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
