/**
 * purgeExpiredUsers.server.test.ts
 * Unit tests for purgeExpiredUsers function
 *
 * @layer Data-IO層 (副作用層)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { purgeExpiredUsers } from './purgeExpiredUsers.server';
import Stripe from 'stripe';

// Mock Stripe
vi.mock('stripe', () => {
  const StripeMock = vi.fn().mockImplementation(() => ({
    customers: {
      del: vi.fn().mockResolvedValue({ deleted: true }),
    },
  }));
  
  // Add static method
  (StripeMock as any).createFetchHttpClient = vi.fn().mockReturnValue({});
  
  return {
    default: StripeMock,
  };
});

describe('purgeExpiredUsers', () => {
  let mockContext: any;
  let mockDB: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockDB = {
      prepare: vi.fn().mockReturnThis(),
      bind: vi.fn().mockReturnThis(),
      run: vi.fn().mockResolvedValue({ success: true }),
      all: vi.fn(),
    };

    mockContext = {
      env: {
        DB: mockDB,
        STRIPE_SECRET_KEY: 'sk_test_mock',
      },
    } as any;
  });

  it('should return empty result when no users are expired', async () => {
    mockDB.all.mockResolvedValue({ results: [] });

    const result = await purgeExpiredUsers(mockContext);

    expect(result.successCount).toBe(0);
    expect(result.failureCount).toBe(0);
  });

  it('should purge expired users successfully', async () => {
    mockDB.all.mockResolvedValue({
      results: [
        { id: 'user-1', stripeCustomerId: 'cus_1' },
        { id: 'user-2', stripeCustomerId: null },
      ],
    });

    const result = await purgeExpiredUsers(mockContext);

    expect(result.successCount).toBe(2);
    expect(result.failureCount).toBe(0);
    
    // Check if Stripe del was called for user-1 but not user-2
    const stripeInstance = (Stripe as any).mock.results[0].value;
    expect(stripeInstance.customers.del).toHaveBeenCalledWith('cus_1');
    expect(stripeInstance.customers.del).toHaveBeenCalledTimes(1);

    // Check DB deletions
    expect(mockDB.prepare).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM users WHERE id = ?'));
  });

  it('should handle Stripe deletion failure and continue with other users', async () => {
    mockDB.all.mockResolvedValue({
      results: [
        { id: 'user-fail', stripeCustomerId: 'cus_fail' },
        { id: 'user-success', stripeCustomerId: 'cus_success' },
      ],
    });

    // Make Stripe del fail for the first user
    const stripeInstance = {
      customers: {
        del: vi.fn()
          .mockRejectedValueOnce(new Error('Stripe API Error'))
          .mockResolvedValueOnce({ deleted: true }),
      },
    };
    (Stripe as any).mockImplementationOnce(() => stripeInstance);

    const result = await purgeExpiredUsers(mockContext);

    expect(result.successCount).toBe(1);
    expect(result.failureCount).toBe(1);
    expect(result.errors[0].userId).toBe('user-fail');
  });
});
