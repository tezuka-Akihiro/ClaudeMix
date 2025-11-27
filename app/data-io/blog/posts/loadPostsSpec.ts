// loadPostsSpec - 🔌 副作用層
// ビルド時に生成されたバンドルからカテゴリ定義を読み込む

import { categories as generatedCategories } from '~/generated/blog-posts';

export interface Category {
  id: number;
  name: string;
  emoji: string;
}

export interface PostsSpec {
  categories: Category[];
}

/**
 * カテゴリ定義を読み込む
 *
 * @returns カテゴリ定義を含むspec情報
 */
export async function loadPostsSpec(): Promise<PostsSpec> {
  try {
    // ビルド時に生成されたデータからカテゴリ定義を取得
    return {
      categories: generatedCategories,
    };
  } catch (error) {
    console.error(`loadPostsSpec failed:`, error);
    throw new Error(`loadPostsSpec operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}