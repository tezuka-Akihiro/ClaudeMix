/**
 * account._index.tsx - Account Index Page (マイページ)
 * Purpose: Display user's account overview
 *
 * @layer UI層 (routes)
 * @responsibility アカウント概要の表示
 */

import type { MetaFunction, LinksFunction } from '@remix-run/node';
import { Form, useRouteLoaderData } from '@remix-run/react';
import type { loader as accountLoader } from './account';

// CSS imports (LinksFunction for SSR)
import accountCommonStyles from '~/styles/account/layer2-common.css?url';
import profileStyles from '~/styles/account/layer2-profile.css?url';

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: accountCommonStyles },
  { rel: "stylesheet", href: profileStyles },
];

export const meta: MetaFunction = () => {
  return [
    { title: 'マイページ - Account' },
    {
      name: 'description',
      content: 'Your account overview and dashboard',
    },
  ];
};

/**
 * Account Index Page Component
 *
 * Displays user's account overview
 * Data is provided by parent route (account.tsx)
 */
export default function AccountIndex() {
  const parentData = useRouteLoaderData<typeof accountLoader>('routes/account');

  if (!parentData) {
    throw new Error('Parent route data not found');
  }

  return (
    <div className="profile-container profile-container-structure" data-testid="account-index-page">
      <h1>マイページ</h1>

      {/* Announcements section */}
      <div className="profile-section profile-section-structure">
        <h2 className="profile-section__title">お知らせ</h2>
        <div>
          <p className="profile-info__value">現在お知らせはありません。</p>
        </div>
      </div>

      {/* Account actions section */}
      <div className="profile-section profile-section-structure">
        <h2 className="profile-section__title">アカウント</h2>
        <div>
          <Form method="post" action="/logout">
            <button
              type="submit"
              className="btn-primary"
              data-testid="logout-button"
            >
              ログアウト
            </button>
          </Form>
        </div>
      </div>
    </div>
  );
}
