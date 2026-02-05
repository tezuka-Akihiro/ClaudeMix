// terms - Route (routes層)
// /terms へのアクセスを /blog/terms へリダイレクト（外部サービス連携用）

import { redirect } from "@remix-run/cloudflare";
import type { LoaderFunction } from "@remix-run/cloudflare";

export const loader: LoaderFunction = () => {
  return redirect("/blog/terms", 301);
};
