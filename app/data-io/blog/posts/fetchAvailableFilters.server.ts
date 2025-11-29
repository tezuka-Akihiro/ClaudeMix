// fetchAvailableFilters - 🔌 副作用層
// 利用可能なカテゴリとタグの一覧を取得する

import { groupTags } from '~/lib/blog/posts/groupTagsByCategory';
import { getAllPosts } from '~/generated/blog-posts';
import { loadPostsSpec } from './loadPostsSpec.server';

/**
 * 利用可能なフィルタオプション
 */
export interface AvailableFilters {
  categories: string[];
  tags: string[];
  tagGroups: { group: string; tags: string[] }[];
}

/**
 * 利用可能なフィルタ（カテゴリとタグ）の一覧を取得する
 *
 * @returns カテゴリとタグの一覧（重複なし、ソート済み）
 */
export async function fetchAvailableFilters(): Promise<AvailableFilters> {
  try {
    // 記事データからカテゴリとタグを抽出
    const allPosts = getAllPosts();
    const allCategories = allPosts.map(post => post.frontmatter.category).filter(Boolean);
    const allTags = allPosts.flatMap(post => post.frontmatter.tags || []);

    // 重複を排除してソート
    const uniqueTags = Array.from(new Set(allTags)).sort();
    const uniqueCategories = Array.from(new Set(allCategories)).sort();

    // specからタグ定義を読み込み、グループ化する
    const spec = loadPostsSpec();
    const tagGroups = groupTags(uniqueTags, spec.tags.current);

    return {
      categories: uniqueCategories,
      tags: uniqueTags,
      tagGroups,
    };
  } catch (error) {
    throw new Error('Failed to fetch available filters', { cause: error });
  }
}
