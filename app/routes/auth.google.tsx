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

/**
 * Loader: Redirect to Google OAuth authorization page
 */
export async function loader({ request, context }: LoaderFunctionArgs) {
  const env = (context as any).env;

  // Get OAuth configuration from environment variables
  const clientId = env.GOOGLE_CLIENT_ID;
  const redirectUri = env.GOOGLE_REDIRECT_URI || 'http://localhost:8788/auth/callback/google';

  if (!clientId) {
    console.error('GOOGLE_CLIENT_ID not configured');
    return redirect('/login?error=oauth-not-configured');
  }

  // Generate CSRF protection state
  const state = crypto.randomUUID();

  // Store state in session/cookie for validation in callback
  // For MVP, we'll validate state in callback using a simple check
  // In production, store in KV with short TTL

  const authUrl = generateGoogleAuthUrl(clientId, redirectUri, state);

  // Store state in cookie for CSRF validation
  return redirect(authUrl, {
    headers: {
      'Set-Cookie': `oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
    },
  });
}

// No default export needed - loader-only route
