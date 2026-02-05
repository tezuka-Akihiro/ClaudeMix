/**
 * login.tsx
 * Purpose: User login page using Remix Auth
 *
 * @layer UI層 (routes)
 * @responsibility ユーザーログインフォーム表示とRemix Authによる認証
 */

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';
import { Form, Link, useActionData, useLoaderData, useNavigation, useSearchParams } from '@remix-run/react';
import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { parseWithValibot } from '@conform-to/valibot';

// CSS imports
import '~/styles/account/layer2-common.css';
import '~/styles/account/layer2-authentication.css';
import '~/styles/account/layer3-authentication.css';

// UI Components
import { FlashMessage } from '~/components/account/common/FlashMessage';

// Spec loader
import { loadSpec } from '~/spec-loader/specLoader.server';
import type { AccountAuthenticationSpec } from '~/specs/account/types';

// Data-IO layer
import { getAuthenticator } from '~/data-io/account/common/authenticator.server';

// Schema layer (Valibot)
import { LoginSchema } from '~/specs/account/authentication-schema';

export const meta: MetaFunction = () => {
  return [
    { title: 'ログイン - ClaudeMix' },
    { name: 'description', content: 'ClaudeMixにログイン' },
  ];
};

interface ActionData {
  error?: string;
  lastResult?: any;
}

interface LoaderData {
  flashMessage?: string;
  uiSpec: {
    title: string;
    subtitle: string;
    fields: {
      email: {
        label: string;
        placeholder: string;
      };
      password: {
        label: string;
        placeholder: string;
      };
    };
    submitButton: {
      label: string;
      loadingLabel: string;
    };
    links: {
      forgotPassword: string;
      registerPrompt: string;
      registerLink: string;
    };
    oauth: {
      googleLabel: string;
    };
  };
}

export async function loader({ request, context }: LoaderFunctionArgs) {
  const spec = loadSpec<AccountAuthenticationSpec>('account/authentication');
  const authenticator = getAuthenticator(context as any);

  // If already logged in, redirect to dashboard
  await authenticator.isAuthenticated(request, {
    successRedirect: spec.server_io.loader.authenticated_redirect,
  });

  // Extract flash message from URL parameter
  const url = new URL(request.url);
  const messageKey = url.searchParams.get('message');
  const flashMessage = messageKey && spec.flash_messages[messageKey as keyof typeof spec.flash_messages]
    ? spec.flash_messages[messageKey as keyof typeof spec.flash_messages]
    : undefined;

  return json<LoaderData>({
    flashMessage,
    uiSpec: {
      title: spec.routes.login.title,
      subtitle: `ClaudeMixに${spec.routes.login.title.toLowerCase()}`,
      fields: {
        email: {
          label: spec.forms.login.fields.email.label,
          placeholder: spec.forms.login.fields.email.placeholder,
        },
        password: {
          label: spec.forms.login.fields.password.label,
          placeholder: spec.forms.login.fields.password.placeholder,
        },
      },
      submitButton: {
        label: spec.forms.login.submit_button.label,
        loadingLabel: spec.forms.login.submit_button.loading_label,
      },
      links: {
        forgotPassword: 'パスワードをお忘れですか？',
        registerPrompt: 'アカウントをお持ちでないですか？',
        registerLink: '新規登録',
      },
      oauth: {
        googleLabel: 'Google でログイン',
      },
    },
  });
}

export async function action({ request, context }: ActionFunctionArgs) {
  const spec = loadSpec<AccountAuthenticationSpec>('account/authentication');
  const authenticator = getAuthenticator(context as any);

  // Use a clone for Conform parsing if needed, but Remix Auth will consume the body
  // Actually, we can just call authenticator.authenticate.
  // If we want Conform error messages, we might need a different approach.
  // But for now, let's keep it simple and use authenticator for the actual auth logic.

  try {
    return await authenticator.authenticate("form", request, {
      successRedirect: spec.server_io.action.default_redirect,
      throwOnError: true,
    });
  } catch (error) {
    if (error instanceof Response) throw error;

    // Handle authentication failure
    return json<ActionData>(
      { error: spec.error_messages.authentication.invalid_credentials },
      { status: 401 }
    );
  }
}

export default function Login() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();
  const isSubmitting = navigation.state === 'submitting';
  const redirectUrl = searchParams.get('redirect-url') || '/account';
  const { uiSpec } = loaderData;

  const [form, fields] = useForm({
    lastResult: actionData?.lastResult,
    onValidate({ formData }) {
      return parseWithValibot(formData, { schema: LoginSchema });
    },
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',
  });

  return (
    <main className="auth-container auth-container-structure" data-testid="login-page">
      <div className="auth-card auth-card-structure">
        <h1 className="auth-header__title">{uiSpec.title}</h1>
        <p className="auth-header__subtitle">{uiSpec.subtitle}</p>

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

        <Form method="post" className="auth-form-structure" {...getFormProps(form)}>
          <input type="hidden" name="redirectUrl" value={redirectUrl} />

          <div className="form-field-structure">
            <label htmlFor={fields.email.id}>{uiSpec.fields.email.label}</label>
            <input
              {...getInputProps(fields.email, { type: 'email' })}
              className="form-field__input"
              placeholder={uiSpec.fields.email.placeholder}
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
              placeholder={uiSpec.fields.password.placeholder}
              autoComplete="current-password"
              data-testid="password-input"
            />
            {fields.password.errors && (
              <span id={fields.password.errorId} className="error-message-structure" role="alert" data-testid="error-message">
                {fields.password.errors}
              </span>
            )}
          </div>

          <button type="submit" className="btn-primary" disabled={isSubmitting} data-testid="submit-button">
            {isSubmitting ? uiSpec.submitButton.loadingLabel : uiSpec.submitButton.label}
          </button>
        </Form>

        <div className="auth-oauth-buttons" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
          <Form action="/auth/google" method="post">
            <button
              type="submit"
              className="auth-oauth-button"
              data-testid="google-login-button"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                padding: '1rem 2rem',
                border: 'none',
                borderRadius: '9999px',
                backgroundColor: 'white',
                color: '#3c4043',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" style={{ marginRight: '0.75rem' }}>
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.183l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
              </svg>
              {uiSpec.oauth.googleLabel}
            </button>
          </Form>

        </div>

        <p className="auth-link">
          <Link to="/forgot-password" data-testid="forgot-password-link">
            {uiSpec.links.forgotPassword}
          </Link>
        </p>

        <div style={{ textAlign: 'center', marginTop: 'var(--spacing-3)' }}>
          <p style={{ color: 'var(--color-text-primary)', marginBottom: 'var(--spacing-2)', fontSize: 'var(--font-size-sm)' }}>
            {uiSpec.links.registerPrompt}
          </p>
          <Link
            to="/register"
            className="btn-secondary"
            data-testid="register-link"
            style={{ display: 'inline-block', textDecoration: 'none' }}
          >
            {uiSpec.links.registerLink}
          </Link>
        </div>
      </div>
    </main>
  );
}
