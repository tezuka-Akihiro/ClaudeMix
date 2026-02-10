/**
 * createSessionData.ts
 * Purpose: Create a new session data structure with proper defaults
 *
 * @layer 純粋ロジック層 (lib)
 * @responsibility セッションデータ生成（副作用なし）
 */

import { loadSpec } from '~/spec-loader/specLoader.server';
import type { SessionData } from '~/specs/account/types';
import type { AccountCommonSpec } from '~/specs/account/types';

/**
 * Default session duration from account common spec
 */
const commonSpec = loadSpec<AccountCommonSpec>('account/common');
const DEFAULT_SESSION_DURATION_SECONDS = commonSpec.session.expiry.duration_seconds;

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
