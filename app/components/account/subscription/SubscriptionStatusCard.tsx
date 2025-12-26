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
  onUpgrade?: () => void;
  onCancel?: () => void;
}

export function SubscriptionStatusCard({
  status,
  onUpgrade,
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
      case 'trial':
        return {
          label: 'トライアル',
          variant: 'warning',
          description: 'トライアル期間中です',
          testId: 'badge-warning',
        };
      case 'inactive':
        return {
          label: '非アクティブ',
          variant: 'danger',
          description: 'サブスクリプションをアクティベートしてください',
          testId: 'badge-danger',
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="subscription-status-card" data-testid="subscription-status-card">
      <h2>現在のプラン</h2>
      <div style={{ marginTop: '1rem' }}>
        <span
          className={`badge-${statusInfo.variant}`}
          data-testid={statusInfo.testId}
        >
          {statusInfo.label}
        </span>
        <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
          {statusInfo.description}
        </p>
      </div>

      <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
        {status !== 'active' && onUpgrade && (
          <button
            type="button"
            onClick={onUpgrade}
            className="btn-primary"
            data-testid="upgrade-button"
          >
            アップグレード
          </button>
        )}
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
