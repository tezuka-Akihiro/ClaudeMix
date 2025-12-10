// loadPostMetadata.server - 🔌 副作用層
// slugを受け取り、OGP画像生成に必要な記事のメタデータを取得

import { getPostBySlug } from '~/generated/blog-posts';

/**
 * OGP画像生成に必要な記事のメタデータ
 */
export interface PostMetadata {
  title: string;
  description: string;
  author: string;
}

/**
 * slugを受け取り、OGP画像生成に必要なメタデータを取得する
 *
 * @param slug - 記事のslug
 * @returns 記事のメタデータ。存在しない場合はnull
 */
export async function loadPostMetadata(slug: string): Promise<PostMetadata | null> {
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

    const { frontmatter } = blogPost;

    // OGP画像生成に必要な情報を抽出
    const metadata: PostMetadata = {
      title: frontmatter.title,
      description: frontmatter.description || frontmatter.summary || '',
      author: frontmatter.author,
    };

    return metadata;
  } catch (error) {
    // 記事が存在しない場合はnullを返す
    console.error(`Failed to load metadata for post with slug "${slug}":`, error);
    return null;
  }
}
