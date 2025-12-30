# 【機能修正提案】ブログ記事アクセス制御：割合ベースから見出しベースへの変更

- **サービス**: `blog`
- **セクション**: `post-detail`
- **関連ドキュメント**:
  - `blog記事アクセス制御機能追加.md` (既存実装)
  - `develop/blog/post-detail/func-spec.md`
  - `develop/blog/post-detail/uiux-spec.md`
  - `develop/blog/post-detail/file-list.md`
  - `develop/blog/post-detail/data-flow-diagram.md`
  - `scripts/lint-blog-metadata/` (リントシステム)

---

## 1. 提案概要

ブログ記事の公開範囲指定を「割合ベース（`freeContentPercentage`）」から「見出しベース（`freeContentHeading`）」に変更し、より直感的でnote型ペイウォールに近いUXを実現します。また、メタデータの妥当性を保証するため、blog-metadata-lint-systemに見出し検証ルールを追加します。

## 2. 変更内容 (As-Is / To-Be)

### 現状 (As-Is)

- 記事のfrontmatterで`freeContentPercentage`（0-100の数値）を指定
- システムが文字数ベースで指定割合までのコンテンツを自動抽出
- 文章の途中で切れる可能性があり、UXが不自然

```yaml
---
slug: "example"
title: "サンプル記事"
freeContentPercentage: 30  # 最初の30%まで公開
---

## はじめに
この部分は公開される可能性が高い

## 本編
ここは30%に入るか入らないか不明確
途中の段落で切れる可能性がある  ← 👈 不自然な切れ方
```

**問題点**:
- 編集時に公開範囲が予測しにくい（文章を追加すると割合が変わる）
- 意味的な区切りではなく、機械的な区切りになる
- noteやMediumのような自然なペイウォール体験と異なる

### 修正後 (To-Be)

- 記事のfrontmatterで`freeContentHeading`（見出し名）を指定
- 指定された見出しの**終わりまで**を公開範囲とする
- 意味的な区切りで自然にペイウォールを配置

```yaml
---
slug: "example"
title: "サンプル記事"
freeContentHeading: "## 概要"  # この見出しの終わりまで公開
---

## はじめに
この部分は公開

## 概要
この部分も公開
（この見出しの終わりまで公開）

## 本編  ← 👈 ここからペイウォール
ここからは有料会員のみ
```

**改善点**:
- 編集しても公開範囲が明確（見出し構造は変わりにくい）
- 意味的な区切りで自然なペイウォール体験
- noteやMediumと同じUX

**リント追加**:
- `freeContentHeading`で指定した見出しが実際に記事内に存在するかチェック
- 見出しのタイポや重複を検出
- 見出しレベル（`##`）の妥当性を検証

## 3. 背景・目的

### 背景

既存実装（割合ベース）には以下の課題がありました：

1. **編集時の予測困難性**: 記事を編集する度に、どこまで公開されるか再計算が必要
2. **不自然な切れ方**: 文章の途中でペイウォールが出現し、読者体験が悪い
3. **業界標準との乖離**: note、Medium、Substackなど主要なコンテンツプラットフォームは見出しベースを採用

さらに、割合ベースの実装では「メタデータの妥当性検証」が困難でした。数値が0-100の範囲内であればリント通過してしまうため、意図しない公開範囲になるリスクがありました。

### 目的

- **目的1**: **UXの向上** - note型ペイウォールの標準的な体験を提供し、読者が自然に「続きを読みたい」と思えるポイントでペイウォールを配置
- **目的2**: **編集者の認知負荷軽減** - 「この見出しまで公開」という直感的な指定で、編集中も公開範囲を容易に把握
- **目的3**: **品質保証の強化** - リントシステムで見出しの存在を検証し、設定ミスによる意図しない公開/非公開を防止
- **目的4**: **業界標準への準拠** - 主要コンテンツプラットフォームと同じUXパターンを採用し、ユーザーの学習コストを削減

