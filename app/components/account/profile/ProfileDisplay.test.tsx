/**
 * ProfileDisplay.test.tsx
 * Unit tests for ProfileDisplay component
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProfileDisplay } from './ProfileDisplay';

// Mock Remix components/hooks
vi.mock('@remix-run/react', () => ({
  useFetcher: () => ({
    state: 'idle',
    submit: vi.fn(),
  }),
}));

describe('ProfileDisplay', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    subscriptionStatus: 'active',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
    oauthProvider: null,
    googleId: null,
  };

  const mockSpec = {
    sections: {
      info: {
        title: 'アカウント情報',
        fields: {
          email: { label: 'メールアドレス' },
          subscription_status: {
            label: 'サブスクリプション状態',
            values: { active: 'アクティブ', inactive: '未契約' },
          },
          subscription_expiry: { label: '有効期限' },
        },
      },
      subscription: {
        title: 'サブスクリプション設定',
        fields: {
          status: { label: '自動更新', values: { on: 'ON', off: 'OFF' } },
          card: { label: 'カード情報' },
        },
        buttons: {
          interrupt: '自動更新の中断に進む',
          resume: '自動更新を再開する',
          delete_card: 'カード情報を削除する',
        },
        messages: {
          interrupt_confirm: '中断しても {date} までは全機能を利用可能です。',
          resume_notice: '次の決済日は {date} です。',
          delete_card_confirm: 'カード情報を削除します。よろしいですか？',
          delete_card_restriction: '※ 自動更新がONの状態では削除できません。',
          delete_card_error: '先に自動更新を中断してください',
        },
      },
      actions: {
        title: 'アカウント管理',
        buttons: [
          { label: 'メールアドレスを変更', action: 'email-change', variant: 'secondary' },
          { label: 'パスワードを変更', action: 'password-change', variant: 'secondary' },
          { label: 'アカウントを削除', action: 'delete-account', variant: 'danger' },
        ],
      },
    },
  };

  it('should render user information', () => {
    render(
      <ProfileDisplay
        user={mockUser}
        subscription={null}
        spec={mockSpec as any}
        onEmailChange={vi.fn()}
        onPasswordChange={vi.fn()}
        onDeleteAccount={vi.fn()}
      />
    );
    expect(screen.getByText('test@example.com')).toBeDefined();
    expect(screen.getByText('アカウント情報')).toBeDefined();
  });

  it('should render action buttons', () => {
    render(
      <ProfileDisplay
        user={mockUser}
        subscription={null}
        spec={mockSpec as any}
        onEmailChange={vi.fn()}
        onPasswordChange={vi.fn()}
        onDeleteAccount={vi.fn()}
      />
    );
    expect(screen.getByTestId('email-change-button')).toBeDefined();
    expect(screen.getByTestId('password-change-button')).toBeDefined();
    expect(screen.getByTestId('delete-account-button')).toBeDefined();
  });
});
