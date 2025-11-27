// blog.$slug - Route: 記事詳細ページ
// データフローとページ構成を担当

import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { fetchPostBySlug } from "~/data-io/blog/post-detail/fetchPostBySlug.server";
import { convertMarkdownToHtml } from "~/lib/blog/post-detail/markdownConverter";
import { extractHeadings } from "~/lib/blog/post-detail/extractHeadings";
import type { Heading } from "~/lib/blog/post-detail/extractHeadings";
import { PostDetailSection } from "~/components/blog/post-detail/PostDetailSection";
import BlogLayout from "~/components/blog/common/BlogLayout";
import { loadBlogConfig } from "~/data-io/blog/common/loadBlogConfig.server";
import type { BlogConfig } from "~/data-io/blog/common/loadBlogConfig.server";

export interface PostDetailLoaderData {
  post: {
    slug: string;
    title: string;
    author: string;
    publishedAt: string;
    htmlContent: string; // マークダウン変換後のHTML
    description?: string;
    tags?: string[];
  };
  headings: Heading[];
  config: BlogConfig;
}

export async function loader({ params }: LoaderFunctionArgs) {
  const { slug } = params;

  if (!slug) {
    throw new Response("Not Found", { status: 404 });
  }

  // 記事データを取得
  const post = await fetchPostBySlug(slug);

  if (!post) {
    throw new Response("Not Found", { status: 404 });
  }

  // 外部ファイル参照が設定されているが、コンテンツが空の場合は500エラー
  // （ビルド時に外部ファイルが見つからなかった場合）
  if (post.source && post.content.trim() === '') {
    throw new Response("Referenced file not found", { status: 500 });
  }

  // マークダウンをHTMLに変換
  const htmlContent = convertMarkdownToHtml(post.content);

  // 見出しを抽出（目次用）
  const headings = extractHeadings(post.content);

  // ブログ設定を取得
  const config = await loadBlogConfig();

  return json({
    post: {
      slug: post.slug,
      title: post.title,
      author: post.author,
      publishedAt: post.publishedAt,
      htmlContent,
      description: post.description,
      tags: post.tags,
    },
    headings,
    config,
  });
}

export default function BlogPostDetail() {
  const { post, headings, config } = useLoaderData<typeof loader>();

  return (
    <BlogLayout config={config}>
      <PostDetailSection post={post} headings={headings} />
    </BlogLayout>
  );
}
