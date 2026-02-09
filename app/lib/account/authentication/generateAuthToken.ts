/**
 * generateAuthToken.ts
 * Purpose: Pure logic to generate secure tokens for authentication
 *
 * @layer 純粋ロジック層 (lib)
 * @responsibility 認証用トークンやOTPの生成
 */

/**
 * Generate a secure random token for Magic Links
 * @returns A high-entropy hex string
 */
export function generateMagicToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a 6-digit numeric OTP
 * @returns A string representing a 6-digit number
 */
export function generateOtp(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  // Ensure 6 digits by using modulo and padding
  return (array[0] % 1000000).toString().padStart(6, '0');
}
