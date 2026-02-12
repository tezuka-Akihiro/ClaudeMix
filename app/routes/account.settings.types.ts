/**
 * account.settings.types.ts
 * Shared types for account settings route and handlers
 */

export interface DatabaseUser {
  id: string;
  email: string;
  passwordHash: string;
  subscriptionStatus: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface ActionData {
  success?: string;
  error?: string;
  fieldErrors?: {
    newEmail?: string;
    currentPassword?: string;
    newPassword?: string;
    newPasswordConfirm?: string;
    confirmation?: string;
  };
}
