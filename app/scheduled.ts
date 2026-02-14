/**
 * scheduled.ts
 * Purpose: Entry point for Cloudflare Workers Cron Triggers
 *
 * @responsibility 定期実行タスク（物理抹消バッチ）の起動
 */

import { purgeExpiredUsers } from './data-io/account/profile/purgeExpiredUsers.server';

export default {
  /**
   * Scheduled handler for Cron Triggers
   * 
   * @param event - Scheduled event info
   * @param env - Cloudflare Environment bindings
   * @param ctx - Execution context
   */
  async scheduled(event: any, env: any, ctx: any) {
    console.log(`Cron Trigger started at ${new Date().toISOString()} (event: ${event.cron})`);

    try {
      const result = await purgeExpiredUsers({ env });
      console.log('Purge execution completed:', result);
    } catch (error) {
      console.error('Purge execution failed:', error);
      // We don't throw here to avoid infinite retries if the platform supports it,
      // but instead rely on logging/alerts.
    }
  },
};
