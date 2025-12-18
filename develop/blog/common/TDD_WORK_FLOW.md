# TDD作業手順書: Common Components

## 1. 概要

**開発名**: blog/common - Common Components の実装
**目的**: ブログサービス全体で使用される共通コンポーネント（ヘッダー、フッター、レイアウト）を実装し、統一されたUI/UXを提供する

## 2. 開発方針

- **Outside-In TDD (外側から内側へのTDD)**: ユーザーの振る舞いを定義するE2Eテスト（外側）から開発を始め、それをパスさせるために必要な各層の機能（内側）をユニットTDDで実装します。これは **受け入れテスト駆動開発 (ATDD)** の一種です。
- **段階的E2Eテスト戦略**:
    1. **E2Eファースト**: 最初に主要な成功シナリオ（Happy Path）のE2Eテストを1つだけ作成し、開発の最終ゴールを定義します。
    2. **Double-Loop TDD**: E2Eテスト（Outer Loop）をパスさせるために、各層（UI, Logic, Data-IO）でユニットテスト（Inner Loop）のTDDサイクルを回して実装を進めます。
    3. **E2E拡張**: 最初のE2Eテストが成功した後、エラーケースや境界値などの詳細なE2Eテストを追加し、品質を盤石にします。
- **モック不要方針**:
  - このセクションは実装が単純（loadBlogConfig.server: 5分、copyrightFormatter: 2分程度）のため、モック段階をスキップします。
  - 詳細は `MOCK_POLICY.md` を参照してください。

---

## 3. 作業手順 (WBS)

### Phase 1: E2Eファースト (Happy Pathの定義) 🔴未着手

- **1. E2Eテストの準備**:
  - **`common`セクションの場合**: 画面レベルのE2Eテストファイル `tests/e2e/screen/blog.screen.spec.ts` を**新規作成**します。
    - **依頼例**: `@GeneratorOperator "blog サービスの画面レベルE2Eテストを作成して"`
  - **テスト内容**:
    - ブログページ（`/blog`）が正常に表示されること
    - BlogHeader（タイトル、menuボタン）が表示されること
    - BlogFooter（コピーライト）が表示されること
    - NavigationMenu（メニュー開閉、項目クリック）が動作すること

- **2. テストの失敗を確認**: `npm run test:e2e` を実行し、実装がまだ存在しないため、このテストが失敗すること（RED）を確認します。
  - この失敗したテストが、Phase 2で実装すべき機能の明確なゴールとなります。

### Phase 2: CSS実装（Layer 2/3/4） 🔴未着手

**目的**: `uiux-spec.md` で設計した内容を、実際のCSSファイルとして実装します。

**実装対象**:

1. **Layer 2**: `app/styles/blog/layer2.css` - コンポーネントの見た目（色、フォント、影など）
2. **Layer 3**: `app/styles/blog/layer3.ts` - レイアウト構造（flexbox、grid）
3. **Layer 4**: `app/styles/blog/layer4.ts` - 例外的な構造（必要な場合のみ）

**段階的更新の運用**:

- **初回セクション（commonセクション）**: 新規サービス実装時は、**必ずcommonセクションを最初に実施**します
  - `uiux-spec.md` で画面共通コンポーネント（ページコンテナ、ヘッダー、フッター等）のCSS設計を行います
  - このフェーズでCSS実装ファイル（layer2.css等）を新規作成し、サービス全体のCSS基盤を確立します

**手順**:

1. **Layer 2 実装**:
   - `uiux-spec.md` で定義したコンポーネントを元に `layer2.css` を実装
   - 実装するコンポーネント:
     - `.blog-layout` - 全体レイアウトコンテナ
     - `.blog-header` - ヘッダー
     - `.blog-footer` - フッター
     - `.navigation-menu` - ナビゲーションメニュー
   - すべての値は `var(--*)` でLayer 1トークンを参照

2. **Layer 3 実装**:
   - `uiux-spec.md` の「認定済み並列配置」セクションを元に `layer3.ts` を実装
   - 実装するレイアウト:
     - BlogHeader内の左右配置（タイトル | menuボタン）
     - NavigationMenu内の縦並び配置（メニュー項目）
   - Tailwind plugin形式（`addComponents`）でレイアウトを定義

3. **Layer 4 実装**（必要な場合のみ）:
   - このセクションでは例外的な構造は不要

4. **検証**:

   ```bash
   npm run lint:css-arch
   ```

   - 違反が検出された場合は `tests/lint/css-arch-layer-report.md` の内容に従って修正

