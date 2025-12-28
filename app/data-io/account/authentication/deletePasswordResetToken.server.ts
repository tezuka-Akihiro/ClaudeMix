/**
 * deletePasswordResetToken.server.ts
 * Purpose: Delete password reset token from Cloudflare Workers KV
 *
 * @layer 副作用層 (Data-IO)
 * @responsibility KV削除
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
 * Delete password reset token from KV
 *
 * @param email - User email address
 * @param context - Cloudflare Workers load context with KV binding
 * @returns void
 * @throws Error if KV operation fails
 *
 * Security:
 * - Ensures single-use tokens (deleted after password reset)
 * - Called after successful password reset
 *
 * Note:
 * - KV deletion propagates globally within ~60 seconds
 * - Safe to call even if token doesn't exist (idempotent)
 */
export async function deletePasswordResetToken(
  email: string,
  context: CloudflareLoadContext
): Promise<void> {
  try {
    const kv = context.env.SESSION_KV;
    const key = `reset-token:${email}`;

    await kv.delete(key);
  } catch (error) {
    console.error('Error deleting password reset token:', error);
    throw new Error('Failed to delete password reset token');
  }
}
