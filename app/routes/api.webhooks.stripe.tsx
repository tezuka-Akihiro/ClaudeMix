/**
 * api.webhooks.stripe.tsx
 * Purpose: Handle Stripe webhooks for subscription lifecycle management
 *
 * @layer UI層 (routes)
 * @responsibility Stripeウェブフックの受信と処理、サブスクリプションライフサイクル管理
 */

import type { ActionFunctionArgs } from '@remix-run/cloudflare'
import { json } from '@remix-run/cloudflare'
import Stripe from 'stripe'
import { verifyStripeWebhook } from '~/data-io/account/subscription/verifyStripeWebhook.server'
import { updateUserSubscriptionStatus } from '~/data-io/account/subscription/updateUserSubscriptionStatus.server'
import { createSubscription } from '~/data-io/account/subscription/createSubscription.server'
import { updateUserStripeCustomerId } from '~/data-io/account/subscription/updateUserStripeCustomerId.server'
import { updateSubscriptionPeriod } from '~/data-io/account/subscription/updateSubscriptionPeriod.server'
import {
  updateSubscriptionCancellation,
  updateSubscriptionStatus,
} from '~/data-io/account/subscription/updateSubscriptionCancellation.server'
import { getUserByStripeCustomerId } from '~/data-io/account/subscription/getUserByStripeCustomerId.server'
import { getSubscriptionByStripeId } from '~/data-io/account/subscription/getSubscriptionByStripeId.server'
import { isWebhookEventProcessed } from '~/data-io/account/subscription/isWebhookEventProcessed.server'
import { recordWebhookEvent } from '~/data-io/account/subscription/recordWebhookEvent.server'

interface CloudflareEnv {
  STRIPE_SECRET_KEY: string
}

export async function action({ request, context }: ActionFunctionArgs) {
  // Only allow POST requests
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 })
  }

  // Get signature header
  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  // Get raw body
  const payload = await request.text()

  try {
    // Verify webhook signature
    const event = await verifyStripeWebhook(payload, signature, context as any)

    // Idempotency guard: check if event already processed
    const alreadyProcessed = await isWebhookEventProcessed(event.id, context as any)
    if (alreadyProcessed) {
      console.log(`Event ${event.id} already processed, skipping`)
      return json({ received: true, skipped: true })
    }

    // Initialize Stripe client for API calls
    const env = (context as any).env as CloudflareEnv
    const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
      httpClient: Stripe.createFetchHttpClient(),
    })

    // Convert Stripe period value to ISO string (handles unix timestamp, ISO string, or undefined)
    const toISOString = (value: unknown): string => {
      if (typeof value === 'number') return new Date(value * 1000).toISOString()
      if (typeof value === 'string') return new Date(value).toISOString()
      return new Date().toISOString() // fallback to now
    }

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        const planId = session.metadata?.planId

        if (userId && session.subscription) {
          // Get full subscription details from Stripe
          const stripeSubscription = (await stripe.subscriptions.retrieve(
            session.subscription as string
          )) as any

          // Extract period dates from items (API 2025-12-15.clover moved these from subscription root)
          const periodStart = stripeSubscription.current_period_start
            ?? stripeSubscription.items?.data?.[0]?.current_period_start
          const periodEnd = stripeSubscription.current_period_end
            ?? stripeSubscription.items?.data?.[0]?.current_period_end

          // Save stripeCustomerId to users table
          await updateUserStripeCustomerId(
            userId,
            stripeSubscription.customer as string,
            context as any
          )

          // Create subscription record in database
          await createSubscription(
            {
              userId,
              stripeSubscriptionId: stripeSubscription.id,
              stripeCustomerId: stripeSubscription.customer as string,
              planId: planId || 'standard',
              status: 'active',
              currentPeriodStart: toISOString(periodStart),
              currentPeriodEnd: toISOString(periodEnd),
            },
            context as any
          )

          // Update user subscription status
          await updateUserSubscriptionStatus(userId, 'active', context as any)
          console.log(`Subscription activated for user ${userId}`)
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any

        // 1. Update cancellation status
        if (subscription.cancel_at_period_end) {
          const periodEnd = subscription.current_period_end
            ?? subscription.items?.data?.[0]?.current_period_end
          const canceledAt = toISOString(periodEnd)
          await updateSubscriptionCancellation(
            subscription.id,
            canceledAt,
            context as any
          )
        } else {
          await updateSubscriptionCancellation(subscription.id, null, context as any)
        }

        // 2. Sync raw status to both tables
        await updateSubscriptionStatus(subscription.id, subscription.status, context as any)

        const dbSubscription = await getSubscriptionByStripeId(
          subscription.id,
          context as any
        )
        if (dbSubscription) {
          await updateUserSubscriptionStatus(
            dbSubscription.userId,
            subscription.status,
            context as any
          )
        }

        // 3. Update period dates
        const subPeriodStart = subscription.current_period_start
          ?? subscription.items?.data?.[0]?.current_period_start
        const subPeriodEnd = subscription.current_period_end
          ?? subscription.items?.data?.[0]?.current_period_end
        await updateSubscriptionPeriod(
          subscription.id,
          toISOString(subPeriodStart),
          toISOString(subPeriodEnd),
          context as any
        )
        console.log(`Subscription ${subscription.id} updated with status: ${subscription.status}`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any

        // Mark subscription as inactive (period ended)
        await updateSubscriptionStatus(subscription.id, 'inactive', context as any)

        // Also update users table
        const dbSubscription = await getSubscriptionByStripeId(
          subscription.id,
          context as any
        )
        if (dbSubscription) {
          await updateUserSubscriptionStatus(
            dbSubscription.userId,
            'inactive',
            context as any
          )
        }
        console.log(`Subscription ${subscription.id} deleted/expired`)
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as any

        if (invoice.subscription) {
          // Get subscription details to update period
          const stripeSubscription = (await stripe.subscriptions.retrieve(
            invoice.subscription as string
          )) as any

          const invPeriodStart = stripeSubscription.current_period_start
            ?? stripeSubscription.items?.data?.[0]?.current_period_start
          const invPeriodEnd = stripeSubscription.current_period_end
            ?? stripeSubscription.items?.data?.[0]?.current_period_end

          // Update subscription period
          await updateSubscriptionPeriod(
            stripeSubscription.id,
            toISOString(invPeriodStart),
            toISOString(invPeriodEnd),
            context as any
          )
          console.log(
            `Subscription ${stripeSubscription.id} period extended to ${toISOString(invPeriodEnd)}`
          )
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any

        if (invoice.subscription) {
          // Sync raw status (should be past_due)
          const stripeSubscription = (await stripe.subscriptions.retrieve(
            invoice.subscription as string
          )) as any

          await updateSubscriptionStatus(
            stripeSubscription.id,
            stripeSubscription.status,
            context as any
          )

          const user = await getUserByStripeCustomerId(
            invoice.customer as string,
            context as any
          )
          if (user) {
            await updateUserSubscriptionStatus(
              user.id,
              stripeSubscription.status,
              context as any
            )
            console.log(
              `Payment failed for user ${user.id}, subscription set to ${stripeSubscription.status}`
            )
          }
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    // Record event as processed (idempotency guard)
    await recordWebhookEvent(event.id, event.type, context as any)

    return json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    )
  }
}

// Reject GET requests
export async function loader() {
  return json({ error: 'Method not allowed' }, { status: 405 })
}
