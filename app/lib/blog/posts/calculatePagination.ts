import type { PaginationInfo } from '~/specs/blog/types';

/**
 * ページネーション情報を計算する純粋関数
 *
 * @param totalPosts - 総記事数
 * @param currentPage - 現在のページ番号（1始まり）
 * @param postsPerPage - 1ページあたりの記事数
 * @returns ページネーション情報
 * @throws {Error} 不正なパラメータの場合
 *
 * @example
 * calculatePagination(25, 1, 10) // => { currentPage: 1, totalPages: 3, totalPosts: 25, postsPerPage: 10, offset: 0 }
 * calculatePagination(25, 2, 10) // => { currentPage: 2, totalPages: 3, totalPosts: 25, postsPerPage: 10, offset: 10 }
 */

export function calculatePagination(
  totalPosts: number,
  currentPage: number,
  postsPerPage: number = 10
): PaginationInfo {
  // パラメータのバリデーション
  if (totalPosts < 0) {
    throw new Error("totalPosts must be non-negative");
  }

  if (currentPage < 1) {
    throw new Error("currentPage must be greater than 0");
  }

  if (postsPerPage < 1) {
    throw new Error("postsPerPage must be greater than 0");
  }

  if (!Number.isInteger(totalPosts) || !Number.isInteger(currentPage) || !Number.isInteger(postsPerPage)) {
    throw new Error("All parameters must be integers");
  }

  // 総ページ数を計算
  const totalPages = Math.ceil(totalPosts / postsPerPage);

  // offset計算（データベースクエリ用）
  const offset = (currentPage - 1) * postsPerPage;

  return {
    currentPage,
    totalPages: totalPages === 0 ? 1 : totalPages, // 記事が0件の場合も1ページとする
    totalPosts,
    postsPerPage,
    offset,
  };
}