5. **確認事項**:
   - ✅ Layer 2で色・サイズ・タイポグラフィが定義されている
   - ✅ Layer 3でフレックス・グリッドレイアウトのみが定義されている
   - ✅ margin が使用されていない（gap統一の原則）
   - ✅ `!important` が使用されていない
   - ✅ リント検証に合格している

### Phase 3: 層別TDD (ユニット/コンポーネント実装) 🔴未着手

#### 3.1. 🔌 副作用層の実装（Phase 3.1 - 最初に実装）

**実装順序**: モック不要のため、data-io層から開始します。

##### 3.1.1. loadBlogConfig.server.ts

- **1. ファイル生成**: `@GeneratorOperator` に依頼して、副作用層のファイルを生成します。

  ```text
  @GeneratorOperator "blogサービスのcommonセクションに、loadBlogConfigという名前のdata-ioファイルを作成してください。
  - ブログ設定情報（タイトル、メニュー項目、コピーライト）を返す
  - 固定の設定値を返す（外部ファイル読み込みは不要）

  service: blog
  section: common
  name: loadBlogConfig.server
  category: data-io"
  ```

- **2. テスト実装 (RED)**: `loadBlogConfig.server.test.ts` に、以下のテストケースを記述します。
  - ブログタイトルが正しく返されること
  - メニュー項目が正しく返されること（挨拶記事、Articles）
  - コピーライトが正しく返されること

