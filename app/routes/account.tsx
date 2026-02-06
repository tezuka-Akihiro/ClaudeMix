/**
 * account.tsx - Parent Route for Account Section
 * Purpose: Authentication guard and layout provider for /account routes
 *
 * @layer UI層 (routes)
 * @responsibility 認証保護、レイアウト提供、セッション管理
 */

import type { LoaderFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Outlet, useLoaderData } from '@remix-run/react';
import { getSession } from '~/data-io/account/common/getSession.server';
import { getUserById } from '~/data-io/account/common/getUserById.server';
import { isSessionExpired } from '~/lib/account/common/isSessionExpired';
import { getActiveNavItem } from '~/lib/account/common/getActiveNavItem';
import AccountLayout from '~/components/account/common/AccountLayout';
import type { NavItem } from '~/specs/account/types';
import { loadSpec } from '~/spec-loader/specLoader.server';
import type { AccountCommonSpec } from '~/specs/account/types';

// Import CSS (Layer 2: Common components)
import '~/styles/account/layer2-common.css';

/**
 * Loader: Authentication guard and data provider
 *
 * Flow:
 * 1. Get session from cookie
 * 2. Validate session (exists and not expired)
 * 3. Get user data from database
 * 4. Redirect to /login if any check fails
 * 5. Return user and navigation data if authenticated
 */
export async function loader({ request, context }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const redirectUrl = url.pathname + url.search;

  // Load common spec
  const commonSpec = loadSpec<AccountCommonSpec>('account/common');
  const loginPath = commonSpec.redirect.login_path;
  const redirectParam = commonSpec.redirect.query_param_name;

  // Get session from cookie
  const session = await getSession(request, context as any);

  // Check if session exists
  if (!session) {
    return redirect(`${loginPath}?${redirectParam}=${encodeURIComponent(redirectUrl)}`);
  }

  // Check if session is expired
  if (isSessionExpired(session.expiresAt)) {
    return redirect(`${loginPath}?${redirectParam}=${encodeURIComponent(redirectUrl)}`);
  }

  // Get user data
  const user = await getUserById(session.userId, context as any);

  // Check if user exists
  if (!user) {
    return redirect(`${loginPath}?${redirectParam}=${encodeURIComponent(redirectUrl)}`);
  }

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
 *
 * Renders nested routes with authentication context
 */
export default function Account() {
  const { user, navItems, activeNavItem } = useLoaderData<typeof loader>();

  return (
    <AccountLayout user={user} navItems={navItems} activeNavItem={activeNavItem}>
      <Outlet />
    </AccountLayout>
  );
}
