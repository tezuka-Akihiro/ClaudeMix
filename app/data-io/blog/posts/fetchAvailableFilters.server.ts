// fetchAvailableFilters.server - 🔌 副作用層
// 利用可能なフィルタ（カテゴリとタグ）の一覧を取得する

import { getAllPosts } from '~/generated/blog-posts';

/**
 * 利用可能なフィルタオプション
 */
export interface AvailableFilters {
  categories: string[];
  tags: string[];
}

/**
 * 利用可能なフィルタ（カテゴリとタグ）の一覧を取得する
 *
 * @returns カテゴリとタグの一覧（重複なし、アルファベット順）
 */
export async function fetchAvailableFilters(): Promise<AvailableFilters> {
  try {
    // ビルド時に生成されたデータから記事一覧を取得
    const allPosts = getAllPosts();

    // カテゴリを重複なく抽出
    const categoriesSet = new Set<string>();
    allPosts.forEach(post => {
      if (post.frontmatter.category) {
        categoriesSet.add(post.frontmatter.category);
      }
    });

    // タグを重複なく抽出
    const tagsSet = new Set<string>();
    allPosts.forEach(post => {
      if (post.frontmatter.tags && Array.isArray(post.frontmatter.tags)) {
        post.frontmatter.tags.forEach((tag: string) => {
          tagsSet.add(tag);
        });
      }
    });

    // アルファベット順にソート
    const categories = Array.from(categoriesSet).sort();
    const tags = Array.from(tagsSet).sort();

    return {
      categories,
      tags,
    };
  } catch (error) {
    console.error(`fetchAvailableFilters failed:`, error);
    throw new Error(
      `Failed to fetch available filters: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
