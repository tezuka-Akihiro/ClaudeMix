---
slug: "refactoring-typescript-types-domain-knowledge"
title: "AIと育てる型定義 Part 4：ドメイン知識の集約で完成度を高める"
publishedAt: "2025-11-24"
summary: "AIとの協調リファクタリング最終章。サイト設定、ページネーション、見出しといった、各所に散らばっていたドメイン知識を『仕様』として集約。コードベースの完成度を劇的に高めるリファクタリングの最終ステップを記録します。"
author: "ClaudeMix Team"
tags: ["refactoring", "architecture"]
category: "Claude Best Practices"
description: "AIとの協調リファクタリング最終章。サイト設定、ページネーション、見出しといった、各所に散らばっていたドメイン知識を『仕様』として集約。コードベースの完成度を劇的に高めるリファクタリングの最終ステップを記録します。"
---

## 📝 概要

AIとの協調リファクタリングシリーズ、ついに最終章です。これまでの道のりを振り返ってみましょう。

- **Part 1**: [単純な重複の排除](/blog/refactoring-typescript-types-with-ai)
- **Part 2**: [『唯一の真実の源』の確立](/blog/refactoring-typescript-types-single-source-of-truth)
- **Part 3**: [『関心の分離』の実践](/blog/refactoring-typescript-types-separation-of-concerns)

今回は、このリファクタリングの総仕上げとして、プロジェクトの**「ドメイン知識」**に関わる型を集約します。サイト全体の設定(`BlogConfig`)、ページネーション(`Pagination`)、記事の見出し(`Heading`)といった、特定のレイヤーに属さない共通の仕様を `app/specs/blog/types.ts` に集約し、コードベースの完成度を飛躍的に高めます。

## ⚠️ 最後の課題：レイヤーを越えるドメイン知識

これまでのリファクタリングで、ほとんどの型は綺麗に整理されました。しかし、まだいくつかの型が、その役割にふさわしくない場所に残っていました。

- **`BlogConfig` / `MenuItem`**: サイト全体の設定情報。データアクセス層(`data-io`)に定義されていましたが、UIコンポーネントでも広く利用されます。
- **`Pagination`関連の型**: `PaginationOptions` (データ取得用)、`PaginationData` (計算ロジック用)、`PaginationProps` (UI用) と、同じ「ページネーション」という概念が各層で別々に定義されていました。
- **`Heading`**: 記事の見出し情報。純粋ロジック層(`lib`)に定義されていましたが、これは「記事データの一部」であり、UI層でも直接利用されます。

これらの型は、特定のレイヤーの責務ではなく、**「このブログアプリケーションがどういうものであるか」**を定義する、ドメインそのものの仕様です。

## 🔍 AIとの設計相談：『仕様』としての型定義

最後の仕上げについて、AIアシスタントに意見を求めました。

**🧑‍💻 (自分)**: 「リファクタリングも終盤だ。残りの `BlogConfig` や `Pagination` 関連の型はどう整理するのがベストだろう？」

**🤖 (AI)**: 「素晴らしいですね！残っているのは、特定のレイヤーに閉じず、アプリケーション全体で共有されるべき『ドメイン知識』に関する型です。これらを `app/specs/blog/types.ts` に集約することで、そのファイルが単なる型定義の置き場ではなく、**プロジェクトの『仕様書』として機能する**ようになります。コードベースの完成度が格段に上がりますよ。」

この対話により、今回のリファクタリングが単なる整理整頓ではなく、**コードの意図を明確にし、プロジェクトの設計思想をコード自体で表現する**という、より高い目標を持つものであることを再確認しました。

## 🔧 実装フェーズ：ドメイン知識の集約

AIの提案に基づき、残りの型をすべて `app/specs/blog/types.ts` に集約しました。

### Step 1: `BlogConfig` と `Heading` の移動

`BlogConfig`, `MenuItem`, `Heading` を、それぞれの定義元ファイルから `app/specs/blog/types.ts` に移動し、`export` しました。そして、元のファイルからは型定義を削除し、新しい共通の型をインポートするように修正しました。

### Step 2: `Pagination` 関連の型の統合

ページネーション関連の型は、より洗練されたアプローチを取りました。

1.  **基底の型を定義**: まず、ページネーションに関するすべての情報を持つ `PaginationInfo` という基底の型を `app/specs/blog/types.ts` に定義しました。

    ```typescript
    export interface PaginationInfo {
      currentPage: number;
      totalPages: number;
      totalPosts: number;
      postsPerPage: number;
      offset: number;
    }
    ```

2.  **派生型の再定義**: 次に、UIコンポーネントで使われていた `PaginationProps` を、この基底型から `Pick` を使って必要なプロパティだけを抜き出す形で再定義しました。

    ```diff
    - export interface PaginationProps {
    -   currentPage: number;
    -   totalPages: number;
    - }
    - const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages }) => {
    + const Pagination: React.FC<Pick<PaginationInfo, 'currentPage' | 'totalPages'>> = ({ currentPage, totalPages }) => {
    ```

これにより、冗長な定義が排除され、すべてのページネーション関連の型が `PaginationInfo` という「唯一の真実の源」から派生する、クリーンな構造が実現しました。

## ✨ 結果と考察：『仕様書』として完成した型定義

この4回にわたるリファクタリングを経て、`app/specs/blog/types.ts` は、もはや単なる型定義ファイルではありません。このブログ機能がどのようなデータ（`Post`）を持ち、どのような選択肢（`AvailableFilters`）を提供し、どのような設定（`BlogConfig`）で動作するのかを定義する、**生きた仕様書**となりました。

AIとの対話を通じて、場当たり的な修正ではなく、設計原則に基づいた体系的なリファクタリングを実現できました。これにより、コードの保守性や見通しが向上しただけでなく、プロジェクトの設計思想そのものがコードに刻み込まれ、チーム全体の共通認識を形成する土台が築かれたのです。

---

### このシリーズの記事

- **Part 1**: [単純な重複の排除](/blog/refactoring-typescript-types-with-ai)
- **Part 2**: [『唯一の真実の源』の確立](/blog/refactoring-typescript-types-single-source-of-truth)
- **Part 3**: [『関心の分離』の実践](/blog/refactoring-typescript-types-separation-of-concerns)
- **Part 4**: [ドメイン知識の集約](/blog/refactoring-typescript-types-domain-knowledge)
- **Part 5**: [『生きた仕様書の完成』](/blog/refactoring-typescript-types-summary)