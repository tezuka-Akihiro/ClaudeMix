// fetchPosts.server - 🔌 副作用層
// ビルド時に生成されたバンドルから記事メタデータを読み込み、PostSummary[]を返す

import { getAllPosts } from '~/generated/blog-posts';
import { filterPosts } from '~/lib/blog/posts/filterPosts';
import { buildThumbnailUrl } from '~/lib/blog/common/buildThumbnailUrl';
import { loadSpec } from '~/spec-loader/specLoader.server';
import type { FilterOptions, PostSummary, FilteredPostsResult, BlogCommonSpec, BlogPostsSpec } from '~/specs/blog/types';

// 型を再エクスポート
export type { PostSummary, FilteredPostsResult };

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

// ページネーションとフィルターのオプションを結合
export type FetchPostsOptions = PaginationOptions & FilterOptions;

/**
 * ブログ記事の一覧を取得する
 *
 * @param options - ページネーションとフィルタオプション（limit, offset, category, tags）
 * @returns 記事サマリーの配列と総数
 */
export async function fetchPosts(
  options?: FetchPostsOptions
): Promise<FilteredPostsResult> {
  try {
    // ビルド時に生成されたデータから記事一覧を取得
    // getAllPosts()は既にソート済み（投稿日降順）
    const allPosts = getAllPosts();

    // R2アセット設定を取得（サムネイルURL生成用）
    const commonSpec = loadSpec<BlogCommonSpec>('blog/common');
    const r2Config = commonSpec.r2_assets;

    // 記事一覧用のスペックをロードしてサムネイル表示設定を確認
    const postsSpec = loadSpec<BlogPostsSpec>('blog/posts');
    const suppressedCategories = postsSpec.thumbnail?.display?.suppressed_categories || [];

    // PostSummary形式に変換（メタデータとサムネイルURLを含む）
    const posts: PostSummary[] = allPosts.map(post => {
      // 特定のカテゴリやサムネイル無効設定の場合はURLを生成しない
      const isSuppressed = suppressedCategories.includes(post.frontmatter.category);
      const thumbnailUrl = isSuppressed ? null : buildThumbnailUrl(post.slug, r2Config);

      return {
        slug: post.slug,
        title: post.frontmatter.title,
        publishedAt: post.frontmatter.publishedAt,
        category: post.frontmatter.category,
        description: post.frontmatter.description,
        tags: post.frontmatter.tags,
        thumbnailUrl,
      };
    });

    // フィルタリング処理（純粋ロジック層を使用）
    const filters: FilterOptions = {
      category: options?.category,
      tags: options?.tags,
    };
    const filteredPosts = filterPosts(posts, filters);

    // ページネーション処理
    const limit = options?.limit ?? filteredPosts.length;
    const offset = options?.offset ?? 0;
    const paginatedPosts = filteredPosts.slice(offset, offset + limit);

    return {
      posts: paginatedPosts,
      total: filteredPosts.length,
    };
  } catch (error) {
    console.error(`fetchPosts failed:`, error);
    throw new Error(`Failed to fetch posts: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
