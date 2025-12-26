/**
 * account.settings.tsx
 * Purpose: User profile settings page
 *
 * @layer UI層 (routes)
 * @responsibility ユーザープロフィール設定の表示と更新
 */

import type { ActionFunctionArgs, MetaFunction } from '@remix-run/cloudflare';
import { json, redirect } from '@remix-run/cloudflare';
import { useActionData, useRouteLoaderData } from '@remix-run/react';
import { useState } from 'react';
import type { loader as accountLoader } from './account';

// CSS imports
import '~/styles/account/layer2-common.css';
import '~/styles/account/layer2-profile.css';

// Data-IO layer
import { deleteUser } from '~/data-io/account/profile/deleteUser.server';
import { updateUserEmail } from '~/data-io/account/profile/updateUserEmail.server';
import { updateUserPassword } from '~/data-io/account/profile/updateUserPassword.server';
import { getUserByEmail } from '~/data-io/account/authentication/getUserByEmail.server';
import { hashPassword } from '~/data-io/account/authentication/hashPassword.server';
import { verifyPassword } from '~/data-io/account/authentication/verifyPassword.server';
import { getSession } from '~/data-io/account/common/getSession.server';
import { getUserById } from '~/data-io/account/common/getUserById.server';
import { deleteAllUserSessions } from '~/data-io/account/common/deleteAllUserSessions.server';

// Pure logic layer
import { sanitizeEmail } from '~/lib/account/authentication/sanitizeEmail';
import { validateEmail } from '~/lib/account/authentication/validateEmail';
import { validatePassword } from '~/lib/account/authentication/validatePassword';

// UI Components (Phase 3.4)
import { ProfileDisplay } from '~/components/account/profile/ProfileDisplay';
import { EmailChangeModal } from '~/components/account/profile/EmailChangeModal';
import { PasswordChangeModal } from '~/components/account/profile/PasswordChangeModal';
import { DeleteAccountModal } from '~/components/account/profile/DeleteAccountModal';

// Database User type (includes passwordHash)
interface DatabaseUser {
  id: string;
  email: string;
  passwordHash: string;
  subscriptionStatus: 'active' | 'inactive' | 'trial';
  createdAt: string;
  updatedAt: string;
}

export const meta: MetaFunction = () => {
  return [
    { title: '設定 - ClaudeMix' },
    { name: 'description', content: 'アカウント設定' },
  ];
};

interface ActionData {
  success?: string;
  error?: string;
  fieldErrors?: {
    newEmail?: string;
    currentPassword?: string;
    newPassword?: string;
    newPasswordConfirm?: string;
    confirmation?: string;
  };
}

/**
 * Minimal loader to enable client-side navigation
 * (actual auth data comes from parent route)
 */
export async function loader() {
  return json({});
}

/**
 * Action: Handle profile update actions
 */
