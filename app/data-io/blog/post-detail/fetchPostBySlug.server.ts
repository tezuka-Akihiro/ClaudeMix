// fetchPostBySlug.server - 🔌 副作用層
// slugを受け取り、ビルド時に生成されたバンドルから記事データを取得

import { getPostBySlug } from '~/generated/blog-posts';

export interface Post {
  slug: string;
  title: string;
  author: string;
  publishedAt: string;
  content: string; // マークダウン形式
  source: string | null; // 外部ファイル参照
  description?: string; // 記事の説明
  tags?: string[]; // タグ配列
}

/**
 * slugを受け取り、記事データを取得する
 *
 * @param slug - 記事のslug
 * @returns 記事データ。存在しない場合はnull
 */
export async function fetchPostBySlug(slug: string): Promise<Post | null> {
  // 空文字列のslugは無効
  if (!slug || slug.trim() === '') {
    return null;
  }

  try {
    // ビルド時に生成されたデータから記事を取得
    const post = getPostBySlug(slug);

    if (!post) {
      return null;
    }

    // NOTE: 外部ファイル参照機能はビルド時に解決されるため、
    // ランタイムでの外部ファイル読み込みは不要になりました。
    // すべてのコンテンツはビルド時にバンドルされています。

    // Postオブジェクトを返す
    return {
      slug: post.slug,
      title: post.frontmatter.title,
      author: post.frontmatter.author,
      publishedAt: post.frontmatter.publishedAt,
      content: post.content,
      source: post.frontmatter.source,
      description: post.frontmatter.description,
      tags: post.frontmatter.tags,
    };
  } catch (error) {
    // 記事ファイル自体が存在しない場合はnullを返す（404エラー）
    console.error(`Failed to fetch post with slug "${slug}":`, error);
    return null;
  }
}
