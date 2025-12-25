/**
 * createUser.server.ts
 * Purpose: Create new user in Cloudflare D1 database
 *
 * @layer 副作用層 (Data-IO)
 * @responsibility Cloudflare D1データベース書き込み（ユーザー作成）
 */

interface CloudflareEnv {
  DB: D1Database;
}

interface CloudflareLoadContext {
  env: CloudflareEnv;
}

/**
 * Create a new user in D1 database
 *
 * @param email - User's email address
 * @param passwordHash - Hashed password
 * @param context - Cloudflare context with D1 database
 * @returns true if user created successfully, false otherwise
 *
 * Security:
 * - Uses parameterized queries to prevent SQL injection
 * - Generates secure random user ID
 */
export async function createUser(
  email: string,
  passwordHash: string,
  context: CloudflareLoadContext
): Promise<boolean> {
  try {
    // Validate inputs
    if (!email || !passwordHash) {
      return false;
    }

    const db = context.env.DB;

    // Generate user ID and timestamps
    const userId = crypto.randomUUID();
    const now = new Date().toISOString();

    // Insert user with parameterized query
    const stmt = db
      .prepare(
        'INSERT INTO users (id, email, passwordHash, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)'
      )
      .bind(userId, email, passwordHash, now, now);

    await stmt.run();

    return true;
  } catch (error) {
    console.error('Error creating user:', error);
    return false; // Fail-safe: return false on error (e.g., duplicate email)
  }
}
