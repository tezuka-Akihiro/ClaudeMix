/**
 * OtpVerifyForm.tsx
 * Purpose: OTP verification form component
 *
 * @layer UI層 (components)
 * @responsibility OTP認証コード入力フォームの表示
 */

import { Form } from '@remix-run/react';

export interface OtpVerifyFormUiSpec {
  title: string;
  fields: {
    otpCode: {
      label: string;
      placeholder: string;
      name: string;
      inputmode: 'numeric';
      maxlength: number;
      autocomplete: string;
    };
  };
  submitButton: {
    label: string;
    loadingLabel: string;
  };
  links: {
    resend: { label: string };
    back: { label: string; path: string };
  };
}

interface OtpVerifyFormProps {
  email: string;
  error?: string;
  uiSpec: OtpVerifyFormUiSpec;
  isSubmitting: boolean;
}

export function OtpVerifyForm({ email, error, uiSpec, isSubmitting }: OtpVerifyFormProps) {
  return (
    <>
      {error && (
        <div className="error-message-structure" role="alert" data-testid="error-message">
          <span>{error}</span>
        </div>
      )}

      <Form method="post" className="auth-form-structure">
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="intent" value="verify-otp" />

        <div className="form-field-structure">
          <label htmlFor="otpCode">{uiSpec.fields.otpCode.label}</label>
          <input
            id="otpCode"
            name={uiSpec.fields.otpCode.name}
            type="text"
            className="form-field__input"
            placeholder={uiSpec.fields.otpCode.placeholder}
            inputMode={uiSpec.fields.otpCode.inputmode}
            maxLength={uiSpec.fields.otpCode.maxlength}
            autoComplete={uiSpec.fields.otpCode.autocomplete}
            autoFocus
            data-testid="otp-code-input"
          />
        </div>

        <button
          type="submit"
          className="btn-primary"
          disabled={isSubmitting}
          data-testid="otp-verify-button"
        >
          {isSubmitting ? uiSpec.submitButton.loadingLabel : uiSpec.submitButton.label}
        </button>
      </Form>

      <div className="auth-otp-actions" style={{ textAlign: 'center', marginTop: 'var(--spacing-3)' }}>
        <Form method="post" style={{ display: 'inline' }}>
          <input type="hidden" name="email" value={email} />
          <input type="hidden" name="intent" value="resend-otp" />
          <button
            type="submit"
            className="auth-link-button"
            data-testid="otp-resend-link"
            disabled={isSubmitting}
          >
            {uiSpec.links.resend.label}
          </button>
        </Form>

        <p style={{ marginTop: 'var(--spacing-2)' }}>
          <a
            href={uiSpec.links.back.path}
            className="auth-link"
            data-testid="otp-back-link"
          >
            {uiSpec.links.back.label}
          </a>
        </p>
      </div>
    </>
  );
}
