/**
 * register.tsx
 * Purpose: User registration page
 *
 * @layer UI層 (routes)
 * @responsibility ユーザー登録フォーム表示と処理
 */

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/cloudflare';
import { json, redirect } from '@remix-run/cloudflare';
import { Form, Link, useActionData, useLoaderData, useNavigation, useSearchParams } from '@remix-run/react';
import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { parseWithValibot } from '@conform-to/valibot';

// CSS imports
import '~/styles/account/layer2-common.css';
import '~/styles/account/layer2-authentication.css';
import '~/styles/account/layer3-authentication.css';

// Spec loader
import { loadSpec, loadSharedSpec } from '~/spec-loader/specLoader.server';
import type { AccountAuthenticationSpec } from '~/specs/account/types';
import type { ProjectSpec } from '~/specs/shared/types';

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

// Schema layer (Valibot)
import { RegisterSchema } from '~/specs/account/authentication-schema';

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const projectName = data?.projectName || 'ClaudeMix';
  return [
    { title: `会員登録 - ${projectName}` },
    { name: 'description', content: `${projectName}のアカウントを作成` },
  ];
};

interface ActionData {
  error?: string;
  lastResult?: any; // Conform submission result
}

interface LoaderData {
  projectName: string;
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
  const projectSpec = loadSharedSpec<ProjectSpec>('project');

  const session = await getSession(request, context as any);
  if (session) {
    const url = new URL(request.url);
    const redirectUrl = url.searchParams.get('redirect-url') || url.searchParams.get('returnTo') || spec.server_io.loader.authenticated_redirect;
    return redirect(redirectUrl);
  }

  return json<LoaderData>({
    projectName: projectSpec.project.name,
    uiSpec: {
      title: spec.routes.register.title,
      subtitle: `${projectSpec.project.name}のアカウントを作成`,
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
  const redirectUrl = formData.get('redirectUrl');

  // Conform + Valibot: Parse and validate form data
  const submission = parseWithValibot(formData, {
    schema: RegisterSchema,
  });

  // Validation failed: return errors
  if (submission.status !== 'success') {
    return json<ActionData>(
      { lastResult: submission.reply() },
      { status: 400 }
    );
  }

  // Type-safe data extraction
  const { email, password } = submission.value;

  // Sanitize email (pure logic layer)
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
  const passwordHash = await hashPassword(password);

  // Create user
  try {
    await createUser(sanitizedEmail, passwordHash, context as any);
  } catch (error) {
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

    // Set session cookie and redirect to /account or redirect-url
    const targetUrl = (typeof redirectUrl === 'string' && redirectUrl)
      ? redirectUrl
      : spec.server_io.action.default_redirect;
    return redirect(targetUrl, {
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
  const [searchParams] = useSearchParams();
  const isSubmitting = navigation.state === 'submitting';
  const redirectUrl = searchParams.get('redirect-url') || searchParams.get('returnTo') || '/account';
  const { uiSpec } = loaderData;

  // Conform: Form state management
  const [form, fields] = useForm({
    lastResult: actionData?.lastResult,
    onValidate({ formData }) {
      return parseWithValibot(formData, { schema: RegisterSchema });
    },
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',
  });

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

        <Form method="post" className="auth-form-structure" {...getFormProps(form)}>
          <input type="hidden" name="redirectUrl" value={redirectUrl} />
          <div className="form-field-structure">
            <label htmlFor={fields.email.id}>{uiSpec.fields.email.label}</label>
            <input
              {...getInputProps(fields.email, { type: 'email' })}
              className="form-field__input"
              autoComplete="email"
              data-testid="email-input"
            />
            {fields.email.errors && (
              <span id={fields.email.errorId} className="error-message-structure" role="alert" data-testid="error-message">
                {fields.email.errors}
              </span>
            )}
          </div>

          <div className="form-field-structure">
            <label htmlFor={fields.password.id}>{uiSpec.fields.password.label}</label>
            <input
              {...getInputProps(fields.password, { type: 'password' })}
              className="form-field__input"
              autoComplete="new-password"
              data-testid="password-input"
            />
            {fields.password.errors && (
              <span id={fields.password.errorId} className="error-message-structure" role="alert" data-testid="error-message">
                {fields.password.errors}
              </span>
            )}
          </div>

          <div className="form-field-structure">
            <label htmlFor={fields.passwordConfirm.id}>{uiSpec.fields.confirmPassword.label}</label>
            <input
              {...getInputProps(fields.passwordConfirm, { type: 'password' })}
              className="form-field__input"
              autoComplete="new-password"
              data-testid="password-confirm-input"
            />
            {fields.passwordConfirm.errors && (
              <span id={fields.passwordConfirm.errorId} className="error-message-structure" role="alert" data-testid="error-message">
                {fields.passwordConfirm.errors}
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
            to={`/login?redirect-url=${encodeURIComponent(redirectUrl)}`}
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
