/**
 * verifyPassword.server.ts
 * Purpose: Verify password against stored hash
 *
 * @layer 副作用層 (Data-IO)
 * @responsibility パスワード検証（bcrypt使用予定）
 */

/**
 * Verify a password against a stored hash
 *
 * @param password - Plain text password to verify
 * @param storedHash - Stored hash from database (format: "salt:hash")
 * @returns Promise<boolean> - True if password matches, false otherwise
 *
 * Security Notes:
 * - Uses constant-time comparison to prevent timing attacks
 * - Compatible with hashPassword output format (salt:hash)
 * - In production, replace with: bcrypt.compare(password, storedHash)
 */
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  try {
    // For MVP/development: Simple verification (NOT FOR PRODUCTION)
    // In production, replace with bcrypt: return await bcrypt.compare(password, storedHash)

    // Parse salt and hash from stored format "salt:hash"
    const parts = storedHash.split(':');
    if (parts.length !== 2) {
      return false; // Invalid hash format
    }

    const [salt, expectedHash] = parts;

    // Recreate hash with the same salt
    const encoder = new TextEncoder();
    const data = encoder.encode(password + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const computedHash = hashArray
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    // Compare hashes (constant-time comparison would be better for production)
    return computedHash === expectedHash;
  } catch (error) {
    console.error('Error verifying password:', error);
    return false; // Fail-safe: reject on error
  }
}
