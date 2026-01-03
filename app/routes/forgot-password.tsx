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

// Spec loader
import { loadSpec } from '~/spec-loader/specLoader.server';
import type { AccountAuthenticationSpec } from '~/specs/account/types';

// Data-IO layer
import { generatePasswordResetToken } from '~/data-io/account/authentication/generatePasswordResetToken.server';
import { getUserByEmail } from '~/data-io/account/authentication/getUserByEmail.server';

// Pure logic layer
import { sanitizeEmail } from '~/lib/account/authentication/sanitizeEmail';
import { validateEmail } from '~/lib/account/authentication/validateEmail';

// CSS imports
import '~/styles/account/layer2-common.css';

export const meta: MetaFunction = () => {
  return [
    { title: 'パスワードリセット - ClaudeMix' },
    { name: 'description', content: 'パスワードリセット' },
  ];
};

interface ActionData {
  success?: string;
  error?: string;
  fieldErrors?: {
    email?: string;
  };
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
  const email = formData.get('email');

  const fieldErrors: ActionData['fieldErrors'] = {};

  // Validation
  if (typeof email !== 'string' || !email) {
    fieldErrors.email = spec.validation.email.error_messages.required;
  } else if (!validateEmail(email)) {
    fieldErrors.email = spec.validation.email.error_messages.invalid_format;
  }

  if (Object.keys(fieldErrors).length > 0) {
    return json<ActionData>({ fieldErrors }, { status: 400 });
  }

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

  return (
    <div className="auth-container auth-container-structure">
      <div className="auth-card auth-card-structure">
        <h1 className="auth-card__title">{uiSpec.title}</h1>

        <p className="auth-card__description">
          {uiSpec.description.split('\n').map((line, i) => (
            <span key={i}>
              {line}
              {i < uiSpec.description.split('\n').length - 1 && <br />}
            </span>
          ))}
        </p>

        {actionData?.success && (
          <div className="auth-success" role="alert" data-testid="success-message">
            {actionData.success}
          </div>
        )}

        {actionData?.error && (
          <div className="auth-error" role="alert" data-testid="error-message">
            {actionData.error}
          </div>
        )}

        <Form method="post" className="auth-form">
          <div className="auth-form-field-structure">
            <label htmlFor="email" className="auth-form__label">
              {uiSpec.field.label}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              className={`auth-form__input ${actionData?.fieldErrors?.email ? 'auth-form__input--error' : ''}`}
              required
              data-testid="email-input"
            />
            {actionData?.fieldErrors?.email && (
              <span className="auth-form__error">{actionData.fieldErrors.email}</span>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="auth-form__submit"
            data-testid="submit-button"
          >
            {isSubmitting ? uiSpec.submitButton.loadingLabel : uiSpec.submitButton.label}
          </button>
        </Form>

        <div className="auth-card__footer">
          <a href={uiSpec.links.loginPath} className="auth-card__link">
            {uiSpec.links.loginLabel}
          </a>
        </div>
      </div>
    </div>
  );
}
