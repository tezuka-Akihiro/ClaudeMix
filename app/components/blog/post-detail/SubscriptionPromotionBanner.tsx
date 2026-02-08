import { Link } from '@remix-run/react'
import type { BlogPostDetailSpec } from '~/specs/blog/types'

interface SubscriptionPromotionBannerProps {
  spec: BlogPostDetailSpec;
}

/**
 * 購読促進バナーコンポーネント
 *
 * @description
 * ペイウォール内に配置され、会員登録・サブスクリプション購入を促す
 *
 * @example
 * <SubscriptionPromotionBanner spec={spec} />
 */
export function SubscriptionPromotionBanner({ spec }: SubscriptionPromotionBannerProps) {
  const { promotion } = spec;

  return (
    <div className="subscription-promotion-banner">
      <h3 className="subscription-promotion-heading">
        {promotion.title}
      </h3>

      <div className="subscription-plans subscription-plans-structure">
        {promotion.plans.map((plan, index) => (
          <div key={index} className="subscription-plan subscription-plan-structure">
            <span className="plan-duration">{plan.duration}</span>
            <span className="plan-price">{plan.price}</span>
            {plan.badge && <span className="plan-badge">{plan.badge}</span>}
          </div>
        ))}
      </div>

      <Link to="/account/subscription" className="subscription-cta-button">
        {promotion.button_label}
      </Link>
    </div>
  )
}
