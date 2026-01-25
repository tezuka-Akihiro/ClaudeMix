/**
 * validateSubscriptionChange.ts
 * Purpose: Validate subscription status change requests
 *
 * @layer 純粋ロジック層 (Lib)
 * @responsibility ビジネスルール検証
 */

export type SubscriptionStatus = 'active' | 'inactive';

export interface SubscriptionChangeRequest {
  currentStatus: SubscriptionStatus;
  newStatus: SubscriptionStatus;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate subscription status change
 *
 * Business rules:
 * - Cannot change to same status
 * - Cannot go from inactive to active directly (must go through payment)
 * - Can always cancel (active → inactive)
 *
 * @param request - Subscription change request
 * @returns Validation result
 */
export function validateSubscriptionChange(
  request: SubscriptionChangeRequest
): ValidationResult {
  const { currentStatus, newStatus } = request;

  // Cannot change to same status
  if (currentStatus === newStatus) {
    return {
      valid: false,
      error: '既に同じステータスです',
    };
  }

  // Cannot go from inactive to active directly
  if (currentStatus === 'inactive' && newStatus === 'active') {
    return {
      valid: false,
      error: '支払いが必要です',
    };
  }

  // All other transitions are valid
  return { valid: true };
}
