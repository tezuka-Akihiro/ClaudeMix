import { SubscriptionPromotionBanner } from './SubscriptionPromotionBanner'
import type { BlogPostDetailSpec } from '~/specs/blog/types'

interface PaywallProps {
  spec: BlogPostDetailSpec;
}

/**
 * ペイウォールコンポーネント
 *
 * @description
 * 未契約ユーザーに対して、制限を超えるコンテンツの前に表示される障壁
 * SubscriptionPromotionBannerを内包し、会員登録を促す
 *
 * @example
 * <Paywall spec={spec} />
 */
export function Paywall({ spec }: PaywallProps) {
  return (
    <div className="paywall">
      <div className="paywall-overlay">
        <div className="paywall-message">
          {spec.messages.ui.paywall_message}
        </div>

        <SubscriptionPromotionBanner spec={spec} />
      </div>
    </div>
  )
}
