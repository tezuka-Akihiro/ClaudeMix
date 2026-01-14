/**
 * register.tsx
 * Purpose: User registration page
 *
 * @layer UI層 (routes)
 * @responsibility ユーザー登録フォーム表示と処理
 */

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/cloudflare';
import { json, redirect } from '@remix-run/cloudflare';
import { Form, Link, useActionData, useLoaderData, useNavigation } from '@remix-run/react';

// CSS imports
import '~/styles/account/layer2-common.css';
import '~/styles/account/layer2-authentication.css';
import '~/styles/account/layer3-authentication.css';

// Spec loader
import { loadSpec } from '~/spec-loader/specLoader.server';
import type { AccountAuthenticationSpec } from '~/specs/account/types';

// Data-IO layer
import { createUser } from '~/data-io/account/authentication/createUser.server';
import { getUserByEmail } from '~/data-io/account/authentication/getUserByEmail.server';
import { hashPassword } from '~/data-io/account/authentication/hashPassword.server';
import { saveSession } from '~/data-io/account/common/saveSession.server';
import { getSession } from '~/data-io/account/common/getSession.server';

// Pure logic layer
import { sanitizeEmail } from '~/lib/account/authentication/sanitizeEmail';
import { validateEmail } from '~/lib/account/authentication/validateEmail';
import { validatePasswordDetailed } from '~/lib/account/authentication/validatePassword';
import { createSessionData } from '~/lib/account/common/createSessionData';

export const meta: MetaFunction = () => {
  return [
    { title: '会員登録 - ClaudeMix' },
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

interface LoaderData {
  uiSpec: {
    title: string;
    subtitle: string;
    fields: {
      email: {
        label: string;
      };
      password: {
        label: string;
      };
      confirmPassword: {
        label: string;
      };
    };
    submitButton: {
      label: string;
      loadingLabel: string;
    };
    links: {
      loginPrompt: string;
      loginLink: string;
    };
  };
}

/**
 * Loader: Check if user is already logged in
 * If logged in, redirect to /account
 */
export async function loader({ request, context }: LoaderFunctionArgs) {
  const spec = loadSpec<AccountAuthenticationSpec>('account/authentication');

  const session = await getSession(request, context as any);
  if (session) {
    return redirect(spec.server_io.loader.authenticated_redirect);
  }

  return json<LoaderData>({
    uiSpec: {
      title: spec.routes.register.title,
      subtitle: `ClaudeMixのアカウントを作成`,
      fields: {
        email: {
          label: spec.forms.register.fields.email.label,
        },
        password: {
          label: spec.forms.register.fields.password.label,
        },
        confirmPassword: {
          label: spec.forms.register.fields.password_confirm.label,
        },
      },
      submitButton: {
        label: spec.forms.register.submit_button.label,
        loadingLabel: spec.forms.register.submit_button.loading_label,
      },
      links: {
        loginPrompt: 'すでにアカウントをお持ちですか？',
        loginLink: 'ログイン',
      },
    },
  });
}

/**
 * Action: Handle registration form submission
 */
export async function action({ request, context }: ActionFunctionArgs) {
  const spec = loadSpec<AccountAuthenticationSpec>('account/authentication');

  const formData = await request.formData();
  const email = formData.get('email');
  const password = formData.get('password');
  const confirmPassword = formData.get('confirmPassword');

  const fieldErrors: ActionData['fieldErrors'] = {};

  // Validate inputs
  if (typeof email !== 'string' || !email) {
    fieldErrors.email = spec.validation.email.error_messages.required;
  } else if (!validateEmail(email)) {
    fieldErrors.email = spec.validation.email.error_messages.invalid_format;
  }

  if (typeof password !== 'string' || !password) {
    fieldErrors.password = spec.validation.password.error_messages.required;
  } else {
    const passwordValidation = validatePasswordDetailed(password);
    if (!passwordValidation.isValid && passwordValidation.error) {
      fieldErrors.password = spec.validation.password.error_messages[passwordValidation.error];
    }
  }

  if (typeof confirmPassword !== 'string' || !confirmPassword) {
    fieldErrors.confirmPassword = spec.validation.password_confirm.error_messages.required;
  } else if (password !== confirmPassword) {
    fieldErrors.confirmPassword = spec.validation.password_confirm.error_messages.mismatch;
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
      { error: spec.error_messages.registration.email_exists },
      { status: 400 }
    );
  }

  // Hash password
  const passwordHash = await hashPassword(password as string);

  // Create user
  const userCreated = await createUser(sanitizedEmail, passwordHash, context as any);
  if (!userCreated) {
    return json<ActionData>(
      { error: spec.error_messages.registration.creation_failed },
      { status: 500 }
    );
  }

  // Get the created user to obtain userId
  const newUser = await getUserByEmail(sanitizedEmail, context as any);
  if (!newUser) {
    return json<ActionData>(
      { error: spec.error_messages.registration.creation_failed },
      { status: 500 }
    );
  }

  // Create session
  const sessionId = crypto.randomUUID();
  const sessionData = createSessionData(newUser.id, sessionId);

  try {
    const setCookieHeader = await saveSession(sessionData, context as any);

    // Set session cookie and redirect to /account
    return redirect(spec.server_io.action.default_redirect, {
      headers: {
        'Set-Cookie': setCookieHeader,
      },
    });
  } catch (error) {
    return json<ActionData>(
      { error: spec.error_messages.authentication.session_creation_failed },
      { status: 500 }
    );
  }
}

export default function Register() {
  const actionData = useActionData<typeof action>();
  const loaderData = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';
  const { uiSpec } = loaderData;

  return (
    <main className="auth-container auth-container-structure" data-testid="register-page">
      <div className="auth-card auth-card-structure">
        <h1 className="auth-header__title">{uiSpec.title}</h1>
        <p className="auth-header__subtitle">{uiSpec.subtitle}</p>

        {actionData?.error && (
          <div className="error-message-structure" role="alert" data-testid="error-message">
            <span>{actionData.error}</span>
          </div>
        )}

        <Form method="post" className="auth-form-structure">
          <div className="form-field-structure">
            <label htmlFor="email">{uiSpec.fields.email.label}</label>
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
            <label htmlFor="password">{uiSpec.fields.password.label}</label>
            <input
              className="form-field__input"
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
              <span id="password-error" className="error-message-structure" role="alert" data-testid="error-message">
                {actionData.fieldErrors.password}
              </span>
            )}
          </div>

          <div className="form-field-structure">
            <label htmlFor="confirmPassword">{uiSpec.fields.confirmPassword.label}</label>
            <input
              className="form-field__input"
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
              <span id="confirmPassword-error" className="error-message-structure" role="alert" data-testid="error-message">
                {actionData.fieldErrors.confirmPassword}
              </span>
            )}
          </div>

          <button type="submit" className="btn-primary" disabled={isSubmitting} data-testid="submit-button">
            {isSubmitting ? uiSpec.submitButton.loadingLabel : uiSpec.submitButton.label}
          </button>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 'var(--spacing-3)' }}>
          <p style={{ color: 'var(--color-text-primary)', marginBottom: 'var(--spacing-2)', fontSize: 'var(--font-size-sm)' }}>
            {uiSpec.links.loginPrompt}
          </p>
          <Link
            to="/login"
            className="btn-secondary"
            data-testid="login-link"
            style={{ display: 'inline-block', textDecoration: 'none' }}
          >
            {uiSpec.links.loginLink}
          </Link>
        </div>
      </div>
    </main>
  );
}
