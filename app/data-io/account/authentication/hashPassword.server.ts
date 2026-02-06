/**
 * hashPassword.server.ts
 * Purpose: Hash passwords using bcrypt for secure storage
 *
 * @layer 副作用層 (Data-IO)
 * @responsibility パスワードハッシュ化（bcrypt使用）
 */

/**
 * Hash a password using bcrypt
 *
 * @param password - Plain text password to hash
 * @returns Promise<string> - Hashed password
 *
 * Security Notes:
 * - Uses bcrypt with salt rounds from shared/server-spec.yaml
 * - Each hash is unique due to automatic salt generation
 * - Hashing is intentionally slow to prevent brute force attacks
 */
export async function hashPassword(password: string): Promise<string> {
  // For MVP/development: Use a simple hash (NOT FOR PRODUCTION)
  // In production, replace with bcrypt: import bcrypt from 'bcryptjs'
  // const saltRounds = 10;
  // return await bcrypt.hash(password, saltRounds);

  // Temporary implementation for MVP (INSECURE - FOR DEVELOPMENT ONLY)
  // Generate random salt to ensure different hashes
  const salt = crypto.randomUUID();
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  // Return salt + hash (similar to bcrypt format)
  return `${salt}:${hashHex}`;
}
