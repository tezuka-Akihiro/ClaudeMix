import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getUserByOAuth } from './getUserByOAuth.server'

describe('getUserByOAuth', () => {
  const mockDb = {
    prepare: vi.fn().mockReturnThis(),
    bind: vi.fn().mockReturnThis(),
    first: vi.fn(),
  }

  const mockContext = {
    env: {
      DB: mockDb as unknown as D1Database,
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should query the users table with correct columns and mapping', async () => {
    const mockUser = {
      id: 'uuid-123',
      email: 'test@example.com',
      oauthProvider: 'google',
      googleId: 'google-sub-123',
      subscriptionStatus: 'active',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    }

    mockDb.first.mockResolvedValue(mockUser)

    const result = await getUserByOAuth('google', 'google-sub-123', mockContext as any)

    expect(mockDb.prepare).toHaveBeenCalledWith(
      expect.stringContaining('google_id AS googleId')
    )
    expect(mockDb.prepare).toHaveBeenCalledWith(
      expect.stringContaining('google_id = ?')
    )
    expect(mockDb.bind).toHaveBeenCalledWith('google', 'google-sub-123')
    expect(result).toEqual(mockUser)
  })

  it('should return null if no user is found', async () => {
    mockDb.first.mockResolvedValue(null)

    const result = await getUserByOAuth('google', 'non-existent', mockContext as any)

    expect(result).toBeNull()
  })
})
