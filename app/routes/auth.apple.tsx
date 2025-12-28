/**
 * auth.apple.tsx
 * Purpose: Initiate Apple OAuth flow (Placeholder for future implementation)
 *
 * @layer UI層 (routes)
 * @responsibility Apple OAuth認証の開始
 */

import type { LoaderFunctionArgs } from '@remix-run/cloudflare';
import { redirect } from '@remix-run/cloudflare';

/**
 * Loader: Apple OAuth placeholder
 *
 * TODO: Implement Apple OAuth
 * - Requires Apple Developer account
 * - Requires Service ID configuration
 * - Requires private key for JWT signing
 * - See: https://developer.apple.com/documentation/sign_in_with_apple
 */
export async function loader({ request, context }: LoaderFunctionArgs) {
  console.warn('Apple OAuth not implemented yet');
  return redirect('/login?error=apple-oauth-not-available');
}
