/**
 * ProfileDisplay.tsx
 * Purpose: Display user profile information
 *
 * @layer UI層 (components)
 * @responsibility ユーザープロフィール情報の表示
 */

import type { User } from '~/specs/account/types';

export interface ProfileDisplayProps {
  user: User;
  onEmailChange: () => void;
  onPasswordChange: () => void;
  onDeleteAccount: () => void;
}

export function ProfileDisplay({
  user,
  onEmailChange,
  onPasswordChange,
  onDeleteAccount,
}: ProfileDisplayProps) {
  return (
    <div className="profile-section profile-section-structure">
      <h2 className="profile-section__title">プロフィール情報</h2>

      <div className="profile-info-structure">
        <div className="profile-info__item">
          <div className="profile-info__label">メールアドレス</div>
          <div className="profile-info__value">{user.email}</div>
        </div>

        <div className="profile-info__item">
          <div className="profile-info__label">サブスクリプション状態</div>
          <div className="profile-info__value">
            {user.subscriptionStatus === 'active' && 'アクティブ'}
            {user.subscriptionStatus === 'inactive' && '非アクティブ'}
            {user.subscriptionStatus === 'trial' && 'トライアル'}
          </div>
        </div>

        <div className="profile-info__item">
          <div className="profile-info__label">アカウント作成日</div>
          <div className="profile-info__value">
            {new Date(user.createdAt).toLocaleDateString('ja-JP')}
          </div>
        </div>
      </div>

      <div className="profile-section profile-section-structure">
        <h3 className="profile-section__title">アカウント操作</h3>

        <div className="profile-actions-structure">
          <button
            type="button"
            onClick={onEmailChange}
            className="profile-actions__button"
            data-testid="email-change-button"
          >
            メールアドレスを変更
          </button>

          <button
            type="button"
            onClick={onPasswordChange}
            className="profile-actions__button"
            data-testid="password-change-button"
          >
            パスワードを変更
          </button>

          <button
            type="button"
            onClick={onDeleteAccount}
            className="profile-actions__button profile-actions__button--danger"
            data-testid="delete-account-button"
          >
            アカウントを削除
          </button>
        </div>
      </div>
    </div>
  );
}
