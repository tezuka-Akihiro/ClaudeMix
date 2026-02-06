/**
 * isWebhookEventProcessed.server.ts
 * Purpose: Check if webhook event has already been processed
 *
 * @layer 副作用層 (Data-IO)
 * @responsibility D1データベース読み取り
 */

interface CloudflareEnv {
  DB: D1Database
}

interface CloudflareLoadContext {
  env: CloudflareEnv
}

/**
 * Check if a webhook event has already been processed
 *
 * Part of idempotency guard - checks event ID before processing
 * to prevent duplicate processing of the same event.
 *
 * @param eventId - Stripe event ID to check
 * @param context - Cloudflare Workers load context with D1 binding
 * @returns true if event was already processed, false otherwise
 */
export async function isWebhookEventProcessed(
  eventId: string,
  context: CloudflareLoadContext
): Promise<boolean> {
  try {
    if (!eventId) {
      return false
    }

    const db = context.env.DB
    const event = await db
      .prepare('SELECT id FROM webhook_events WHERE event_id = ? LIMIT 1')
      .bind(eventId)
      .first()

    return event !== null
  } catch (error) {
    console.error('Error checking webhook event status:', error)
    // On error, return false to allow processing (fail open)
    // This is safer than blocking legitimate events
    return false
  }
}
