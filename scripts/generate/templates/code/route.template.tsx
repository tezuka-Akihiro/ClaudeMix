// {{service}} - app/routes: ルート
// データフローとページ構成を担当

import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface {{LOADER_DATA_TYPE}} {
  // TODO: ローダーデータの型定義を追加
}

export async function loader({ request }: LoaderFunctionArgs) {
  // TODO: データ取得ロジックを実装
  // 純粋ロジック層（app/lib）と副作用層（app/data-io）を活用

  return json<{{LOADER_DATA_TYPE}}>({
    // TODO: データを返す
  });
}

export default function {{service}}Page() {
  const data = useLoaderData<typeof loader>();

  return (
    <div>
      <h1>{{service}}</h1>
      {/* TODO: UI コンポーネントを組み合わせてページを構成 */}
      {/* components層のコンポーネントを import して使用 */}
    </div>
  );
}