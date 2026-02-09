/**
 * ProfileDisplay.tsx
 * Purpose: Display user profile information
 *
 * @layer UI層 (components)
 * @responsibility ユーザープロフィール情報の表示
 */

import { useFetcher } from '@remix-run/react';
import type { User, Subscription } from '~/specs/account/types';

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
        subscription_expiry: { label: string };
      };
    };
    subscription: {
      title: string;
      fields: {
        status: {
          label: string;
          values: {
            on: string;
            off: string;
          };
        };
        card: {
          label: string;
        };
      };
      buttons: {
        interrupt: string;
        resume: string;
        delete_card: string;
      };
      messages: {
        interrupt_confirm: string;
        resume_notice: string;
        delete_card_confirm: string;
        delete_card_restriction: string;
        delete_card_error: string;
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
  subscription: Subscription | null;
  spec: ProfileDisplaySpec;
  onEmailChange: () => void;
  onPasswordChange: () => void;
  onDeleteAccount: () => void;
}

export function ProfileDisplay({
  user,
  subscription,
  spec,
  onEmailChange,
  onPasswordChange,
  onDeleteAccount,
}: ProfileDisplayProps) {
  const { info, subscription: subscriptionSpec, actions } = spec.sections;
  const fetcher = useFetcher();

  const isRenewalOn = subscription?.status === 'active' && !subscription.canceledAt;
  const isRenewalOff = subscription?.status === 'active' && !!subscription.canceledAt;
  const nextBillingDate = subscription ? new Date(subscription.currentPeriodEnd).toLocaleDateString('ja-JP') : '';

  const handleToggleRenewal = () => {
    if (isRenewalOn) {
      const confirmed = window.confirm(subscriptionSpec.messages.interrupt_confirm.replace('{date}', nextBillingDate));
      if (confirmed) {
        fetcher.submit({ intent: 'interrupt-renewal' }, { method: 'post' });
      }
    } else if (isRenewalOff) {
      fetcher.submit({ intent: 'resume-renewal' }, { method: 'post' });
    }
  };

  // Get subscription status label from spec
  const statusKey = user.subscriptionStatus as keyof typeof info.fields.subscription_status.values;
  const subscriptionLabel =
    info.fields.subscription_status.values[statusKey] ||
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
          <div className="profile-info__label">{info.fields.subscription_expiry.label}</div>
          <div className="profile-info__value">
            {subscription
              ? new Date(subscription.currentPeriodEnd).toLocaleDateString('ja-JP')
              : '-'}
          </div>
        </div>
      </div>

      {/* Subscription Settings Section */}
      {subscription && subscription.status !== 'inactive' && (
        <div className="profile-section profile-section-structure" data-testid="subscription-status-display">
          <h3 className="profile-section__title">{subscriptionSpec.title}</h3>
          <div className="profile-info-structure">
            <div className="profile-info__item">
              <div className="profile-info__label">{subscriptionSpec.fields.status.label}</div>
              <div className="profile-info__value">
                <div className="flex flex-col gap-2">
                  <span data-testid="renewal-status">
                    {isRenewalOn ? subscriptionSpec.fields.status.values.on : subscriptionSpec.fields.status.values.off}
                  </span>
                  <button
                    type="button"
                    onClick={handleToggleRenewal}
                    className="btn-secondary"
                    disabled={fetcher.state !== 'idle'}
                    data-testid="renewal-toggle-button"
                  >
                    {isRenewalOn ? subscriptionSpec.buttons.interrupt : subscriptionSpec.buttons.resume}
                  </button>
                  {isRenewalOff && (
                    <p className="text-sm text-gray-600" data-testid="next-billing-notice">
                      {subscriptionSpec.messages.resume_notice.replace('{date}', nextBillingDate)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="profile-info__item">
              <div className="profile-info__label">{subscriptionSpec.fields.card.label}</div>
              <div className="profile-info__value">
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (isRenewalOn) {
                        alert(subscriptionSpec.messages.delete_card_error);
                      } else if (window.confirm(subscriptionSpec.messages.delete_card_confirm)) {
                        fetcher.submit({ intent: 'delete-payment-method' }, { method: 'post' });
                      }
                    }}
                    className="btn-secondary"
                    disabled={fetcher.state !== 'idle'}
                    data-testid="delete-payment-method-button"
                  >
                    {subscriptionSpec.buttons.delete_card}
                  </button>
                  {isRenewalOn && (
                    <p className="text-sm text-red-600" data-testid="card-deletion-disabled-notice">
                      {subscriptionSpec.messages.delete_card_restriction}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
