/**
 * destroySession.server.ts
 * Purpose: Delete session from Cloudflare Workers KV and invalidate Cookie
 *
 * @layer 副作用層 (Data-IO)
 * @responsibility Cloudflare Workers KV削除、Cookie無効化
 */

/**
 * AppLoadContext type for Cloudflare Workers environment
 */
interface CloudflareEnv {
  SESSION_KV: KVNamespace;
}

interface CloudflareLoadContext {
  cloudflare: {
    env: CloudflareEnv;
  };
}

/**
 * Delete session from Cloudflare Workers KV and generate Cookie deletion header
 *
 * @param sessionId - Session ID to delete
 * @param context - Cloudflare Workers load context with KV binding
 * @returns Set-Cookie header string for cookie deletion (Max-Age=0)
 * @throws Error if KV deletion fails
 */
export async function destroySession(
  sessionId: string,
  context: CloudflareLoadContext
): Promise<string> {
  try {
    // Delete session from KV
    const kv = context.cloudflare.env.SESSION_KV;
    const kvKey = `session:${sessionId}`;
    await kv.delete(kvKey);

    // Generate cookie deletion header
    const setCookieHeader = generateCookieDeletionHeader();

    return setCookieHeader;
  } catch (error) {
    console.error('Error destroying session:', error);
    throw new Error('Failed to destroy session');
  }
}

/**
 * Generate Set-Cookie header to invalidate the session cookie
 * Sets Max-Age=0 to expire the cookie immediately
 *
 * @returns Set-Cookie header string for cookie deletion
 */
function generateCookieDeletionHeader(): string {
  const cookieParts = [
    'session_id=', // Empty value
    'Max-Age=0', // Expire immediately
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
  ];

  return cookieParts.join('; ');
}
