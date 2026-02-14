/**
 * DeleteAccountModal.test.tsx
 * Unit tests for DeleteAccountModal component
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DeleteAccountModal } from './DeleteAccountModal';

// Mock Remix components/hooks
vi.mock('@remix-run/react', () => ({
  Form: ({ children }: { children: React.ReactNode }) => <form>{children}</form>,
  useNavigation: () => ({
    state: 'idle',
  }),
}));

describe('DeleteAccountModal', () => {
  const mockSpec = {
    title: 'アカウント削除',
    warning_message: '退会すると即座にアクセスできなくなります。30日後にすべてのデータが完全に削除されます。',
    fields: {
      current_password: {
        label: 'パスワード',
        placeholder: '本人確認のため入力してください',
      },
      confirmation: {
        label: '削除を確認しました',
      },
    },
    submit_button: {
      label: 'アカウントを削除する',
      loading_label: '削除中...',
    },
    cancel_button: {
      label: 'キャンセル',
    },
  };

  it('should render the warning message', () => {
    render(
      <DeleteAccountModal
        isOpen={true}
        onClose={vi.fn()}
        spec={mockSpec as any}
      />
    );
    expect(screen.getByText('退会すると即座にアクセスできなくなります。30日後にすべてのデータが完全に削除されます。')).toBeDefined();
  });

  it('should render form fields', () => {
    render(
      <DeleteAccountModal
        isOpen={true}
        onClose={vi.fn()}
        spec={mockSpec as any}
      />
    );
    expect(screen.getByTestId('current-password-input')).toBeDefined();
    expect(screen.getByTestId('confirmation-checkbox')).toBeDefined();
  });
});
