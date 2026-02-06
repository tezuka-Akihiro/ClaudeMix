import { describe, it, expect } from 'vitest'
import { isSubscriptionAccessible } from './isSubscriptionAccessible'

describe('isSubscriptionAccessible', () => {
  const now = new Date('2026-02-05T12:00:00Z')
  const future = '2026-03-01T00:00:00Z'
  const past = '2026-01-01T00:00:00Z'

  it('should return true for active status within period', () => {
    expect(isSubscriptionAccessible({
      status: 'active',
      currentPeriodEnd: future,
      canceledAt: null
    }, now)).toBe(true)
  })

  it('should return true for active status with cancellation scheduled within period', () => {
    // 権利の全う: 中断後も active 期間内はアクセス可能
    expect(isSubscriptionAccessible({
      status: 'active',
      currentPeriodEnd: future,
      canceledAt: future
    }, now)).toBe(true)
  })

  it('should return false for past_due status (immediate restriction)', () => {
    // 決済不履行: 猶予なしで制限
    expect(isSubscriptionAccessible({
      status: 'past_due',
      currentPeriodEnd: future,
      canceledAt: null
    }, now)).toBe(false)
  })

  it('should return false for inactive status', () => {
    expect(isSubscriptionAccessible({
      status: 'inactive',
      currentPeriodEnd: future,
      canceledAt: null
    }, now)).toBe(false)
  })

  it('should return false if period has ended', () => {
    expect(isSubscriptionAccessible({
      status: 'active',
      currentPeriodEnd: past,
      canceledAt: null
    }, now)).toBe(false)
  })

  it('should return false for other statuses like trialing, unpaid', () => {
    expect(isSubscriptionAccessible({
      status: 'trialing',
      currentPeriodEnd: future,
      canceledAt: null
    }, now)).toBe(false)
    expect(isSubscriptionAccessible({
      status: 'unpaid',
      currentPeriodEnd: future,
      canceledAt: null
    }, now)).toBe(false)
  })
})
