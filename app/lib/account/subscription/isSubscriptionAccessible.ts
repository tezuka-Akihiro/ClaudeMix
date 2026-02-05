/**
 * isSubscriptionAccessible.ts
 * Purpose: Determine if user has access to subscription content
 *
 * @layer 純粋ロジック層 (lib)
 * @responsibility サブスクリプション閲覧権限判定
 */

import type { SubscriptionStatus } from '~/specs/account/types'

/**
 * Parameters for subscription accessibility check
 */
export interface SubscriptionAccessParams {
  /** User's subscription status */
  status: SubscriptionStatus | string
  /** Current period end date (ISO 8601) */
  currentPeriodEnd: string | null
  /** Cancellation scheduled date (ISO 8601), null if not scheduled */
  canceledAt: string | null
}

/**
 * Check if subscription grants access to premium content
 *
 * Strict Rule: Only 'active' status grants access.
 * No grace period for 'past_due'.
 *
 * @param params - Subscription access parameters
 * @param now - Current time for comparison (optional, defaults to now)
 * @returns true if user can access premium content
 */
export function isSubscriptionAccessible(
  params: SubscriptionAccessParams,
  now: Date = new Date()
): boolean {
  const { status, currentPeriodEnd } = params

  // Only 'active' status is allowed
  if (status !== 'active') {
    return false
  }

  // If no period end date, deny access (data integrity issue)
  if (!currentPeriodEnd) {
    return false
  }

  // Check if current period has ended
  const periodEndDate = new Date(currentPeriodEnd)
  if (isNaN(periodEndDate.getTime())) {
    return false
  }

  // Access granted if period has not ended
  return now < periodEndDate
}

/**
 * Get subscription access status with detailed information
 *
 * @param params - Subscription access parameters
 * @param now - Current time for comparison (optional, defaults to now)
 * @returns Detailed access status
 */
export function getSubscriptionAccessStatus(
  params: SubscriptionAccessParams,
  now: Date = new Date()
): {
  hasAccess: boolean
  reason: 'active' | 'trialing' | 'grace_period' | 'cancellation_pending' | 'expired' | 'inactive' | 'no_subscription'
  periodEnd: Date | null
} {
  const { status, currentPeriodEnd, canceledAt } = params

  // No subscription
  if (!status || status === 'inactive') {
    return {
      hasAccess: false,
      reason: 'no_subscription',
      periodEnd: null,
    }
  }

  // Parse period end date
  const periodEnd = currentPeriodEnd ? new Date(currentPeriodEnd) : null
  const isPeriodValid = periodEnd && !isNaN(periodEnd.getTime())
  const isPeriodActive = isPeriodValid && now < periodEnd

  // Active subscription with cancellation scheduled
  if (status === 'active' && canceledAt && isPeriodActive) {
    return {
      hasAccess: true,
      reason: 'cancellation_pending',
      periodEnd,
    }
  }

  // Active subscription
  if (status === 'active' && isPeriodActive) {
    return {
      hasAccess: true,
      reason: 'active',
      periodEnd,
    }
  }


  // Period expired
  if (isPeriodValid && now >= periodEnd) {
    return {
      hasAccess: false,
      reason: 'expired',
      periodEnd,
    }
  }

  // Default: inactive
  return {
    hasAccess: false,
    reason: 'inactive',
    periodEnd,
  }
}
