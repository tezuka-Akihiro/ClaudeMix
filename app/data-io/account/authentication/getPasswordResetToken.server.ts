/**
 * getPasswordResetToken.server.ts
 * Purpose: Retrieve password reset token from Cloudflare Workers KV
 *
 * @layer 副作用層 (Data-IO)
 * @responsibility KV読み取り
 */

/**
 * AppLoadContext type for Cloudflare Workers environment
 */
interface CloudflareEnv {
  SESSION_KV: KVNamespace;
}

interface CloudflareLoadContext {
  env: CloudflareEnv;
}

/**
 * Password Reset Token Data structure
 */
export interface PasswordResetTokenData {
  email: string;
  token: string;
  createdAt: string;
}

/**
 * Retrieve password reset token from KV by email
 *
 * @param email - User email address
 * @param context - Cloudflare Workers load context with KV binding
 * @returns Token data if found, null otherwise
 * @throws Error if KV operation fails
 *
 * Note:
 * - KV automatically deletes expired tokens (TTL: 1 hour)
 * - Returns null if token not found or expired
 */
export async function getPasswordResetToken(
  email: string,
  context: CloudflareLoadContext
): Promise<PasswordResetTokenData | null> {
  try {
    const kv = context.env.SESSION_KV;
    const key = `reset-token:${email}`;

    const tokenDataJson = await kv.get(key);

    if (!tokenDataJson) {
      return null;
    }

    try {
      const tokenData = JSON.parse(tokenDataJson) as PasswordResetTokenData;
      return tokenData;
    } catch {
      // Invalid JSON in KV, treat as not found
      return null;
    }
  } catch (error) {
    console.error('Error retrieving password reset token:', error);
    throw new Error('Failed to retrieve password reset token');
  }
}
