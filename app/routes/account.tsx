/**
 * account.tsx - Parent Route for Account Section
 * Purpose: Authentication guard and layout provider for /account routes
 *
 * @layer UI層 (routes)
 * @responsibility 認証保護、レイアウト提供、セッション管理
 */

import type { LoaderFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';
import { Outlet, useLoaderData } from '@remix-run/react';
import { getAuthenticator } from '~/data-io/account/common/authenticator.server';
import { getActiveNavItem } from '~/lib/account/common/getActiveNavItem';
import AccountLayout from '~/components/account/common/AccountLayout';
import type { NavItem } from '~/specs/account/types';
import { loadSpec } from '~/spec-loader/specLoader.server';
import type { AccountCommonSpec } from '~/specs/account/types';

// Import CSS (Layer 2: Common components)
import '~/styles/account/layer2-common.css';

/**
 * Loader: Authentication guard and data provider
 */
export async function loader({ request, context }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const redirectUrl = url.pathname + url.search;

  const authenticator = getAuthenticator(context as any);

  // Use authenticator to check if user is logged in
  const user = await authenticator.isAuthenticated(request, {
    failureRedirect: `/login?redirect-url=${encodeURIComponent(redirectUrl)}`,
  });

  // Load common spec
  const commonSpec = loadSpec<AccountCommonSpec>('account/common');

  // Navigation items (from common-spec.yaml)
  const navItems: NavItem[] = commonSpec.navigation.menu_items;

  // Determine active navigation item
  const activeNavItem = getActiveNavItem(navItems, url.pathname);

  return json({
    user,
    navItems,
    activeNavItem,
    services: commonSpec.services,
  });
}

/**
 * Account Parent Route Component
 */
export default function Account() {
  const { user, navItems, activeNavItem } = useLoaderData<typeof loader>();

  return (
    <AccountLayout user={user} navItems={navItems} activeNavItem={activeNavItem}>
      <Outlet />
    </AccountLayout>
  );
}
