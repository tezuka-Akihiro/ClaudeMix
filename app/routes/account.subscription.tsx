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
import { loadSpec } from '~/spec-loader/specLoader.server';
import type { AccountSubscriptionSpec } from '~/specs/account/types';

// Plan型定義（specから取得したプランをUIで使用するための型）
interface PlanForUI {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  currency: string;
  interval: 'month' | 'year';
  intervalCount: number;
  stripePriceId: string;
  features: string[];
  discountRate: number;
  badge?: string | null;
  enabled: boolean;
}

/**
 * specからプラン情報を取得してUI用に変換
 */
function getPlansFromSpec(): Record<string, PlanForUI> {
  const spec = loadSpec<AccountSubscriptionSpec>('account/subscription');
  const plans: Record<string, PlanForUI> = {};

  for (const [key, plan] of Object.entries(spec.plans)) {
    plans[key] = {
      id: plan.id,
      name: plan.name,
      description: plan.description,
      price: plan.price,
      originalPrice: plan.original_price,
      currency: plan.currency,
      interval: plan.interval as 'month' | 'year',
      intervalCount: plan.interval_count,
      stripePriceId: plan.stripe_price_id,
      features: plan.features,
      discountRate: plan.discount_rate,
      badge: plan.badge ?? null,
      enabled: plan.enabled,
    };
  }

  return plans;
}

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
  // specからプラン情報を取得
  const PLANS = getPlansFromSpec();
  const spec = loadSpec<AccountSubscriptionSpec>('account/subscription');

  // Get enabled plans
  const plans = Object.values(PLANS).filter(plan => plan.enabled);

  // Check for success message
  const url = new URL(request.url);
  const success = url.searchParams.get('success') === 'true';

  return json({
    plans,
    success,
    successMessage: spec.success_messages.checkout.completed,
  });
}

/**
 * Handle subscription actions
 */
export async function action({ request, context }: ActionFunctionArgs) {
  // specからプラン情報とエラーメッセージを取得
  const PLANS = getPlansFromSpec();
  const spec = loadSpec<AccountSubscriptionSpec>('account/subscription');

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
    const plan = PLANS[planId];

    if (!plan) {
      return json({ error: spec.error_messages.checkout.invalid_plan }, { status: 400 });
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
          successUrl: `${baseUrl}${spec.routes.success_redirect.path}`,
          cancelUrl: `${baseUrl}${spec.routes.cancel_redirect.path}`,
        },
        context as any
      );

      return redirect(checkoutUrl);
    } catch (error) {
      console.error('Error creating checkout session:', error);
      return json({ error: spec.error_messages.checkout.session_creation_failed }, { status: 500 });
    }
  }

  // Handle subscription status changes (upgrade/cancel)
  const newStatus = formData.get('newStatus') as 'active' | 'inactive';
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
    return json({ error: spec.error_messages.server.internal_error }, { status: 500 });
  }
}

export default function AccountSubscription() {
  // Use parent route's authentication data instead of duplicating auth logic
  const parentData = useRouteLoaderData<typeof accountLoader>('routes/account');
  const { plans, success, successMessage } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();

  if (!parentData) {
    throw new Error('Parent route data not found');
  }

  const { user } = parentData;
  const isActive = user.subscriptionStatus === 'active';

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
          {successMessage}
        </div>
      )}

      {fetcher.data?.error && (
        <div className="profile-error" role="alert">{fetcher.data.error}</div>
      )}

      <SubscriptionStatusCard
        status={user.subscriptionStatus}
        onCancel={handleCancel}
      />

      {/* Plan Selection Section (show only for inactive users) */}
      {!isActive && (
        <div data-testid="plan-selector">
          <h2 className="profile-section__title">プランを選択</h2>
          <div className="plan-grid">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`plan-card${plan.badge ? ' plan-card--recommended' : ''}`}
                data-testid={`plan-card-${plan.id}`}
              >
                {plan.badge && (
                  <span className="plan-badge">{plan.badge}</span>
                )}
                <h3 className="plan-name">{plan.name}</h3>
                <div className="plan-price">
                  {'originalPrice' in plan && plan.originalPrice && (
                    <span className="plan-price__original">¥{plan.originalPrice.toLocaleString()}</span>
                  )}
                  <span className="plan-price__amount">¥{plan.price.toLocaleString()}</span>
                  <span className="plan-price__interval">
                    /{plan.interval === 'month' ? '月' : '年'}
                  </span>
                </div>
                <p className="plan-description">{plan.description}</p>
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
                  {fetcher.state !== 'idle' ? '処理中...' : '購入'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
