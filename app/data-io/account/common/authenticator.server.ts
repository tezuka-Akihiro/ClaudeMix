import { Authenticator } from 'remix-auth';
import type { User } from '~/specs/account/types';
import { getFormStrategy } from '../authentication/strategies/form.server';
import { getGoogleStrategy } from '../authentication/strategies/google.server';

let _authenticator: Authenticator<User> | null = null;

/**
 * Get or initialize the Authenticator instance (remix-auth v4)
 */
export function getAuthenticator(context: any): Authenticator<User> {
  if (_authenticator) return _authenticator;

  const authenticator = new Authenticator<User>();

  // Register strategies
  authenticator.use(getFormStrategy(context), 'form');
  authenticator.use(getGoogleStrategy(context), 'google');

  _authenticator = authenticator;
  return authenticator;
}
