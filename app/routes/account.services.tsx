/**
 * account.services.tsx
 * Purpose: Services list page
 *
 * @layer UI層 (routes)
 * @responsibility サービス一覧の表示
 */

import type { MetaFunction } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';
import { Link, useRouteLoaderData } from '@remix-run/react';
import type { loader as accountLoader } from './account';

// CSS imports
import '~/styles/account/layer2-common.css';
import '~/styles/account/layer2-profile.css';

export const meta: MetaFunction = () => {
  return [
    { title: 'サービス一覧 - ClaudeMix' },
    { name: 'description', content: 'サービス一覧' },
  ];
};

/**
 * Minimal loader to enable client-side navigation
 * (actual data comes from parent route)
 */
export async function loader() {
  return json({});
}

export default function AccountServices() {
  const parentData = useRouteLoaderData<typeof accountLoader>('routes/account');

  if (!parentData) {
    throw new Error('Parent route data not found');
  }

  const { services } = parentData;

  return (
    <div className="profile-container profile-container-structure" data-testid="services-page">
      <h1>サービス一覧</h1>

      <div className="profile-section profile-section-structure">
        <h2 className="profile-section__title">利用可能なサービス</h2>
        <div className="flex flex-col gap-4">
          {services.items.map((service) => (
            <Link
              key={service.path}
              to={service.path}
              className="btn-primary inline-block text-center"
              data-testid="service-link"
            >
              {service.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
