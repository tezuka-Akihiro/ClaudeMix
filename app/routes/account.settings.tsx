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
import { useState, useEffect } from 'react';
import type { loader as accountLoader } from './account';

// CSS imports
import '~/styles/account/layer2-common.css';
import '~/styles/account/layer2-profile.css';

// Spec loader
import { loadSpec } from '~/spec-loader/specLoader.server';
import type { AccountProfileSpec } from '~/specs/account/types';

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
 * Loader: Provide UI spec to client
 * (actual auth data comes from parent route)
 */
export async function loader() {
  const spec = loadSpec<AccountProfileSpec>('account/profile');

  return json({
    profileSpec: {
      sections: spec.profile_display.sections,
    },
    emailChangeSpec: {
      title: spec.forms.email_change.title,
      fields: {
        new_email: {
          label: spec.forms.email_change.fields.new_email.label,
          placeholder: spec.forms.email_change.fields.new_email.placeholder,
        },
        current_password: {
          label: spec.forms.email_change.fields.current_password.label,
          placeholder: spec.forms.email_change.fields.current_password.placeholder,
        },
      },
      submit_button: {
        label: spec.forms.email_change.submit_button.label,
        loading_label: spec.forms.email_change.submit_button.loading_label,
      },
      cancel_button: {
        label: spec.forms.email_change.cancel_button.label,
      },
    },
    passwordChangeSpec: {
      title: spec.forms.password_change.title,
      fields: {
        current_password: {
          label: spec.forms.password_change.fields.current_password.label,
          placeholder: spec.forms.password_change.fields.current_password.placeholder,
        },
        new_password: {
          label: spec.forms.password_change.fields.new_password.label,
          placeholder: spec.forms.password_change.fields.new_password.placeholder,
        },
        new_password_confirm: {
          label: spec.forms.password_change.fields.new_password_confirm.label,
          placeholder: spec.forms.password_change.fields.new_password_confirm.placeholder,
        },
      },
      submit_button: {
        label: spec.forms.password_change.submit_button.label,
        loading_label: spec.forms.password_change.submit_button.loading_label,
      },
      cancel_button: {
        label: spec.forms.password_change.cancel_button.label,
      },
    },
    deleteAccountSpec: {
      title: spec.forms.delete_account.title,
      warning_message: spec.forms.delete_account.warning_message,
      fields: {
        current_password: {
          label: spec.forms.delete_account.fields.current_password.label,
          placeholder: spec.forms.delete_account.fields.current_password.placeholder,
        },
        confirmation: {
          label: spec.forms.delete_account.fields.confirmation.label,
        },
      },
      submit_button: {
        label: spec.forms.delete_account.submit_button.label,
        loading_label: spec.forms.delete_account.submit_button.loading_label,
      },
      cancel_button: {
        label: spec.forms.delete_account.cancel_button.label,
      },
    },
  });
}

/**
 * Action: Handle profile update actions
 */
