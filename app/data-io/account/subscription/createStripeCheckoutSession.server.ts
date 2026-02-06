/**
 * createStripeCheckoutSession.server.ts
 * Purpose: Create Stripe Checkout Session for subscription
 *
 * @layer 副作用層 (Data-IO)
 * @responsibility Stripe API呼び出し
 */

import Stripe from 'stripe'

/**
 * AppLoadContext type for Cloudflare Workers environment
 */
interface CloudflareEnv {
  STRIPE_SECRET_KEY: string
}

interface CloudflareLoadContext {
  env: CloudflareEnv
}

/**
 * Checkout Session作成用パラメータ
 */
export interface CreateCheckoutSessionParams {
  userId: string
  userEmail: string
  planId: string
  stripePriceId: string
  successUrl: string
  cancelUrl: string
}

/**
 * Create Stripe Checkout Session
 *
 * @param params - Checkout Session creation parameters
 * @param context - Cloudflare Workers load context with env bindings
 * @returns Checkout Session URL for redirect
 * @throws Error if session creation fails
 */
export async function createStripeCheckoutSession(
  params: CreateCheckoutSessionParams,
  context: CloudflareLoadContext
): Promise<string> {
  const { userId, userEmail, planId, stripePriceId, successUrl, cancelUrl } = params

  // Initialize Stripe client
  const stripe = new Stripe(context.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-12-15.clover',
    typescript: true,
  })

  // Create Checkout Session
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: stripePriceId,
        quantity: 1,
      },
    ],
    customer_email: userEmail,
    metadata: {
      userId,
      planId,
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
    billing_address_collection: 'auto',
  })

  if (!session.url) {
    throw new Error('Failed to create checkout session URL')
  }

  return session.url
}