## 4. 変更の妥当性 (Pros / Cons)

Pros (利点):

- **UX品質の大幅向上**: 文章の意味的な区切りで自然にペイウォールを配置でき、読者体験が向上
- **編集者フレンドリー**: 「どの見出しまで公開するか」という直感的な指定で、編集中も公開範囲が明確
- **リント可能**: メタデータで指定した見出しが実際に存在するか自動検証でき、品質保証が強化される
- **業界標準との整合性**: note、Medium、Substackと同じUXパターンで、ユーザーの学習コストが低い
- **保守性向上**: 見出し構造は記事の骨格なので変わりにくく、長期的に安定した運用が可能
- **プレビルド思想との親和性**: 見出しはMarkdown解析で一度抽出すれば良く、実装がシンプル

Cons (懸念点):

- **実装変更コスト**: 既存の割合ベース実装を見直す必要がある
  - `determineContentVisibility.ts`のシグネチャ変更
  - Markdown解析ロジックの追加
  - テストの全面的な修正
- **リントシステムの拡張が必須**: 見出し検証ルールを追加しないと、設定ミスを検出できない
- **後方互換性の考慮**: 既存の`freeContentPercentage`を使用している記事（現在0件だが将来的に）への対応方針が必要
- **Markdown解析の複雑性**: 見出しの抽出、次の見出しまでの範囲特定、エッジケース（見出しが存在しない等）への対応が必要
- **見出し構造への依存**: 記事に適切な見出し構造がないと機能しない（ただし、ブログ記事には通常見出しが存在）

**総合評価**:

Consは実装コストと複雑性の増加ですが、これらは一時的な課題です。一方、Prosは**長期的なUX品質、保守性、業界標準への準拠**という、プロダクトの本質的な価値を高めます。

特に重要なのは以下の3点です：

1. **プレビルド思想との親和性**: ClaudeMixは「エッジ環境での動的処理を避け、ビルド時に事前生成」という思想を採用しています。見出しベースの実装は、Markdown解析時に一度見出しを抽出すれば良く、この思想と完全に整合します。

2. **リント可能な設計**: ClaudeMixは「AIコーディングの品質をリントで担保」という方針を採用しています。見出しベースにすることで、メタデータの妥当性を自動検証でき、この方針を強化します。

3. **note型ペイウォールの実現**: プロダクトの目標である「コンテンツの収益化支援」において、業界標準のUXパターンを採用することは極めて重要です。

したがって、この変更は**非常に妥当性が高く、ClaudeMixのアーキテクチャ思想と完全に整合する**と判断します。実装コストは一時的ですが、得られる価値は長期的かつ本質的です。

## 5 設計フロー

以下の設計ドキュメントを上から順に確認し、編集内容を追記して。

### 🗾GUIDING_PRINCIPLES.md

**編集箇所**: `develop/blog/GUIDING_PRINCIPLES.md`

**編集内容**:
- **主要機能（16行目付近）**: 「記事アクセス制御（見出しベース）」を追加
- **用語集（104-127行目）**: 以下の用語を追加
  - `Free Content Heading` | 無料公開範囲の終了見出し | 記事のfrontmatterで指定される見出し名。この見出しの終わりまでが無料公開範囲となる
  - `Heading-based Paywall` | 見出しベースペイウォール | 見出しの終わりを区切りとして設定するペイウォール方式。note/Medium等の業界標準パターン

### 📚️func-spec.md

**編集箇所**: `develop/blog/post-detail/func-spec.md`

