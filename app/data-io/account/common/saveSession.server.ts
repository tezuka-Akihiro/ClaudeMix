/**
 * saveSession.server.ts
 * Purpose: Save session data to D1 database and generate Set-Cookie header
 *
 * @layer 副作用層 (Data-IO)
 * @responsibility D1データベース書き込み、Cookie生成
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
 * Save session data to D1 database and generate Set-Cookie header
 *
 * @param sessionData - Session data to save
 * @param context - Cloudflare Workers load context with D1 binding
 * @returns Set-Cookie header string
 * @throws Error if database save fails
 */
export async function saveSession(
  sessionData: SessionData,
  context: CloudflareLoadContext
): Promise<string> {
  try {
    const db = context.env.DB;

    // Insert session into D1 database
    const stmt = db
      .prepare(
        'INSERT INTO sessions (id, userId, expiresAt, createdAt) VALUES (?, ?, ?, ?)'
      )
      .bind(
        sessionData.sessionId,
        sessionData.userId,
        sessionData.expiresAt,
        new Date().toISOString()
      );

    await stmt.run();

    // Calculate TTL from expiresAt
    const expiresAt = new Date(sessionData.expiresAt);
    const now = new Date();
    const ttlSeconds = Math.floor((expiresAt.getTime() - now.getTime()) / 1000);

    // Generate Set-Cookie header
    const setCookieHeader = generateSetCookieHeader(
      sessionData.sessionId,
      ttlSeconds
    );

    return setCookieHeader;
  } catch (error) {
    console.error('Error saving session:', error);
    throw new Error('Failed to save session');
  }
}

/**
 * Generate Set-Cookie header string with security attributes
 *
 * @param sessionId - Session ID to set in cookie
 * @param maxAge - Cookie max age in seconds
 * @returns Set-Cookie header string
 */
function generateSetCookieHeader(sessionId: string, maxAge: number): string {
  const cookieParts = [
    `session_id=${sessionId}`,
    `Max-Age=${maxAge}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
  ];

  return cookieParts.join('; ');
}
