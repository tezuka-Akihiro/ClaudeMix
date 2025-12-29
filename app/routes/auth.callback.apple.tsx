/**
 * auth.callback.apple.tsx
 * Purpose: Handle Apple OAuth callback (Placeholder for future implementation)
 *
 * @layer UI層 (routes)
 * @responsibility Apple OAuth認証コールバック処理
 */

import type { LoaderFunctionArgs } from '@remix-run/cloudflare';
import { redirect } from '@remix-run/cloudflare';

/**
 * Loader: Apple OAuth callback placeholder
 */
export async function loader({ request, context }: LoaderFunctionArgs) {
  console.warn('Apple OAuth callback not implemented yet');
  return redirect('/login?error=apple-oauth-not-available');
}
