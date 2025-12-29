/**
 * generatePasswordResetToken.server.ts
 * Purpose: Generate and store password reset token in Cloudflare Workers KV
 *
 * @layer 副作用層 (Data-IO)
 * @responsibility KV書き込み、トークン生成
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
 * Generate a cryptographically secure random token
 *
 * @returns 32-character hex string
 */
function generateSecureToken(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate password reset token and store in KV
 *
 * @param email - User email address
 * @param context - Cloudflare Workers load context with KV binding
 * @returns Generated token
 * @throws Error if KV operation fails
 *
 * Security:
 * - Token is cryptographically random (128-bit entropy)
 * - Token is stored with 1-hour TTL (auto-expiration)
 * - Key format: reset-token:{email}
 *
 * Note:
 * - For production, consider rate limiting to prevent abuse
 * - Token is single-use (deleted after successful password reset)
 */
export async function generatePasswordResetToken(
  email: string,
  context: CloudflareLoadContext
): Promise<string> {
  try {
    const kv = context.env.SESSION_KV;
    const token = generateSecureToken();
    const key = `reset-token:${email}`;

    // Store token with 1-hour TTL (3600 seconds)
    await kv.put(
      key,
      JSON.stringify({
        email,
        token,
        createdAt: new Date().toISOString(),
      }),
      {
        expirationTtl: 3600, // 1 hour
      }
    );

    return token;
  } catch (error) {
    console.error('Error generating password reset token:', error);
    throw new Error('Failed to generate password reset token');
  }
}
