/**
 * account.subscription.tsx
 * Purpose: User subscription management page
 *
 * @layer UI層 (routes)
 * @responsibility サブスクリプション管理画面の表示
 */

import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/cloudflare';
import { json, redirect } from '@remix-run/cloudflare';
import { useLoaderData } from '@remix-run/react';

// Data-IO layer
import { getSession } from '~/data-io/account/common/getSession.server';
import { getUserById } from '~/data-io/account/common/getUserById.server';

export const meta: MetaFunction = () => {
  return [
    { title: 'サブスクリプション - ClaudeMix' },
    { name: 'description', content: 'サブスクリプション管理' },
  ];
};

/**
 * Loader: Fetch user subscription data
 */
export async function loader({ request, context }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const redirectUrl = url.pathname + url.search;

  const session = await getSession(request, context as any);
  if (!session) {
    return redirect(`/login?redirect-url=${encodeURIComponent(redirectUrl)}`);
  }

  const user = await getUserById(session.userId, context as any);
  if (!user) {
    return redirect(`/login?redirect-url=${encodeURIComponent(redirectUrl)}`);
  }

  return json({ user });
}

export default function AccountSubscription() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <div className="subscription-container" data-testid="subscription-page">
      <h1>サブスクリプション</h1>
      <p>現在のプラン: {user.subscriptionStatus}</p>
      <p>このページは実装中です。</p>
    </div>
  );
}
