import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getSubscriptionStatus } from './getSubscriptionStatus.server'

// accountサービスのdata-io層をモック
vi.mock('~/data-io/account/subscription/getSubscriptionByUserId.server', () => ({
  getSubscriptionByUserId: vi.fn(),
}))

import { getSubscriptionByUserId } from '~/data-io/account/subscription/getSubscriptionByUserId.server'

describe('getSubscriptionStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('正常系', () => {
    it('アクティブなサブスクリプションが存在する場合、hasActiveSubscription: trueを返す', async () => {
      const mockSubscription = {
        id: 'sub_123',
        userId: 'user_123',
        stripeSubscriptionId: 'stripe_sub_123',
        stripeCustomerId: 'stripe_cus_123',
        planId: 'plan_monthly',
        status: 'active' as const,
        currentPeriodStart: new Date('2025-01-01').toISOString(),
        currentPeriodEnd: new Date('2025-12-31').toISOString(),
        createdAt: new Date('2025-01-01').toISOString(),
        updatedAt: new Date('2025-01-01').toISOString(),
      }

      vi.mocked(getSubscriptionByUserId).mockResolvedValue(mockSubscription)

      const result = await getSubscriptionStatus('user_123')

      expect(result).toEqual({ hasActiveSubscription: true })
      expect(getSubscriptionByUserId).toHaveBeenCalledWith('user_123')
    })

    it('サブスクリプションが存在しない場合、hasActiveSubscription: falseを返す', async () => {
      vi.mocked(getSubscriptionByUserId).mockResolvedValue(null)

      const result = await getSubscriptionStatus('user_123')

      expect(result).toEqual({ hasActiveSubscription: false })
    })

    it('サブスクリプションのstatusがcanceledの場合、hasActiveSubscription: falseを返す', async () => {
      const mockSubscription = {
        id: 'sub_123',
        userId: 'user_123',
        stripeSubscriptionId: 'stripe_sub_123',
        stripeCustomerId: 'stripe_cus_123',
        planId: 'plan_monthly',
        status: 'canceled' as const,
        currentPeriodStart: new Date('2025-01-01').toISOString(),
        currentPeriodEnd: new Date('2025-12-31').toISOString(),
        createdAt: new Date('2025-01-01').toISOString(),
        updatedAt: new Date('2025-01-01').toISOString(),
      }

      vi.mocked(getSubscriptionByUserId).mockResolvedValue(mockSubscription)

      const result = await getSubscriptionStatus('user_123')

      expect(result).toEqual({ hasActiveSubscription: false })
    })

    it('サブスクリプションのcurrentPeriodEndが過去の場合、hasActiveSubscription: falseを返す', async () => {
      const mockSubscription = {
        id: 'sub_123',
        userId: 'user_123',
        stripeSubscriptionId: 'stripe_sub_123',
        stripeCustomerId: 'stripe_cus_123',
        planId: 'plan_monthly',
        status: 'active' as const,
        currentPeriodStart: new Date('2024-01-01').toISOString(),
        currentPeriodEnd: new Date('2024-12-31').toISOString(),
        createdAt: new Date('2024-01-01').toISOString(),
        updatedAt: new Date('2024-01-01').toISOString(),
      }

      vi.mocked(getSubscriptionByUserId).mockResolvedValue(mockSubscription)

      const result = await getSubscriptionStatus('user_123')

      expect(result).toEqual({ hasActiveSubscription: false })
    })
  })

  describe('異常系', () => {
    it('accountサービスdata-io層でエラーが発生した場合、安全側（false）に倒す', async () => {
      vi.mocked(getSubscriptionByUserId).mockRejectedValue(
        new Error('Database error')
      )

      const result = await getSubscriptionStatus('user_123')

      expect(result).toEqual({ hasActiveSubscription: false })
    })

    it('userIdがnullの場合、hasActiveSubscription: falseを返す', async () => {
      const result = await getSubscriptionStatus(null)

      expect(result).toEqual({ hasActiveSubscription: false })
      expect(getSubscriptionByUserId).not.toHaveBeenCalled()
    })

    it('userIdが空文字の場合、hasActiveSubscription: falseを返す', async () => {
      const result = await getSubscriptionStatus('')

      expect(result).toEqual({ hasActiveSubscription: false })
      expect(getSubscriptionByUserId).not.toHaveBeenCalled()
    })
  })
})
