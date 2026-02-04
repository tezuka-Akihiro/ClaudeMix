import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/cloudflare';
import { json, redirect } from '@remix-run/cloudflare';
import { useActionData, Form, Link } from '@remix-run/react';
import { getAuthenticator } from '~/data-io/account/common/authenticator.server';
import { getSessionUser, commitUserSession } from '~/data-io/account/common/session.server';

export async function loader({ request, context }: LoaderFunctionArgs) {
  const user = await getSessionUser(request, context);
  if (user) return redirect('/account');
  return null;
}

export async function action({ request, context }: ActionFunctionArgs) {
  const authenticator = getAuthenticator(context);
  try {
    const user = await authenticator.authenticate('form', request);
    const cookie = await commitUserSession(user, context);

    return redirect('/account', {
      headers: { 'Set-Cookie': cookie },
    });
  } catch (error) {
    if (error instanceof Response) return error;
    return json({ error: (error as Error).message }, { status: 400 });
  }
}

export default function Register() {
  const actionData = useActionData<typeof action>();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <h1 className="mb-6 text-2xl font-bold text-center">会員登録</h1>
        <Form method="post" className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">メールアドレス</label>
            <input
              id="email"
              type="email"
              name="email"
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">パスワード</label>
            <input
              id="password"
              type="password"
              name="password"
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
              required
            />
          </div>
          <div>
            <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-700">パスワード確認</label>
            <input
              id="passwordConfirm"
              type="password"
              name="passwordConfirm"
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
              required
            />
          </div>
          {actionData?.error && (
            <div className="text-sm text-red-600">{actionData.error}</div>
          )}
          <button
            type="submit"
            name="intent"
            value="register"
            className="w-full px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700"
          >
            登録する
          </button>
        </Form>
        <div className="mt-4 text-center">
          <Link to="/login" className="text-sm text-blue-600 hover:underline">
            既にアカウントをお持ちの方はこちら
          </Link>
        </div>
      </div>
    </div>
  );
}