export async function action({ request, context }: ActionFunctionArgs) {
  const session = await getSession(request, context as any);
  if (!session) {
    return redirect('/login');
  }

  const formData = await request.formData();
  const intent = formData.get('intent');

  // Get current user with passwordHash for verification
  const currentUser = (await getUserById(session.userId, context as any)) as DatabaseUser | null;
  if (!currentUser) {
    return json<ActionData>({ error: 'ユーザーが見つかりません' }, { status: 404 });
  }

  // Handle email change
  if (intent === 'email-change') {
    const newEmail = formData.get('newEmail');
    const currentPassword = formData.get('currentPassword');

    const fieldErrors: ActionData['fieldErrors'] = {};

    // Validation
    if (typeof newEmail !== 'string' || !newEmail) {
      fieldErrors.newEmail = 'メールアドレスを入力してください';
    } else if (!validateEmail(newEmail)) {
      fieldErrors.newEmail = '有効なメールアドレスを入力してください';
    }

    if (typeof currentPassword !== 'string' || !currentPassword) {
      fieldErrors.currentPassword = 'パスワードを入力してください';
    }

    if (Object.keys(fieldErrors).length > 0) {
      return json<ActionData>({ fieldErrors }, { status: 400 });
    }

    // Verify current password
    const isPasswordValid = await verifyPassword(currentPassword as string, currentUser.passwordHash);
    if (!isPasswordValid) {
      return json<ActionData>(
        { error: 'パスワードが正しくありません' },
        { status: 401 }
      );
    }

    // Sanitize and check for duplicates
    const sanitizedEmail = sanitizeEmail(newEmail);
    if (sanitizedEmail === currentUser.email) {
      return json<ActionData>(
        { error: '現在のメールアドレスと同じです' },
        { status: 400 }
      );
    }

    const existingUser = await getUserByEmail(sanitizedEmail, context as any);
    if (existingUser) {
      return json<ActionData>(
        { error: 'このメールアドレスは既に登録されています' },
        { status: 400 }
      );
    }

    // Update email
    const emailUpdated = await updateUserEmail(session.userId, sanitizedEmail, context as any);
    if (!emailUpdated) {
      return json<ActionData>(
        { error: 'メールアドレスの更新に失敗しました' },
        { status: 500 }
      );
    }

    return json<ActionData>({ success: 'メールアドレスを更新しました' });
  }

  // Handle password change
  if (intent === 'password-change') {
    const currentPassword = formData.get('currentPassword');
    const newPassword = formData.get('newPassword');
    const newPasswordConfirm = formData.get('newPasswordConfirm');

    const fieldErrors: ActionData['fieldErrors'] = {};

    // Validation
    if (typeof currentPassword !== 'string' || !currentPassword) {
      fieldErrors.currentPassword = '現在のパスワードを入力してください';
    }

    if (typeof newPassword !== 'string' || !newPassword) {
      fieldErrors.newPassword = '新しいパスワードを入力してください';
    } else if (!validatePassword(newPassword)) {
      fieldErrors.newPassword = 'パスワードは8文字以上、128文字以下で入力してください';
    }

    if (typeof newPasswordConfirm !== 'string' || !newPasswordConfirm) {
      fieldErrors.newPasswordConfirm = 'パスワード（確認）を入力してください';
    } else if (newPassword !== newPasswordConfirm) {
      fieldErrors.newPasswordConfirm = 'パスワードが一致しません';
    }

    if (Object.keys(fieldErrors).length > 0) {
      return json<ActionData>({ fieldErrors }, { status: 400 });
    }

    // Verify current password
    const isPasswordValid = await verifyPassword(currentPassword as string, currentUser.passwordHash);
    if (!isPasswordValid) {
      return json<ActionData>(
        { error: '現在のパスワードが正しくありません' },
        { status: 401 }
      );
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword as string);

    // Update password
    const passwordUpdated = await updateUserPassword(session.userId, newPasswordHash, context as any);
    if (!passwordUpdated) {
      return json<ActionData>(
        { error: 'パスワードの更新に失敗しました' },
        { status: 500 }
      );
    }

    return json<ActionData>({ success: 'パスワードを更新しました' });
  }

  // Handle account deletion
  if (intent === 'delete-account') {
    const currentPassword = formData.get('currentPassword');
    const confirmation = formData.get('confirmation');

    const fieldErrors: ActionData['fieldErrors'] = {};

    // Validation
    if (typeof currentPassword !== 'string' || !currentPassword) {
      fieldErrors.currentPassword = 'パスワードを入力してください';
    }

    if (confirmation !== 'true') {
      fieldErrors.confirmation = '削除を確認してください';
    }

    if (Object.keys(fieldErrors).length > 0) {
      return json<ActionData>({ fieldErrors }, { status: 400 });
    }

    // Verify current password
    const isPasswordValid = await verifyPassword(currentPassword as string, currentUser.passwordHash);
    if (!isPasswordValid) {
      return json<ActionData>(
        { error: 'パスワードが正しくありません' },
        { status: 401 }
      );
    }

    // Delete all user sessions
    await deleteAllUserSessions(session.userId, context as any);

    // Delete user
    const userDeleted = await deleteUser(session.userId, context as any);
    if (!userDeleted) {
      return json<ActionData>(
        { error: 'アカウントの削除に失敗しました' },
        { status: 500 }
      );
    }

    // Redirect to login with cleared session cookie
    return redirect('/login', {
      headers: {
        'Set-Cookie': 'sessionId=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0',
      },
    });
  }

  return json<ActionData>({ error: '不正なリクエストです' }, { status: 400 });
}

export default function AccountSettings() {
  // Use parent route's authentication data instead of duplicating auth logic
  const parentData = useRouteLoaderData<typeof accountLoader>('routes/account');

  if (!parentData) {
    throw new Error('Parent route data not found');
  }

  const { user } = parentData;
  const actionData = useActionData<typeof action>();
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  return (
    <div className="profile-container profile-container-structure" data-testid="profile-display">
      <h1>アカウント設定</h1>

      {actionData?.success && (
        <div className="profile-success" role="alert" data-testid="success-message">
          {actionData.success}
        </div>
      )}

      {actionData?.error && (
        <div className="profile-error" role="alert" data-testid="error-message">
          {actionData.error}
        </div>
      )}

      <ProfileDisplay
        user={user}
        onEmailChange={() => setEmailModalOpen(true)}
        onPasswordChange={() => setPasswordModalOpen(true)}
        onDeleteAccount={() => setDeleteModalOpen(true)}
      />

      <EmailChangeModal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        errors={actionData?.fieldErrors}
      />

      <PasswordChangeModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        errors={actionData?.fieldErrors}
      />

      <DeleteAccountModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        errors={actionData?.fieldErrors}
      />
    </div>
  );
}
