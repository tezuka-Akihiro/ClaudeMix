/**
 * account._index.tsx - Account Index Page (マイページ)
 * Purpose: Display user's account overview
 *
 * @layer UI層 (routes)
 * @responsibility アカウント概要の表示
 */

import type { MetaFunction } from '@remix-run/node';

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
  return (
    <div>
      <h2>マイページ</h2>
      <p>Welcome to your account page.</p>
    </div>
  );
}
