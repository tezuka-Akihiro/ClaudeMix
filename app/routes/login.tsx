/**
 * login.tsx
 * Purpose: User login page
 *
 * @layer UI層 (routes)
 * @responsibility ユーザーログインフォーム表示と処理
 */

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/cloudflare';
import { json, redirect } from '@remix-run/cloudflare';
import { Form, Link, useActionData, useLoaderData, useNavigation, useSearchParams } from '@remix-run/react';

// CSS imports
import '~/styles/account/layer2-common.css';
import '~/styles/account/layer2-authentication.css';

// UI Components
import { FlashMessage } from '~/components/account/common/FlashMessage';

// Data-IO layer
import { getUserByEmail } from '~/data-io/account/authentication/getUserByEmail.server';
import { verifyPassword } from '~/data-io/account/authentication/verifyPassword.server';
import { saveSession } from '~/data-io/account/common/saveSession.server';
import { getSession } from '~/data-io/account/common/getSession.server';

// Database User type (includes passwordHash for authentication)
interface DatabaseUser {
  id: string;
  email: string;
  passwordHash: string;
  subscriptionStatus: 'active' | 'inactive' | 'trial';
  createdAt: string;
  updatedAt: string;
}

// Pure logic layer
import { sanitizeEmail } from '~/lib/account/authentication/sanitizeEmail';
import { validateEmail } from '~/lib/account/authentication/validateEmail';
import { validatePassword } from '~/lib/account/authentication/validatePassword';
import { createSessionData } from '~/lib/account/common/createSessionData';

export const meta: MetaFunction = () => {
  return [
    { title: 'ログイン - ClaudeMix' },
    { name: 'description', content: 'ClaudeMixにログイン' },
  ];
};

interface ActionData {
  error?: string;
  fieldErrors?: {
    email?: string;
    password?: string;
  };
}

interface LoaderData {
  flashMessage?: string;
}

// Flash message mapping
const FLASH_MESSAGES: Record<string, string> = {
  'session-expired': 'セッションの有効期限が切れました',
  'unauthorized': 'ログインが必要です',
  'logout-success': 'ログアウトしました',
};

/**
 * Loader: Check if user is already logged in
 * If logged in, redirect to /account or redirect-url
 * Also extract flash message from URL parameter
 */
export async function loader({ request, context }: LoaderFunctionArgs) {
  const session = await getSession(request, context as any);
  if (session) {
    const url = new URL(request.url);
    const redirectUrl = url.searchParams.get('redirect-url') || '/account';
    return redirect(redirectUrl);
  }

  // Extract flash message from URL parameter
  const url = new URL(request.url);
  const messageKey = url.searchParams.get('message');
  const flashMessage = messageKey ? FLASH_MESSAGES[messageKey] : undefined;

  return json<LoaderData>({ flashMessage });
}

/**
 * Action: Handle login form submission
 */
export async function action({ request, context }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get('email');
  const password = formData.get('password');
  const redirectUrl = formData.get('redirectUrl') || '/account';

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

  // Return errors if validation failed
  if (Object.keys(fieldErrors).length > 0) {
    return json<ActionData>({ fieldErrors }, { status: 400 });
  }

  // Sanitize email
  const sanitizedEmail = sanitizeEmail(email);

  // Get user by email (cast to DatabaseUser to access passwordHash)
  const user = (await getUserByEmail(sanitizedEmail, context as any)) as DatabaseUser | null;
  if (!user) {
    return json<ActionData>(
      { error: 'メールアドレスまたはパスワードが正しくありません' },
      { status: 401 }
    );
  }

  // Verify password
  const isPasswordValid = await verifyPassword(password as string, user.passwordHash);
  if (!isPasswordValid) {
    return json<ActionData>(
      { error: 'メールアドレスまたはパスワードが正しくありません' },
      { status: 401 }
    );
  }

  // Create session
  const sessionId = crypto.randomUUID();
  const sessionData = createSessionData(user.id, sessionId);
  const sessionCreated = await saveSession(sessionId, sessionData, context as any);

  if (!sessionCreated) {
    return json<ActionData>(
      { error: 'セッションの作成に失敗しました。もう一度お試しください' },
      { status: 500 }
    );
  }

  // Set session cookie and redirect
  const targetUrl = typeof redirectUrl === 'string' ? redirectUrl : '/account';
  return redirect(targetUrl, {
    headers: {
      'Set-Cookie': `sessionId=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`,
    },
  });
}

export default function Login() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();
  const isSubmitting = navigation.state === 'submitting';
  const redirectUrl = searchParams.get('redirect-url') || '/account';

  return (
    <div className="auth-container auth-container-structure" data-testid="login-page">
      <div className="auth-card auth-card-structure">
        <h1 className="auth-header__title">ログイン</h1>
        <p className="auth-header__subtitle">ClaudeMixにログイン</p>

        {loaderData.flashMessage && (
          <FlashMessage
            message={loaderData.flashMessage}
            type="info"
            autoDismiss={true}
            autoDismissDelay={5000}
          />
        )}

        {actionData?.error && (
          <div className="error-message-structure" role="alert" data-testid="error-message">
            <span>{actionData.error}</span>
          </div>
        )}

        <Form method="post" className="auth-form-structure">
          <input type="hidden" name="redirectUrl" value={redirectUrl} />

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
              <span id="email-error" className="error-message-structure" role="alert" data-testid="error-message">
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
              autoComplete="current-password"
              required
              aria-invalid={actionData?.fieldErrors?.password ? true : undefined}
              aria-describedby={actionData?.fieldErrors?.password ? 'password-error' : undefined}
              data-testid="password-input"
            />
            {actionData?.fieldErrors?.password && (
              <span id="password-error" className="error-message-structure" role="alert" data-testid="error-message">
                {actionData.fieldErrors.password}
              </span>
            )}
          </div>

          <button type="submit" disabled={isSubmitting} data-testid="submit-button">
            {isSubmitting ? 'ログイン中...' : 'ログイン'}
          </button>
        </Form>

        <p className="auth-link">
          アカウントをお持ちでないですか？{' '}
          <Link to="/register" data-testid="register-link">
            新規登録
          </Link>
        </p>
      </div>
    </div>
  );
}
