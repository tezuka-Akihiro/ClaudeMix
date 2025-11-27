// filterPosts.ts - 🧠 純粋ロジック層
// 記事一覧をフィルタリングする純粋関数

import type { PostSummary } from '~/data-io/blog/posts/fetchPosts.server';

/**
 * フィルタオプション
 */
export interface FilterOptions {
  category?: string;
  tags?: string[];
}

/**
 * 記事一覧をフィルタリングする純粋関数
 *
 * @param posts - フィルタ対象の記事一覧
 * @param filters - フィルタ条件
 * @returns フィルタ後の記事一覧
 *
 * @description
 * - カテゴリフィルタ: filters.category が空文字列または undefined の場合はスキップ
 * - タグフィルタ: filters.tags が空配列または undefined の場合はスキップ、
 *   それ以外は AND 条件（すべてのタグを含む記事のみ）
 */
export function filterPosts(
  posts: PostSummary[],
  filters: FilterOptions
): PostSummary[] {
  let filteredPosts = posts;

  // カテゴリフィルタ
  if (filters.category && filters.category.trim() !== '') {
    filteredPosts = filteredPosts.filter(
      post => post.category === filters.category
    );
  }

  // タグフィルタ (AND条件)
  if (filters.tags && filters.tags.length > 0) {
    filteredPosts = filteredPosts.filter(post => {
      if (!post.tags) return false;
      return filters.tags!.every(tag => post.tags!.includes(tag));
    });
  }

  return filteredPosts;
}
