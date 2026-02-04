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
  const stripe = new Stripe(context.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-12-18.acacia',
    typescript: true,
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
  const stripe = new Stripe(context.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-12-18.acacia',
    typescript: true,
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
