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
import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { parseWithValibot } from '@conform-to/valibot';

// CSS imports
import '~/styles/account/layer2-common.css';
import '~/styles/account/layer2-authentication.css';
import '~/styles/account/layer3-authentication.css';

// UI Components
import { FlashMessage } from '~/components/account/common/FlashMessage';

// Spec loader
import { loadSpec, loadSharedSpec } from '~/spec-loader/specLoader.server';
import type { AccountAuthenticationSpec } from '~/specs/account/types';
import type { ProjectSpec } from '~/specs/shared/types';

// Data-IO layer
import { getUserByEmail } from '~/data-io/account/authentication/getUserByEmail.server';
import { verifyPassword } from '~/data-io/account/authentication/verifyPassword.server';
import { saveSession } from '~/data-io/account/common/saveSession.server';
import { getSession } from '~/data-io/account/common/getSession.server';
import { checkOtpRateLimit } from '~/data-io/account/authentication/checkOtpRateLimit.server';
import { saveOtpToken } from '~/data-io/account/authentication/saveOtpToken.server';
import { sendAuthEmail } from '~/data-io/account/authentication/sendAuthEmail.server';

// Database User type (includes passwordHash for authentication)
interface DatabaseUser {
  id: string;
  email: string;
  passwordHash: string;
  subscriptionStatus: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

// Pure logic layer
import { sanitizeEmail } from '~/lib/account/authentication/sanitizeEmail';
import { validateEmail } from '~/lib/account/authentication/validateEmail';
import { validatePasswordDetailed } from '~/lib/account/authentication/validatePassword';
import { generateOtp } from '~/lib/account/authentication/generateAuthToken';
import { createSessionData } from '~/lib/account/common/createSessionData';

// Schema layer (Valibot)
import { LoginSchema, SendOtpSchema } from '~/specs/account/authentication-schema';

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const projectName = data?.projectName || 'ClaudeMix';
  return [
    { title: `ログイン - ${projectName}` },
    { name: 'description', content: `${projectName}にログイン` },
  ];
};

interface ActionData {
  error?: string;
  lastResult?: any; // Conform submission result
}

interface LoaderData {
  projectName: string;
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
    otp: {
      emailLabel: string;
      emailPlaceholder: string;
      submitLabel: string;
      submitLoadingLabel: string;
    };
  };
}

/**
 * Loader: Check if user is already logged in
 * If logged in, redirect to /account or redirect-url
 * Also extract flash message from URL parameter
 */
export async function loader({ request, context }: LoaderFunctionArgs) {
  const spec = loadSpec<AccountAuthenticationSpec>('account/authentication');
  const projectSpec = loadSharedSpec<ProjectSpec>('project');

  const session = await getSession(request, context as any);
  const url = new URL(request.url);
  if (session) {
    const redirectUrl = url.searchParams.get('redirect-url') || url.searchParams.get('returnTo') || spec.server_io.loader.authenticated_redirect;
    return redirect(redirectUrl);
  }

  // Extract flash message from URL parameter
  const messageKey = url.searchParams.get('message');
  const flashMessage = messageKey && spec.flash_messages[messageKey as keyof typeof spec.flash_messages]
    ? spec.flash_messages[messageKey as keyof typeof spec.flash_messages]
    : undefined;

  return json<LoaderData>({
    projectName: projectSpec.project.name,
    flashMessage,
    uiSpec: {
      title: spec.routes.login.title,
      subtitle: `${projectSpec.project.name}に${spec.routes.login.title.toLowerCase()}`,
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
      otp: {
        emailLabel: spec.forms.send_otp.fields.email.label,
        emailPlaceholder: spec.forms.send_otp.fields.email.placeholder,
        submitLabel: spec.forms.send_otp.submit_button.label,
        submitLoadingLabel: spec.forms.send_otp.submit_button.loading_label,
      },
    },
  });
}

/**
 * Action: Handle login form submission and OTP send
 */
