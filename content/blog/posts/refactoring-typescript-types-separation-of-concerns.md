---
slug: "refactoring-typescript-types-separation-of-concerns"
title: "AIと育てる型定義 Part 3：責務の分離でコードをクリーンにする"
publishedAt: "2025-11-21"
summary: "AIとの協調リファクタリング第3弾。今回はフィルター機能に散らばる型定義にメスを入れます。TypeScriptのIntersection Typesを活用して『責務の分離』を実践し、再利用性と見通しを向上させる過程を記録します。"
author: "ClaudeMix Team"
tags: ["refactoring", "architecture"]
category: "Claude Best Practices"
description: "AIとの協調リファクタリング第3弾。今回はフィルター機能に散らばる型定義にメスを入れます。TypeScriptのIntersection Typesを活用して『責務の分離』を実践し、再利用性と見通しを向上させる過程を記録します。"
---

## 📝 概要

これまでのシリーズでは、AIとの対話を通じて型定義を整理してきました。

- **Part 1**: [単純に重複していた型を集約](/blog/refactoring-typescript-types-with-ai)
- **Part 2**: [関連する型から『唯一の真実の源』を確立](/blog/refactoring-typescript-types-single-source-of-truth)

今回は、さらに一歩進んで**「関心の分離 (Separation of Concerns)」**という設計原則を型定義に適用します。具体的には、ブログのフィルター機能に関連する型が抱えていた「責務の混在」と「配置場所の問題」を、AIと協力して解決していきます。

## ⚠️ 新たな課題：混在する責務と不適切な配置

これまでのリファクタリングで主要な型は整理されましたが、フィルター機能周りにはまだ改善の余地がありました。

1.  **責務の混在**: `fetchPosts.server.ts` にあった `FetchPostsOptions` 型は、**ページネーション** (`limit`, `offset`) と**フィルター** (`category`, `tags`) という、2つの異なる責務を併せ持っていました。

    ```typescript
    // ❌ 修正前
    export interface FetchPostsOptions {
      limit?: number;
      offset?: number;
      category?: string;
      tags?: string[];
    }
    ```

2.  **不適切な配置**: `fetchAvailableFilters.server.ts` で定義されていた `AvailableFilters` 型は、フィルターの選択肢を定義するもので、UIコンポーネントでも必要とされる情報です。しかし、データアクセス層（`data-io`）に定義されていたため、UI層から参照しにくい状態でした。

## 🔍 AIとの設計相談：『関心の分離』を適用する

これらの課題をAIアシスタントに提示し、設計方針を相談しました。

**🧑‍💻 (自分)**: 「フィルター関連の型がまだ散らかっているんだ。`FetchPostsOptions` は責務が混ざってるし、`AvailableFilters` はUIでも使いたいのにサーバー側に定義されている。」

**🤖 (AI)**: 「良い点に気づきましたね。これは『関心の分離』を適用する絶好の機会です。`FetchPostsOptions` については、ページネーションとフィルターの型をそれぞれ独立して定義し、TypeScriptの **Intersection Type (`&`)** を使って結合するのがおすすめです。これにより、各々の責務が明確になります。」

**🧑‍💻 (自分)**: 「なるほど。`AvailableFilters` の方はどうだろう？」

**🤖 (AI)**: 「`AvailableFilters` のように、UI層とサーバー層の両方で利用される型は、`app/specs/blog/types.ts` のようなプロジェクト共通の場所に配置するのがベストプラクティスです。これにより、型の定義が単一の信頼できる場所（Single Source of Truth）に集約され、再利用性が高まります。」

AIとの対話を通じて、具体的なリファクタリング計画が明確になりました。

## 🔧 実装フェーズ：型の責務を分離し、再配置する

### Step 1: `FilterOptions` の責務分離

まず、`FetchPostsOptions` からフィルターの責務を分離しました。

1.  **`FilterOptions` を共通化**: フィルター条件のみを持つ `FilterOptions` を `app/specs/blog/types.ts` に定義。
2.  **Intersection Type で結合**: `fetchPosts.server.ts` で、ページネーション用の `PaginationOptions` と共通の `FilterOptions` を `&` を使って結合し、新しい `FetchPostsOptions` を定義しました。

    ```diff
    - export interface FetchPostsOptions {
    -   limit?: number;
    -   offset?: number;
    -   category?: string;
    -   tags?: string[];
    - }
    + export interface PaginationOptions {
    +   limit?: number;
    +   offset?: number;
    + }
    + // ページネーションとフィルターのオプションを結合
    + export type FetchPostsOptions = PaginationOptions & FilterOptions;
    ```

3.  **古い定義を削除**: `lib/blog/posts/filterPosts.ts` にあった重複する `FilterOptions` を削除し、共通の型をインポートするように変更しました。

### Step 2: `AvailableFilters` の集約

次に、UIとサーバーで共有される `AvailableFilters` 型を共通の場所に移動しました。

1.  **`AvailableFilters` を共通化**: `app/specs/blog/types.ts` に `AvailableFilters` を定義。この際、すでに共通化されていた `TagGroup` 型を再利用しました。
2.  **古い定義を削除**: `fetchAvailableFilters.server.ts` からローカルの型定義を削除し、共通の型をインポートするように変更しました。

## ✨ 結果と考察

今回のリファクタリングにより、フィルター関連の型は「関心の分離」の原則に従って整理されました。

- **責務の明確化**: `FetchPostsOptions` が「ページネーション」と「フィルター」という明確な責務に分離され、コードの意図が読み取りやすくなりました。
- **再利用性の向上**: `FilterOptions` が独立したことで、将来的に他の機能でフィルター条件だけを再利用することが容易になりました。
- **見通しの改善**: UIとサーバーで共有する `AvailableFilters` が共通の場所に配置されたことで、データフローが明確になり、プロジェクト全体の整合性が向上しました。

AIとの対話を通じて、単にコードを動かすだけでなく、よりクリーンでメンテナンスしやすい設計へと導いてもらう。これもまた、AIとの協調開発の大きな価値の一つです。

---

### このシリーズの記事

- **Part 1**: [単純な重複の排除](/blog/refactoring-typescript-types-with-ai)
- **Part 2**: [『唯一の真実の源』の確立](/blog/refactoring-typescript-types-single-source-of-truth)
- **Part 3**: [『関心の分離』の実践](/blog/refactoring-typescript-types-separation-of-concerns)
- **Part 4**: [ドメイン知識の集約](/blog/refactoring-typescript-types-domain-knowledge)
- **Part 5**: [『生きた仕様書の完成』](/blog/refactoring-typescript-types-summary)