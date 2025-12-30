/**
 * getSubscriptionByUserId.server.ts
 * Purpose: Get user's subscription data from D1 database
 *
 * @layer 副作用層 (Data-IO)
 * @responsibility D1データベース読み取り
 *
 * NOTE: This is a stub implementation. Full implementation will be added when account service is developed.
 */

import type { Subscription } from '~/specs/account/types'

/**
 * Get subscription by user ID
 *
 * @param userId - User ID to query
 * @returns Subscription object if found, null otherwise
 *
 * STUB IMPLEMENTATION: Currently returns null (no active subscription)
 * This will be implemented when account service subscription feature is completed.
 */
export async function getSubscriptionByUserId(
  userId: string
): Promise<Subscription | null> {
  // STUB: Return null to indicate no subscription
  // In production, this will query the D1 database
  return null
}