- **3. 実装 (GREEN)**: `loadBlogConfig.server.ts` を実装し、テストをパスさせます。

  ```typescript
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

- **4. リファクタリング**: 必要に応じてコードの可読性を向上させます。

#### 3.2. 🧠 純粋ロジック層の実装（Phase 3.2）

##### 3.2.1. copyrightFormatter.ts

- **1. ファイル生成**: `@GeneratorOperator` に依頼して、純粋ロジック層のファイルを生成します。

  ```text
  @GeneratorOperator "blogサービスのcommonセクションに、copyrightFormatterという名前のlibファイルを作成してください。
  - コピーライト文字列をフォーマットする純粋関数
  - 年の自動更新機能

  service: blog
  section: common
  name: copyrightFormatter
  category: lib"
  ```

- **2. テスト実装 (RED)**: `copyrightFormatter.test.ts` に、以下のテストケースを記述します。
  - 現在年が正しく挿入されること
  - プロジェクト名が正しく挿入されること
  - フォーマットが正しいこと（例: "© 2025 ClaudeMix"）

- **3. 実装 (GREEN)**: `copyrightFormatter.ts` を実装し、テストをパスさせます。

  ```typescript
  export function formatCopyright(projectName: string = "ClaudeMix"): string {
    const currentYear = new Date().getFullYear();
    return `© ${currentYear} ${projectName}`;
  }
  ```

- **4. リファクタリング**: 必要に応じてコードの効率と可読性を向上させます。

#### 3.3. UI層の実装（Phase 3.3 - 最後に実装）

##### 3.3.1. BlogLayout

- **1. UIコンポーネントの作成**:

  ```text
  @GeneratorOperator "blogサービスのcommonセクションに、BlogLayoutという名前のUIコンポーネントを作成してください。
  - ページ全体のレイアウトコンテナ（Header/Footer/Contentエリア）
  - childrenプロパティでメインコンテンツを受け取る

  service: blog
  section: common
  name: BlogLayout
  category: ui
  ui-type: component"
  ```

- **2. テスト実装 (RED)**: 生成されたテストファイルに、以下のテストケースを記述します。
  - BlogLayoutが正しくレンダリングされること
  - BlogHeader、BlogFooter、childrenが正しく配置されること

- **3. 実装 (GREEN)**: コンポーネントを実装し、テストをパスさせます。
  - **スタイリング制約**:
    - ❌ **フロー制御クラスの直接使用禁止**: `flex`, `grid`, `gap` は直接使用せず、Layer 3で定義された構造クラスを使用
    - ❌ **個別スタイリングの禁止**: `p-4`, `w-1/2` のようなユーティリティクラスを直接組み合わせない
    - ✅ **責務の分離**: Layer 3のレイアウトクラスと、Layer 2の見た目クラスの組み合わせのみを許可

- **4. リファクタリング**: コードの可読性を向上させます。

##### 3.3.2. BlogHeader

- **1. UIコンポーネントの作成**:

  ```text
  @GeneratorOperator "blogサービスのcommonセクションに、BlogHeaderという名前のUIコンポーネントを作成してください。
  - ブログヘッダー（タイトル、menuボタン）
  - メニュー開閉状態の管理

  service: blog
  section: common
  name: BlogHeader
  category: ui
  ui-type: component"
  ```

- **2. テスト実装 (RED)**: 以下のテストケースを記述します。
  - ブログタイトルが表示されること
  - menuボタンが表示されること
  - menuボタンクリックでNavigationMenuが開閉すること
  - タイトルクリックで `/blog` へ遷移すること

- **3. 実装 (GREEN)**: コンポーネントを実装し、テストをパスさせます。

- **4. リファクタリング**: コードの可読性を向上させます。

##### 3.3.3. NavigationMenu

- **1. UIコンポーネントの作成**:

  ```text
  @GeneratorOperator "blogサービスのcommonセクションに、NavigationMenuという名前のUIコンポーネントを作成してください。
  - ナビゲーションメニュー（メニュー項目表示）
  - メニュー項目クリックでページ遷移
  - メニュー外クリックで閉じる
  - Escキー押下で閉じる

  service: blog
  section: common
  name: NavigationMenu
  category: ui
  ui-type: component"
  ```

- **2. テスト実装 (RED)**: 以下のテストケースを記述します。
  - メニュー項目が表示されること
  - メニュー項目クリックでページ遷移すること
  - メニュー外クリックで閉じること
  - Escキー押下で閉じること

- **3. 実装 (GREEN)**: コンポーネントを実装し、テストをパスさせます。

- **4. リファクタリング**: コードの可読性を向上させます。

##### 3.3.4. BlogFooter

- **1. UIコンポーネントの作成**:

  ```text
  @GeneratorOperator "blogサービスのcommonセクションに、BlogFooterという名前のUIコンポーネントを作成してください。
  - ブログフッター（コピーライト表記）

  service: blog
  section: common
  name: BlogFooter
  category: ui
  ui-type: component"
  ```

- **2. テスト実装 (RED)**: 以下のテストケースを記述します。
  - コピーライト表記が表示されること

- **3. 実装 (GREEN)**: コンポーネントを実装し、テストをパスさせます。

- **4. リファクタリング**: コードの可読性を向上させます。

##### 3.3.5. blog/index Route

- **1. Routeファイルの作成**:

  ```text
  @GeneratorOperator "blogサービスのcommonセクションに、blog/indexという名前のrouteファイルを作成してください。
  - ブログトップページのRoute
  - BlogLayoutを使用した最小限の実装
  - loaderでloadBlogConfig.serverを呼び出し、ブログ設定を取得

  service: blog
  section: common
  name: blog/index
  category: ui
  ui-type: route"
  ```

- **2. テスト実装 (RED)**: 以下のテストケースを記述します。
  - loaderが正しくブログ設定を返すこと
  - BlogLayoutが正しくレンダリングされること
  - BlogHeader、BlogFooter、NavigationMenuが含まれること

- **3. 実装 (GREEN)**: Routeを実装し、テストをパスさせます。

  ```typescript
  // app/routes/blog/index.tsx
  import type { LoaderFunctionArgs } from "@remix-run/node";
  import { json } from "@remix-run/node";
  import { useLoaderData } from "@remix-run/react";
  import { BlogLayout } from "~/components/blog/common/BlogLayout";
  import { loadBlogConfig } from "~/data-io/blog/common/loadBlogConfig.server";

  export async function loader({ request }: LoaderFunctionArgs) {
    const config = await loadBlogConfig();
    return json(config);
  }

  export default function BlogIndex() {
    const config = useLoaderData<typeof loader>();
    return (
      <BlogLayout config={config}>
        <div data-testid="main-content">
          <h1>Welcome to {config.blogTitle}</h1>
        </div>
      </BlogLayout>
    );
  }
  ```

- **4. リファクタリング**: コードの可読性を向上させます。

### Phase 4: E2E拡張と統合確認 ✅完了

#### E2Eテスト実施状況

**ステータス**: ✅ 実施済み

- Phase 1で作成したE2Eテストファイル: `tests/e2e/screen/blog.screen.spec.ts`
- `npm run test:e2e` を別環境で実行し、すべてのE2Eテストが成功することを確認済み

#### 実施した検証項目

- **1. TypeScript型チェック**: ✅ PASS
  - `npx tsc --noEmit` を実行し、型エラーがないことを確認

- **2. ビルド検証**: ✅ PASS
  - `npm run build` を実行し、ビルドが成功することを確認
  - 警告: `@import`の順序に関する警告あり（機能には影響なし）

- **3. CSS階層アーキテクチャ検証**: ✅ PASS
  - `npm run lint:css-arch -- --service blog` を実行
  - 違反なし、全てのCSSルールに準拠

- **4. ユニットテスト全件検証**: ✅ PASS (463テスト)
  - `npm test -- --run` を実行
  - プロジェクト全体: 43ファイル、463テスト全パス
  - blog service: 21テスト全パス
    - loadBlogConfig.server: 4テスト
    - copyrightFormatter: 5テスト
    - BlogFooter: 3テスト
    - NavigationMenu: 4テスト
    - BlogHeader: 4テスト
    - BlogLayout: 5テスト

- **5. 表示確認**: ✅ PASS
  - Chrome DevTools MCPを使用してブラウザ表示を確認
  - 確認項目:
    - ✅ ブログページ（`/blog`）の表示
    - ✅ BlogHeader（タイトル、menuボタン）の表示
    - ✅ BlogFooter（© 2025 ClaudeMix）の表示
    - ✅ メニューボタンクリックでNavigationMenuが開く
    - ✅ メニュー外クリックでNavigationMenuが閉じる
    - ✅ Escキー押下でNavigationMenuが閉じる
    - ✅ ヘッダータイトルクリックで `/blog` へ遷移
    - ✅ メニュー項目クリックでページ遷移（未実装ページは404表示、これは正常）

---

## 4. 不具合発見時のフィードバックループ

開発中に予期せぬ不具合が発見された場合、それはテストの抜け漏れを意味します。以下の手順でテストスイートを強化し、同じ不具合の再発を恒久的に防ぎます。

1. **再現テストの作成 (E2E or ユニット)**: まず、発見された不具合を再現する**失敗するテスト**を記述します。
2. **原因特定とユニットテストの強化**: デバッグを行い、不具合の根本原因となっている純粋ロジック（lib）やコンポーネントを特定し、その原因を最小単位で再現する**失敗するユニットテスト**を追加します。
3. **実装の修正 (GREEN)**: 追加したユニットテストがパスするように、原因となったコードを修正します。
4. **再現テストの成功確認 (GREEN)**: 最初に作成した再現テスト（E2E/統合テスト）を実行し、こちらもパスすることを確認します。
5. **知見の共有**: この経験を「学んだこと・気づき」セクションに記録し、チームの知識として蓄積します。

---

## 5. 進捗ログ

| 日付 | 作業内容 | 完了項目 | 次回予定 |
|------|----------|----------|----------|
| 2025-11-14 | TDD_WORK_FLOW.md作成 | 設計ドキュメント完成 | Phase 1: E2Eテスト作成 |
| 2025-11-14 | Phase 1: E2Eファースト | E2Eテスト作成完了（tests/e2e/screen/blog.screen.spec.ts） | Phase 2: CSS実装 |
| 2025-11-14 | Phase 2: CSS実装 | Layer 2/3 CSS実装完了、CSS lint全パス | Phase 3: TDD実装 |
| 2025-11-14 | Phase 3.1: Data-IO層 | loadBlogConfig.server.ts実装完了（4テスト全パス） | Phase 3.2: Pure Logic層 |
| 2025-11-14 | Phase 3.2: Pure Logic層 | copyrightFormatter.ts実装完了（5テスト全パス） | Phase 3.3: UI層 |
| 2025-11-14 | Phase 3.3: UI層 | BlogLayout, BlogHeader, NavigationMenu, BlogFooter, blog/index route実装完了（21テスト全パス） | Phase 4: E2E拡張と統合確認 |
| 2025-11-14 | Phase 4: 統合確認 | TypeScript型チェック、ビルド、CSS lint、全ユニットテスト（463テスト）全パス、Chrome DevTools MCPでの表示確認完了 | E2Eテスト実施 |
| 2025-11-17 | E2Eテスト実施 | E2Eテスト（tests/e2e/screen/blog.screen.spec.ts）全パス確認 | commonセクション完了 ✅ |

## 6. 学んだこと・気づき

- モック不要の判断基準を明確化（実装時間5分以下の場合）
- commonセクションの実装が他のセクション（posts、post-detail）の基盤となるため、最優先で実装する必要がある

## 7. さらなる改善提案

- postsセクション、post-detailセクションの設計・実装
- マークダウン記事の管理方法の検討
- 記事データの永続化方法の検討
