# MOCK_POLICY.md - posts Section

## 概要

このドキュメントは、postsセクションの段階的強化（Progressive Enhancement）における、モック実装フェーズのポリシーを定義します。

**段階的強化の2ステップ**:

1. **ステップ1（モック実装）**: 固定データでUI構造を確立
2. **ステップ2（機能強化）**: 実データとロジックを接続

---

## 1. モック対象の判定

### ✅ モック実装が必要な対象

#### 1.1 UI層のレイアウト確認

- **UI/UX名**: 記事一覧のグリッドレイアウトとカード表示
- **モック時の挙動**:
  - 固定の3件のPostSummaryデータをハードコードで表示
  - レスポンシブグリッド（モバイル1列、タブレット2列、デスクトップ3列）の動作確認
  - PostCardのホバー状態の確認
- **正実装時の挙動**:
  - loaderからfetchPosts.server.tsを呼び出し、ファイルシステムから実際の記事データを取得
  - PostSummary[]を動的にレンダリング
- **目的**:
  - レイアウトとスタイルの早期確認
  - レスポンシブ対応の動作確認
  - 設計の妥当性検証
- **寿命**: data-io層実装開始時に破棄（loaderを実データ取得に切り替え）

---

### ❌ モック実装が不要な対象

以下の対象は、モック実装フェーズをスキップして直接実装します：

#### 1.2 純粋ロジック層（lib）

- **対象**: formatPublishedDate.ts
- **理由**:
  - 純粋関数であり、副作用なし
  - 単体テストで直接検証可能
  - モック化する必要性がない
- **実装方針**: ユニットテスト駆動で直接実装

#### 1.3 副作用層（data-io）

- **対象**: fetchPosts.server.ts
- **理由**:
  - ファイルシステムアクセスは比較的シンプル
  - テスト時はファイルシステムをモック化するが、実装フェーズでのモック化は不要
  - 直接実装してユニットテストで検証
- **実装方針**: ユニットテストでファイルシステムをモック化して検証

---

## 2. 関連ファイル（アーキテクチャ層別）

| 層 | ファイルパス | モック設定 | 実装設定 |
|:---|:---|:---|:---|
| **Route層** | app/routes/blog.tsx | loader内で固定のPostSummary[]を返す | fetchPosts.server.tsを呼び出して実データを取得 |
| **UI層** | app/components/blog/posts/PostsSection.tsx | 固定データをpropsで受け取り表示 | loaderデータを受け取り表示 |
| **UI層** | app/components/blog/posts/PostCard.tsx | 固定データをpropsで受け取り表示 | PostSummaryをpropsで受け取り表示 |
| **lib層** | app/lib/blog/posts/formatPublishedDate.ts | **モック不要（直接実装）** | 純粋関数として実装 |
| **data-io層** | app/data-io/blog/posts/fetchPosts.server.ts | **モック不要（直接実装）** | ファイルシステムアクセスを実装 |

---

## 3. モックデータポリシー

### 3.1 固定データの定義

モック実装フェーズでは、以下の固定データを使用します（`spec.yaml`のtest_dataセクションに定義済み）：

```typescript
const mockPosts: PostSummary[] = [
  {
    slug: "remix-tips-2024",
    title: "Remixで学ぶモダンWeb開発",
    publishedAt: "2024-05-01"
  },
  {
    slug: "claude-code-guide",
    title: "Claude Codeを使った効率的な開発フロー",
    publishedAt: "2024-04-15"
  },
  {
    slug: "typescript-best-practices",
    title: "TypeScriptベストプラクティス",
    publishedAt: "2024-03-20"
  }
];
```

### 3.2 データソース

- **モック実装時**: Route層のloader内にハードコード
- **正実装時**: `app/data-io/blog/posts/fetchPosts.server.ts`から取得

---

## 4. モック実装の具体例

### 4.1 Route層のloaderモック

```typescript
// app/routes/blog.tsx (モック実装版)
export async function loader() {
  // 固定データを返す（モック実装）
  const mockPosts: PostSummary[] = [
    { slug: "remix-tips-2024", title: "Remixで学ぶモダンWeb開発", publishedAt: "2024-05-01" },
    { slug: "claude-code-guide", title: "Claude Codeを使った効率的な開発フロー", publishedAt: "2024-04-15" },
    { slug: "typescript-best-practices", title: "TypeScriptベストプラクティス", publishedAt: "2024-03-20" }
  ];

  return json({ posts: mockPosts });
}
```

### 4.2 正実装への切り替え

```typescript
// app/routes/blog.tsx (正実装版)
import { fetchPosts } from "~/data-io/blog/posts/fetchPosts.server";

export async function loader() {
  // 実データを取得（正実装）
  const posts = await fetchPosts();
  return json({ posts });
}
```

---

## 5. 使用ルール

### 5.1 適用フェーズ

- **Phase 2.3～2.4（UI層・Route層実装）**: モック実装を使用
- **Phase 2.1～2.2（data-io層・lib層実装）**: モック不要、直接実装

### 5.2 レビュー方針

- モック実装は人間レビュー前提
- ブラウザでの表示確認が主目的
- 品質保証は対象外（正実装フェーズで実施）

### 5.3 モック破棄タイミング

- data-io層（fetchPosts.server.ts）実装完了後、loaderを実データ取得に切り替え
- 固定データのハードコードを削除

---

## 6. まとめ

### ✅ モック実装が必要

- **UI層のレイアウト確認**: PostsSection、PostCard
- **Route層のloader**: 固定データを返す

### ❌ モック実装が不要

- **純粋ロジック層**: formatPublishedDate.ts（直接実装）
- **副作用層**: fetchPosts.server.ts（直接実装、テスト時はモック化）

### 実装の流れ

1. **Phase 2.3～2.4**: UI層とRoute層をモックデータで実装し、ブラウザで表示確認
2. **Phase 2.1～2.2**: data-io層とlib層を直接実装し、ユニットテストで検証
3. **Phase 2の最後**: Route層のloaderを実データ取得に切り替え、E2Eテストで全体動作を確認
