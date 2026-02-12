/**
 * account.settings.tsx
 * Purpose: User profile settings page
 *
 * @layer UI層 (routes)
 * @responsibility ユーザープロフィール設定の表示と更新
 */

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';
import { useActionData, useRouteLoaderData, useLoaderData } from '@remix-run/react';
import { useState, useEffect } from 'react';
import type { loader as accountLoader } from './account';

// CSS imports
import '~/styles/account/layer2-common.css';
import '~/styles/account/layer2-profile.css';

// Data-IO layer
import { loadAccountSettingsData } from '~/data-io/account/profile/loadAccountSettingsData.server';
import { handleAccountSettingsAction } from '~/data-io/account/profile/accountSettingsHandlers.server';

// Types
import type { ActionData } from './account.settings.types';

// UI Components
import { ProfileDisplay } from '~/components/account/profile/ProfileDisplay';
import { EmailChangeModal } from '~/components/account/profile/EmailChangeModal';
import { PasswordChangeModal } from '~/components/account/profile/PasswordChangeModal';
import { DeleteAccountModal } from '~/components/account/profile/DeleteAccountModal';

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const projectName = data?.projectName || 'ClaudeMix';
  return [
    { title: `設定 - ${projectName}` },
    { name: 'description', content: 'アカウント設定' },
  ];
};

/**
 * Loader: Provide UI spec and subscription data to client
 */
export async function loader({ request, context }: LoaderFunctionArgs) {
  const data = await loadAccountSettingsData(request, context as any);
  return json(data);
}

/**
 * Action: Handle profile update actions
 */
export async function action({ request, context }: ActionFunctionArgs) {
  return handleAccountSettingsAction(request, context as any);
}

export default function AccountSettings() {
  const parentData = useRouteLoaderData<typeof accountLoader>('routes/account');

  if (!parentData) {
    throw new Error('Parent route data not found');
  }

  const { user } = parentData;
  const actionData = useActionData<ActionData>();
  const loaderData = useLoaderData<typeof loader>();
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  if (!loaderData) {
    throw new Error('Loader data not found');
  }

  // Close modals only on successful submission
  useEffect(() => {
    if (actionData?.success) {
      setEmailModalOpen(false);
      setPasswordModalOpen(false);
      setDeleteModalOpen(false);
    }
  }, [actionData?.success]);

  return (
    <div className="profile-container profile-container-structure" data-testid="profile-display">
      <h1>アカウント設定</h1>

      {actionData?.success && (
        <div className="profile-success" role="alert" data-testid="success-message">
          {actionData.success}
        </div>
      )}

      <ProfileDisplay
        user={user}
        subscription={loaderData.subscription}
        spec={loaderData.profileSpec}
        onEmailChange={() => setEmailModalOpen(true)}
        onPasswordChange={() => setPasswordModalOpen(true)}
        onDeleteAccount={() => setDeleteModalOpen(true)}
      />

      <EmailChangeModal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        spec={loaderData.emailChangeSpec}
        error={actionData?.error}
        errors={actionData?.fieldErrors}
      />

      <PasswordChangeModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        spec={loaderData.passwordChangeSpec}
        error={actionData?.error}
        errors={actionData?.fieldErrors}
      />

      <DeleteAccountModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        spec={loaderData.deleteAccountSpec}
        error={actionData?.error}
        errors={actionData?.fieldErrors}
      />
    </div>
  );
}