export async function action({ request, context }: ActionFunctionArgs) {
  const spec = loadSpec<AccountAuthenticationSpec>('account/authentication');

  const formData = await request.formData();
  const intent = formData.get('intent') as string;

  // Handle OTP send intent
  if (intent === spec.server_io.action.intents.send_otp) {
    const otpSubmission = parseWithValibot(formData, {
      schema: SendOtpSchema,
    });

    if (otpSubmission.status !== 'success') {
      return json<ActionData>(
        { lastResult: otpSubmission.reply() },
        { status: 400 }
      );
    }

    const sanitizedEmail = sanitizeEmail(otpSubmission.value.email);

    // Rate limit check
    const rateLimitResult = await checkOtpRateLimit(sanitizedEmail, context as any);
    if (!rateLimitResult.allowed) {
      return json<ActionData>(
        { error: spec.error_messages.otp.rate_limited },
        { status: 429 }
      );
    }

    // Generate OTP and save to KV
    const otpCode = generateOtp();
    const saved = await saveOtpToken(sanitizedEmail, otpCode, context as any);
    if (!saved) {
      return json<ActionData>(
        { error: spec.error_messages.otp.send_failed },
        { status: 500 }
      );
    }

    // Send OTP email
    const env = (context as any).cloudflare?.env || (context as any).env;
    await sendAuthEmail({
      to: sanitizedEmail,
      type: 'otp',
      payload: otpCode,
      resendApiKey: env?.RESEND_API_KEY || '',
    });

    // Redirect to OTP verify page
    return redirect(`${spec.routes.otp_verify.path}?email=${encodeURIComponent(sanitizedEmail)}`);
  }

  // Handle password login intent
  const redirectUrl = formData.get('redirectUrl');

  // Conform + Valibot: Parse and validate form data
  const submission = parseWithValibot(formData, {
    schema: LoginSchema,
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

  // Get user by email (cast to DatabaseUser to access passwordHash)
  const user = (await getUserByEmail(sanitizedEmail, context as any)) as DatabaseUser | null;
  if (!user) {
    return json<ActionData>(
      { error: spec.error_messages.authentication.invalid_credentials },
      { status: 401 }
    );
  }

  // Verify password
  const isPasswordValid = await verifyPassword(password, user.passwordHash);
  if (!isPasswordValid) {
    return json<ActionData>(
      { error: spec.error_messages.authentication.invalid_credentials },
      { status: 401 }
    );
  }

  // Create session
  const sessionId = crypto.randomUUID();
  const sessionData = createSessionData(user.id, sessionId);
  const setCookieHeader = await saveSession(sessionData, context as any);

  // Set session cookie and redirect
  const targetUrl = (typeof redirectUrl === 'string' && redirectUrl)
    ? redirectUrl
    : spec.server_io.action.default_redirect;
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
  const redirectUrl = searchParams.get('redirect-url') || searchParams.get('returnTo') || '/account';
  const { uiSpec } = loaderData;

  // Conform: Form state management
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

        <div className="auth-divider" style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0', gap: '1rem' }}>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--color-border, #e5e7eb)' }} />
          <span style={{ color: 'var(--color-text-secondary, #6b7280)', fontSize: 'var(--font-size-sm, 0.875rem)' }}>or</span>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--color-border, #e5e7eb)' }} />
        </div>

        <Form method="post" className="auth-form-structure" style={{ marginBottom: '1.5rem' }}>
          <input type="hidden" name="intent" value="send-otp" />
          <div className="form-field-structure">
            <label htmlFor="otp-email">{uiSpec.otp.emailLabel}</label>
            <input
              id="otp-email"
              name="email"
              type="email"
              className="form-field__input"
              placeholder={uiSpec.otp.emailPlaceholder}
              autoComplete="email"
              data-testid="otp-email-input"
            />
          </div>
          <button
            type="submit"
            className="btn-secondary"
            disabled={isSubmitting}
            data-testid="otp-send-button"
            style={{ width: '100%' }}
          >
            {isSubmitting ? uiSpec.otp.submitLoadingLabel : uiSpec.otp.submitLabel}
          </button>
        </Form>

        <div className="auth-oauth-buttons" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
          <a
            href={`/auth/google?redirect-url=${encodeURIComponent(redirectUrl)}`}
            className="auth-oauth-button"
            data-testid="google-login-button"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem 2rem',
              border: 'none',
              borderRadius: '9999px',
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
            {uiSpec.oauth.googleLabel}
          </a>
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
            to={`/register?redirect-url=${encodeURIComponent(redirectUrl)}`}
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
