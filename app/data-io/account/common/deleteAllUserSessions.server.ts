/**
 * deleteAllUserSessions.server.ts
 * Purpose: Delete all sessions for a specific user from Cloudflare Workers KV
 *
 * @layer 副作用層 (Data-IO)
 * @responsibility Cloudflare Workers KV一括削除、ページネーション処理
 */

import type { SessionData } from '~/specs/account/types';
import { loadSpec } from '~/spec-loader/specLoader.server';
import type { AccountCommonSpec } from '~/specs/account/types';

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
 * Delete all sessions for a specific user from Cloudflare Workers KV
 *
 * @param userId - User ID whose sessions should be deleted
 * @param context - Cloudflare Workers load context with KV binding
 * @returns Number of sessions deleted
 * @throws Error if KV operations fail
 */
export async function deleteAllUserSessions(
  userId: string,
  context: CloudflareLoadContext
): Promise<number> {
  const commonSpec = loadSpec<AccountCommonSpec>('account/common');

  try {
    const kv = context.env.SESSION_KV;
    let deletedCount = 0;
    let cursor: string | undefined;

    // List all session keys with pagination support
    do {
      const listResult = await kv.list({
        prefix: commonSpec.session.kv.key_prefix,
        ...(cursor && { cursor }),
      });

      // Fetch and filter sessions belonging to the user
      const sessionKeysToDelete: string[] = [];

      for (const key of listResult.keys) {
        const sessionDataJson = await kv.get(key.name);

        if (sessionDataJson) {
          try {
            const sessionData = JSON.parse(sessionDataJson) as SessionData;
            if (sessionData.userId === userId) {
              sessionKeysToDelete.push(key.name);
            }
          } catch {
            // Skip invalid JSON entries
            continue;
          }
        }
      }

      // Delete all matching sessions
      for (const key of sessionKeysToDelete) {
        await kv.delete(key);
        deletedCount++;
      }

      // Update cursor for next page
      cursor = listResult.list_complete ? undefined : listResult.cursor;
    } while (cursor);

    return deletedCount;
  } catch (error) {
    console.error('Error deleting all user sessions:', error);
    throw new Error('Failed to delete all user sessions');
  }
}