**編集内容**:
- **基本機能6（39-44行目）の置き換え**:
  ```markdown
  6. **サブスクリプション状態に応じたアクセス制御**:
     - **目的**: note型の「導入部分は公開、本編は会員限定」という表示制御を実現し、コンテンツの収益化を支援する
     - **記事の可視範囲制御**: 各記事のfrontmatterで`freeContentHeading`（見出し名）を指定し、未契約ユーザーには指定された見出しの終わりまでのコンテンツを表示
     - **ペイウォール表示**: 未契約ユーザーが制限を超えるコンテンツにアクセスした場合、指定見出しの終わり位置にペイウォール（障壁）を表示
     - **購読促進UI**: ペイウォール内に会員登録・サブスクリプション購入を促すバナーやCTAボタンを配置
     - **契約ユーザーの扱い**: 有効なサブスクリプションを持つユーザーには、記事全文を制限なく表示
  ```

- **Route責務（66-70行目）の更新**:
  - 記載: 「記事データ + サブスクリプション状態 + 見出し情報を取得し、lib層で可視範囲を判定」

- **純粋ロジック要件（139-147行目）の置き換え**:
  ```markdown
  *コンテンツ可視範囲判定処理* (`app/lib/blog/post-detail/determineContentVisibility.ts`):

  - 入力: サブスクリプション状態（`hasActiveSubscription: boolean`）、記事の公開範囲見出し（`freeContentHeading: string | null`）、見出し情報配列（`headings: Heading[]`）
  - 出力: コンテンツ可視範囲の判定結果 `{ showFullContent: boolean, cutoffHeadingId: string | null }`
  - 責務: サブスクリプション状態と指定見出しに基づいて、記事のどの範囲を表示すべきかを判定する純粋関数
  - ロジック:
    - `hasActiveSubscription === true`: `showFullContent: true, cutoffHeadingId: null`
    - `hasActiveSubscription === false` かつ `freeContentHeading` が指定: 見出し配列から該当見出しを検索し、その見出しIDを返す `showFullContent: false, cutoffHeadingId: <headingId>`
    - `freeContentHeading` が見つからない、またはnull: `showFullContent: true, cutoffHeadingId: null`（全文公開）
  - 副作用なし（テスト容易性を確保）
  ```

- **新規ロジック追加（147行目の後）**:
  ```markdown
  *見出しベースコンテンツ分割処理* (`app/lib/blog/post-detail/splitContentByHeading.ts`):

  - 入力: HTML文字列、カットオフ見出しID（`cutoffHeadingId: string | null`）
  - 出力: `{ visibleContent: string, hiddenContent: string }`
  - 責務: 指定された見出しIDの終わり位置でHTMLコンテンツを分割する純粋関数
  - ロジック:
    - `cutoffHeadingId === null`: 全文を`visibleContent`として返す
    - `cutoffHeadingId`が指定: HTMLをパースし、該当IDを持つ見出しの次の兄弟要素の直前で分割
  - 副作用なし
  ```

- **副作用要件（164行目）の更新**:
  - `freeContentPercentage` → `freeContentHeading` に変更

### 🖼️uiux-spec.md

**編集箇所**: `develop/blog/post-detail/uiux-spec.md`

**編集内容**:
- **Paywall の表示条件の判定ロジック（181-184行目）の置き換え**:
  ```markdown
  #### 表示条件の判定ロジック

  - **lib層での判定**: `app/lib/blog/post-detail/determineContentVisibility.ts` で可視範囲を計算（見出しベース）
  - **lib層での分割**: `app/lib/blog/post-detail/splitContentByHeading.ts` で指定見出しの終わりまでを抽出
  - **UI層での適用**: PostDetailSectionで判定結果を受け取り、条件に応じてPaywallコンポーネントを表示
  ```

- **Paywall の状態（176-179行目）の更新**:
  ```markdown
  - **表示 (visible)**: サブスクリプションが非アクティブ（`hasActiveSubscription: false`）かつ記事に`freeContentHeading`が設定されている場合に表示
  - **非表示 (hidden)**: サブスクリプションがアクティブ（`hasActiveSubscription: true`）の場合、またはfreeContentHeadingが未設定の場合は非表示
  ```

### 📋️spec.yaml

**編集箇所**: `app/specs/blog/post-detail-spec.yaml`

