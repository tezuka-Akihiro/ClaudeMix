/**
 * getSession.server.ts
 * Purpose: Retrieve session data from Cloudflare Workers KV using session ID from Cookie
 *
 * @layer副作用層 (Data-IO)
 * @responsibility Cloudflare Workers KV読み取り、Cookie解析
 */

import type { SessionData } from '~/specs/account/types';

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
 * Retrieve session data from Cloudflare Workers KV
 *
 * @param request - HTTP Request containing Cookie header
 * @param context - Cloudflare Workers load context with KV binding
 * @returns SessionData if valid session exists, null otherwise
 */
export async function getSession(
  request: Request,
  context: CloudflareLoadContext
): Promise<SessionData | null> {
  try {
    // Extract session ID from Cookie header
    const cookieHeader = request.headers.get('Cookie');
    if (!cookieHeader) {
      return null;
    }

    // Parse session_id from Cookie
    const sessionId = parseCookie(cookieHeader, 'session_id');
    if (!sessionId) {
      return null;
    }

    // Retrieve session data from KV
    const kv = context.cloudflare.env.SESSION_KV;
    const kvKey = `session:${sessionId}`;
    const sessionDataJson = await kv.get(kvKey);

    if (!result) {
      return null;
    }

    // Parse and return session data
    const sessionData = JSON.parse(sessionDataJson) as SessionData;
    return sessionData;
  } catch (error) {
    // Log error and return null (fail safely)
    console.error('Error retrieving session:', error);
    return null;
  }
}

/**
 * Parse cookie value from Cookie header string
 *
 * @param cookieHeader - Cookie header string (e.g., "session_id=abc; other=xyz")
 * @param name - Cookie name to extract
 * @returns Cookie value if found, null otherwise
 */
function parseCookie(cookieHeader: string, name: string): string | null {
  const cookies = cookieHeader.split(';').map((c) => c.trim());
  const targetCookie = cookies.find((cookie) => cookie.startsWith(`${name}=`));

  if (!targetCookie) {
    return null;
  }

  return targetCookie.split('=')[1] || null;
}
