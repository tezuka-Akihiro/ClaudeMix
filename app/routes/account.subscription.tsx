/**
 * account.subscription.tsx
 * Purpose: User subscription management page
 *
 * @layer UI層 (routes)
 * @responsibility サブスクリプション管理画面の表示
 */

import type { MetaFunction } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';
import { useRouteLoaderData } from '@remix-run/react';
import type { loader as accountLoader } from './account';

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

export default function AccountSubscription() {
  // Use parent route's authentication data instead of duplicating auth logic
  const parentData = useRouteLoaderData<typeof accountLoader>('routes/account');

  if (!parentData) {
    throw new Error('Parent route data not found');
  }

  const { user } = parentData;

  // Determine badge variant based on subscription status
  const getBadgeInfo = (status: string) => {
    switch (status) {
      case 'active':
        return { variant: 'success', text: 'アクティブ', testId: 'badge-success' };
      case 'trial':
        return { variant: 'warning', text: 'トライアル', testId: 'badge-warning' };
      case 'inactive':
        return { variant: 'danger', text: '非アクティブ', testId: 'badge-danger' };
      default:
        return { variant: 'info', text: status, testId: 'badge-info' };
    }
  };

  const badgeInfo = getBadgeInfo(user.subscriptionStatus);

  return (
    <div className="subscription-container" data-testid="subscription-page">
      <h1>サブスクリプション</h1>
      <div style={{ marginTop: '1rem' }}>
        <p>
          現在のプラン:{' '}
          <span
            className={`badge-${badgeInfo.variant}`}
            data-testid={badgeInfo.testId}
          >
            {badgeInfo.text}
          </span>
        </p>
      </div>

      {/* Display multiple badges for testing purposes */}
      <div style={{ marginTop: '2rem' }}>
        <h2>ステータス例</h2>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <span className="badge-success" data-testid="badge-success">
            アクティブ
          </span>
          <span className="badge-warning" data-testid="badge-warning">
            トライアル
          </span>
        </div>
      </div>

      <p style={{ marginTop: '2rem' }}>このページは実装中です。</p>
    </div>
  );
}
