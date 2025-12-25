/**
 * EmailChangeModal.tsx
 * Purpose: Modal for changing email address
 *
 * @layer UI層 (components)
 * @responsibility メールアドレス変更モーダル
 */

import { Form, useNavigation } from '@remix-run/react';

export interface EmailChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  errors?: {
    newEmail?: string;
    currentPassword?: string;
  };
}

export function EmailChangeModal({ isOpen, onClose, errors }: EmailChangeModalProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  if (!isOpen) return null;

  return (
    <div
      className="profile-modal-overlay profile-modal-overlay-structure"
      onClick={onClose}
      data-testid="email-change-modal"
    >
      <div className="profile-modal profile-modal-structure" onClick={(e) => e.stopPropagation()}>
        <h2 className="profile-modal__title">メールアドレス変更</h2>

        <Form method="post" className="profile-form">
          <input type="hidden" name="intent" value="email-change" />

          <div className="profile-form-field-structure">
            <label htmlFor="newEmail" className="profile-form__label">
              新しいメールアドレス
            </label>
            <input
              id="newEmail"
              name="newEmail"
              type="email"
              className={`profile-form__input ${errors?.newEmail ? 'profile-form__input--error' : ''}`}
              required
              data-testid="new-email-input"
            />
            {errors?.newEmail && (
              <span className="profile-form__error">{errors.newEmail}</span>
            )}
          </div>

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
