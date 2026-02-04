import type { LoaderFunctionArgs } from '@remix-run/cloudflare';
import { redirect } from '@remix-run/cloudflare';
import { getAuthenticator } from '~/data-io/account/common/authenticator.server';
import { commitUserSession } from '~/data-io/account/common/session.server';

export async function loader({ request, context }: LoaderFunctionArgs) {
  const authenticator = getAuthenticator(context);
  try {
    const user = await authenticator.authenticate('google', request);
    const cookie = await commitUserSession(user, context);

    return redirect('/account', {
      headers: { 'Set-Cookie': cookie },
    });
  } catch (error) {
    console.error('Google Auth Error:', error);
    return redirect('/login?error=oauth-failed');
  }
}
