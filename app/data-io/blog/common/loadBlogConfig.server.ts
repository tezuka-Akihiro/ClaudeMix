// loadBlogConfig.server - 🔌 副作用層
// ブログ設定情報（タイトル、メニュー項目、コピーライト）を返す
// spec.yamlから設定を読み込む（SSoTパターン）
import { loadSpec, loadSharedSpec } from '~/spec-loader/specLoader.server';
import type { BlogConfig, MenuItem, BlogCommonSpec } from '~/specs/blog/types';
import type { ProjectSpec } from '~/specs/shared/types';

// 型を再エクスポート
export type { BlogConfig, MenuItem };

/**
 * ブログの設定情報を読み込む（spec.yaml参照パターン）
 *
 * @returns ブログ設定（タイトル、メニュー項目、コピーライト）
 */
export async function loadBlogConfig(): Promise<BlogConfig> {
  const spec = loadSpec<BlogCommonSpec>('blog/common');
  const projectSpec = loadSharedSpec<ProjectSpec>('project');

  // 動的に現在の年を生成してcopyrightを構築（SSoT原則に従い年はハードコードしない）
  const currentYear = new Date().getFullYear();
  const copyright = `© ${currentYear} ${projectSpec.project.name}`;

  return {
    blogTitle: spec.blog_config.title,
    menuItems: spec.navigation.menu_items,
    copyright,
    siteUrl: spec.blog_config.site_url,
    siteName: spec.blog_config.title,
  };
}
