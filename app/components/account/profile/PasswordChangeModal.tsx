/**
 * PasswordChangeModal.tsx
 * Purpose: Modal for changing password
 *
 * @layer UI層 (components)
 * @responsibility パスワード変更モーダル
 */

import { Form, useNavigation } from '@remix-run/react';

export interface PasswordChangeModalSpec {
  title: string;
  fields: {
    current_password: {
      label: string;
    };
    new_password: {
      label: string;
    };
    new_password_confirm: {
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

  if (!isOpen) return null;

  return (
    <div
      className="profile-modal-overlay profile-modal-overlay-structure"
      onClick={onClose}
      data-testid="password-change-modal"
    >
      <div className="profile-modal profile-modal-structure" onClick={(e) => e.stopPropagation()}>
        <h2 className="profile-modal__title">{spec.title}</h2>

        <Form method="post" className="profile-form">
          <input type="hidden" name="intent" value="password-change" />

          <div className="profile-form-field-structure">
            <label htmlFor="currentPassword" className="profile-form__label">
              {spec.fields.current_password.label}
            </label>
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              className={`profile-form__input ${errors?.currentPassword ? 'profile-form__input--error' : ''}`}
              required
              data-testid="current-password-input"
            />
            {errors?.currentPassword && (
              <span className="profile-form__error">{errors.currentPassword}</span>
            )}
          </div>

          <div className="profile-form-field-structure">
            <label htmlFor="newPassword" className="profile-form__label">
              {spec.fields.new_password.label}
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              className={`profile-form__input ${errors?.newPassword ? 'profile-form__input--error' : ''}`}
              required
              data-testid="new-password-input"
            />
            {errors?.newPassword && (
              <span className="profile-form__error">{errors.newPassword}</span>
            )}
          </div>

          <div className="profile-form-field-structure">
            <label htmlFor="newPasswordConfirm" className="profile-form__label">
              {spec.fields.new_password_confirm.label}
            </label>
            <input
              id="newPasswordConfirm"
              name="newPasswordConfirm"
              type="password"
              className={`profile-form__input ${errors?.newPasswordConfirm ? 'profile-form__input--error' : ''}`}
              required
              data-testid="new-password-confirm-input"
            />
            {errors?.newPasswordConfirm && (
              <span className="profile-form__error">{errors.newPasswordConfirm}</span>
            )}
          </div>

          <div className="profile-modal-buttons-structure">
            <button
              type="submit"
              disabled={isSubmitting}
              className="profile-modal__button profile-modal__button--primary"
              data-testid="save-button"
            >
              {isSubmitting ? spec.submit_button.loading_label : spec.submit_button.label}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="profile-modal__button profile-modal__button--secondary"
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
