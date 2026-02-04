import { GoogleStrategy } from 'remix-auth-google';
import { authMapper } from '../mappers/authMapper.server';
import { authLogic } from '~/lib/account/authentication/authLogic';
import { userRepository } from '../userRepository.server';

/**
 * Configure Google Strategy
 */
export function getGoogleStrategy(context: any) {
  const env = context.cloudflare?.env || context.env;

  return new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: env.GOOGLE_REDIRECT_URI || 'http://localhost:8788/auth/callback/google',
    },
    async ({ profile }) => {
      // 1. Mapping
      const domainProfile = authMapper.toDomainProfile(profile);

      // 2. Logic (Pure)
      const validatedData = authLogic.processProfile(domainProfile);

      // 3. Side Effect (D1)
      let user = await userRepository.findByOAuth('google', domainProfile.id, context);

      if (!user) {
        // Auto-register if not exists
        user = await userRepository.createUser({
          email: validatedData.email,
          oauth_provider: 'google',
          oauth_id: domainProfile.id
        }, context);
      }

      return user;
    }
  );
}
