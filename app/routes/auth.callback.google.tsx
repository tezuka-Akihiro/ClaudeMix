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
import { loadSpec } from '~/spec-loader/specLoader.server';
import type { AccountAuthenticationSpec } from '~/specs/account/types';

/**
 * Loader: Handle Google OAuth callback
 */
export async function loader({ request, context }: LoaderFunctionArgs) {
  const spec = loadSpec<AccountAuthenticationSpec>('account/authentication');
  const loginPath = spec.routes.login.path;
  const cookie = spec.oauth.google.state_cookie;

  // Cloudflare Pagesでは context.cloudflare.env を使用
  const env = (context as any).cloudflare?.env || (context as any).env;
  const url = new URL(request.url);

  // Extract OAuth response parameters
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  // Handle OAuth errors
  if (error) {
    console.error('Google OAuth error:', error);
    return redirect(`${loginPath}?error=oauth-failed`);
  }

  if (!code || !state) {
    console.error('Missing code or state parameter');
    return redirect(`${loginPath}?error=oauth-invalid`);
  }

  // Validate state for CSRF protection
  const cookieHeader = request.headers.get('Cookie') || '';
  const cookies = Object.fromEntries(
    cookieHeader.split('; ').filter(Boolean).map((c) => {
      const [key, ...rest] = c.split('=');
      return [key, rest.join('=')];
    })
  );
  const storedState = cookies[cookie.name];

  if (!storedState || state !== storedState) {
    console.error('CSRF validation failed: state mismatch');
    return redirect(`${loginPath}?error=csrf-detected`);
  }

  // Get OAuth configuration
  const clientId = env?.GOOGLE_CLIENT_ID;
  const clientSecret = env?.GOOGLE_CLIENT_SECRET;
  const redirectUri = env?.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    console.error('Google OAuth not fully configured: missing GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, or GOOGLE_REDIRECT_URI');
    return redirect(`${loginPath}?error=oauth-not-configured`);
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
        return redirect(`${loginPath}?error=email-already-exists`);
      }

      // Create new OAuth user
      const userId = await createOAuthUser(
        {
          email: googleUser.email,
          oauthProvider: 'google',
          googleId: googleUser.id,
        },
        context as any
      );

      if (!userId) {
        console.error('Failed to create OAuth user');
        return redirect(`${loginPath}?error=oauth-registration-failed`);
      }

      // Fetch newly created user
      user = await getUserByOAuth('google', googleUser.id, context as any);

      if (!user) {
        console.error('Failed to retrieve newly created user');
        return redirect(`${loginPath}?error=oauth-login-failed`);
      }
    }

    // Create session
    const sessionId = crypto.randomUUID();
    const sessionData = createSessionData(user.id, sessionId);
    const setCookieHeader = await saveSession(sessionData, context as any);

    // Determine redirect target from oauth_redirect cookie (or default)
    const redirectCookie = spec.oauth.google.redirect_cookie;
    const rawRedirect = cookies[redirectCookie.name];
    const decodedRedirect = rawRedirect ? decodeURIComponent(rawRedirect) : null;
    // Only allow relative paths (open redirect protection)
    const redirectTarget = decodedRedirect && decodedRedirect.startsWith('/')
      ? decodedRedirect
      : spec.server_io.action.default_redirect;

    // Set session cookie, clear oauth_state and oauth_redirect cookies, then redirect
    const isSecure = new URL(request.url).protocol === 'https:';
    const securePart = isSecure ? ' Secure;' : '';
    const headers = new Headers();
    headers.append('Set-Cookie', setCookieHeader);
    headers.append('Set-Cookie', `${cookie.name}=; Path=${cookie.path}; HttpOnly;${securePart} SameSite=${cookie.same_site}; Max-Age=0`);
    headers.append('Set-Cookie', `${redirectCookie.name}=; Path=${redirectCookie.path}; HttpOnly;${securePart} SameSite=${redirectCookie.same_site}; Max-Age=0`);

    return redirect(redirectTarget, { headers });
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return redirect(`${loginPath}?error=oauth-failed`);
  }
}

// No default export needed - loader-only route
