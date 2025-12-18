# MOCK_POLICY.md - Common Components

## 1. モック戦略

**このセクションではモック実装は不要です。**

---

## 2. モックが不要な理由

### 実装の簡易性

このセクションの実装は非常にシンプルであり、モックを作成する時間で実装を完了できます。

| ファイル | 実装内容 | 実装時間（推定） | モックの必要性 |
| :--- | :--- |:---:| :--- |
| **loadBlogConfig.server.ts** | 固定の設定値（タイトル、メニュー項目、コピーライト）を返す。JSONファイル読み込みまたは定数定義で実現可能。 | 5分程度 | ❌ 不要 |
| **copyrightFormatter.ts** | 年を挿入するだけの純粋関数（例: `© ${new Date().getFullYear()} ClaudeMix`） | 2分程度 | ❌ 不要 |
| **UIコンポーネント** | propsを受け取って表示するだけのシンプルな構造 | - | ❌ 不要 |

### モックが有効なケース（このセクションには該当しない）

モック実装が有効なのは、以下のような複雑な処理がある場合です：

- ✅ ファイルシステムの複雑な操作（例: project.toml解析、ファイルアーカイブ）
- ✅ 外部APIの呼び出し
- ✅ データベースアクセス
- ✅ 実装が複雑で時間がかかる処理

**blog/commonセクションには、上記のような複雑な処理が存在しません。**

---

## 3. 推奨される開発アプローチ

### Outside-In TDDの適用方針

1. **Phase 1: E2Eテスト作成**
   - セクションレベルのE2Eテスト（`common.spec.ts`）を先に作成
   - ブログレイアウト、ヘッダー、フッター、メニューの表示確認

2. **Phase 2.1: data-io層の実装**
   - `loadBlogConfig.server.ts` を実装
   - テストで固定データを返すことを確認

3. **Phase 2.2: 純粋ロジック層の実装**
   - `copyrightFormatter.ts` を実装
   - 年の自動更新ロジックをテスト

4. **Phase 2.3: UI層の実装**
   - `BlogLayout.tsx`, `BlogHeader.tsx`, `NavigationMenu.tsx`, `BlogFooter.tsx` を実装
   - 各コンポーネントのユニットテストを作成

### データの扱い方

**実装時から実データを使用します：**

```typescript
// app/data-io/blog/common/loadBlogConfig.server.ts
export async function loadBlogConfig() {
  return {
    blogTitle: "ClaudeMix Blog",
    menuItems: [
      { label: "挨拶記事", path: "/blog/welcome" },
      { label: "Articles", path: "/blog" },
    ],
    copyright: `© ${new Date().getFullYear()} ClaudeMix`,
  };
}
```

**loaderでの使用例：**

```typescript
// app/routes/blog.tsx
import { loadBlogConfig } from "~/data-io/blog/common/loadBlogConfig.server";

export async function loader() {
  const config = await loadBlogConfig();
  return json(config);
}
```

---

## 4. テスト戦略

### UI層のテスト

コンポーネントテストでは、propsとして直接データを渡してテストします：

```typescript
// BlogHeader.test.tsx
import { render, screen } from "@testing-library/react";
import { BlogHeader } from "./BlogHeader";

test("ブログタイトルが表示される", () => {
  render(
    <BlogHeader
      title="ClaudeMix Blog"
      menuItems={[
        { label: "挨拶記事", path: "/blog/welcome" },
        { label: "Articles", path: "/blog" },
      ]}
    />
  );

  expect(screen.getByText("ClaudeMix Blog")).toBeInTheDocument();
});
```

**data-io層のモックは不要です。** コンポーネントはpropsを受け取るだけなので、テストデータを直接渡せば十分です。

---

## 5. 判断基準（将来の参考）

他のセクション（posts、post-detail）で同様の判断をする際の基準：

### モックを作成すべきケース

- 実装が複雑で10分以上かかる見込み
- 外部API、データベース、ファイルシステムへの依存が強い
- UI層の実装を先行したいが、副作用層の実装に時間がかかる

### モックを作成しないケース

- 実装が単純で5分程度で完了する
- 固定データや定数を返すだけの処理
- 純粋関数のみで副作用がない

**blog/commonセクションは後者に該当するため、モックは不要です。**

---

## 6. まとめ

- ✅ Outside-In TDDの原則に従い、E2Eテストから開始
- ✅ モック段階をスキップし、data-io層から順に実装
- ✅ 実装が簡単なため、開発速度の向上が期待できる
- ✅ コードの複雑性を減らし、保守性を向上
