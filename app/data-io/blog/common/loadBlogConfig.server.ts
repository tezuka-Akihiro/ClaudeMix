// loadBlogConfig.server - 🔌 副作用層
// ブログ設定情報（タイトル、メニュー項目、コピーライト）を返す
// 固定の設定値を返す（外部ファイル読み込みは不要）

export interface MenuItem {
  label: string;
  path: string;
}

export interface BlogConfig {
  blogTitle: string;
  menuItems: MenuItem[];
  copyright: string;
}

/**
 * ブログの設定情報を読み込む
 *
 * @returns ブログ設定（タイトル、メニュー項目、コピーライト）
 */
export async function loadBlogConfig(): Promise<BlogConfig> {
  return {
    blogTitle: "ClaudeMix Blog",
    menuItems: [
      { label: "挨拶記事", path: "/blog/welcome" },
      { label: "Articles", path: "/blog" },
    ],
    copyright: `© ${new Date().getFullYear()} ClaudeMix`,
  };
}
