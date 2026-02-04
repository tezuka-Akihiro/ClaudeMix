/**
 * auth.callback.google.test.tsx
 * Purpose: Unit tests for Google OAuth callback route
 *
 * @layer UI層 (routes)
 * @responsibility Google OAuth認証コールバックのテスト
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loader } from '~/routes/auth.callback.google';

// Mock data-io functions
vi.mock('~/data-io/account/authentication/exchangeGoogleCode.server', () => ({
  exchangeGoogleCode: vi.fn(),
}));

vi.mock('~/data-io/account/authentication/getUserByOAuth.server', () => ({
  getUserByOAuth: vi.fn(),
}));

vi.mock('~/data-io/account/authentication/getUserByEmail.server', () => ({
  getUserByEmail: vi.fn(),
}));

vi.mock('~/data-io/account/authentication/createOAuthUser.server', () => ({
  createOAuthUser: vi.fn(),
}));

vi.mock('~/data-io/account/common/saveSession.server', () => ({
  saveSession: vi.fn(() => Promise.resolve('session=test-session; Path=/; HttpOnly')),
}));

vi.mock('~/lib/account/common/createSessionData', () => ({
  createSessionData: vi.fn((userId, sessionId) => ({ userId, sessionId })),
}));

// Mock crypto.randomUUID
vi.stubGlobal('crypto', {
  randomUUID: vi.fn(() => 'test-session-uuid'),
});

// Import mocked functions for assertions
import { exchangeGoogleCode } from '~/data-io/account/authentication/exchangeGoogleCode.server';
import { getUserByOAuth } from '~/data-io/account/authentication/getUserByOAuth.server';
import { getUserByEmail } from '~/data-io/account/authentication/getUserByEmail.server';
import { createOAuthUser } from '~/data-io/account/authentication/createOAuthUser.server';

describe('auth.callback.google loader', () => {
  const validEnv = {
    GOOGLE_CLIENT_ID: 'test-client-id',
    GOOGLE_CLIENT_SECRET: 'test-secret',
    GOOGLE_REDIRECT_URI: 'http://localhost:8788/auth/callback/google',
  };

  const createMockRequest = (params: Record<string, string> = {}, cookies: string = '') => {
    const url = new URL('http://localhost:8788/auth/callback/google');
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    return new Request(url.toString(), {
      headers: cookies ? { Cookie: cookies } : {},
    });
  };

  const createMockContext = (env: Record<string, string | undefined> = validEnv) => ({
    cloudflare: { env },
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('parameter validation', () => {
    it('should redirect to login with error when code is missing', async () => {
      const request = createMockRequest({ state: 'test-state' });
      const context = createMockContext();

      const response = await loader({ request, context, params: {} });

      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toBe('/login?error=oauth-invalid');
    });

    it('should redirect to login with error when state is missing', async () => {
      const request = createMockRequest({ code: 'test-code' });
      const context = createMockContext();

      const response = await loader({ request, context, params: {} });

      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toBe('/login?error=oauth-invalid');
    });

    it('should redirect to login with error when both code and state are missing', async () => {
      const request = createMockRequest({});
      const context = createMockContext();

      const response = await loader({ request, context, params: {} });

      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toBe('/login?error=oauth-invalid');
    });

    it('should redirect to login with error when OAuth error parameter is present', async () => {
      const request = createMockRequest({ error: 'access_denied' });
      const context = createMockContext();

      const response = await loader({ request, context, params: {} });

      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toBe('/login?error=oauth-failed');
    });
  });

  describe('CSRF validation', () => {
    it('should redirect to login with error when oauth_state cookie is missing', async () => {
      const request = createMockRequest({ code: 'test-code', state: 'test-state' });
      const context = createMockContext();

      const response = await loader({ request, context, params: {} });

      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toBe('/login?error=csrf-detected');
    });

    it('should redirect to login with error when state does not match cookie', async () => {
      const request = createMockRequest(
        { code: 'test-code', state: 'state-from-google' },
        'oauth_state=different-state'
      );
      const context = createMockContext();

      const response = await loader({ request, context, params: {} });

      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toBe('/login?error=csrf-detected');
    });
  });

  describe('environment variable validation', () => {
    it('should redirect to login with error when env vars are missing', async () => {
      const request = createMockRequest(
        { code: 'test-code', state: 'test-state' },
        'oauth_state=test-state'
      );
      const context = createMockContext({});

      const response = await loader({ request, context, params: {} });

      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toBe('/login?error=oauth-not-configured');
    });
  });

  describe('successful OAuth flow', () => {
    const mockGoogleUser = {
      id: 'google-user-123',
      email: 'test@example.com',
      name: 'Test User',
    };

    const mockUser = {
      id: 'user-uuid-123',
      email: 'test@example.com',
      oauthProvider: 'google',
      oauthId: 'google-user-123',
    };

    it('should redirect to account page for existing OAuth user', async () => {
      vi.mocked(exchangeGoogleCode).mockResolvedValue(mockGoogleUser);
      vi.mocked(getUserByOAuth).mockResolvedValue(mockUser);

      const request = createMockRequest(
        { code: 'test-code', state: 'test-state' },
        'oauth_state=test-state'
      );
      const context = createMockContext();

      const response = await loader({ request, context, params: {} });

      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toBe('/account');
      expect(exchangeGoogleCode).toHaveBeenCalledWith(
        'test-code',
        'test-client-id',
        'test-secret',
        'http://localhost:8788/auth/callback/google'
      );
    });

    it('should create new user and redirect to account page for new OAuth user', async () => {
      vi.mocked(exchangeGoogleCode).mockResolvedValue(mockGoogleUser);
      vi.mocked(getUserByOAuth)
        .mockResolvedValueOnce(null) // First call: user doesn't exist
        .mockResolvedValueOnce(mockUser); // Second call: after creation
      vi.mocked(getUserByEmail).mockResolvedValue(null);
      vi.mocked(createOAuthUser).mockResolvedValue('user-uuid-123');

      const request = createMockRequest(
        { code: 'test-code', state: 'test-state' },
        'oauth_state=test-state'
      );
      const context = createMockContext();

      const response = await loader({ request, context, params: {} });

      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toBe('/account');
      expect(createOAuthUser).toHaveBeenCalledWith(
        {
          email: 'test@example.com',
          oauthProvider: 'google',
          oauthId: 'google-user-123',
        },
        context
      );
    });

    it('should clear oauth_state cookie on successful login', async () => {
      vi.mocked(exchangeGoogleCode).mockResolvedValue(mockGoogleUser);
      vi.mocked(getUserByOAuth).mockResolvedValue(mockUser);

      const request = createMockRequest(
        { code: 'test-code', state: 'test-state' },
        'oauth_state=test-state'
      );
      const context = createMockContext();

      const response = await loader({ request, context, params: {} });

      const setCookieHeaders = response.headers.getSetCookie();
      const clearStateCookie = setCookieHeaders.find((c: string) => c.includes('oauth_state=;'));
      expect(clearStateCookie).toBeDefined();
      expect(clearStateCookie).toContain('Max-Age=0');
    });

    it('should set session cookie on successful login', async () => {
      vi.mocked(exchangeGoogleCode).mockResolvedValue(mockGoogleUser);
      vi.mocked(getUserByOAuth).mockResolvedValue(mockUser);

      const request = createMockRequest(
        { code: 'test-code', state: 'test-state' },
        'oauth_state=test-state'
      );
      const context = createMockContext();

      const response = await loader({ request, context, params: {} });

      const setCookieHeaders = response.headers.getSetCookie();
      const sessionCookie = setCookieHeaders.find((c: string) => c.includes('session='));
      expect(sessionCookie).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should redirect to login with error when email already exists with password', async () => {
      const mockGoogleUser = {
        id: 'google-user-123',
        email: 'existing@example.com',
        name: 'Test User',
      };
      const existingPasswordUser = {
        id: 'existing-user-123',
        email: 'existing@example.com',
        passwordHash: 'hashed-password',
      };

      vi.mocked(exchangeGoogleCode).mockResolvedValue(mockGoogleUser);
      vi.mocked(getUserByOAuth).mockResolvedValue(null);
      vi.mocked(getUserByEmail).mockResolvedValue(existingPasswordUser);

      const request = createMockRequest(
        { code: 'test-code', state: 'test-state' },
        'oauth_state=test-state'
      );
      const context = createMockContext();

      const response = await loader({ request, context, params: {} });

      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toBe('/login?error=email-already-exists');
    });

    it('should redirect to login with error when user creation fails', async () => {
      const mockGoogleUser = {
        id: 'google-user-123',
        email: 'new@example.com',
        name: 'Test User',
      };

      vi.mocked(exchangeGoogleCode).mockResolvedValue(mockGoogleUser);
      vi.mocked(getUserByOAuth).mockResolvedValue(null);
      vi.mocked(getUserByEmail).mockResolvedValue(null);
      vi.mocked(createOAuthUser).mockResolvedValue(null);

      const request = createMockRequest(
        { code: 'test-code', state: 'test-state' },
        'oauth_state=test-state'
      );
      const context = createMockContext();

      const response = await loader({ request, context, params: {} });

      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toBe('/login?error=oauth-registration-failed');
    });

    it('should redirect to login with error when exchangeGoogleCode throws', async () => {
      vi.mocked(exchangeGoogleCode).mockRejectedValue(new Error('Token exchange failed'));

      const request = createMockRequest(
        { code: 'test-code', state: 'test-state' },
        'oauth_state=test-state'
      );
      const context = createMockContext();

      const response = await loader({ request, context, params: {} });

      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toBe('/login?error=oauth-failed');
    });
  });
});
