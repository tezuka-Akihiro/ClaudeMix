/**
 * ProfileDisplay.tsx
 * Purpose: Display user profile information
 *
 * @layer UI層 (components)
 * @responsibility ユーザープロフィール情報の表示
 */

import type { User } from '~/specs/account/types';

export interface ProfileDisplaySpec {
  sections: {
    info: {
      title: string;
      fields: {
        email: { label: string };
        subscription_status: {
          label: string;
          values: {
            active: string;
            inactive: string;
          };
        };
        created_at: { label: string };
      };
    };
    actions: {
      title: string;
      buttons: Array<{
        label: string;
        action: string;
        variant: string;
      }>;
    };
  };
}

export interface ProfileDisplayProps {
  user: User;
  spec: ProfileDisplaySpec;
  onEmailChange: () => void;
  onPasswordChange: () => void;
  onDeleteAccount: () => void;
}

export function ProfileDisplay({
  user,
  spec,
  onEmailChange,
  onPasswordChange,
  onDeleteAccount,
}: ProfileDisplayProps) {
  const { info, actions } = spec.sections;

  // Get subscription status label from spec
  const subscriptionLabel =
    info.fields.subscription_status.values[user.subscriptionStatus] ||
    info.fields.subscription_status.values.inactive;

  return (
    <div className="profile-section profile-section-structure">
      <h2 className="profile-section__title">{info.title}</h2>

      <div className="profile-info-structure">
        <div className="profile-info__item">
          <div className="profile-info__label">{info.fields.email.label}</div>
          <div className="profile-info__value">{user.email}</div>
        </div>

        <div className="profile-info__item">
          <div className="profile-info__label">{info.fields.subscription_status.label}</div>
          <div className="profile-info__value">{subscriptionLabel}</div>
        </div>

        <div className="profile-info__item">
          <div className="profile-info__label">{info.fields.created_at.label}</div>
          <div className="profile-info__value">
            {new Date(user.createdAt).toLocaleDateString('ja-JP')}
          </div>
        </div>
      </div>

      <div className="profile-section profile-section-structure">
        <h3 className="profile-section__title">{actions.title}</h3>

        <div className="profile-actions-structure">
          <button
            type="button"
            onClick={onEmailChange}
            className="profile-actions__button"
            data-testid="email-change-button"
          >
            {actions.buttons[0].label}
          </button>

          <button
            type="button"
            onClick={onPasswordChange}
            className="profile-actions__button"
            data-testid="password-change-button"
          >
            {actions.buttons[1].label}
          </button>

          <button
            type="button"
            onClick={onDeleteAccount}
            className="profile-actions__button profile-actions__button--danger"
            data-testid="delete-account-button"
          >
            {actions.buttons[2].label}
          </button>
        </div>
      </div>
    </div>
  );
}
