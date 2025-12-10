// fetchAvailableFilters - 🔌 副作用層
// 利用可能なカテゴリとタグの一覧を取得する

import { groupTags } from '~/lib/blog/posts/groupTagsByCategory';
import { getAllPosts } from '~/generated/blog-posts';
import { loadPostsSpec } from './loadPostsSpec.server';
import type { AvailableFilters } from '~/specs/blog/types';

/**
 * 利用可能なフィルタ（カテゴリとタグ）の一覧を取得する
 *
 * @returns カテゴリとタグの一覧
 * - categories: 記事で実際に使用されているカテゴリ
 * - tags: spec.yamlで定義されているすべてのタグ
 * - tagGroups: spec.yamlの定義に基づくタググループ
 */
export async function fetchAvailableFilters(): Promise<AvailableFilters> {
  try {
    // 記事データからカテゴリを抽出（カテゴリは実際に使用されているもののみ）
    const allPosts = getAllPosts();
    const allCategories = allPosts.map(post => post.frontmatter.category).filter(Boolean);
    const uniqueCategories = Array.from(new Set(allCategories)).sort();

    // specからタグ定義とグループ順序を読み込む
    const spec = loadPostsSpec();

    // spec.yamlで定義されているすべてのタグを表示（記事での使用有無に関わらず）
    const allDefinedTags = spec.tags.map(tag => tag.name).sort();

    // タググループを生成（spec.yamlの定義順）
    const tagGroups = groupTags(allDefinedTags, spec.tags, spec.tag_groups.order);

    return {
      categories: uniqueCategories,
      tags: allDefinedTags,
      tagGroups,
    };
  } catch (error) {
    throw new Error('Failed to fetch available filters', { cause: error });
  }
}
