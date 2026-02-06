/**
 * createSubscription.server.ts
 * Purpose: Create subscription record in D1 database
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
 * Parameters for creating a subscription record
 */
export interface CreateSubscriptionParams {
  userId: string
  stripeSubscriptionId: string
  stripeCustomerId: string
  planId: string
  status: string
  currentPeriodStart: string
  currentPeriodEnd: string
}

/**
 * Create subscription record in database
 *
 * @param params - Subscription creation parameters
 * @param context - Cloudflare Workers load context with D1 binding
 * @returns Created subscription ID
 * @throws Error if database insert fails
 */
export async function createSubscription(
  params: CreateSubscriptionParams,
  context: CloudflareLoadContext
): Promise<string> {
  const {
    userId,
    stripeSubscriptionId,
    stripeCustomerId,
    planId,
    status,
    currentPeriodStart,
    currentPeriodEnd,
  } = params

  try {
    const db = context.env.DB
    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    await db
      .prepare(
        `INSERT INTO subscriptions
        (id, user_id, stripe_subscription_id, stripe_customer_id, plan_id, status, current_period_start, current_period_end, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        userId,
        stripeSubscriptionId,
        stripeCustomerId,
        planId,
        status,
        currentPeriodStart,
        currentPeriodEnd,
        now,
        now
      )
      .run()

    return id
  } catch (error) {
    console.error('Error creating subscription:', error)
    throw new Error('Failed to create subscription record')
  }
}
