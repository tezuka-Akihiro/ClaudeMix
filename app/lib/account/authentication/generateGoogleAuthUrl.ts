/**
 * generateGoogleAuthUrl.ts
 * Purpose: Generate Google OAuth authorization URL
 *
 * @layer 純粋ロジック層 (lib)
 * @responsibility URL生成ロジック
 */

/**
 * Generate Google OAuth authorization URL
 *
 * @param clientId - Google OAuth client ID
 * @param redirectUri - Callback URL after authorization
 * @param state - CSRF protection state parameter
 * @returns Google OAuth authorization URL
 *
 * Security:
 * - Uses 'state' parameter for CSRF protection
 * - Requests minimal scopes (email, profile)
 * - Forces account selection (prompt=select_account)
 *
 * Google OAuth Documentation:
 * https://developers.google.com/identity/protocols/oauth2/web-server
 */
export function generateGoogleAuthUrl(
  clientId: string,
  redirectUri: string,
  state: string
): string {
  const baseUrl = 'https://accounts.google.com/o/oauth2/v2/auth';

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state: state,
    access_type: 'online',
    prompt: 'select_account',
  });

  return `${baseUrl}?${params.toString()}`;
}
