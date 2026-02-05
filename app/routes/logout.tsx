/**
 * logout.tsx
 * Purpose: User logout handler using Remix Auth
 *
 * @layer UI層 (routes)
 * @responsibility ユーザーログアウト処理
 */

import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/cloudflare';
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
import { getAuthenticator } from '~/data-io/account/common/authenticator.server';

/**
 * Loader: Redirect to dashboard if logged in (safety)
 * In some cases, GET /logout might want to logout directly,
 * but Remix Auth prefers POST for logout.
 */
export async function loader({ request, context }: LoaderFunctionArgs) {
  const spec = loadSpec<AccountAuthenticationSpec>('account/authentication');
  const authenticator = getAuthenticator(context as any);

  return await authenticator.logout(request, {
    redirectTo: spec.routes.logout.redirect_after,
  });
}

/**
 * Action: Handle logout via POST
 */
export async function action({ request, context }: ActionFunctionArgs) {
  const spec = loadSpec<AccountAuthenticationSpec>('account/authentication');
  const authenticator = getAuthenticator(context as any);

  return await authenticator.logout(request, {
    redirectTo: spec.routes.logout.redirect_after,
  });
}

export default function Logout() {
  const navigation = useNavigation();
  const formRef = useRef<HTMLFormElement>(null);
  const isSubmitting = navigation.state === 'submitting';

  // Auto-submit form on mount if it's not already submitting
  useEffect(() => {
    if (formRef.current && navigation.state === 'idle') {
      formRef.current.submit();
    }
  }, [navigation.state]);

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
