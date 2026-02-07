import { Link } from '@remix-run/react'

/**
 * 購読促進バナーコンポーネント
 */
interface SubscriptionPromotionBannerProps {
  heading: string;
  ctaLabel: string;
}

/**
 * 購読促進バナーコンポーネント
 *
 * @description
 * ペイウォール内に配置され、会員登録・サブスクリプション購入を促す
 *
 * @example
 * <SubscriptionPromotionBanner />
 */
export function SubscriptionPromotionBanner({ heading, ctaLabel }: SubscriptionPromotionBannerProps) {
  return (
    <div className="subscription-promotion-banner">
      <h3 className="subscription-promotion-heading">
        {heading}
      </h3>

      <div className="subscription-plans subscription-plans-structure">
        <div className="subscription-plan subscription-plan-structure">
          <span className="plan-duration">1ヶ月</span>
          <span className="plan-price">¥980/月</span>
        </div>
        <div className="subscription-plan subscription-plan-structure">
          <span className="plan-duration">3ヶ月</span>
          <span className="plan-price">¥2,700 (¥900/月)</span>
          <span className="plan-badge">8%お得</span>
        </div>
        <div className="subscription-plan subscription-plan-structure">
          <span className="plan-duration">6ヶ月</span>
          <span className="plan-price">¥4,900 (¥817/月)</span>
        </div>
      </div>

      <Link to="/account/subscription" className="subscription-cta-button">
        {ctaLabel}
      </Link>
    </div>
  )
}
