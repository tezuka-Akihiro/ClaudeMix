/**
 * account.subscription.tsx
 * Purpose: User subscription management page
 *
 * @layer UI層 (routes)
 * @responsibility サブスクリプション管理画面の表示
 */

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/cloudflare';
import { json, redirect } from '@remix-run/cloudflare';
import { useRouteLoaderData, useLoaderData, useFetcher } from '@remix-run/react';
import type { loader as accountLoader } from './account';
import { SubscriptionStatusCard } from '~/components/account/subscription/SubscriptionStatusCard';
import { validateSubscriptionChange } from '~/lib/account/subscription/validateSubscriptionChange';
import { updateUserSubscriptionStatus } from '~/data-io/account/subscription/updateUserSubscriptionStatus.server';
import { createStripeCheckoutSession } from '~/data-io/account/subscription/createStripeCheckoutSession.server';
import { getSession } from '~/data-io/account/common/getSession.server';
import { getUserById } from '~/data-io/account/common/getUserById.server';

// Plan definitions (from subscription-spec.yaml)
const PLANS = {
  standard: {
    id: 'standard',
    name: 'スタンダード',
    description: '気軽な入り口。',
    price: 980,
    currency: 'JPY',
    interval: 'month' as const,
    intervalCount: 1,
    stripePriceId: process.env.STRIPE_PRICE_STANDARD || 'price_standard_placeholder',
    features: ['全記事閲覧', '広告非表示'],
    discountRate: 0,
    enabled: true,
  },
  supporter: {
    id: 'supporter',
    name: 'サポーター',
    description: 'コア層向け。2ヶ月分を割引。',
    price: 9800,
    originalPrice: 11760,
    currency: 'JPY',
    interval: 'year' as const,
    intervalCount: 1,
    stripePriceId: process.env.STRIPE_PRICE_SUPPORTER || 'price_supporter_placeholder',
    features: ['全記事閲覧', '広告非表示', '2ヶ月分お得'],
    discountRate: 17,
    badge: 'おすすめ',
    enabled: true,
  },
} as const;

// CSS imports
import '~/styles/account/layer2-common.css';
import '~/styles/account/layer2-profile.css';
import '~/styles/account/layer2-subscription.css';

export const meta: MetaFunction = () => {
  return [
    { title: 'サブスクリプション - ClaudeMix' },
    { name: 'description', content: 'サブスクリプション管理' },
  ];
};

/**
 * Loader: Return available plans
 */
export async function loader({ request }: LoaderFunctionArgs) {
  // Get enabled plans
  const plans = Object.values(PLANS).filter(plan => plan.enabled);

  // Check for success message
  const url = new URL(request.url);
  const success = url.searchParams.get('success') === 'true';

  return json({ plans, success });
}

/**
 * Handle subscription actions
 */
export async function action({ request, context }: ActionFunctionArgs) {
  // Get session
  const sessionData = await getSession(request, context as any);
  if (!sessionData) {
    return redirect('/login');
  }

  // Parse form data
  const formData = await request.formData();
  const intent = formData.get('intent') as string;

  // Get current user
  const user = await getUserById(sessionData.userId, context as any);
  if (!user) {
    return redirect('/login');
  }

  // Handle create-checkout intent
  if (intent === 'create-checkout') {
    const planId = formData.get('planId') as string;
    const plan = PLANS[planId as keyof typeof PLANS];

    if (!plan) {
      return json({ error: '無効なプランが選択されています' }, { status: 400 });
    }

    try {
      const url = new URL(request.url);
      const baseUrl = `${url.protocol}//${url.host}`;

      const checkoutUrl = await createStripeCheckoutSession(
        {
          userId: sessionData.userId,
          userEmail: user.email,
          planId: plan.id,
          stripePriceId: plan.stripePriceId,
          successUrl: `${baseUrl}/account/subscription?success=true`,
          cancelUrl: `${baseUrl}/account/subscription`,
        },
        context as any
      );

      return redirect(checkoutUrl);
    } catch (error) {
      console.error('Error creating checkout session:', error);
      return json({ error: 'Stripe決済画面の作成に失敗しました' }, { status: 500 });
    }
  }

  // Handle subscription status changes (upgrade/cancel)
  const newStatus = formData.get('newStatus') as 'active' | 'inactive' | 'trial';
  const currentStatus = user.subscriptionStatus;

  // Validate subscription change
  const validation = validateSubscriptionChange({
    currentStatus,
    newStatus,
  });

  if (!validation.valid) {
    return json({ error: validation.error }, { status: 400 });
  }

  // Update subscription status
  try {
    await updateUserSubscriptionStatus(sessionData.userId, newStatus, context as any);
    return redirect('/account/subscription');
  } catch (error) {
    console.error('Error updating subscription:', error);
    return json({ error: 'サブスクリプションの更新に失敗しました' }, { status: 500 });
  }
}

export default function AccountSubscription() {
  // Use parent route's authentication data instead of duplicating auth logic
  const parentData = useRouteLoaderData<typeof accountLoader>('routes/account');
  const { plans, success } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();

  if (!parentData) {
    throw new Error('Parent route data not found');
  }

  const { user } = parentData;
  const isActive = user.subscriptionStatus === 'active';

  const handleUpgrade = () => {
    fetcher.submit(
      { intent: 'upgrade', newStatus: 'trial' },
      { method: 'post' }
    );
  };

  const handleCancel = () => {
    fetcher.submit(
      { intent: 'cancel', newStatus: 'inactive' },
      { method: 'post' }
    );
  };

  const handleSelectPlan = (planId: string) => {
    fetcher.submit(
      { intent: 'create-checkout', planId },
      { method: 'post' }
    );
  };

  return (
    <div className="profile-container profile-container-structure" data-testid="subscription-page">
      <h1>サブスクリプション</h1>

      {success && (
        <div className="profile-success" role="status" data-testid="subscription-success">
          サブスクリプションの購読が完了しました。ご利用ありがとうございます。
        </div>
      )}

      {fetcher.data?.error && (
        <div className="profile-error" role="alert">{fetcher.data.error}</div>
      )}

      <SubscriptionStatusCard
        status={user.subscriptionStatus}
        onUpgrade={handleUpgrade}
        onCancel={handleCancel}
      />

      {/* Plan Selection Section (show only for inactive users) */}
      {!isActive && (
        <div className="profile-section profile-section-structure" data-testid="plan-selector">
          <h2 className="profile-section__title">プランを選択</h2>
          <div className="plan-grid">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="plan-card"
                data-testid={`plan-card-${plan.id}`}
              >
                {plan.badge && (
                  <span className="plan-badge">{plan.badge}</span>
                )}
                <h3 className="plan-name">{plan.name}</h3>
                <p className="plan-description">{plan.description}</p>
                <div className="plan-price">
                  <span className="plan-price__amount">¥{plan.price.toLocaleString()}</span>
                  <span className="plan-price__interval">
                    /{plan.interval === 'month' ? '月' : '年'}
                  </span>
                </div>
                {plan.originalPrice && (
                  <p className="plan-original-price">
                    通常 ¥{plan.originalPrice.toLocaleString()}
                  </p>
                )}
                <ul className="plan-features">
                  {plan.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => handleSelectPlan(plan.id)}
                  className="btn-primary plan-select-button"
                  disabled={fetcher.state !== 'idle'}
                  data-testid={`subscribe-${plan.id}`}
                >
                  {fetcher.state !== 'idle' ? '処理中...' : '購読する'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
