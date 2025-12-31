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
  'password-reset-success': 'パスワードを再設定しました。新しいパスワードでログインしてください。',
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
  const setCookieHeader = await saveSession(sessionData, context as any);

  // Set session cookie and redirect
  const targetUrl = typeof redirectUrl === 'string' ? redirectUrl : '/account';
  return redirect(targetUrl, {
    headers: {
      'Set-Cookie': setCookieHeader,
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
              className="form-field__input"
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
              className="form-field__input"
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

          <button type="submit" className="btn-primary" disabled={isSubmitting} data-testid="submit-button">
            {isSubmitting ? 'ログイン中...' : 'ログイン'}
          </button>
        </Form>

        <div className="auth-divider" style={{ margin: '1.5rem 0', textAlign: 'center', position: 'relative' }}>
          <span style={{ background: 'white', padding: '0 1rem', position: 'relative', zIndex: 1, color: '#111111' }}>または</span>
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: '#e0e0e0', zIndex: 0 }}></div>
        </div>

        <div className="auth-oauth-buttons" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <a
            href="/auth/google"
            className="auth-oauth-button"
            data-testid="google-login-button"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.75rem 1rem',
              border: '1px solid #dadce0',
              borderRadius: '4px',
              backgroundColor: 'white',
              color: '#3c4043',
              textDecoration: 'none',
              fontWeight: 500,
              transition: 'background-color 0.2s',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" style={{ marginRight: '0.75rem' }}>
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.183l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
            </svg>
            Google でログイン
          </a>

          <a
            href="/auth/apple"
            className="auth-oauth-button"
            data-testid="apple-login-button"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.75rem 1rem',
              border: '1px solid #000',
              borderRadius: '4px',
              backgroundColor: '#000',
              color: 'white',
              textDecoration: 'none',
              fontWeight: 500,
              transition: 'background-color 0.2s',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" style={{ marginRight: '0.75rem' }} fill="currentColor">
              <path d="M14.94 5.19A4.38 4.38 0 0 0 13 8.59c0 2.08 1.63 2.85 1.69 2.87-.01.05-.26.94-.88 1.86-.54.8-1.1 1.59-1.98 1.61-.87.01-1.15-.52-2.15-.52-1 0-1.31.51-2.14.53-.85.02-1.51-.86-2.06-1.66-1.12-1.64-1.98-4.62-.83-6.64.57-1.01 1.6-1.65 2.71-1.67.85-.01 1.64.57 2.16.57.52 0 1.5-.71 2.53-.6.43.01 1.64.17 2.41 1.31-.06.04-1.44.84-1.42 2.51zM12.02 3.83c.44-.53.74-1.27.66-2-.64.03-1.41.43-1.87.96-.41.48-.77 1.24-.67 1.97.71.05 1.43-.36 1.88-.93z"/>
            </svg>
            Apple でログイン
          </a>
        </div>

        <p className="auth-link">
          <Link to="/forgot-password" data-testid="forgot-password-link">
            パスワードをお忘れですか？
          </Link>
        </p>

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
