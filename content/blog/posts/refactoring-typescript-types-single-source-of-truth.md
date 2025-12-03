---
slug: "refactoring-typescript-types-single-source-of-truth"
title: "AIと育てる型定義 Part 2：『唯一の真実の源』で散らばった関連型を整理する"
author: "ClaudeMix Team"
publishedAt: "2025-11-18"
category: "Claude Best Practices"
tags: ["refactoring", "architecture"]
description: "AIとの協調リファクタリング第2弾。今回は、似ているようで少しずつ違う『ブログ記事』関連の型定義に挑みます。TypeScriptのUtility Typesを駆使して『唯一の真実の源』を確立し、保守性と見通しを劇的に改善するプロセスを全記録。"
---

## 📝 概要

[前回の記事](/blog/refactoring-typescript-types-with-ai)では、AIと協力して完全に重複していた `TagGroup` 型を集約し、コードベースの健全性を取り戻す第一歩を踏み出しました。

今回は、より複雑な課題に挑戦します。それは、**関連しているが、少しずつ内容が違う**型定義の整理です。具体的には、プロジェクト内に散在する `Post`, `PostSummary`, `BlogPost` といった「ブログ記事」関連の型を扱います。

このリファクタリングを通じて、**「唯一の真実の源 (Single Source of Truth)」** という重要な設計原則を導入し、TypeScriptの `Utility Types` を活用して、保守性と再利用性の高い型システムを構築していきます。

## ⚠️ 新たな課題：関連するが同一ではない型

`TagGroup` は単純な重複だったので、一つのファイルにまとめるだけで解決しました。しかし、「ブログ記事」関連の型は、それぞれ異なる目的とプロパティを持っています。

- **`BlogPost`** (`app/generated/blog-posts.ts`): ビルド時にMarkdownから生成される、すべての情報を持つ**元データ**。
- **`Post`** (`app/data-io/blog/post-detail/fetchPostBySlug.server.ts`): 記事**詳細ページ**で必要とされるデータ。
- **`PostSummary`** (`app/data-io/blog/posts/fetchPosts.server.ts`): 記事**一覧ページ**で使われる、要約されたデータ。
- **`PostCardProps`** (`app/components/blog/posts/PostCard.tsx`): 記事カードコンポーネントが表示に使うデータ。

これらの型は密接に関連していますが、それぞれが独立して定義されているため、以下のような問題が発生します。

- **変更の追従が困難**: `BlogPost` の元データに新しいプロパティ（例: `readingTime`）を追加した場合、他のすべての関連型を手動で更新する必要があり、修正漏れのリスクが高い。
- **信頼性の欠如**: どの型が「最新」で「正しい」情報源なのかが不明確になる。

## 🔍 AIとの設計相談：『唯一の真実の源』というアプローチ

このより高度な問題について、再びAIアシスタントに相談しました。

**🧑‍💻 (自分)**: 「次は `Post` 関連の型を整理したい。でも、これらは単純な重複じゃない。どう整理するのがベストかな？」

**🤖 (AI)**: 「これは『唯一の真実の源 (Single Source of Truth)』を確立する絶好の機会ですね。まず、すべての情報を持つ**基底となる型**を一つ定義します。そして、そこから `Pick` や `Omit` といったTypeScriptのUtility Typesを使い、各用途（一覧、詳細など）に特化した型を派生させるのがおすすめです。」

**🧑‍💻 (自分)**: 「なるほど。具体的にはどう進める？」

**🤖 (AI)**: 「まず、ビルド時に生成される `BlogPost` が最も信頼できる情報源なので、これを基底の型とします。この型を `app/specs/blog/types.ts` のような共通の場所に移動させ、`PostSummary` や `Post` は、この基底型から必要なプロパティだけを `Pick` して作るように再定義します。こうすれば、元の定義が変わっても、派生した型は自動的に追従します。」

この対話を通じて、私たちは単にファイルをまとめるのではなく、**型同士の関係性を設計し、依存関係を明確にする**という、より高度なリファクタリング方針を固めました。

## 🔧 実装フェーズ：Utility Typesによる型の再構築

AIの提案に基づき、以下のステップで実装を進めました。

### Step 1: 基底の型と派生型の定義

まず、共通の型定義ファイル `app/specs/blog/types.ts` に、すべての情報を持つ基底の型 `Post` と、記事一覧で使う `PostSummary` 型を定義しました。

`PostSummary` は、TypeScriptの `Pick` Utility Typeを使い、`Post` 型から必要なプロパティだけを抜き出して生成しています。

```typescript
/**
 * ブログ記事のすべての情報を持つ基底の型 (Single Source of Truth)
 */
export interface Post {
  slug: string;
  title: string;
  publishedAt: string;
  summary: string;
  author: string;
  tags: string[];
  category: string;
  source: string | null;
  description?: string;
  testOnly: boolean;
  content: string;
}

/**
 * 記事一覧で利用する、Postから派生した型
 */
export type PostSummary = Pick<
  Post,
  'slug' | 'title' | 'publishedAt' | 'category' | 'description' | 'tags'
>;
```

### Step 2: データアクセス層とコンポーネントの更新

次に、各ファイルに散らばっていた古い型定義を削除し、`app/specs/blog/types.ts` から新しい型をインポートするように修正しました。

- **記事詳細データ取得 (`fetchPostBySlug.server.ts`)**: ローカルの `Post` 型を削除し、共通の `Post` 型をインポート。
- **記事一覧データ取得 (`fetchPosts.server.ts`)**: ローカルの `PostSummary` 型を削除し、共通の `PostSummary` 型をインポート。
- **記事カードコンポーネント (`PostCard.tsx`)**: `PostCardProps` という独自の型定義を廃止し、共通の `PostSummary` 型を直接Propsとして受け取るように変更。

```diff
 // ...
 import type { PostSummary } from '~/specs/blog/types';
 
- interface PostCardProps {
-  slug: string;
-  title: string;
-  publishedAt: string;
-  category: string;
-  description?: string;
-  tags?: string[];
- }
-
- const PostCard: React.FC<PostCardProps> = ({ slug, title, publishedAt, category, description, tags }) => {
+ const PostCard: React.FC<PostSummary> = ({ slug, title, publishedAt, category, description, tags }) => {
 // ...
```

## ✨ 結果と考察

このリファクタリングにより、**「唯一の真実の源」**が確立されました。

主なメリットは以下の通りです。

- **保守性の向上**: 将来、記事データに新しいプロパティ（例: `readingTime`）を追加する場合、基底の `Post` 型を修正するだけで済みます。`PostSummary` のような派生型は、意図的に変更しない限り影響を受けません。
- **信頼性の向上**: `Post` 型が唯一の信頼できる情報源となり、どのプロパティが利用可能かが明確になりました。
- **コードの簡潔化**: `PostCard.tsx` のように、冗長なProps定義を削除し、コンポーネントの責務がより明確になりました。

AIとの対話を通じて、単なる重複排除に留まらず、より堅牢な型設計へとステップアップできた好例と言えるでしょう。

---

### このシリーズの記事

- **Part 1**: [単純な重複の排除](/blog/refactoring-typescript-types-with-ai)
- **Part 2**: [『唯一の真実の源』の確立](/blog/refactoring-typescript-types-single-source-of-truth)
- **Part 3**: [『関心の分離』の実践](/blog/refactoring-typescript-types-separation-of-concerns)
- **Part 4**: [ドメイン知識の集約](/blog/refactoring-typescript-types-domain-knowledge)
- **Part 5**: [『生きた仕様書の完成』](/blog/refactoring-typescript-types-summary)

