/**
 * getSession.server.ts
 * Purpose: Retrieve session data from D1 database using session ID from Cookie
 *
 * @layer副作用層 (Data-IO)
 * @responsibility D1データベース読み取り、Cookie解析
 */

import type { SessionData } from '~/specs/account/types';

/**
 * AppLoadContext type for Cloudflare Workers environment
 */
interface CloudflareEnv {
  DB: D1Database;
}

interface CloudflareLoadContext {
  env: CloudflareEnv;
}

/**
 * Retrieve session data from D1 database
 *
 * @param request - HTTP Request containing Cookie header
 * @param context - Cloudflare Workers load context with D1 binding
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

    // Retrieve session data from D1 database
    const db = context.env.DB;
    const result = await db
      .prepare('SELECT * FROM sessions WHERE id = ?')
      .bind(sessionId)
      .first();

    if (!result) {
      return null;
    }

    // Return session data
    const sessionData: SessionData = {
      sessionId: result.id as string,
      userId: result.userId as string,
      expiresAt: result.expiresAt as string,
      createdAt: result.createdAt as string,
    };
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
