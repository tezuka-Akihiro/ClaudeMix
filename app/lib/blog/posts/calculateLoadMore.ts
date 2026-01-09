import type { LoadMoreInfo } from '~/specs/blog/types';

/**
 * 追加読み込み情報を計算する純粋関数
 *
 * @param totalPosts - 総記事数
 * @param loadedCount - 現在読み込み済み件数
 * @param postsPerLoad - 1回の読み込み件数（デフォルト: 6）
 * @returns 追加読み込み情報
 * @throws {Error} 不正なパラメータの場合
 *
 * @example
 * calculateLoadMore(25, 6, 6) // => { loadedCount: 6, totalPosts: 25, hasMore: true, postsPerLoad: 6 }
 * calculateLoadMore(25, 25, 6) // => { loadedCount: 25, totalPosts: 25, hasMore: false, postsPerLoad: 6 }
 */

export function calculateLoadMore(
  totalPosts: number,
  loadedCount: number,
  postsPerLoad: number = 6
): LoadMoreInfo {
  // パラメータのバリデーション
  if (totalPosts < 0) {
    throw new Error("totalPosts must be non-negative");
  }

  if (loadedCount < 0) {
    throw new Error("loadedCount must be non-negative");
  }

  if (postsPerLoad < 1) {
    throw new Error("postsPerLoad must be greater than 0");
  }

  if (!Number.isInteger(totalPosts) || !Number.isInteger(loadedCount) || !Number.isInteger(postsPerLoad)) {
    throw new Error("All parameters must be integers");
  }

  if (loadedCount > totalPosts) {
    throw new Error("loadedCount cannot be greater than totalPosts");
  }

  // 追加読み込み可能かを判定
  const hasMore = loadedCount < totalPosts;

  return {
    loadedCount,
    totalPosts,
    hasMore,
    postsPerLoad,
  };
}
