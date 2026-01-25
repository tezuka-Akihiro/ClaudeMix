/**
 * verifyStripeWebhook.server.ts
 * Purpose: Verify Stripe webhook signature
 *
 * @layer 副作用層 (Data-IO)
 * @responsibility Stripe Webhook署名検証
 */

import Stripe from 'stripe'

/**
 * AppLoadContext type for Cloudflare Workers environment
 */
interface CloudflareEnv {
  STRIPE_SECRET_KEY: string
  STRIPE_WEBHOOK_SECRET: string
}

interface CloudflareLoadContext {
  env: CloudflareEnv
}

/**
 * Verify Stripe webhook signature and parse event
 *
 * @param payload - Raw request body
 * @param signature - Stripe signature header
 * @param context - Cloudflare Workers load context with env bindings
 * @returns Verified Stripe event
 * @throws Error if signature verification fails
 */
export async function verifyStripeWebhook(
  payload: string,
  signature: string,
  context: CloudflareLoadContext
): Promise<Stripe.Event> {
  // Initialize Stripe client
  const stripe = new Stripe(context.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-12-18.acacia',
    typescript: true,
  })

  // Verify webhook signature
  const event = stripe.webhooks.constructEvent(
    payload,
    signature,
    context.env.STRIPE_WEBHOOK_SECRET
  )

  return event
}