**編集内容**:
- **新規セクション追加（94行目の後）**:
  ```yaml
  # ==========================================
  # アクセス制御設定
  # ==========================================
  access_control:
    # 見出しベースペイウォール設定
    free_content_heading:
      # frontmatterフィールド名
      field_name: "freeContentHeading"
      # 型: string | null
      type: "string"
      # 説明
      description: "この見出しの終わりまでを無料公開範囲とする"
      # デフォルト値（未指定時は全文公開）
      default: null
  ```

### 🗂️file_list.md

**編集箇所**: `develop/blog/post-detail/file-list.md`

**編集内容**:
- **純粋ロジック層（56行目）の説明更新**:
  ```markdown
  | determineContentVisibility.ts | app/lib/blog/post-detail/determineContentVisibility.ts | サブスクリプション状態（`hasActiveSubscription: boolean`）、記事の公開範囲見出し（`freeContentHeading: string | null`）、見出し情報配列（`headings: Heading[]`）を受け取り、コンテンツの可視範囲を判定する純粋関数。`{ showFullContent: boolean, cutoffHeadingId: string | null }` を返す。副作用なし（テスト容易性を確保） |
  ```

- **新規ファイル追加（57行目の後）**:
  ```markdown
  | splitContentByHeading.ts | app/lib/blog/post-detail/splitContentByHeading.ts | HTML文字列とカットオフ見出しID（`cutoffHeadingId: string | null`）を受け取り、指定された見出しの終わり位置でコンテンツを分割する純粋関数。`{ visibleContent: string, hiddenContent: string }` を返す。副作用なし |
  | splitContentByHeading.test.ts | app/lib/blog/post-detail/splitContentByHeading.test.ts | splitContentByHeading.tsのテスト。見出しIDでの分割、見出しが見つからない場合のフォールバック、エッジケースを検証 |
  ```

- **副作用層（64行目）の説明更新**:
  ```markdown
  | fetchPostBySlug.server.ts | app/data-io/blog/post-detail/fetchPostBySlug.server.ts | slugを受け取り、ファイルシステムから記事データ（frontmatter含む: title, description, publishedAt, author, tags, category, source, **freeContentHeading**）を取得する関数。sourceプロパティがある場合は外部ファイルを読み込む。記事が存在しない場合はnullを返す。**freeContentHeadingフィールドを含むPostDetailDataを返す** |
  ```

- **その他セクション追加（70行目の後）**:
  ```markdown

  ---

  ## 5. リントシステム拡張（scripts層）

  | ファイル名 | パス | 説明 |
  | :--- | :--- | :--- |
  | validate-free-content-heading.js | scripts/lint-blog-metadata/rules/validate-free-content-heading.js | frontmatterの`freeContentHeading`で指定された見出しが実際に記事内に存在するかを検証するリントルール。見出しの重複、タイポ、レベル不整合を検出 |
  | validate-free-content-heading.test.js | scripts/lint-blog-metadata/rules/validate-free-content-heading.test.js | validate-free-content-heading.jsのテスト。正常系（見出し存在）、異常系（見出し不存在、重複、タイポ）を検証 |
  ```

### 🧬data-flow-diagram.md

**編集箇所**: `develop/blog/post-detail/data-flow-diagram.md`

**編集内容**:
- **データ取得・変換フロー（16-30行目）の更新**:
  - `freeContentPercentage` → `freeContentHeading` に変更（18行目）

- **アクセス制御判定フロー（42-45行目）の置き換え**:
  ```mermaid
  subgraph "アクセス制御判定フロー"
      Route -->|"hasActiveSubscription<br/>freeContentHeading<br/>見出し情報配列"| VisibilityLib["determineContentVisibility.ts<br/>(Pure Logic層)"]
      VisibilityLib -->|"showFullContent<br/>cutoffHeadingId"| SplitLib["splitContentByHeading.ts<br/>(Pure Logic層)"]
      SplitLib -->|"visibleContent<br/>hiddenContent"| Route
  end
  ```

