/**
 * Unit tests for OtpVerifyForm.tsx
 * Purpose: Verify OTP verification form component rendering and behavior
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { loadSpec } from 'tests/utils/loadSpec';
import type { AccountAuthenticationSpec } from '~/specs/account/types';
import { OtpVerifyForm } from './OtpVerifyForm';

// Mock Remix hooks
vi.mock('@remix-run/react', () => ({
  Form: ({ children, ...props }: any) => <form {...props}>{children}</form>,
  useNavigation: () => ({ state: 'idle' }),
}));

describe('OtpVerifyForm', () => {
  let spec: AccountAuthenticationSpec;

  beforeAll(async () => {
    spec = await loadSpec<AccountAuthenticationSpec>('account', 'authentication');
  });

  const defaultProps = {
    email: 'test@example.com',
    error: undefined as string | undefined,
    uiSpec: {
      title: '認証コード入力',
      fields: {
        otpCode: {
          label: '認証コード',
          placeholder: '6桁の認証コードを入力',
          name: 'otpCode',
          inputmode: 'numeric' as const,
          maxlength: 6,
          autocomplete: 'one-time-code',
        },
      },
      submitButton: {
        label: '認証する',
        loadingLabel: '認証中...',
      },
      links: {
        resend: { label: 'コードを再送信' },
        back: { label: 'ログインに戻る', path: '/login' },
      },
    },
    isSubmitting: false,
  };

  describe('Rendering', () => {
    it('should render the OTP input field', () => {
      render(<OtpVerifyForm {...defaultProps} />);
      const input = screen.getByTestId('otp-code-input');
      expect(input).toBeInTheDocument();
    });

    it('should render submit button with spec label', () => {
      render(<OtpVerifyForm {...defaultProps} />);
      const button = screen.getByTestId('otp-verify-button');
      expect(button).toHaveTextContent(defaultProps.uiSpec.submitButton.label);
    });

    it('should render back link', () => {
      render(<OtpVerifyForm {...defaultProps} />);
      const link = screen.getByTestId('otp-back-link');
      expect(link).toBeInTheDocument();
      expect(link).toHaveTextContent(defaultProps.uiSpec.links.back.label);
    });

    it('should render resend link', () => {
      render(<OtpVerifyForm {...defaultProps} />);
      const link = screen.getByTestId('otp-resend-link');
      expect(link).toBeInTheDocument();
      expect(link).toHaveTextContent(defaultProps.uiSpec.links.resend.label);
    });

    it('should include hidden email field', () => {
      render(<OtpVerifyForm {...defaultProps} />);
      const hiddenInput = document.querySelector('input[name="email"]') as HTMLInputElement;
      expect(hiddenInput).toBeInTheDocument();
      expect(hiddenInput.value).toBe(defaultProps.email);
    });
  });

  describe('Error display', () => {
    it('should display error message when error prop is provided', () => {
      render(<OtpVerifyForm {...defaultProps} error="認証コードが正しくありません" />);
      const errorElement = screen.getByTestId('error-message');
      expect(errorElement).toBeInTheDocument();
    });

    it('should not display error when error prop is undefined', () => {
      render(<OtpVerifyForm {...defaultProps} />);
      expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
    });
  });

  describe('Loading state', () => {
    it('should show loading label when submitting', () => {
      render(<OtpVerifyForm {...defaultProps} isSubmitting={true} />);
      const button = screen.getByTestId('otp-verify-button');
      expect(button).toHaveTextContent(defaultProps.uiSpec.submitButton.loadingLabel);
    });

    it('should disable button when submitting', () => {
      render(<OtpVerifyForm {...defaultProps} isSubmitting={true} />);
      const button = screen.getByTestId('otp-verify-button');
      expect(button).toBeDisabled();
    });
  });

  describe('Input attributes', () => {
    it('should have inputMode numeric', () => {
      render(<OtpVerifyForm {...defaultProps} />);
      const input = screen.getByTestId('otp-code-input');
      expect(input).toHaveAttribute('inputMode', 'numeric');
    });

    it('should have maxLength from spec', () => {
      render(<OtpVerifyForm {...defaultProps} />);
      const input = screen.getByTestId('otp-code-input');
      expect(input).toHaveAttribute('maxLength', String(defaultProps.uiSpec.fields.otpCode.maxlength));
    });

    it('should have autocomplete one-time-code', () => {
      render(<OtpVerifyForm {...defaultProps} />);
      const input = screen.getByTestId('otp-code-input');
      expect(input).toHaveAttribute('autoComplete', 'one-time-code');
    });
  });
});
