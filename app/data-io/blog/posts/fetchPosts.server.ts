// fetchPosts.server - 🔌 副作用層
// ビルド時に生成されたバンドルから記事メタデータを読み込み、PostSummary[]を返す

import { getAllPosts } from '~/generated/blog-posts';
import { filterPosts, type FilterOptions } from '~/lib/blog/posts/filterPosts';

export interface PostSummary {
  slug: string;
  title: string;
  publishedAt: string; // ISO format "2024-05-01"
  category: string;
  description?: string;
  tags?: string[];
}

export interface FetchPostsOptions {
  limit?: number;
  offset?: number;
  category?: string;
  tags?: string[];
}

export interface FetchPostsResult {
  posts: PostSummary[];
  total: number;
}

/**
 * ブログ記事の一覧を取得する
 *
 * @param options - ページネーションとフィルタオプション（limit, offset, category, tags）
 * @returns 記事サマリーの配列と総数
 */
export async function fetchPosts(
  options?: FetchPostsOptions
): Promise<FetchPostsResult> {
  try {
    // ビルド時に生成されたデータから記事一覧を取得
    // getAllPosts()は既にソート済み（投稿日降順）
    const allPosts = getAllPosts();

    // PostSummary形式に変換（メタデータを含む）
    const posts: PostSummary[] = allPosts.map(post => ({
      slug: post.slug,
      title: post.frontmatter.title,
      publishedAt: post.frontmatter.publishedAt,
      category: post.frontmatter.category,
      description: post.frontmatter.description,
      tags: post.frontmatter.tags,
    }));

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
