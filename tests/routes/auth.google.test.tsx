/**
 * auth.google.test.tsx
 * Purpose: Unit tests for Google OAuth initiation route
 *
 * @layer UI層 (routes)
 * @responsibility Google OAuth認証開始のテスト
 */

import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { loader } from '~/routes/auth.google';
import { loadSpec } from 'tests/utils/loadSpec';
import type { AccountAuthenticationSpec } from '~/specs/account/types';

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
  let spec: AccountAuthenticationSpec;

  beforeAll(async () => {
    spec = await loadSpec<AccountAuthenticationSpec>('account', 'authentication');
  });

  const createMockRequest = () => {
    return new Request('http://localhost:3000/auth/google');
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
        GOOGLE_REDIRECT_URI: 'http://localhost:3000/auth/callback/google',
      });

      const response = await loader({ request, context, params: {} });

      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toBe(`${spec.routes.login.path}?error=oauth-not-configured`);
    });

    it('should redirect to login with error when GOOGLE_CLIENT_SECRET is missing', async () => {
      const request = createMockRequest();
      const context = createMockContext({
        GOOGLE_CLIENT_ID: 'test-client-id',
        GOOGLE_REDIRECT_URI: 'http://localhost:3000/auth/callback/google',
      });

      const response = await loader({ request, context, params: {} });

      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toBe(`${spec.routes.login.path}?error=oauth-not-configured`);
    });

    it('should redirect to login with error when GOOGLE_REDIRECT_URI is missing', async () => {
      const request = createMockRequest();
      const context = createMockContext({
        GOOGLE_CLIENT_ID: 'test-client-id',
        GOOGLE_CLIENT_SECRET: 'test-secret',
      });

      const response = await loader({ request, context, params: {} });

      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toBe(`${spec.routes.login.path}?error=oauth-not-configured`);
    });

    it('should redirect to login with error when all env vars are missing', async () => {
      const request = createMockRequest();
      const context = createMockContext({});

      const response = await loader({ request, context, params: {} });

      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toBe(`${spec.routes.login.path}?error=oauth-not-configured`);
    });
  });

  describe('when environment variables are configured', () => {
    const validEnv = {
      GOOGLE_CLIENT_ID: 'test-client-id',
      GOOGLE_CLIENT_SECRET: 'test-secret',
      GOOGLE_REDIRECT_URI: 'http://localhost:3000/auth/callback/google',
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

    it('should set oauth_state cookie with correct attributes (HTTP: no Secure flag)', async () => {
      const request = createMockRequest();
      const context = createMockContext(validEnv);
      const cookie = spec.oauth.google.state_cookie;

      const response = await loader({ request, context, params: {} });

      const setCookie = response.headers.get('Set-Cookie');
      expect(setCookie).toContain(`${cookie.name}=test-state-uuid`);
      expect(setCookie).toContain(`Path=${cookie.path}`);
      expect(setCookie).toContain('HttpOnly');
      expect(setCookie).not.toContain('Secure');
      expect(setCookie).toContain(`SameSite=${cookie.same_site}`);
      expect(setCookie).toContain(`Max-Age=${cookie.max_age_seconds}`);
    });

    it('should include Secure flag when request is HTTPS', async () => {
      const request = new Request('https://claudemix.dev/auth/google');
      const context = createMockContext(validEnv);

      const response = await loader({ request, context, params: {} });

      const setCookie = response.headers.get('Set-Cookie');
      expect(setCookie).toContain('Secure');
    });

    it('should generate unique state for CSRF protection', async () => {
      const request = createMockRequest();
      const context = createMockContext(validEnv);

      await loader({ request, context, params: {} });

      expect(crypto.randomUUID).toHaveBeenCalled();
    });
  });

  describe('redirect-url cookie', () => {
    const validEnv = {
      GOOGLE_CLIENT_ID: 'test-client-id',
      GOOGLE_CLIENT_SECRET: 'test-secret',
      GOOGLE_REDIRECT_URI: 'http://localhost:3000/auth/callback/google',
    };

    it('should set oauth_redirect cookie when redirect-url query param is present', async () => {
      const request = new Request('http://localhost:3000/auth/google?redirect-url=%2Fblog%2Fmy-article');
      const context = createMockContext(validEnv);
      const redirectCookie = spec.oauth.google.redirect_cookie;

      const response = await loader({ request, context, params: {} });

      const cookies = response.headers.getSetCookie();
      const redirectCookieHeader = cookies.find((c: string) => c.startsWith(redirectCookie.name));
      expect(redirectCookieHeader).toBeDefined();
      expect(redirectCookieHeader).toContain(`${redirectCookie.name}=%2Fblog%2Fmy-article`);
      expect(redirectCookieHeader).toContain('HttpOnly');
      expect(redirectCookieHeader).toContain(`SameSite=${redirectCookie.same_site}`);
      expect(redirectCookieHeader).toContain(`Max-Age=${redirectCookie.max_age_seconds}`);
    });

    it('should not set oauth_redirect cookie when redirect-url is absent', async () => {
      const request = createMockRequest();
      const context = createMockContext(validEnv);
      const redirectCookie = spec.oauth.google.redirect_cookie;

      const response = await loader({ request, context, params: {} });

      const cookies = response.headers.getSetCookie();
      const redirectCookieHeader = cookies.find((c: string) => c.startsWith(redirectCookie.name));
      expect(redirectCookieHeader).toBeUndefined();
    });

    it('should reject absolute URL redirect-url (open redirect protection)', async () => {
      const request = new Request('http://localhost:3000/auth/google?redirect-url=https%3A%2F%2Fevil.com%2Fsteal');
      const context = createMockContext(validEnv);
      const redirectCookie = spec.oauth.google.redirect_cookie;

      const response = await loader({ request, context, params: {} });

      const cookies = response.headers.getSetCookie();
      const redirectCookieHeader = cookies.find((c: string) => c.startsWith(redirectCookie.name));
      expect(redirectCookieHeader).toBeUndefined();
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
          GOOGLE_REDIRECT_URI: 'http://localhost:3000/auth/callback/google',
        },
      };

      const response = await loader({ request, context, params: {} });

      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toContain('accounts.google.com');
    });
  });
});
