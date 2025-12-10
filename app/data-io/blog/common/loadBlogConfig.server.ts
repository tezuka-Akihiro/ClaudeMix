// loadBlogConfig.server - 🔌 副作用層
// ブログ設定情報（タイトル、メニュー項目、コピーライト）を返す
// spec.yamlから設定を読み込む（SSoTパターン）
import { loadSpec } from '~/spec-loader/specLoader.server';
import type { BlogConfig, MenuItem, BlogCommonSpec } from '~/specs/blog/types';

// 型を再エクスポート
export type { BlogConfig, MenuItem };

/**
 * ブログの設定情報を読み込む（spec.yaml参照パターン）
 *
 * @returns ブログ設定（タイトル、メニュー項目、コピーライト）
 */
export async function loadBlogConfig(): Promise<BlogConfig> {
  const spec = loadSpec<BlogCommonSpec>('blog/common');

  return {
    blogTitle: spec.blog_config.title,
    menuItems: spec.navigation.menu_items,
    copyright: spec.blog_config.copyright,
  };
}
