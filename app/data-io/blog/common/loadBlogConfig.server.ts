// loadBlogConfig.server - 🔌 副作用層
// ブログ設定情報（タイトル、メニュー項目、コピーライト）を返す
// 固定の設定値を返す（外部ファイル読み込みは不要）
import type { BlogConfig } from '~/specs/blog/types';

/**
 * ブログの設定情報を読み込む
 *
 * @returns ブログ設定（タイトル、メニュー項目、コピーライト）
 */
export async function loadBlogConfig(): Promise<BlogConfig> {
  return {
    blogTitle: "ClaudeMix Blog",
    menuItems: [
      { label: "はじめまして", path: "/blog/hazimemasite" },
      { label: "hello world", path: "/blog/welcome" },
      { label: "LINK",path: "/blog/link" },
    ],
    copyright: `© ${new Date().getFullYear()} ClaudeMix`,
  };
}
