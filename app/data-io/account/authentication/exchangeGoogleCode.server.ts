/**
 * exchangeGoogleCode.server.ts
 * Purpose: Exchange Google OAuth authorization code for access token and user info
 *
 * @layer 副作用層 (Data-IO)
 * @responsibility 外部API呼び出し (Google OAuth)
 */

export interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
}

export interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  id_token: string;
}

/**
 * Exchange Google OAuth authorization code for access token
 *
 * @param code - Authorization code from Google
 * @param clientId - Google OAuth client ID
 * @param clientSecret - Google OAuth client secret
 * @param redirectUri - Callback URL (must match registered URI)
 * @returns Access token response
 * @throws Error if token exchange fails
 */
async function getGoogleAccessToken(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<GoogleTokenResponse> {
  const tokenUrl = 'https://oauth2.googleapis.com/token';

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Google token exchange failed:', errorText);
    throw new Error('Failed to exchange Google authorization code');
  }

  return response.json();
}

/**
 * Fetch Google user information using access token
 *
 * @param accessToken - Google OAuth access token
 * @returns User information
 * @throws Error if user info fetch fails
 */
async function getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const userInfoUrl = 'https://www.googleapis.com/oauth2/v2/userinfo';

  const response = await fetch(userInfoUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Google user info fetch failed:', errorText);
    throw new Error('Failed to fetch Google user information');
  }

  return response.json();
}

/**
 * Exchange Google OAuth code for user information
 *
 * @param code - Authorization code from Google
 * @param clientId - Google OAuth client ID
 * @param clientSecret - Google OAuth client secret
 * @param redirectUri - Callback URL
 * @returns Google user information
 * @throws Error if OAuth process fails
 *
 * Security:
 * - Validates email is verified by Google
 * - Uses HTTPS for all API calls
 * - Access token is not stored (single-use)
 */
export async function exchangeGoogleCode(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<GoogleUserInfo> {
  // Exchange code for access token
  const tokenResponse = await getGoogleAccessToken(code, clientId, clientSecret, redirectUri);

  // Fetch user information
  const userInfo = await getGoogleUserInfo(tokenResponse.access_token);

  // Verify email is confirmed by Google
  if (!userInfo.verified_email) {
    throw new Error('Google email not verified');
  }

  return userInfo;
}
