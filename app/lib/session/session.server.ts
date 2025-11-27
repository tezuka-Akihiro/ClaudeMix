/**
 * セッションストレージ管理
 * Remix Cookie Session Storageを使用
 */

import { createCookieSessionStorage, redirect } from "@remix-run/cloudflare";
import type { User } from "./session.types";

// Cloudflare環境では環境変数は異なる方法で取得される可能性があるため、
// デフォルト値を設定（本番環境ではCloudflareダッシュボードで設定）
const sessionSecret = process.env.SESSION_SECRET || "default-dev-secret-change-in-production";
if (!sessionSecret) {
  throw new Error("SESSION_SECRET must be set");
}

const { getSession, commitSession, destroySession } =
  createCookieSessionStorage({
    cookie: {
      name: "__session",
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7, // 7日間
      path: "/",
      sameSite: "lax",
      secrets: [sessionSecret],
      secure: process.env.NODE_ENV === "production",
    },
  });

export { getSession, commitSession, destroySession };

/**
 * リクエストからユーザー情報を取得
 */
export async function getUserFromSession(
  request: Request
): Promise<User | null> {
  const session = await getSession(request.headers.get("Cookie"));
  const userId = session.get("userId");
  if (!userId) return null;

  return {
    id: userId,
    name: session.get("userName"),
  };
}

/**
 * ユーザーセッションを作成してリダイレクト
 */
export async function createUserSession(
  userId: string,
  userName: string,
  redirectTo: string
) {
  const session = await getSession();
  session.set("userId", userId);
  session.set("userName", userName);

  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
}

/**
 * セッションを破棄してリダイレクト
 */
export async function logout(request: Request) {
  const session = await getSession(request.headers.get("Cookie"));
  return redirect("/login", {
    headers: {
      "Set-Cookie": await destroySession(session),
    },
  });
}
