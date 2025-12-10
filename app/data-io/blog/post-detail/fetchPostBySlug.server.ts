// fetchPostBySlug.server - 🔌 副作用層
// slugを受け取り、ビルド時に生成されたバンドルから記事データを取得

import { getPostBySlug, type BlogPost } from '~/generated/blog-posts';
import type { Post } from '~/specs/blog/types';

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
    const blogPost = getPostBySlug(slug);

    if (!blogPost) {
      return null;
    }

    // NOTE: 外部ファイル参照機能はビルド時に解決されるため、
    // ランタイムでの外部ファイル読み込みは不要になりました。
    // すべてのコンテンツとメタデータはビルド時にバンドルされています。
    const post: Post = {
      slug: blogPost.slug,
      ...blogPost.frontmatter,
      content: blogPost.content,
      // generated/blog-postsのHeading型（level: number）をspecs/blog/typesのHeading型（level: 2）に型アサーション
      headings: blogPost.headings as Post['headings'],
    };

    // Postオブジェクトを返す
    return post;
  } catch (error) {
    // 記事ファイル自体が存在しない場合はnullを返す（404エラー）
    console.error(`Failed to fetch post with slug "${slug}":`, error);
    return null;
  }
}
