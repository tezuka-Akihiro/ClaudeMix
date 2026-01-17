// _index - Route: TOPページ
// ランディングページ（/blog/landing/engineer）へリダイレクト

import { redirect } from "@remix-run/node";

export async function loader() {
  // TOPページへのアクセスはランディングページへリダイレクト
  return redirect("/blog/landing/engineer");
}

export default function Index() {
  // loader でリダイレクトされるため、このコンポーネントは表示されない
  return null;
}
