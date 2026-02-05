import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSessionStorage } from './session.server';

describe('session.server', () => {
  const mockKV = {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  };

  const mockContext = {
    env: {
      SESSION_KV: mockKV,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be able to commit a session to KV', async () => {
    const storage = getSessionStorage(mockContext as any);
    const session = await storage.getSession();
    session.set('userId', 'user-123');

    await storage.commitSession(session);

    expect(mockKV.put).toHaveBeenCalled();
  });

  it('should be able to destroy a session in KV', async () => {
    const storage = getSessionStorage(mockContext as any);

    const session = await storage.getSession();
    const cookie = await storage.commitSession(session);

    const sessionToDestroy = await storage.getSession(cookie);
    await storage.destroySession(sessionToDestroy);

    expect(mockKV.delete).toHaveBeenCalled();
  });
});
