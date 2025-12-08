---
slug: "refactoring-typescript-types-final-touches"
title: "AIと育てる型定義 Part 5: UIとデータ層を繋ぐ『生きた仕様書』の完成"
publishedAt: "2025-11-27"
summary: "AI協調リファクタリング最終回。UIコンポーネントのPropsやデータ層の戻り値をドメイン仕様に統合し、プロジェクトの『生きた仕様書』を完成させるまでの全記録。"
author: "ClaudeMix Team"
tags: ["refactoring", "architecture", "typescript"]
category: "Claude Best Practices"
description: "AI協調リファクタリング最終回。UIコンポーネントのPropsやデータ層の戻り値をドメイン仕様に統合し、プロジェクトの『生きた仕様書』を完成させるまでの全記録。"
---

## 📝 概要

AIとの協調リファクタリングシリーズ、ついに最終回です。私たちはこれまで、4つのステップを通じて型定義を体系的に整理してきました。

- **Part 1**: [単純な重複の排除](/blog/refactoring-typescript-types-with-ai)
- **Part 2**: [『唯一の真実の源』の確立](/blog/refactoring-typescript-types-single-source-of-truth)
- **Part 3**: [『関心の分離』の実践](/blog/refactoring-typescript-types-separation-of-concerns)
- **Part 4**: [ドメイン知識の集約](/blog/refactoring-typescript-types-domain-knowledge)

今回は、この旅の総仕上げとして、UIコンポーネント層とデータアクセス層にローカルで定義されていた最後の型を、プロジェクトの「仕様」を定義する `app/specs/blog/types.ts` に統合します。これにより、このファイルは名実ともにプロジェクトの**「生きた仕様書」**として完成します。

## ⚠️ 最後の課題：各層に残るローカルな型定義

これまでのリファクタリングを経て、コードベースはかなりクリーンになりました。しかし、まだいくつかの型が、その本来あるべき場所ではないファイルにローカルで定義されていました。

1. **`FetchPostsResult`**: データアクセス層にありながら、UI層でのページネーション計算を意識した `total` プロパティを持っていました。責務が曖昧な状態です。
2. **`PostsSectionProps`**: 記事一覧ページのコンポーネント内に定義されたProps型。その実態は、`loader` が返す複数のデータをまとめただけのものでした。
3. **`PostDetailSectionProps`**: 記事詳細ページのコンポーネント内に定義されたProps型。MarkdownがHTMLに変換された後の、UI表示専用のデータ構造を持っていました。

これらは、UIとデータを繋ぐ重要な「契約」でありながら、ローカルに定義されているため、プロジェクト全体の見通しを妨げる最後の要因となっていました。

## 🔍 AIとの設計相談：『生きた仕様書』の完成へ

最後の仕上げについて、AIアシスタントと最終確認を行いました。

**🧑‍💻 (自分)**: 「UIコンポーネントのPropsやデータ層の戻り値の型が、まだ各ファイルに散らばっている。これらも `specs` に集約すべきだろうか？」

**🤖 (AI)**: 「その通りです。それこそが、このリファクタリングの最終目標です。UIコンポーネントが期待するデータの形状（Props）や、データ層が提供するデータの形状（戻り値）を `app/specs/blog/types.ts` に集約することで、そのファイルは**データモデルからUIの仕様までを網羅した『生きた仕様書』**になります。これにより、Remixの `loader` とコンポーネント間のデータの受け渡しが型レベルで保証され、プロジェクト全体の信頼性が劇的に向上します。」

この対話により、今回の作業が単なる整理ではなく、**アプリケーションのデータフロー全体を型で定義し、保証する**という、極めて重要なステップであることが確認できました。

## 🔧 実装フェーズ：UIとデータの『契約』を定義する

### Step 1: UIとデータ層で使われる型を共通定義

まず、`app/specs/blog/types.ts` に、各層で必要となる新しい型を定義しました。

```typescript
/**
 * 記事一覧ページ（PostsSection）で利用するすべてのデータ
 */
export interface PostsPageData {
  posts: PostSummary[];
  pagination: Pick<PaginationInfo, 'currentPage' | 'totalPages'>;
  availableFilters: AvailableFilters;
  selectedFilters: FilterOptions;
}

/**
 * 記事詳細ページでレンダリングするための記事データ
 * Post型のcontent(markdown)をhtmlContent(html)に置き換えたもの
 */
export type RenderedPost = Omit<Post, 'content' | 'summary' | 'testOnly'> & {
  htmlContent: string;
};
```

`RenderedPost` では、TypeScriptの `Omit` と `&` を組み合わせ、基底の `Post` 型から不要なプロパティを除外し、UI表示に必要な `htmlContent` を追加する形で派生させています。これにより、元の型との関係性を保ちつつ、UI専用のデータモデルを安全に定義できました。

### Step 2: 各コンポーネントのPropsを共通型に置き換え

次に、各コンポーネントにローカルで定義されていたProps型を削除し、新しく定義した共通の型を参照するように変更しました。

```diff
- interface PostsSectionProps {
-   posts: PostSummary[];
-   pagination: {
-     currentPage: number;
-     totalPages: number;
-   };
-   // ... and more
- }
- const PostsSection: React.FC<PostsSectionProps> = ({...}) => {
+ import type { PostsPageData } from '~/specs/blog/types';
+
+ const PostsSection: React.FC<PostsPageData> = ({...}) => {
```

これにより、Remixの `loader` が返すデータ構造と、`PostsSection` コンポーネントが受け取るデータ構造が `PostsPageData` という単一の型で完全に一致し、見通しが大幅に改善されました。

## ✨ 結果と考察：コードが語る仕様書

この5回にわたるリファクタリングの旅を経て、私たちのコードベースは大きく変貌しました。特に `app/specs/blog/types.ts` は、もはや単なる型の寄せ集めではありません。

- **データモデルの定義** (`Post`, `PostSummary`)
- **ビジネスロジックの入力/出力** (`FilterOptions`, `FilteredPostsResult`)
- **サイト全体の構成情報** (`BlogConfig`, `MenuItem`)
- **UIコンポーネントのデータ契約** (`PostsPageData`, `RenderedPost`)

これらすべてを内包し、**アプリケーションの振る舞いそのものを定義する「生きた仕様書」**となったのです。

AIとの対話を通じて、場当たり的な修正ではなく、設計原則に基づいた体系的な改善を続けることができました。その結果、保守性や信頼性が向上しただけでなく、コード自体がプロジェクトの設計思想を雄弁に語る、理想的な状態に近づいたと言えるでしょう。

---

### このシリーズの記事

- **Part 1**: [単純な重複の排除](/blog/refactoring-typescript-types-with-ai)
- **Part 2**: [『唯一の真実の源』の確立](/blog/refactoring-typescript-types-single-source-of-truth)
- **Part 3**: [『関心の分離』の実践](/blog/refactoring-typescript-types-separation-of-concerns)
- **Part 4**: [ドメイン知識の集約](/blog/refactoring-typescript-types-domain-knowledge)
- **Part 5**: [『生きた仕様書の完成』](/blog/refactoring-typescript-types-summary)
