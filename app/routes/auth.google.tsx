import type { ActionFunctionArgs } from '@remix-run/cloudflare';
import { getAuthenticator } from '~/data-io/account/common/authenticator.server';

export async function action({ request, context }: ActionFunctionArgs) {
  const authenticator = getAuthenticator(context);
  return await authenticator.authenticate('google', request);
}
