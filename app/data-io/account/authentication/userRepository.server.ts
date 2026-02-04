import type { User } from '~/specs/account/types';

/**
 * User Repository for D1 Database operations
 */
export const userRepository = {
  /**
   * Find user by email
   */
  async findByEmail(email: string, context: any): Promise<User | null> {
    const db = context.cloudflare?.env?.DB || context.env?.DB;
    if (!db) throw new Error('DB binding is missing');

    const result = await db
      .prepare('SELECT * FROM users WHERE email = ?')
      .bind(email)
      .first();

    return result as User | null;
  },

  /**
   * Find user by OAuth provider and ID
   */
  async findByOAuth(provider: string, oauthId: string, context: any): Promise<User | null> {
    const db = context.cloudflare?.env?.DB || context.env?.DB;
    if (!db) throw new Error('DB binding is missing');

    const result = await db
      .prepare('SELECT * FROM users WHERE oauth_provider = ? AND oauth_id = ?')
      .bind(provider, oauthId)
      .first();

    return result as User | null;
  },

  /**
   * Create a new user (Form or OAuth)
   */
  async createUser(
    data: {
      email: string;
      password_hash?: string;
      oauth_provider?: string;
      oauth_id?: string;
    },
    context: any
  ): Promise<User> {
    const db = context.cloudflare?.env?.DB || context.env?.DB;
    if (!db) throw new Error('DB binding is missing');

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await db
      .prepare(
        'INSERT INTO users (id, email, password_hash, oauth_provider, oauth_id, subscription_status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .bind(
        id,
        data.email,
        data.password_hash || null,
        data.oauth_provider || null,
        data.oauth_id || null,
        'inactive',
        now,
        now
      )
      .run();

    const user = await this.findByEmail(data.email, context);
    if (!user) throw new Error('Failed to create user');
    return user;
  }
};
