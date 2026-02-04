/**
 * SubscriptionStatusDisplay.tsx
 * Purpose: Display subscription status with detailed information
 *
 * @layer UI層 (components)
 * @responsibility サブスクリプション状態の詳細表示
 */

import { formatSubscriptionEndDate, formatNextBillingDate } from '~/lib/account/subscription/formatSubscriptionEndDate'

export type SubscriptionDisplayStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'inactive'

export interface SubscriptionStatusDisplayProps {
  /** Current subscription status */
  status: SubscriptionDisplayStatus
  /** Current period end date (ISO 8601) */
  currentPeriodEnd?: string | null
  /** Cancellation scheduled date (ISO 8601), null if not scheduled */
  canceledAt?: string | null
  /** Plan name to display */
  planName?: string
  /** Handler for reactivation button */
  onReactivate?: () => void
}

/**
 * Get badge variant based on status
 */
function getBadgeVariant(status: SubscriptionDisplayStatus, canceledAt?: string | null): {
  variant: 'success' | 'warning' | 'danger' | 'secondary'
  label: string
} {
  if (status === 'active' && canceledAt) {
    return { variant: 'warning', label: '解約予約済み' }
  }

  switch (status) {
    case 'active':
      return { variant: 'success', label: '有効' }
    case 'trialing':
      return { variant: 'success', label: 'トライアル中' }
    case 'past_due':
      return { variant: 'danger', label: '支払い遅延' }
    case 'canceled':
      return { variant: 'secondary', label: 'キャンセル済み' }
    case 'inactive':
    default:
      return { variant: 'secondary', label: '未契約' }
  }
}

/**
 * Subscription status display with detailed information
 *
 * Shows:
 * - Status badge
 * - Plan name
 * - Next billing date or cancellation notice
 * - Reactivation button for canceled subscriptions
 */
export function SubscriptionStatusDisplay({
  status,
  currentPeriodEnd,
  canceledAt,
  planName,
  onReactivate,
}: SubscriptionStatusDisplayProps) {
  const badge = getBadgeVariant(status, canceledAt)
  const isCancellationPending = status === 'active' && canceledAt

  return (
    <div data-testid="subscription-status-display" className="subscription-status-display">
      {/* Status Badge */}
      <div className="subscription-status-header">
        <span
          className={`subscription-badge subscription-badge-${badge.variant}`}
          data-testid="status-badge"
        >
          {badge.label}
        </span>
        {planName && (
          <span className="subscription-plan-name" data-testid="plan-name">
            {planName}
          </span>
        )}
      </div>

      {/* Cancellation Notice */}
      {isCancellationPending && currentPeriodEnd && (
        <div
          data-testid="cancellation-notice"
          className="subscription-cancellation-notice"
        >
          <p className="cancellation-message">
            現在のプランは
            <strong>{formatSubscriptionEndDate(currentPeriodEnd).replace('まで利用可能', '')}</strong>
            まで引き続きご利用いただけます。
            解約をキャンセルして継続することもできます。
          </p>
          {onReactivate && (
            <button
              type="button"
              className="btn-secondary"
              data-testid="reactivate-button"
              onClick={onReactivate}
            >
              解約をキャンセル
            </button>
          )}
        </div>
      )}

      {/* Next Billing Date (for active subscriptions without cancellation) */}
      {status === 'active' && !canceledAt && currentPeriodEnd && (
        <div className="subscription-billing-info" data-testid="billing-info">
          <p>{formatNextBillingDate(currentPeriodEnd)}</p>
        </div>
      )}

      {/* Past Due Notice */}
      {status === 'past_due' && currentPeriodEnd && (
        <div className="subscription-past-due-notice" data-testid="past-due-notice">
          <p>
            支払いの確認ができていません。
            <strong>{formatSubscriptionEndDate(currentPeriodEnd).replace('まで利用可能', '')}</strong>
            までに支払い方法を更新してください。
          </p>
        </div>
      )}

      {/* Inactive Notice */}
      {status === 'inactive' && (
        <div className="subscription-inactive-notice" data-testid="inactive-notice">
          <p>現在、有効なサブスクリプションがありません。</p>
        </div>
      )}
    </div>
  )
}
