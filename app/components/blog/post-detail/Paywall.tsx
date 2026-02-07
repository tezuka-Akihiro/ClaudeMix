import { SubscriptionPromotionBanner } from './SubscriptionPromotionBanner'

/**
 * ペイウォールコンポーネント
 */
interface PaywallProps {
  message: string;
  promotionHeading: string;
  ctaLabel: string;
}

/**
 * ペイウォールコンポーネント
 *
 * @description
 * 未契約ユーザーに対して、制限を超えるコンテンツの前に表示される障壁
 * SubscriptionPromotionBannerを内包し、会員登録を促す
 *
 * @example
 * <Paywall />
 */
export function Paywall({ message, promotionHeading, ctaLabel }: PaywallProps) {
  return (
    <div className="paywall">
      <div className="paywall-overlay">
        <div className="paywall-message">
          {message}
        </div>

        <SubscriptionPromotionBanner
          heading={promotionHeading}
          ctaLabel={ctaLabel}
        />
      </div>
    </div>
  )
}
