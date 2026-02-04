/**
 * PaymentWarningBanner.tsx
 * Purpose: Display warning banner for payment failures
 *
 * @layer UI層 (components)
 * @responsibility 支払い失敗時の警告バナー表示
 */

export interface PaymentWarningBannerProps {
  /** Whether the banner should be displayed */
  show: boolean
  /** Link to update payment method */
  updatePaymentUrl?: string
}

/**
 * Payment warning banner for past_due subscriptions
 *
 * Displays a prominent warning when payment has failed,
 * informing the user to update their payment method.
 */
export function PaymentWarningBanner({
  show,
  updatePaymentUrl = '/account/billing',
}: PaymentWarningBannerProps) {
  if (!show) {
    return null
  }

  return (
    <div
      data-testid="payment-warning-banner"
      className="payment-warning-banner"
      role="alert"
      aria-live="assertive"
    >
      <div className="payment-warning-icon" aria-hidden="true">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>
      <div className="payment-warning-content">
        <h3 className="payment-warning-title">お支払いを確認できません</h3>
        <p className="payment-warning-message">
          カード情報を更新してください。猶予期間中は引き続きご利用いただけます。
        </p>
        <a
          href={updatePaymentUrl}
          className="payment-warning-action"
          data-testid="update-payment-link"
        >
          カード情報を更新する
        </a>
      </div>
    </div>
  )
}
