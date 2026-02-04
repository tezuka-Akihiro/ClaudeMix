/**
 * auth.google.test.tsx
 * Purpose: Unit tests for Google OAuth initiation route
 *
 * @layer UI層 (routes)
 * @responsibility Google OAuth認証開始のテスト
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loader } from '~/routes/auth.google';

// Mock generateGoogleAuthUrl
vi.mock('~/lib/account/authentication/generateGoogleAuthUrl', () => ({
  generateGoogleAuthUrl: vi.fn((clientId, redirectUri, state) =>
    `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&response_type=code&scope=openid%20email%20profile`
  ),
}));

// Mock crypto.randomUUID
vi.stubGlobal('crypto', {
  randomUUID: vi.fn(() => 'test-state-uuid'),
});

describe('auth.google loader', () => {
  const createMockRequest = () => {
    return new Request('http://localhost:8788/auth/google');
  };

  const createMockContext = (env: Record<string, string | undefined>) => ({
    cloudflare: { env },
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('when environment variables are missing', () => {
    it('should redirect to login with error when GOOGLE_CLIENT_ID is missing', async () => {
      const request = createMockRequest();
      const context = createMockContext({
        GOOGLE_CLIENT_SECRET: 'test-secret',
        GOOGLE_REDIRECT_URI: 'http://localhost:8788/auth/callback/google',
      });

      const response = await loader({ request, context, params: {} });

      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toBe('/login?error=oauth-not-configured');
    });

    it('should redirect to login with error when GOOGLE_CLIENT_SECRET is missing', async () => {
      const request = createMockRequest();
      const context = createMockContext({
        GOOGLE_CLIENT_ID: 'test-client-id',
        GOOGLE_REDIRECT_URI: 'http://localhost:8788/auth/callback/google',
      });

      const response = await loader({ request, context, params: {} });

      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toBe('/login?error=oauth-not-configured');
    });

    it('should redirect to login with error when GOOGLE_REDIRECT_URI is missing', async () => {
      const request = createMockRequest();
      const context = createMockContext({
        GOOGLE_CLIENT_ID: 'test-client-id',
        GOOGLE_CLIENT_SECRET: 'test-secret',
      });

      const response = await loader({ request, context, params: {} });

      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toBe('/login?error=oauth-not-configured');
    });

    it('should redirect to login with error when all env vars are missing', async () => {
      const request = createMockRequest();
      const context = createMockContext({});

      const response = await loader({ request, context, params: {} });

      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toBe('/login?error=oauth-not-configured');
    });
  });

  describe('when environment variables are configured', () => {
    const validEnv = {
      GOOGLE_CLIENT_ID: 'test-client-id',
      GOOGLE_CLIENT_SECRET: 'test-secret',
      GOOGLE_REDIRECT_URI: 'http://localhost:8788/auth/callback/google',
    };

    it('should redirect to Google OAuth URL', async () => {
      const request = createMockRequest();
      const context = createMockContext(validEnv);

      const response = await loader({ request, context, params: {} });

      expect(response.status).toBe(302);
      const location = response.headers.get('Location');
      expect(location).toContain('https://accounts.google.com/o/oauth2/v2/auth');
      expect(location).toContain('client_id=test-client-id');
      expect(location).toContain('state=test-state-uuid');
    });

    it('should set oauth_state cookie with correct attributes', async () => {
      const request = createMockRequest();
      const context = createMockContext(validEnv);

      const response = await loader({ request, context, params: {} });

      const setCookie = response.headers.get('Set-Cookie');
      expect(setCookie).toContain('oauth_state=test-state-uuid');
      expect(setCookie).toContain('Path=/');
      expect(setCookie).toContain('HttpOnly');
      expect(setCookie).toContain('Secure');
      expect(setCookie).toContain('SameSite=Lax');
      expect(setCookie).toContain('Max-Age=600');
    });

    it('should generate unique state for CSRF protection', async () => {
      const request = createMockRequest();
      const context = createMockContext(validEnv);

      await loader({ request, context, params: {} });

      expect(crypto.randomUUID).toHaveBeenCalled();
    });
  });

  describe('context compatibility', () => {
    it('should work with context.env fallback', async () => {
      const request = createMockRequest();
      // Some Cloudflare setups use context.env instead of context.cloudflare.env
      const context = {
        env: {
          GOOGLE_CLIENT_ID: 'test-client-id',
          GOOGLE_CLIENT_SECRET: 'test-secret',
          GOOGLE_REDIRECT_URI: 'http://localhost:8788/auth/callback/google',
        },
      };

      const response = await loader({ request, context, params: {} });

      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toContain('accounts.google.com');
    });
  });
});
