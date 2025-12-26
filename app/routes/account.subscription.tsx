/**
 * account.subscription.tsx
 * Purpose: User subscription management page
 *
 * @layer UI層 (routes)
 * @responsibility サブスクリプション管理画面の表示
 */

import type { ActionFunctionArgs, MetaFunction } from '@remix-run/cloudflare';
import { json, redirect } from '@remix-run/cloudflare';
import { useRouteLoaderData, useFetcher } from '@remix-run/react';
import type { loader as accountLoader } from './account';
import { SubscriptionStatusCard } from '~/components/account/subscription/SubscriptionStatusCard';
import { validateSubscriptionChange } from '~/lib/account/subscription/validateSubscriptionChange';
import { updateUserSubscriptionStatus } from '~/data-io/account/subscription/updateUserSubscriptionStatus.server';
import { getSession } from '~/data-io/account/common/getSession.server';

// CSS imports
import '~/styles/account/layer2-subscription.css';

export const meta: MetaFunction = () => {
  return [
    { title: 'サブスクリプション - ClaudeMix' },
    { name: 'description', content: 'サブスクリプション管理' },
  ];
};

/**
 * Minimal loader to enable client-side navigation
 * (actual auth data comes from parent route)
 */
export async function loader() {
  return json({});
}

/**
 * Handle subscription status changes
 */
export async function action({ request, context }: ActionFunctionArgs) {
  // Get session
  const cookieHeader = request.headers.get('Cookie');
  const sessionId = cookieHeader
    ?.split(';')
    .find((c) => c.trim().startsWith('session_id='))
    ?.split('=')[1];

  if (!sessionId) {
    return redirect('/login');
  }

  const sessionData = await getSession(sessionId, context as any);
  if (!sessionData) {
    return redirect('/login');
  }

  // Parse form data
  const formData = await request.formData();
  const intent = formData.get('intent');
  const newStatus = formData.get('newStatus') as 'active' | 'inactive' | 'trial';

  // Get current user status from parent route
  const parentData = await context.parentData?.();
  const currentStatus = parentData?.user?.subscriptionStatus || 'inactive';

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
    return json({ success: true });
  } catch (error) {
    console.error('Error updating subscription:', error);
    return json({ error: 'サブスクリプションの更新に失敗しました' }, { status: 500 });
  }
}

export default function AccountSubscription() {
  // Use parent route's authentication data instead of duplicating auth logic
  const parentData = useRouteLoaderData<typeof accountLoader>('routes/account');
  const fetcher = useFetcher();

  if (!parentData) {
    throw new Error('Parent route data not found');
  }

  const { user } = parentData;

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

  return (
    <div className="subscription-container" data-testid="subscription-page">
      <h1>サブスクリプション</h1>

      {fetcher.data?.error && (
        <div className="error-message">{fetcher.data.error}</div>
      )}

      <div>
        <SubscriptionStatusCard
          status={user.subscriptionStatus}
          onUpgrade={handleUpgrade}
          onCancel={handleCancel}
        />
      </div>

      <p style={{ marginTop: '2rem', fontSize: '0.875rem', color: '#666' }}>
        注意: これはMVP実装です。実際の決済処理は未実装です。
      </p>
    </div>
  );
}