export async function action({ request, context }: ActionFunctionArgs) {
  const spec = loadSpec<AccountProfileSpec>('account/profile');

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
      fieldErrors.newEmail = spec.validation.new_email.error_messages.required;
    } else if (!validateEmail(newEmail)) {
      fieldErrors.newEmail = spec.validation.new_email.error_messages.invalid_format;
    }

    if (typeof currentPassword !== 'string' || !currentPassword) {
      fieldErrors.currentPassword = spec.validation.current_password.error_messages.required;
    }

    if (Object.keys(fieldErrors).length > 0) {
      return json<ActionData>({ fieldErrors }, { status: 400 });
    }

    // Verify current password
    const isPasswordValid = await verifyPassword(currentPassword as string, currentUser.passwordHash);
    if (!isPasswordValid) {
      return json<ActionData>(
        { error: spec.validation.current_password.error_messages.incorrect },
        { status: 401 }
      );
    }

    // Sanitize and check for duplicates
    const sanitizedEmail = sanitizeEmail(newEmail);
    if (sanitizedEmail === currentUser.email) {
      return json<ActionData>(
        { error: spec.error_messages.email_change.same_as_current },
        { status: 400 }
      );
    }

    const existingUser = await getUserByEmail(sanitizedEmail, context as any);
    if (existingUser) {
      return json<ActionData>(
        { error: spec.error_messages.email_change.email_exists },
        { status: 400 }
      );
    }

    // Update email
    const emailUpdated = await updateUserEmail(session.userId, sanitizedEmail, context as any);
    if (!emailUpdated) {
      return json<ActionData>(
        { error: spec.error_messages.email_change.update_failed },
        { status: 500 }
      );
    }

    return json<ActionData>({ success: spec.success_messages.email_change.completed });
  }

  // Handle password change
  if (intent === 'password-change') {
    const currentPassword = formData.get('currentPassword');
    const newPassword = formData.get('newPassword');
    const newPasswordConfirm = formData.get('newPasswordConfirm');

    const fieldErrors: ActionData['fieldErrors'] = {};

    // Validation
    if (typeof currentPassword !== 'string' || !currentPassword) {
      fieldErrors.currentPassword = spec.validation.current_password.error_messages.required;
    }

    if (typeof newPassword !== 'string' || !newPassword) {
      fieldErrors.newPassword = spec.validation.new_password.error_messages.required;
    } else if (!validatePassword(newPassword)) {
      fieldErrors.newPassword = spec.validation.new_password.error_messages.weak;
    }

    if (typeof newPasswordConfirm !== 'string' || !newPasswordConfirm) {
      fieldErrors.newPasswordConfirm = spec.validation.new_password_confirm.error_messages.required;
    } else if (newPassword !== newPasswordConfirm) {
      fieldErrors.newPasswordConfirm = spec.validation.new_password_confirm.error_messages.mismatch;
    }

    if (Object.keys(fieldErrors).length > 0) {
      return json<ActionData>({ fieldErrors }, { status: 400 });
    }

    // Verify current password
    const isPasswordValid = await verifyPassword(currentPassword as string, currentUser.passwordHash);
    if (!isPasswordValid) {
      return json<ActionData>(
        { error: spec.error_messages.password_change.incorrect_current },
        { status: 401 }
      );
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword as string);

    // Update password
    const passwordUpdated = await updateUserPassword(session.userId, newPasswordHash, context as any);
    if (!passwordUpdated) {
      return json<ActionData>(
        { error: spec.error_messages.password_change.update_failed },
        { status: 500 }
      );
    }

    return json<ActionData>({ success: spec.success_messages.password_change.completed });
  }

  // Handle account deletion
  if (intent === 'delete-account') {
    const currentPassword = formData.get('currentPassword');
    const confirmation = formData.get('confirmation');

    const fieldErrors: ActionData['fieldErrors'] = {};

    // Validation
    if (typeof currentPassword !== 'string' || !currentPassword) {
      fieldErrors.currentPassword = spec.validation.current_password.error_messages.required;
    }

    if (confirmation !== 'true') {
      fieldErrors.confirmation = spec.validation.confirmation.error_messages.required;
    }

    if (Object.keys(fieldErrors).length > 0) {
      return json<ActionData>({ fieldErrors }, { status: 400 });
    }

    // Verify current password
    const isPasswordValid = await verifyPassword(currentPassword as string, currentUser.passwordHash);
    if (!isPasswordValid) {
      return json<ActionData>(
        { error: spec.error_messages.delete_account.incorrect_password },
        { status: 401 }
      );
    }

    // Check for active subscription (Phase 2)
    if (currentUser.subscriptionStatus === 'active' || currentUser.subscriptionStatus === 'trial') {
      console.warn(`User ${session.userId} has active subscription (${currentUser.subscriptionStatus}). Proceeding with deletion.`);
      // TODO: Future implementation - Cancel Stripe subscription via API
      // await cancelStripeSubscription(currentUser.stripeCustomerId, currentUser.stripeSubscriptionId);
      // Note: Database CASCADE will automatically delete subscription records
    }

    // Delete all user sessions
    await deleteAllUserSessions(session.userId, context as any);

    // Delete user (CASCADE will delete subscriptions)
    const userDeleted = await deleteUser(session.userId, context as any);
    if (!userDeleted) {
      return json<ActionData>(
        { error: spec.error_messages.delete_account.delete_failed },
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
  const loaderData = useRouteLoaderData<typeof loader>('routes/account.settings');
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
