/**
 * cancelStripeSubscription.server.ts
 * Purpose: Cancel Stripe subscription via Stripe API
 *
 * @layer 副作用層 (Data-IO)
 * @responsibility Stripe API呼び出し
 */

import Stripe from 'stripe'

interface CloudflareEnv {
  STRIPE_SECRET_KEY: string
  ENABLE_STRIPE_MOCK?: string
}

interface CloudflareLoadContext {
  env: CloudflareEnv
}

/**
 * Cancel Stripe subscription at period end
 *
 * Sets cancel_at_period_end to true, allowing user to continue
 * accessing content until the current billing period ends.
 *
 * @param stripeSubscriptionId - Stripe subscription ID to cancel
 * @param context - Cloudflare Workers load context with Stripe key
 * @returns Updated subscription object from Stripe
 * @throws Error if cancellation fails
 */
export async function cancelStripeSubscription(
  stripeSubscriptionId: string,
  context: CloudflareLoadContext
): Promise<Stripe.Subscription> {
  // ============================================
  // Mocking for E2E Tests / Local Development
  // ============================================
  const isProduction = process.env.NODE_ENV === 'production';
  const isMockEnabled = context.env.ENABLE_STRIPE_MOCK === 'true';
  const isPlaceholderKey = !context.env.STRIPE_SECRET_KEY || context.env.STRIPE_SECRET_KEY === 'sk_test_xxxxxxxxxxxxxxxxxxxx';

  if (!isProduction && (isMockEnabled || isPlaceholderKey)) {
    return {
      id: stripeSubscriptionId,
      cancel_at_period_end: true,
    } as Stripe.Subscription;
  }

  const stripe = new Stripe(context.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-12-15.clover',
    typescript: true,
    httpClient: Stripe.createFetchHttpClient(),
  })

  try {
    const subscription = await stripe.subscriptions.update(stripeSubscriptionId, {
      cancel_at_period_end: true,
    })

    return subscription
  } catch (error) {
    console.error('Error canceling Stripe subscription:', error)
    throw new Error('Failed to cancel subscription')
  }
}

/**
 * Reactivate a canceled Stripe subscription
 *
 * Sets cancel_at_period_end to false, resuming the subscription.
 *
 * @param stripeSubscriptionId - Stripe subscription ID to reactivate
 * @param context - Cloudflare Workers load context with Stripe key
 * @returns Updated subscription object from Stripe
 * @throws Error if reactivation fails
 */
export async function reactivateStripeSubscription(
  stripeSubscriptionId: string,
  context: CloudflareLoadContext
): Promise<Stripe.Subscription> {
  // ============================================
  // Mocking for E2E Tests / Local Development
  // ============================================
  const isProduction = process.env.NODE_ENV === 'production';
  const isMockEnabled = context.env.ENABLE_STRIPE_MOCK === 'true';
  const isPlaceholderKey = !context.env.STRIPE_SECRET_KEY || context.env.STRIPE_SECRET_KEY === 'sk_test_xxxxxxxxxxxxxxxxxxxx';

  if (!isProduction && (isMockEnabled || isPlaceholderKey)) {
    return {
      id: stripeSubscriptionId,
      cancel_at_period_end: false,
    } as Stripe.Subscription;
  }

  const stripe = new Stripe(context.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-12-15.clover',
    typescript: true,
    httpClient: Stripe.createFetchHttpClient(),
  })

  try {
    const subscription = await stripe.subscriptions.update(stripeSubscriptionId, {
      cancel_at_period_end: false,
    })

    return subscription
  } catch (error) {
    console.error('Error reactivating Stripe subscription:', error)
    throw new Error('Failed to reactivate subscription')
  }
}
