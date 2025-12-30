import { SubscriptionPromotionBanner } from './SubscriptionPromotionBanner'

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
export function Paywall() {
  return (
    <div className="paywall">
      <div className="paywall-overlay">
        <div className="paywall-message">
          続きを読むには会員登録が必要です
        </div>

        <SubscriptionPromotionBanner />
      </div>
    </div>
  )
}
