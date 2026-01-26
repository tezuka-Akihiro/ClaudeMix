/**
 * logout.tsx
 * Purpose: User logout handler
 *
 * @layer UI層 (routes)
 * @responsibility ユーザーログアウト処理
 */

import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/cloudflare';
import { redirect } from '@remix-run/cloudflare';
import { Form, useNavigation } from '@remix-run/react';
import { useEffect, useRef } from 'react';

// CSS imports
import '~/styles/account/layer2-common.css';
import '~/styles/account/layer2-authentication.css';
import '~/styles/account/layer3-authentication.css';

// Spec loader
import { loadSpec } from '~/spec-loader/specLoader.server';
import type { AccountAuthenticationSpec } from '~/specs/account/types';

// Data-IO layer
import { destroySession } from '~/data-io/account/common/destroySession.server';
import { getSession } from '~/data-io/account/common/getSession.server';

/**
 * Loader: Handle logout on GET request
 * This allows direct navigation to /logout via browser or test
 */
export async function loader({ request, context }: LoaderFunctionArgs) {
  const spec = loadSpec<AccountAuthenticationSpec>('account/authentication');
  const redirectPath = spec.routes.logout.redirect_after;

  // Get current session
  const session = await getSession(request, context as any);

  // Destroy session from database if it exists
  if (session) {
    await destroySession(session.sessionId, context as any);
  }

  // Clear session cookie and redirect to login
  return redirect(redirectPath, {
    headers: {
      'Set-Cookie': 'sessionId=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0',
    },
  });
}

/**
 * Action: Handle logout
 */
export async function action({ request, context }: ActionFunctionArgs) {
  const spec = loadSpec<AccountAuthenticationSpec>('account/authentication');
  const redirectPath = spec.routes.logout.redirect_after;

  // Get current session
  const session = await getSession(request, context as any);

  // Destroy session from KV if it exists
  if (session) {
    await destroySession(session.sessionId, context as any);
  }

  // Clear session cookie and redirect to login
  return redirect(redirectPath, {
    headers: {
      'Set-Cookie': 'sessionId=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0',
    },
  });
}

export default function Logout() {
  const navigation = useNavigation();
  const formRef = useRef<HTMLFormElement>(null);
  const isSubmitting = navigation.state === 'submitting';

  // Auto-submit form on mount
  useEffect(() => {
    if (formRef.current && !isSubmitting) {
      formRef.current.submit();
    }
  }, [isSubmitting]);

  return (
    <div className="auth-container auth-container-structure" data-testid="logout-page">
      <div className="auth-card auth-card-structure">
        <h1 className="auth-header__title">ログアウト</h1>
        <p className="auth-header__subtitle">
          {isSubmitting ? 'ログアウト中...' : 'ログアウトしています...'}
        </p>

        <Form ref={formRef} method="post" className="auth-form-structure">
          <noscript>
            <button type="submit" data-testid="submit-button">
              ログアウト
            </button>
          </noscript>
        </Form>
      </div>
    </div>
  );
}
