import { FormStrategy } from 'remix-auth-form';
import { userRepository } from '../userRepository.server';
import { verifyPassword } from '../verifyPassword.server'; // I need to check where this is
import { hashPassword } from '../hashPassword.server';
import { validateEmail } from '~/lib/account/authentication/validateEmail';

/**
 * Configure Form Strategy
 */
export function getFormStrategy(context: any) {
  return new FormStrategy(async ({ form }) => {
    const email = form.get('email') as string;
    const password = form.get('password') as string;
    const intent = form.get('intent') as string;

    if (!validateEmail(email)) throw new Error('Invalid email');

    if (intent === 'register') {
      const existingUser = await userRepository.findByEmail(email, context);
      if (existingUser) throw new Error('Email already exists');

      const passwordHash = await hashPassword(password);
      return await userRepository.createUser(
        { email, password_hash: passwordHash },
        context
      );
    } else {
      const user = await userRepository.findByEmail(email, context);
      if (!user || !user.password_hash) throw new Error('Invalid credentials');

      const isValid = await verifyPassword(password, user.password_hash);
      if (!isValid) throw new Error('Invalid credentials');

      return user;
    }
  });
}
