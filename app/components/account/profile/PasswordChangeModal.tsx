/**
 * PasswordChangeModal.tsx
 * Purpose: Modal for changing password
 *
 * @layer UI層 (components)
 * @responsibility パスワード変更モーダル
 */

import { Form, useNavigation } from '@remix-run/react';

export interface PasswordChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  errors?: {
    currentPassword?: string;
    newPassword?: string;
    newPasswordConfirm?: string;
  };
}

export function PasswordChangeModal({ isOpen, onClose, errors }: PasswordChangeModalProps) {
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
        <h2 className="profile-modal__title">パスワード変更</h2>

        <Form method="post" className="profile-form">
          <input type="hidden" name="intent" value="password-change" />

          <div className="profile-form-field-structure">
            <label htmlFor="currentPassword" className="profile-form__label">
              現在のパスワード
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
              新しいパスワード
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
              新しいパスワード（確認）
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
              {isSubmitting ? '保存中...' : '保存'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="profile-modal__button profile-modal__button--secondary"
              data-testid="cancel-button"
            >
              キャンセル
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}
