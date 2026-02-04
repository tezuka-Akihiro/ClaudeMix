import { createWorkersKVSessionStorage } from '@remix-run/cloudflare';
import type { User } from '~/specs/account/types';

/**
 * Configure Session Storage using Cloudflare Workers KV
 */
export function getSessionStorage(context: any) {
  const env = context.cloudflare?.env || context.env;

  if (!env?.SESSION_KV) {
    throw new Error('SESSION_KV binding is not configured');
  }

  return createWorkersKVSessionStorage({
    kv: env.SESSION_KV,
    cookie: {
      name: '__account_session',
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      secrets: [env.SESSION_SECRET || 's3cr3t'],
    },
  });
}

/**
 * Session Helper for remix-auth v4
 */
export async function getSessionUser(request: Request, context: any): Promise<User | null> {
  const storage = getSessionStorage(context);
  const session = await storage.getSession(request.headers.get('Cookie'));
  return session.get('user') || null;
}

export async function commitUserSession(user: User, context: any): Promise<string> {
  const storage = getSessionStorage(context);
  const session = await storage.getSession();
  session.set('user', user);
  return await storage.commitSession(session);
}

export async function destroyUserSession(request: Request, context: any): Promise<string> {
  const storage = getSessionStorage(context);
  const session = await storage.getSession(request.headers.get('Cookie'));
  return await storage.destroySession(session);
}
