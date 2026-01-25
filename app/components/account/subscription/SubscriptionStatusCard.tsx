/**
 * SubscriptionStatusCard.tsx
 * Purpose: Display user's current subscription status
 *
 * @layer UI層 (components)
 * @responsibility サブスクリプション状態表示
 */

import type { SubscriptionStatus } from '~/lib/account/subscription/validateSubscriptionChange';

export interface SubscriptionStatusCardProps {
  status: SubscriptionStatus;
  onCancel?: () => void;
}

export function SubscriptionStatusCard({
  status,
  onCancel,
}: SubscriptionStatusCardProps) {
  const getStatusInfo = () => {
    switch (status) {
      case 'active':
        return {
          label: 'アクティブ',
          variant: 'success',
          description: 'すべての機能が利用可能です',
          testId: 'badge-success',
        };
      case 'inactive':
        return {
          label: '非アクティブ',
          variant: 'danger',
          description: 'サブスクリプションをアクティベートしてください',
          testId: 'badge-danger',
        };
      default:
        return {
          label: '不明',
          variant: 'danger',
          description: 'ステータスを確認してください',
          testId: 'badge-danger',
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div data-testid="subscription-status-card">
      <h2 className="profile-section__title">現在のプラン</h2>
      <div>
        <span
          className={`badge-${statusInfo.variant}`}
          data-testid={statusInfo.testId}
        >
          {statusInfo.label}
        </span>
        <p>{statusInfo.description}</p>
      </div>

      <div className="subscription-button-group subscription-button-group-structure">
        {status !== 'inactive' && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary"
            data-testid="cancel-button"
          >
            キャンセル
          </button>
        )}
      </div>
    </div>
  );
}
