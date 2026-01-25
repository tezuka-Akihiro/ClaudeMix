/**
 * api.webhooks.stripe.tsx
 * Purpose: Handle Stripe webhooks
 *
 * @layer UI層 (routes)
 * @responsibility Stripeウェブフックの受信と処理
 */

import type { ActionFunctionArgs } from '@remix-run/cloudflare'
import { json } from '@remix-run/cloudflare'
import { verifyStripeWebhook } from '~/data-io/account/subscription/verifyStripeWebhook.server'
import { updateUserSubscriptionStatus } from '~/data-io/account/subscription/updateUserSubscriptionStatus.server'

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

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const userId = session.metadata?.userId

        if (userId) {
          // Activate subscription
          await updateUserSubscriptionStatus(userId, 'active', context as any)
          console.log(`Subscription activated for user ${userId}`)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        const userId = subscription.metadata?.userId

        if (userId) {
          // Mark subscription as canceled
          await updateUserSubscriptionStatus(userId, 'inactive', context as any)
          console.log(`Subscription canceled for user ${userId}`)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object
        console.log(`Payment failed for invoice ${invoice.id}`)
        // TODO: Send notification to user
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

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
