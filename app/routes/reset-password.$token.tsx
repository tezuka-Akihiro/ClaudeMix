/**
 * reset-password.$token.tsx
 * Purpose: Password reset execution page with token validation
 *
 * @layer UI層 (routes)
 * @responsibility パスワードリセット実行の処理
 */

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/cloudflare';
import { json, redirect } from '@remix-run/cloudflare';
import { Form, useActionData, useLoaderData, useNavigation } from '@remix-run/react';

// Data-IO layer
import { getPasswordResetToken } from '~/data-io/account/authentication/getPasswordResetToken.server';
import { deletePasswordResetToken } from '~/data-io/account/authentication/deletePasswordResetToken.server';
import { getUserByEmail } from '~/data-io/account/authentication/getUserByEmail.server';
import { updateUserPassword } from '~/data-io/account/profile/updateUserPassword.server';
import { hashPassword } from '~/data-io/account/authentication/hashPassword.server';
import { deleteAllUserSessions } from '~/data-io/account/common/deleteAllUserSessions.server';

// Pure logic layer
import { validatePassword } from '~/lib/account/authentication/validatePassword';

// CSS imports
import '~/styles/account/layer2-common.css';
import '~/styles/account/layer2-authentication.css';
import '~/styles/account/layer3-authentication.css';

export const meta: MetaFunction = () => {
  return [
    { title: 'パスワード再設定 - ClaudeMix' },
    { name: 'description', content: 'パスワード再設定' },
  ];
};

interface LoaderData {
  tokenValid: boolean;
  email?: string;
}

interface ActionData {
  success?: string;
  error?: string;
  fieldErrors?: {
    newPassword?: string;
    newPasswordConfirm?: string;
  };
}

/**
 * Loader: Validate token on page load
 */
export async function loader({ params, context }: LoaderFunctionArgs) {
  const { token } = params;

  if (!token) {
    return json<LoaderData>({ tokenValid: false });
  }

  // For initial validation, we need to check all tokens in KV
  // This is inefficient but necessary since we can't reverse lookup by token
  // In production, consider using a different key structure or additional index

  // For MVP: Accept any token format and validate in action
  // Token validation will happen when user submits the form
  return json<LoaderData>({ tokenValid: true });
}

/**
 * Action: Handle password reset with token validation
 */
export async function action({ request, params, context }: ActionFunctionArgs) {
  const { token } = params;
  const formData = await request.formData();
  const newPassword = formData.get('newPassword');
  const newPasswordConfirm = formData.get('newPasswordConfirm');

  if (!token) {
    return json<ActionData>(
      { error: 'トークンが無効です' },
      { status: 400 }
    );
  }

  const fieldErrors: ActionData['fieldErrors'] = {};

  // Validation
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

  // Find token in KV by iterating through all reset-token keys
  // This is necessary because we store by email but receive a token
  let userEmail: string | null = null;

  try {
    const kv = (context as any).env.SESSION_KV;
    const listResult = await kv.list({ prefix: 'reset-token:' });

    for (const key of listResult.keys) {
      const tokenDataJson = await kv.get(key.name);
      if (tokenDataJson) {
        try {
          const tokenData = JSON.parse(tokenDataJson);
          if (tokenData.token === token) {
            userEmail = tokenData.email;
            break;
          }
        } catch {
          continue;
        }
      }
    }
  } catch (error) {
    console.error('Error validating token:', error);
    return json<ActionData>(
      { error: 'トークンの検証に失敗しました' },
      { status: 500 }
    );
  }

  if (!userEmail) {
    return json<ActionData>(
      { error: 'トークンが無効または期限切れです' },
      { status: 400 }
    );
  }

  // Get user by email
  const user = await getUserByEmail(userEmail, context as any);
  if (!user) {
    return json<ActionData>(
      { error: 'ユーザーが見つかりません' },
      { status: 404 }
    );
  }

  // Hash new password
  const newPasswordHash = await hashPassword(newPassword as string);

  // Update password
  const passwordUpdated = await updateUserPassword(user.id, newPasswordHash, context as any);
  if (!passwordUpdated) {
    return json<ActionData>(
      { error: 'パスワードの更新に失敗しました' },
      { status: 500 }
    );
  }

  // Delete all user sessions (security: force re-login)
  await deleteAllUserSessions(user.id, context as any);

  // Delete password reset token (single-use)
  await deletePasswordResetToken(userEmail, context as any);

  // Redirect to login with success message
  return redirect('/login?message=password-reset-success');
}

export default function ResetPassword() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  if (!loaderData.tokenValid) {
    return (
      <div className="auth-container auth-container-structure">
        <div className="auth-card auth-card-structure">
          <h1 className="auth-header__title">無効なリンク</h1>
          <p className="auth-header__subtitle">
            このリンクは無効です。
            <br />
            パスワードリセットを再度リクエストしてください。
          </p>
          <p className="auth-link" style={{ textAlign: 'center', marginTop: 'var(--spacing-3)' }}>
            <a href="/forgot-password">
              パスワードリセットに戻る
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container auth-container-structure">
      <div className="auth-card auth-card-structure">
        <h1 className="auth-header__title">パスワード再設定</h1>

        <p className="auth-header__subtitle">新しいパスワードを入力してください。</p>

        {actionData?.error && (
          <div className="error-message-structure" role="alert" data-testid="error-message">
            {actionData.error}
          </div>
        )}

        <Form method="post" className="auth-form-structure">
          <div className="form-field-structure">
            <label htmlFor="newPassword" className="form-field__label">
              新しいパスワード
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              className="form-field__input"
              aria-invalid={actionData?.fieldErrors?.newPassword ? true : undefined}
              aria-describedby={actionData?.fieldErrors?.newPassword ? 'new-password-error' : undefined}
              required
              data-testid="new-password-input"
            />
            {actionData?.fieldErrors?.newPassword && (
              <span id="new-password-error" className="form-field__error" role="alert" data-testid="error-message">{actionData.fieldErrors.newPassword}</span>
            )}
          </div>

          <div className="form-field-structure">
            <label htmlFor="newPasswordConfirm" className="form-field__label">
              新しいパスワード（確認）
            </label>
            <input
              id="newPasswordConfirm"
              name="newPasswordConfirm"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              className="form-field__input"
              aria-invalid={actionData?.fieldErrors?.newPasswordConfirm ? true : undefined}
              aria-describedby={actionData?.fieldErrors?.newPasswordConfirm ? 'new-password-confirm-error' : undefined}
              required
              data-testid="new-password-confirm-input"
            />
            {actionData?.fieldErrors?.newPasswordConfirm && (
              <span id="new-password-confirm-error" className="form-field__error" role="alert" data-testid="error-message">{actionData.fieldErrors.newPasswordConfirm}</span>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary"
            data-testid="submit-button"
          >
            {isSubmitting ? '設定中...' : 'パスワードを再設定'}
          </button>
        </Form>

        <p className="auth-link" style={{ textAlign: 'center', marginTop: 'var(--spacing-3)' }}>
          <a href="/login">
            ログインに戻る
          </a>
        </p>
      </div>
    </div>
  );
}
