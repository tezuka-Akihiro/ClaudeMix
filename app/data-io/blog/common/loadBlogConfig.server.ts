// loadBlogConfig.server - 🔌 副作用層
// ブログ設定情報（タイトル、メニュー項目、コピーライト、フッターリンク）を返す
// spec.yamlから設定を読み込む（SSoTパターン）
import { loadSpec } from '~/spec-loader/specLoader.server';
import type { BlogConfig, MenuItem, FooterLink, BlogCommonSpec } from '~/specs/blog/types';

// 型を再エクスポート
export type { BlogConfig, MenuItem, FooterLink };

/**
 * ブログの設定情報を読み込む（spec.yaml参照パターン）
 *
 * @returns ブログ設定（タイトル、メニュー項目、コピーライト、フッターリンク）
 */
export async function loadBlogConfig(): Promise<BlogConfig> {
  const spec = loadSpec<BlogCommonSpec>('blog/common');

  // フッターリンクをFooterLink型に変換（is_modal → isModal）
  const footerLinks: FooterLink[] = spec.footer.legal_links.map((link) => ({
    label: link.label,
    href: link.href,
    isModal: link.is_modal,
  }));

  // 環境変数から特定商取引法の内容を取得（本番環境用）
  // 設定されていない場合は spec.yaml のプレースホルダーを使用（開発環境用）
  const legalContent = process.env.LEGAL_CONTENT || spec.footer.legal_content;

  return {
    blogTitle: spec.blog_config.title,
    menuItems: spec.navigation.menu_items,
    copyright: spec.blog_config.copyright,
    siteUrl: spec.blog_config.site_url,
    siteName: spec.blog_config.title,
    footerLinks,
    legalContent,
  };
}
