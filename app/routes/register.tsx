/**
 * register.tsx
 * Purpose: User registration page
 *
 * @layer UI層 (routes)
 * @responsibility ユーザー登録フォーム表示と処理
 */

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';
import { Form, Link, useActionData, useLoaderData, useNavigation } from '@remix-run/react';
import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { parseWithValibot } from '@conform-to/valibot';

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
import { getAuthenticator } from '~/data-io/account/common/authenticator.server';

// Pure logic layer
import { sanitizeEmail } from '~/lib/account/authentication/sanitizeEmail';

// Schema layer (Valibot)
import { RegisterSchema } from '~/specs/account/authentication-schema';

export const meta: MetaFunction = () => {
  return [
    { title: '会員登録 - ClaudeMix' },
    { name: 'description', content: 'ClaudeMixのアカウントを作成' },
  ];
};

interface ActionData {
  error?: string;
  lastResult?: any;
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

export async function loader({ request, context }: LoaderFunctionArgs) {
  const spec = loadSpec<AccountAuthenticationSpec>('account/authentication');
  const authenticator = getAuthenticator(context as any);

  await authenticator.isAuthenticated(request, {
    successRedirect: spec.server_io.loader.authenticated_redirect,
  });

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

export async function action({ request, context }: ActionFunctionArgs) {
  const spec = loadSpec<AccountAuthenticationSpec>('account/authentication');
  const authenticator = getAuthenticator(context as any);

  // We need to clone the request because we need to read it twice:
  // 1. For manual validation and user creation
  // 2. For authenticator.authenticate
  const clonedRequest = request.clone();
  const formData = await request.formData();

  const submission = parseWithValibot(formData, {
    schema: RegisterSchema,
  });

  if (submission.status !== 'success') {
    return json<ActionData>(
      { lastResult: submission.reply() },
      { status: 400 }
    );
  }

  const { email, password } = submission.value;
  const sanitizedEmail = sanitizeEmail(email);

  const existingUser = await getUserByEmail(sanitizedEmail, context as any);
  if (existingUser) {
    return json<ActionData>(
      { error: spec.error_messages.registration.email_exists },
      { status: 400 }
    );
  }

  const passwordHash = await hashPassword(password);
  const userCreated = await createUser(sanitizedEmail, passwordHash, context as any);

  if (!userCreated) {
    return json<ActionData>(
      { error: spec.error_messages.registration.creation_failed },
      { status: 500 }
    );
  }

  // Log the user in after successful registration
  return await authenticator.authenticate("form", clonedRequest, {
    successRedirect: spec.server_io.action.default_redirect,
    failureRedirect: "/login?message=registration_success",
  });
}

export default function Register() {
  const actionData = useActionData<typeof action>();
  const loaderData = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';
  const { uiSpec } = loaderData;

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
              data-testid="confirm-password-input"
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