- **正常系フロー（289-312行目）の5-6ステップ更新**:
  ```markdown
  5. **アクセス制御判定**: Route が `determineContentVisibility.ts` を呼び出し、サブスクリプション状態と`freeContentHeading`、見出し情報配列から可視範囲を判定（カットオフ見出しIDを取得）
  6. **コンテンツ分割**: Route が `splitContentByHeading.ts` を呼び出し、HTML本文をカットオフ見出しIDで分割（visibleContent / hiddenContent）
  7. **マークダウン変換**: Route が取得した本文（マークダウン形式）を `markdownConverter.ts` に渡してHTML形式に変換
  8. **見出し抽出**: Route が `extractHeadings.ts` を呼び出して見出し情報を抽出
  ```

## 6 TDD_WORK_FLOW.md 簡易版

以下の全項目に対して、実際のパスと編集内容を1行で記載して。
完全な計画ではなく、大枠がわかればよい。
特に、新規ファイルに関して把握したい。

### 👁️e2e-screen-test

- 対象なし（画面レベルのE2Eテストは既存で対応済み）

### 👁️e2e-section-test

- `tests/e2e/section/blog/post-detail.spec.ts` - 見出しベースペイウォールの動作検証を追加（契約/未契約ユーザーで表示範囲が変わることを確認）

### 🎨CSS実装 (layer2.css, layer3.ts, layer4.ts)

- 対象なし（既存のPaywallコンポーネントスタイルを継続使用）

### 🪨route

- `app/routes/blog.$slug.tsx` - loaderでfreeContentHeadingを取得し、determineContentVisibility→splitContentByHeadingを呼び出してコンテンツを分割

### 🚧components.test

- `app/components/blog/post-detail/PostDetailSection.test.tsx` - 見出しベース可視範囲制御のテスト追加（cutoffHeadingIdに基づくコンテンツ表示/非表示）
- `app/components/blog/post-detail/Paywall.test.tsx` - 既存テスト維持（表示条件は変わらず）

### 🪨components

- `app/components/blog/post-detail/PostDetailSection.tsx` - propsでvisibleContent/hiddenContentを受け取り、showFullContentに応じて表示制御

### 🚧logic.test

- `app/lib/blog/post-detail/determineContentVisibility.test.ts` - **[修正]** シグネチャ変更（freeContentHeading, headings追加）、見出し検索ロジックのテスト追加
- `app/lib/blog/post-detail/splitContentByHeading.test.ts` - **[新規]** HTML分割ロジックのテスト（見出しID指定時、null時、見出し不存在時）

### 🪨logic

- `app/lib/blog/post-detail/determineContentVisibility.ts` - **[修正]** 入力に`freeContentHeading: string | null`, `headings: Heading[]`追加、出力を`cutoffHeadingId`に変更
- `app/lib/blog/post-detail/splitContentByHeading.ts` - **[新規]** HTMLパーサーで見出しIDを検索し、該当位置でコンテンツを分割する純粋関数

### 🚧data-io.test

- `app/data-io/blog/post-detail/fetchPostBySlug.server.test.ts` - frontmatterの`freeContentHeading`フィールド取得テスト追加

### 🪨data-io

- `app/data-io/blog/post-detail/fetchPostBySlug.server.ts` - frontmatterパース時に`freeContentHeading`を抽出、PostDetailData型に含める
- `app/specs/blog/types.ts` - PostDetailData型に`freeContentHeading?: string | null`フィールド追加

### その他

- `scripts/lint-blog-metadata/rules/validate-free-content-heading.js` - **[新規]** frontmatterのfreeContentHeadingが記事内に存在するか検証するリントルール
- `scripts/lint-blog-metadata/rules/validate-free-content-heading.test.js` - **[新規]** リントルールのテスト（正常系/異常系）
- `scripts/lint-blog-metadata/index.js` - validate-free-content-headingルールを登録
