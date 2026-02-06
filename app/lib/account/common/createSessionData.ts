/**
 * createSessionData.ts
 * Purpose: Create a new session data structure with proper defaults
 *
 * @layer 純粋ロジック層 (lib)
 * @responsibility セッションデータ生成（副作用なし）
 */

import { getSharedSpec } from '~/generated/specs';
import type { SessionData } from '~/specs/account/types';
import type { ServerSpec } from '~/specs/shared/types';

/**
 * Default session duration from shared spec
 */
const serverSpec = getSharedSpec<ServerSpec>('server');
const DEFAULT_SESSION_DURATION_SECONDS = serverSpec.security.session_max_age;

/**
 * Create a new session data structure
 *
 * @param userId - User ID for the session
 * @param sessionId - Unique session identifier
 * @param durationSeconds - Session duration in seconds (default: 7 days)
 * @returns Complete SessionData object with ISO 8601 timestamps
 */
export function createSessionData(
  userId: string,
  sessionId: string,
  durationSeconds: number = DEFAULT_SESSION_DURATION_SECONDS
): SessionData {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + durationSeconds * 1000);

  return {
    sessionId,
    userId,
    expiresAt: expiresAt.toISOString(),
    createdAt: now.toISOString(),
  };
}
