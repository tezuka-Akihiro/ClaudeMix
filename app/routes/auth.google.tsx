/**
 * auth.google.tsx
 * Purpose: Initiate Google OAuth flow
 *
 * @layer UI層 (routes)
 * @responsibility Google OAuth認証の開始
 */

import type { LoaderFunctionArgs } from '@remix-run/cloudflare';
import { redirect } from '@remix-run/cloudflare';
import { generateGoogleAuthUrl } from '~/lib/account/authentication/generateGoogleAuthUrl';
import { loadSpec } from '~/spec-loader/specLoader.server';
import type { AccountAuthenticationSpec } from '~/specs/account/types';

/**
 * Loader: Redirect to Google OAuth authorization page
 */
export async function loader({ request, context }: LoaderFunctionArgs) {
  const spec = loadSpec<AccountAuthenticationSpec>('account/authentication');
  // Cloudflare Pagesでは context.cloudflare.env を使用
  const env = (context as any).cloudflare?.env || (context as any).env;

  // Get OAuth configuration from environment variables
  const clientId = env?.GOOGLE_CLIENT_ID;
  const clientSecret = env?.GOOGLE_CLIENT_SECRET;
  const redirectUri = env?.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    console.error('Google OAuth not fully configured: missing GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, or GOOGLE_REDIRECT_URI');
    return redirect(`${spec.routes.login.path}?error=oauth-not-configured`);
  }

  // Generate CSRF protection state
  const state = crypto.randomUUID();

  // Store state in session/cookie for validation in callback
  // For MVP, we'll validate state in callback using a simple check
  // In production, store in KV with short TTL

  const authUrl = generateGoogleAuthUrl(clientId, redirectUri, state);

  // Store state in cookie for CSRF validation
  const cookie = spec.oauth.google.state_cookie;
  const isSecure = new URL(request.url).protocol === 'https:';
  const securePart = isSecure ? ' Secure;' : '';
  return redirect(authUrl, {
    headers: {
      'Set-Cookie': `${cookie.name}=${state}; Path=${cookie.path}; HttpOnly;${securePart} SameSite=${cookie.same_site}; Max-Age=${cookie.max_age_seconds}`,
    },
  });
}

// No default export needed - loader-only route
