/**
 * forgot-password.tsx
 * Purpose: Password reset request page
 *
 * @layer UI層 (routes)
 * @responsibility パスワードリセット要求の処理
 */

import type { ActionFunctionArgs, MetaFunction } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';
import { Form, useActionData, useNavigation } from '@remix-run/react';

// Data-IO layer
import { generatePasswordResetToken } from '~/data-io/account/authentication/generatePasswordResetToken.server';
import { getUserByEmail } from '~/data-io/account/authentication/getUserByEmail.server';

// Pure logic layer
import { sanitizeEmail } from '~/lib/account/authentication/sanitizeEmail';
import { validateEmail } from '~/lib/account/authentication/validateEmail';

// CSS imports
import '~/styles/account/layer2-common.css';

export const meta: MetaFunction = () => {
  return [
    { title: 'パスワードリセット - ClaudeMix' },
    { name: 'description', content: 'パスワードリセット' },
  ];
};

interface ActionData {
  success?: string;
  error?: string;
  fieldErrors?: {
    email?: string;
  };
}

/**
 * Action: Handle password reset request
 */
export async function action({ request, context }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get('email');

  const fieldErrors: ActionData['fieldErrors'] = {};

  // Validation
  if (typeof email !== 'string' || !email) {
    fieldErrors.email = 'メールアドレスを入力してください';
  } else if (!validateEmail(email)) {
    fieldErrors.email = '有効なメールアドレスを入力してください';
  }

  if (Object.keys(fieldErrors).length > 0) {
    return json<ActionData>({ fieldErrors }, { status: 400 });
  }

  const sanitizedEmail = sanitizeEmail(email);

  // Check if user exists
  const user = await getUserByEmail(sanitizedEmail, context as any);

  // Security: Always show success message, even if email doesn't exist
  // This prevents email enumeration attacks
  if (user) {
    try {
      // Generate and store token in KV
      const token = await generatePasswordResetToken(sanitizedEmail, context as any);

      // TODO: Send email with reset link
      // In production: await sendPasswordResetEmail(sanitizedEmail, token);
      // For MVP/development: Log the reset link
      const resetLink = `http://localhost:8788/reset-password/${token}`;
      console.log('========================================');
      console.log('PASSWORD RESET LINK (MVP - Check console):');
      console.log(`Email: ${sanitizedEmail}`);
      console.log(`Link: ${resetLink}`);
      console.log('========================================');
    } catch (error) {
      console.error('Error generating password reset token:', error);
      // Still show success message to user (security)
    }
  }

  // Always return success message (security: don't reveal if email exists)
  return json<ActionData>({
    success: 'パスワードリセットのメールを送信しました。メールをご確認ください。',
  });
}

export default function ForgotPassword() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <div className="auth-container auth-container-structure">
      <div className="auth-card auth-card-structure">
        <h1 className="auth-card__title">パスワードリセット</h1>

        <p className="auth-card__description">
          登録時のメールアドレスを入力してください。
          <br />
          パスワードリセット用のリンクをお送りします。
        </p>

        {actionData?.success && (
          <div className="auth-success" role="alert" data-testid="success-message">
            {actionData.success}
          </div>
        )}

        {actionData?.error && (
          <div className="auth-error" role="alert" data-testid="error-message">
            {actionData.error}
          </div>
        )}

        <Form method="post" className="auth-form">
          <div className="auth-form-field-structure">
            <label htmlFor="email" className="auth-form__label">
              メールアドレス
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              className={`auth-form__input ${actionData?.fieldErrors?.email ? 'auth-form__input--error' : ''}`}
              required
              data-testid="email-input"
            />
            {actionData?.fieldErrors?.email && (
              <span className="auth-form__error">{actionData.fieldErrors.email}</span>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="auth-form__submit"
            data-testid="submit-button"
          >
            {isSubmitting ? '送信中...' : 'リセットリンクを送信'}
          </button>
        </Form>

        <div className="auth-card__footer">
          <a href="/login" className="auth-card__link">
            ログインに戻る
          </a>
        </div>
      </div>
    </div>
  );
}
