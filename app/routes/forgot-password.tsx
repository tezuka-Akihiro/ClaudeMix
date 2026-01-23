/**
 * forgot-password.tsx
 * Purpose: Password reset request page
 *
 * @layer UI層 (routes)
 * @responsibility パスワードリセット要求の処理
 */

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';
import { Form, useActionData, useLoaderData, useNavigation } from '@remix-run/react';
import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { parseWithValibot } from '@conform-to/valibot';

// Spec loader
import { loadSpec } from '~/spec-loader/specLoader.server';
import type { AccountAuthenticationSpec } from '~/specs/account/types';

// Data-IO layer
import { generatePasswordResetToken } from '~/data-io/account/authentication/generatePasswordResetToken.server';
import { getUserByEmail } from '~/data-io/account/authentication/getUserByEmail.server';

// Pure logic layer
import { sanitizeEmail } from '~/lib/account/authentication/sanitizeEmail';
import { validateEmail } from '~/lib/account/authentication/validateEmail';

// Schema layer (Valibot)
import { ForgotPasswordSchema } from '~/schemas/account/authentication-schema';

// CSS imports
import '~/styles/account/layer2-common.css';
import '~/styles/account/layer2-authentication.css';
import '~/styles/account/layer3-authentication.css';

export const meta: MetaFunction = () => {
  return [
    { title: 'パスワードリセット - ClaudeMix' },
    { name: 'description', content: 'パスワードリセット' },
  ];
};

interface ActionData {
  success?: string;
  error?: string;
  lastResult?: any; // Conform submission result
}

interface LoaderData {
  uiSpec: {
    title: string;
    description: string;
    field: {
      label: string;
    };
    submitButton: {
      label: string;
      loadingLabel: string;
    };
    links: {
      loginLabel: string;
      loginPath: string;
    };
  };
}

/**
 * Loader: Provide UI spec to client
 */
export async function loader({ request, context }: LoaderFunctionArgs) {
  const spec = loadSpec<AccountAuthenticationSpec>('account/authentication');

  return json<LoaderData>({
    uiSpec: {
      title: spec.forms.forgot_password.title,
      description: spec.forms.forgot_password.description,
      field: {
        label: spec.forms.forgot_password.fields.email.label,
      },
      submitButton: {
        label: spec.forms.forgot_password.submit_button.label,
        loadingLabel: spec.forms.forgot_password.submit_button.loading_label,
      },
      links: {
        loginLabel: spec.forms.forgot_password.links.login.label,
        loginPath: spec.forms.forgot_password.links.login.path,
      },
    },
  });
}

/**
 * Action: Handle password reset request
 */
export async function action({ request, context }: ActionFunctionArgs) {
  const spec = loadSpec<AccountAuthenticationSpec>('account/authentication');

  const formData = await request.formData();

  // Conform + Valibot: Parse and validate form data
  const submission = parseWithValibot(formData, {
    schema: ForgotPasswordSchema,
  });

  // Validation failed: return errors
  if (submission.status !== 'success') {
    return json<ActionData>(
      { lastResult: submission.reply() },
      { status: 400 }
    );
  }

  // Type-safe data extraction
  const { email } = submission.value;

  // Sanitize email (pure logic layer)
  const sanitizedEmail = sanitizeEmail(email);

  // Check if user exists
  const user = await getUserByEmail(sanitizedEmail, context as any);

  // Security: Always show success message, even if email doesn't exist
  // This prevents email enumeration attacks
  if (user) {
    try {
      // Generate and store token in KV
      const token = await generatePasswordResetToken(sanitizedEmail, context as any);

      // TODO: Send email with reset link
      // In production: await sendPasswordResetEmail(sanitizedEmail, token);
      // For MVP/development: Log the reset link
      const resetLink = `http://localhost:8788/reset-password/${token}`;
      console.log('========================================');
      console.log('PASSWORD RESET LINK (MVP - Check console):');
      console.log(`Email: ${sanitizedEmail}`);
      console.log(`Link: ${resetLink}`);
      console.log('========================================');
    } catch (error) {
      console.error('Error generating password reset token:', error);
      // Still show success message to user (security)
    }
  }

  // Always return success message (security: don't reveal if email exists)
  return json<ActionData>({
    success: spec.forms.forgot_password.success_message,
  });
}

export default function ForgotPassword() {
  const actionData = useActionData<typeof action>();
  const loaderData = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';
  const { uiSpec } = loaderData;

  // Conform: Form state management
  const [form, fields] = useForm({
    lastResult: actionData?.lastResult,
    onValidate({ formData }) {
      return parseWithValibot(formData, { schema: ForgotPasswordSchema });
    },
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',
  });

  return (
    <main className="auth-container auth-container-structure">
      <div className="auth-card auth-card-structure">
        <h1 className="auth-header__title">{uiSpec.title}</h1>

        <p className="auth-header__subtitle">
          {uiSpec.description.split('\n').map((line, i) => (
            <span key={i}>
              {line}
              {i < uiSpec.description.split('\n').length - 1 && <br />}
            </span>
          ))}
        </p>

        {actionData?.success && (
          <div className="error-message-structure" role="alert" data-testid="success-message" style={{ backgroundColor: 'var(--color-status-success-bg)', borderColor: 'var(--color-status-success)', color: 'var(--color-status-success)' }}>
            {actionData.success}
          </div>
        )}

        {actionData?.error && (
          <div className="error-message-structure" role="alert" data-testid="error-message">
            {actionData.error}
          </div>
        )}

        <Form method="post" className="auth-form-structure" {...getFormProps(form)}>
          <div className="form-field-structure">
            <label htmlFor={fields.email.id} className="form-field__label">
              {uiSpec.field.label}
            </label>
            <input
              {...getInputProps(fields.email, { type: 'email' })}
              className="form-field__input"
              autoComplete="email"
              data-testid="email-input"
            />
            {fields.email.errors && (
              <span id={fields.email.errorId} className="form-field__error" role="alert">{fields.email.errors}</span>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary"
            data-testid="submit-button"
          >
            {isSubmitting ? uiSpec.submitButton.loadingLabel : uiSpec.submitButton.label}
          </button>
        </Form>

        <p className="auth-link" style={{ textAlign: 'center', marginTop: 'var(--spacing-3)' }}>
          <a href={uiSpec.links.loginPath}>
            {uiSpec.links.loginLabel}
          </a>
        </p>
      </div>
    </main>
  );
}
