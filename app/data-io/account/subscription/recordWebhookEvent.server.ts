/**
 * recordWebhookEvent.server.ts
 * Purpose: Record processed webhook event for idempotency
 *
 * @layer 副作用層 (Data-IO)
 * @responsibility D1データベース書き込み
 */

interface CloudflareEnv {
  DB: D1Database
}

interface CloudflareLoadContext {
  env: CloudflareEnv
}

/**
 * Record a processed webhook event
 *
 * Part of idempotency guard - records event ID after successful processing
 * to prevent duplicate processing of the same event.
 *
 * @param eventId - Stripe event ID (unique identifier)
 * @param eventType - Event type (e.g., 'checkout.session.completed')
 * @param context - Cloudflare Workers load context with D1 binding
 */
export async function recordWebhookEvent(
  eventId: string,
  eventType: string,
  context: CloudflareLoadContext
): Promise<void> {
  try {
    const db = context.env.DB
    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    await db
      .prepare(
        `INSERT INTO webhook_events (id, eventId, eventType, processedAt, createdAt)
        VALUES (?, ?, ?, ?, ?)`
      )
      .bind(id, eventId, eventType, now, now)
      .run()
  } catch (error) {
    // If insert fails due to unique constraint, the event was already recorded
    // This is expected behavior and not an error
    if (
      error instanceof Error &&
      error.message.includes('UNIQUE constraint failed')
    ) {
      console.log(`Webhook event ${eventId} already recorded, skipping`)
      return
    }
    console.error('Error recording webhook event:', error)
    throw new Error('Failed to record webhook event')
  }
}
