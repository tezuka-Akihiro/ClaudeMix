/**
 * DeleteAccountModal.tsx
 * Purpose: Modal for account deletion
 *
 * @layer UI層 (components)
 * @responsibility アカウント削除モーダル
 */

import { Form, useNavigation } from '@remix-run/react';

export interface DeleteAccountModalSpec {
  title: string;
  warning_message: string;
  fields: {
    current_password: {
      label: string;
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

  if (!isOpen) return null;

  return (
    <div
      className="profile-modal-overlay profile-modal-overlay-structure"
      onClick={onClose}
      data-testid="delete-account-modal"
    >
      <div className="profile-modal profile-modal-structure" onClick={(e) => e.stopPropagation()}>
        <h2 className="profile-modal__title">{spec.title}</h2>

        <div className="profile-modal__warning">
          {spec.warning_message}
        </div>

        <Form method="post" className="profile-form">
          <input type="hidden" name="intent" value="delete-account" />

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
            <span className="profile-form__error">{errors.confirmation}</span>
          )}

          <div className="profile-modal-buttons-structure">
            <button
              type="submit"
              disabled={isSubmitting}
              className="profile-modal__button profile-modal__button--danger"
              data-testid="delete-button"
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
