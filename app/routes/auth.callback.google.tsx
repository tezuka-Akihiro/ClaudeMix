/**
 * auth.callback.google.tsx
 * Purpose: Handle Google OAuth callback
 *
 * @layer UI層 (routes)
 * @responsibility Google OAuth認証コールバック処理
 */

import type { LoaderFunctionArgs } from '@remix-run/cloudflare';
import { redirect } from '@remix-run/cloudflare';
import { exchangeGoogleCode } from '~/data-io/account/authentication/exchangeGoogleCode.server';
import { getUserByOAuth } from '~/data-io/account/authentication/getUserByOAuth.server';
import { getUserByEmail } from '~/data-io/account/authentication/getUserByEmail.server';
import { createOAuthUser } from '~/data-io/account/authentication/createOAuthUser.server';
import { saveSession } from '~/data-io/account/common/saveSession.server';
import { createSessionData } from '~/lib/account/common/createSessionData';

/**
 * Loader: Handle Google OAuth callback
 */
export async function loader({ request, context }: LoaderFunctionArgs) {
  const env = (context as any).env;
  const url = new URL(request.url);

  // Extract OAuth response parameters
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  // Handle OAuth errors
  if (error) {
    console.error('Google OAuth error:', error);
    return redirect('/login?error=oauth-failed');
  }

  if (!code || !state) {
    console.error('Missing code or state parameter');
    return redirect('/login?error=oauth-invalid');
  }

  // TODO: Validate state for CSRF protection
  // For MVP, we skip state validation
  // In production: const storedState = await getStateFromCookie(request);
  // if (state !== storedState) return redirect('/login?error=csrf-detected');

  // Get OAuth configuration
  const clientId = env.GOOGLE_CLIENT_ID;
  const clientSecret = env.GOOGLE_CLIENT_SECRET;
  const redirectUri = env.GOOGLE_REDIRECT_URI || 'http://localhost:8788/auth/callback/google';

  if (!clientId || !clientSecret) {
    console.error('Google OAuth not configured');
    return redirect('/login?error=oauth-not-configured');
  }

  try {
    // Exchange code for user info
    const googleUser = await exchangeGoogleCode(code, clientId, clientSecret, redirectUri);

    // Check if user already exists by OAuth provider + ID
    let user = await getUserByOAuth('google', googleUser.id, context as any);

    if (!user) {
      // Check if user exists by email (account linking scenario)
      const existingUser = await getUserByEmail(googleUser.email, context as any);

      if (existingUser) {
        // Email already registered with password - for MVP, prevent login
        // In production, implement account linking flow
        console.warn(`Email ${googleUser.email} already registered with password`);
        return redirect('/login?error=email-already-exists');
      }

      // Create new OAuth user
      const userId = await createOAuthUser(
        {
          email: googleUser.email,
          oauthProvider: 'google',
          oauthId: googleUser.id,
        },
        context as any
      );

      if (!userId) {
        console.error('Failed to create OAuth user');
        return redirect('/login?error=oauth-registration-failed');
      }

      // Fetch newly created user
      user = await getUserByOAuth('google', googleUser.id, context as any);

      if (!user) {
        console.error('Failed to retrieve newly created user');
        return redirect('/login?error=oauth-login-failed');
      }
    }

    // Create session
    const sessionId = crypto.randomUUID();
    const sessionData = createSessionData(user.id, sessionId);
    const setCookieHeader = await saveSession(sessionData, context as any);

    // Set session cookie and redirect to account page
    return redirect('/account', {
      headers: {
        'Set-Cookie': setCookieHeader,
      },
    });
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return redirect('/login?error=oauth-failed');
  }
}

// No default export needed - loader-only route
