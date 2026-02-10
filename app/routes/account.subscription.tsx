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
import { useEffect } from 'react';
import type { loader as accountLoader } from './account';
import { validateSubscriptionChange } from '~/lib/account/subscription/validateSubscriptionChange';
import { updateUserSubscriptionStatus } from '~/data-io/account/subscription/updateUserSubscriptionStatus.server';
import { createStripeCheckoutSession } from '~/data-io/account/subscription/createStripeCheckoutSession.server';
import { getSession } from '~/data-io/account/common/getSession.server';
import { getUserById } from '~/data-io/account/common/getUserById.server';
import { getSubscriptionByUserId } from '~/data-io/account/subscription/getSubscriptionByUserId.server';
import type { SubscriptionStatus } from '~/specs/account/types';
import { loadSpec, loadSharedSpec } from '~/spec-utils/specLoader.server';
import type { AccountSubscriptionSpec } from '~/specs/account/types';
import type { ProjectSpec } from '~/specs/shared/types';

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

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const projectName = data?.projectName || 'ClaudeMix';
  const pageTitle = data?.pageTitle || 'サブスクリプション管理';
  return [
    { title: `${pageTitle} - ${projectName}` },
    { name: 'description', content: pageTitle },
  ];
};

/**
 * Loader: Return available plans and current subscription
 */
export async function loader({ request, context }: LoaderFunctionArgs) {
  // Get session
  const sessionData = await getSession(request, context as any);
  if (!sessionData) {
    return redirect('/login');
  }

  // specからプラン情報を取得
  const PLANS = getPlansFromSpec();
  const spec = loadSpec<AccountSubscriptionSpec>('account/subscription');
  const projectSpec = loadSharedSpec<ProjectSpec>('project');

  // Get enabled plans
  const plans = Object.values(PLANS).filter(plan => plan.enabled);

  // Get current subscription details
  const subscription = await getSubscriptionByUserId(sessionData.userId, context as any);

  // Check for success message
  const url = new URL(request.url);
  const success = url.searchParams.get('success') === 'true';

  return json({
    projectName: projectSpec.project.name,
    pageTitle: spec.routes.subscription.title,
    plans,
    subscription,
    success,
    successMessage: spec.success_messages.checkout.completed,
    submitButtonLabel: spec.forms.create_checkout.submit_button.label,
    loadingLabel: spec.forms.create_checkout.submit_button.loading_label,
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

      return json({ checkoutUrl });
    } catch (error) {
      console.error('Error creating checkout session:', error);
      return json({ error: spec.error_messages.checkout.session_creation_failed }, { status: 500 });
    }
  }

  // Handle subscription status changes (upgrade/cancel)
  const newStatus = formData.get('newStatus') as 'active' | 'inactive';
  const currentStatus = user.subscriptionStatus as SubscriptionStatus;

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
  const { pageTitle, plans, subscription, success, successMessage, submitButtonLabel, loadingLabel } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();

  if (!parentData) {
    throw new Error('Parent route data not found');
  }

  const { user } = parentData;
  const isInterrupted = subscription?.status === 'active' && !!subscription?.canceledAt;

  // Stripe Checkout への外部遷移（fetcherは外部URLへのredirectを処理できないため）
  useEffect(() => {
    if (fetcher.data && 'checkoutUrl' in fetcher.data && fetcher.data.checkoutUrl) {
      window.location.href = fetcher.data.checkoutUrl;
    }
  }, [fetcher.data]);

  const handleSelectPlan = (planId: string) => {
    fetcher.submit(
      { intent: 'create-checkout', planId },
      { method: 'post' }
    );
  };

  return (
    <div className="profile-container profile-container-structure" data-testid="subscription-page">
      <h1>{pageTitle}</h1>

      {success && (
        <div className="profile-success" role="status" data-testid="subscription-success">
          {successMessage}
        </div>
      )}

      {fetcher.data && 'error' in fetcher.data && fetcher.data.error && (
        <div className="profile-error" role="alert">{fetcher.data.error}</div>
      )}

      {/* 決済エラー時の通知（past_due時） */}
      {subscription?.status === 'past_due' && (
        <div className="profile-error mb-6" role="alert">
          決済エラーが発生しました。アカウント設定から支払い情報を更新してください。
        </div>
      )}

      {/* Plan Selection Section */}
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
                  disabled={fetcher.state !== 'idle' || isInterrupted || subscription?.planId === plan.id}
                  title={isInterrupted ? 'プラン変更を行うには、まず更新を再開してください' : ''}
                  data-testid={`subscribe-${plan.id}`}
                >
                  {fetcher.state !== 'idle' ? loadingLabel : subscription?.planId === plan.id ? '契約中' : submitButtonLabel}
                </button>
                {isInterrupted && (
                  <p className="text-sm text-red-500 mt-2 text-center">
                    プラン変更を行うには、まず更新を再開してください
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
    </div>
  );
}
