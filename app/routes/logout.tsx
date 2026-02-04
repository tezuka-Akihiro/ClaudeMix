import type { ActionFunctionArgs } from '@remix-run/cloudflare';
import { redirect } from '@remix-run/cloudflare';
import { destroyUserSession } from '~/data-io/account/common/session.server';

export async function action({ request, context }: ActionFunctionArgs) {
  const cookie = await destroyUserSession(request, context);
  return redirect('/login', {
    headers: { 'Set-Cookie': cookie },
  });
}
