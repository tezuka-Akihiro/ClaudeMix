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
    return json({ error: (error as Error).message }, { status: 401 });
  }
}

export default function Login() {
  const actionData = useActionData<typeof action>();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <h1 className="mb-6 text-2xl font-bold text-center">ログイン</h1>

        <Form action="/auth/google" method="post" className="mb-4">
          <button
            type="submit"
            className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Googleでログイン
          </button>
        </Form>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 text-gray-500 bg-white">または</span>
          </div>
        </div>

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
          {actionData?.error && (
            <div className="text-sm text-red-600">{actionData.error}</div>
          )}
          <button
            type="submit"
            name="intent"
            value="login"
            className="w-full px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700"
          >
            ログイン
          </button>
        </Form>
        <div className="mt-4 text-center">
          <Link to="/register" className="text-sm text-blue-600 hover:underline">
            新規会員登録はこちら
          </Link>
        </div>
      </div>
    </div>
  );
}
