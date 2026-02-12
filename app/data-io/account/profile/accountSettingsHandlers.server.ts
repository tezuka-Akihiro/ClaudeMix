/**
 * accountSettingsHandlers.server.ts
 * Action handlers for account settings page
 */

import { json, redirect } from '@remix-run/cloudflare';
import { loadSpec } from '~/spec-loader/specLoader.server';
import type { AccountProfileSpec } from '~/specs/account/types';
import { getSession } from '~/data-io/account/common/getSession.server';
import { getUserById } from '~/data-io/account/common/getUserById.server';
import { deleteUser } from '~/data-io/account/profile/deleteUser.server';
import { updateUserEmail } from '~/data-io/account/profile/updateUserEmail.server';
import { updateUserPassword } from '~/data-io/account/profile/updateUserPassword.server';
import { getSubscriptionByUserId } from '~/data-io/account/subscription/getSubscriptionByUserId.server';
import { cancelStripeSubscription, reactivateStripeSubscription } from '~/data-io/account/subscription/cancelStripeSubscription.server';
import { updateSubscriptionCancellation } from '~/data-io/account/subscription/updateSubscriptionCancellation.server';
import { getUserByEmail } from '~/data-io/account/authentication/getUserByEmail.server';
import { hashPassword } from '~/data-io/account/authentication/hashPassword.server';
import { verifyPassword } from '~/data-io/account/authentication/verifyPassword.server';
import { deleteAllUserSessions } from '~/data-io/account/common/deleteAllUserSessions.server';
import { sanitizeEmail } from '~/lib/account/authentication/sanitizeEmail';
import { validateEmail } from '~/lib/account/authentication/validateEmail';
import { validatePassword } from '~/lib/account/authentication/validatePassword';
import type { DatabaseUser, ActionData } from '~/routes/account.settings.types';

export async function handleAccountSettingsAction(request: Request, context: any) {
  const spec = loadSpec<AccountProfileSpec>('account/profile');

  const session = await getSession(request, context);
  if (!session) {
    return redirect('/login');
  }

  const formData = await request.formData();
  const intent = formData.get('intent');

  // Get current user with passwordHash for verification
  const currentUser = (await getUserById(session.userId, context)) as DatabaseUser | null;
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

    const existingUser = await getUserByEmail(sanitizedEmail, context);
    if (existingUser) {
      return json<ActionData>(
        { error: spec.error_messages.email_change.email_exists },
        { status: 400 }
      );
    }

    // Update email
    const emailUpdated = await updateUserEmail(session.userId, sanitizedEmail, context);
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
    const passwordUpdated = await updateUserPassword(session.userId, newPasswordHash, context);
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

    // Check for active subscription
    if (currentUser.subscriptionStatus === 'active') {
      const subscription = await getSubscriptionByUserId(session.userId, context);
      if (subscription?.status === 'active' && !subscription.canceledAt) {
        return json<ActionData>(
          { error: '自動更新がONの状態では退会できません。先に自動更新を中断してください。' },
          { status: 400 }
        );
      }
    }

    // Delete all user sessions
    await deleteAllUserSessions(session.userId, context);

    // Delete user (CASCADE will delete subscriptions)
    const userDeleted = await deleteUser(session.userId, context);
    if (!userDeleted) {
      return json<ActionData>(
        { error: spec.error_messages.delete_account.delete_failed },
        { status: 500 }
      );
    }

    // Redirect to login with cleared session cookie
    return redirect('/login', {
      headers: {
        'Set-Cookie': 'session_id=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0',
      },
    });
  }

  // Handle interrupt-renewal
  if (intent === 'interrupt-renewal') {
    const subscription = await getSubscriptionByUserId(session.userId, context);
    if (!subscription || !subscription.stripeSubscriptionId) {
      return json<ActionData>({ error: 'サブスクリプションが見つかりません' }, { status: 404 });
    }

    try {
      await cancelStripeSubscription(subscription.stripeSubscriptionId, context);
      await updateSubscriptionCancellation(subscription.stripeSubscriptionId, subscription.currentPeriodEnd, context);
      return json<ActionData>({ success: '自動更新を中断しました' });
    } catch (error) {
      return json<ActionData>({ error: '自動更新の中断に失敗しました' }, { status: 500 });
    }
  }

  // Handle resume-renewal
  if (intent === 'resume-renewal') {
    const subscription = await getSubscriptionByUserId(session.userId, context);
    if (!subscription || !subscription.stripeSubscriptionId) {
      return json<ActionData>({ error: 'サブスクリプションが見つかりません' }, { status: 404 });
    }

    try {
      await reactivateStripeSubscription(subscription.stripeSubscriptionId, context);
      await updateSubscriptionCancellation(subscription.stripeSubscriptionId, null, context);
      return json<ActionData>({ success: '自動更新を再開しました' });
    } catch (error) {
      return json<ActionData>({ error: '自動更新の再開に失敗しました' }, { status: 500 });
    }
  }

  // Handle delete-payment-method
  if (intent === 'delete-payment-method') {
    const subscription = await getSubscriptionByUserId(session.userId, context);
    if (subscription?.status === 'active' && !subscription.canceledAt) {
      return json<ActionData>(
        { error: '先に自動更新を中断してください' },
        { status: 400 }
      );
    }

    return json<ActionData>({ success: 'カード情報を削除しました（デモ）' });
  }

  return json<ActionData>({ error: '不正なリクエストです' }, { status: 400 });
}
