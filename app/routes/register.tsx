/**
 * register.tsx
 * Purpose: User registration page
 *
 * @layer UI層 (routes)
 * @responsibility ユーザー登録フォーム表示と処理
 */

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/cloudflare';
import { json, redirect } from '@remix-run/cloudflare';
import { Form, Link, useActionData, useNavigation } from '@remix-run/react';

// Data-IO layer
import { createUser } from '~/data-io/account/authentication/createUser.server';
import { getUserByEmail } from '~/data-io/account/authentication/getUserByEmail.server';
import { hashPassword } from '~/data-io/account/authentication/hashPassword.server';
import { saveSession } from '~/data-io/account/common/saveSession.server';
import { getSession } from '~/data-io/account/common/getSession.server';

// Pure logic layer
import { sanitizeEmail } from '~/lib/account/authentication/sanitizeEmail';
import { validateEmail } from '~/lib/account/authentication/validateEmail';
import { validatePassword } from '~/lib/account/authentication/validatePassword';
import { createSessionData } from '~/lib/account/common/createSessionData';

export const meta: MetaFunction = () => {
  return [
    { title: 'アカウント登録 - ClaudeMix' },
    { name: 'description', content: 'ClaudeMixのアカウントを作成' },
  ];
};

interface ActionData {
  error?: string;
  fieldErrors?: {
    email?: string;
    password?: string;
    confirmPassword?: string;
  };
}

/**
 * Loader: Check if user is already logged in
 * If logged in, redirect to /account
 */
export async function loader({ request, context }: LoaderFunctionArgs) {
  const session = await getSession(request, context as any);
  if (session) {
    return redirect('/account');
  }
  return json({});
}

/**
 * Action: Handle registration form submission
 */
export async function action({ request, context }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get('email');
  const password = formData.get('password');
  const confirmPassword = formData.get('confirmPassword');

  const fieldErrors: ActionData['fieldErrors'] = {};

  // Validate inputs
  if (typeof email !== 'string' || !email) {
    fieldErrors.email = 'メールアドレスを入力してください';
  } else if (!validateEmail(email)) {
    fieldErrors.email = '有効なメールアドレスを入力してください';
  }

  if (typeof password !== 'string' || !password) {
    fieldErrors.password = 'パスワードを入力してください';
  } else if (!validatePassword(password)) {
    fieldErrors.password = 'パスワードは8文字以上、128文字以下で入力してください';
  }

  if (typeof confirmPassword !== 'string' || !confirmPassword) {
    fieldErrors.confirmPassword = 'パスワード（確認）を入力してください';
  } else if (password !== confirmPassword) {
    fieldErrors.confirmPassword = 'パスワードが一致しません';
  }

  // Return errors if validation failed
  if (Object.keys(fieldErrors).length > 0) {
    return json<ActionData>({ fieldErrors }, { status: 400 });
  }

  // Sanitize email
  const sanitizedEmail = sanitizeEmail(email);

  // Check if user already exists
  const existingUser = await getUserByEmail(sanitizedEmail, context as any);
  if (existingUser) {
    return json<ActionData>(
      { error: 'このメールアドレスは既に登録されています' },
      { status: 400 }
    );
  }

  // Hash password
  const passwordHash = await hashPassword(password as string);

  // Create user
  const userCreated = await createUser(sanitizedEmail, passwordHash, context as any);
  if (!userCreated) {
    return json<ActionData>(
      { error: 'アカウントの作成に失敗しました。もう一度お試しください' },
      { status: 500 }
    );
  }

  // Get the created user to obtain userId
  const newUser = await getUserByEmail(sanitizedEmail, context as any);
  if (!newUser) {
    return json<ActionData>(
      { error: 'アカウントの作成に失敗しました。もう一度お試しください' },
      { status: 500 }
    );
  }

  // Create session
  const sessionId = crypto.randomUUID();
  const sessionData = createSessionData(newUser.id, sessionId);
  const sessionCreated = await saveSession(sessionId, sessionData, context as any);

  if (!sessionCreated) {
    return json<ActionData>(
      { error: 'セッションの作成に失敗しました。ログインしてください' },
      { status: 500 }
    );
  }

  // Set session cookie and redirect to /account
  return redirect('/account', {
    headers: {
      'Set-Cookie': `sessionId=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`,
    },
  });
}

export default function Register() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <div className="auth-container auth-container-structure" data-testid="register-page">
      <div className="auth-card auth-card-structure">
        <h1 className="auth-header__title">アカウント登録</h1>
        <p className="auth-header__subtitle">ClaudeMixのアカウントを作成</p>

        {actionData?.error && (
          <div className="error-message-structure" role="alert" data-testid="error-message">
            <span>{actionData.error}</span>
          </div>
        )}

        <Form method="post" className="auth-form-structure">
          <div className="form-field-structure">
            <label htmlFor="email">メールアドレス</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              aria-invalid={actionData?.fieldErrors?.email ? true : undefined}
              aria-describedby={actionData?.fieldErrors?.email ? 'email-error' : undefined}
              data-testid="email-input"
            />
            {actionData?.fieldErrors?.email && (
              <span id="email-error" className="error-message-structure" role="alert">
                {actionData.fieldErrors.email}
              </span>
            )}
          </div>

          <div className="form-field-structure">
            <label htmlFor="password">パスワード</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              aria-invalid={actionData?.fieldErrors?.password ? true : undefined}
              aria-describedby={actionData?.fieldErrors?.password ? 'password-error' : undefined}
              data-testid="password-input"
            />
            {actionData?.fieldErrors?.password && (
              <span id="password-error" className="error-message-structure" role="alert">
                {actionData.fieldErrors.password}
              </span>
            )}
          </div>

          <div className="form-field-structure">
            <label htmlFor="confirmPassword">パスワード（確認）</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              aria-invalid={actionData?.fieldErrors?.confirmPassword ? true : undefined}
              aria-describedby={
                actionData?.fieldErrors?.confirmPassword ? 'confirmPassword-error' : undefined
              }
              data-testid="confirm-password-input"
            />
            {actionData?.fieldErrors?.confirmPassword && (
              <span id="confirmPassword-error" className="error-message-structure" role="alert">
                {actionData.fieldErrors.confirmPassword}
              </span>
            )}
          </div>

          <button type="submit" disabled={isSubmitting} data-testid="submit-button">
            {isSubmitting ? '登録中...' : '登録'}
          </button>
        </Form>

        <p className="auth-link">
          すでにアカウントをお持ちですか？{' '}
          <Link to="/login" data-testid="login-link">
            ログイン
          </Link>
        </p>
      </div>
    </div>
  );
}
