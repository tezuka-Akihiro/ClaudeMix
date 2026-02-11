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
  ENABLE_STRIPE_MOCK?: string
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

  // ============================================
  // Mocking for E2E Tests / Local Development
  // ============================================
  // If ENABLE_STRIPE_MOCK is set, or if no real Stripe key is provided
  // in a non-production environment, return a mock success URL.
  const isProduction = process.env.NODE_ENV === 'production';
  const isMockEnabled = context.env.ENABLE_STRIPE_MOCK === 'true';
  const isPlaceholderKey = !context.env.STRIPE_SECRET_KEY || context.env.STRIPE_SECRET_KEY === 'sk_test_xxxxxxxxxxxxxxxxxxxx';

  if (!isProduction && (isMockEnabled || isPlaceholderKey)) {
    console.warn('⚠️ Stripe Mocking is enabled. Returning mock checkout URL.');
    // Return success URL as if checkout was completed (for testing UI flow)
    const separator = successUrl.includes('?') ? '&' : '?';
    return `${successUrl}${separator}session_id=mock_session_${Date.now()}`;
  }

  // Initialize Stripe client (fetch for Cloudflare Workers compatibility)
  const stripe = new Stripe(context.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-12-15.clover',
    typescript: true,
    httpClient: Stripe.createFetchHttpClient(),
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
