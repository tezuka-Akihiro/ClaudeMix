// blog.$slug - Route: 記事詳細ページ
// データフローとページ構成を担当

import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { fetchPostBySlug } from "~/data-io/blog/post-detail/fetchPostBySlug.server";
import type { Heading } from "~/specs/blog/types";
import { PostDetailSection } from "~/components/blog/post-detail/PostDetailSection";
import BlogLayout from "~/components/blog/common/BlogLayout";
import { loadBlogConfig } from "~/data-io/blog/common/loadBlogConfig.server";
import type { BlogConfig } from "~/data-io/blog/common/loadBlogConfig.server";
import { loadSpec } from "~/spec-loader/specLoader.server";
import type { BlogCommonSpec } from "~/specs/blog/types";

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

export async function loader({ params, request }: LoaderFunctionArgs) {
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

  // NOTE: コンテンツはビルド時にHTML変換済み、見出しもビルド時に抽出済み
  const htmlContent = post.content;
  const headings = post.headings;

  // ブログ設定を取得
  const config = await loadBlogConfig();

  // OGP画像の設定を取得
  const spec = loadSpec<BlogCommonSpec>('blog/common');
  const ogpImageWidth = spec.ogp.image.width;
  const ogpImageHeight = spec.ogp.image.height;

  // リクエストから動的にベースURLを取得（環境に依存しない）
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  return json({
    post: {
      slug: post.slug,
      title: post.title,
      author: post.author,
      publishedAt: post.publishedAt,
      htmlContent,
      description: post.description,
      tags: post.tags,
      category: post.category,
      source: post.source,
      headings: post.headings,
    },
    headings,
    config,
    ogpImage: {
      width: ogpImageWidth,
      height: ogpImageHeight,
    },
    baseUrl, // 動的に取得したベースURLを追加
  });
}

export const meta: MetaFunction<typeof loader> = ({ data, params, location }) => {
  if (!data) {
    return [
      { title: "Not Found" },
      { name: "description", content: "The page you are looking for does not exist." },
    ];
  }

  const { post, config, ogpImage, baseUrl } = data;
  // リクエストから動的に取得したベースURLを使用（環境に依存しない）
  const pageUrl = new URL(location.pathname, baseUrl).toString();
  const ogpImageUrl = new URL(`/ogp/${params.slug}.png`, baseUrl).toString();

  return [
    { title: `${post.title} | ${config.siteName}` },
    { name: "description", content: post.description },
    // OGP (Open Graph Protocol)
    { property: "og:title", content: post.title },
    { property: "og:description", content: post.description },
    { property: "og:type", content: "article" },
    { property: "og:url", content: pageUrl },
    { property: "og:image", content: ogpImageUrl },
    { property: "og:image:width", content: ogpImage.width.toString() },
    { property: "og:image:height", content: ogpImage.height.toString() },
    { property: "og:image:type", content: "image/png" },
    { property: "og:image:alt", content: post.title },
    { property: "og:site_name", content: config.siteName },
    // Twitter Card
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:image", content: ogpImageUrl },
    { name: "twitter:image:alt", content: post.title },
  ];
};

export default function BlogPostDetail() {
  const { post, headings, config } = useLoaderData<typeof loader>();

  return (
    <BlogLayout config={config}>
      <PostDetailSection post={post} headings={headings} />
    </BlogLayout>
  );
}
