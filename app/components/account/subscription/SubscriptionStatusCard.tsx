/**
 * SubscriptionStatusCard.tsx
 * Purpose: Subscription action buttons
 *
 * @layer UI層 (components)
 * @responsibility サブスクリプション操作ボタンの表示
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
  return (
    <div data-testid="subscription-status-card">
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
