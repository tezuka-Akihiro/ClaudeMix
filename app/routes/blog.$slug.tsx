// blog.$slug - Route: 記事詳細ページ
// データフローとページ構成を担当

import type { LoaderFunctionArgs, MetaFunction, LinksFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useEffect } from "react";
import { fetchPostBySlug } from "~/data-io/blog/post-detail/fetchPostBySlug.server";
import type { Heading } from "~/specs/blog/types";
import { PostDetailSection } from "~/components/blog/post-detail/PostDetailSection";
import BlogLayout from "~/components/blog/common/BlogLayout";
import { loadBlogConfig } from "~/data-io/blog/common/loadBlogConfig.server";
import type { BlogConfig } from "~/data-io/blog/common/loadBlogConfig.server";
import { loadSpec } from "~/spec-loader/specLoader.server";
import type { BlogCommonSpec, BlogPostsSpec } from "~/specs/blog/types";
import { getSubscriptionStatus } from "~/data-io/blog/post-detail/getSubscriptionStatus.server";
import { determineContentVisibility } from "~/lib/blog/post-detail/determineContentVisibility";
import { getSession } from "~/data-io/account/common/getSession.server";

// 共通コンポーネントのCSS（BlogHeader, BlogFooter等）
import layer2CommonStyles from "~/styles/blog/layer2-common.css?url";
// 記事詳細ページ専用のCSS（PostDetailSection, TableOfContents等）
import layer2PostDetailStyles from "~/styles/blog/layer2-post-detail.css?url";

export const links: LinksFunction = () => [
  {
    rel: "stylesheet",
    href: layer2CommonStyles,
  },
  {
    rel: "stylesheet",
    href: layer2PostDetailStyles,
  },
];

export interface PostDetailLoaderData {
  post: {
    slug: string;
    title: string;
    author: string;
    publishedAt: string;
    visibleContent: string; // 表示可能なHTML（見出しベース）
    hiddenContent: string; // 非表示HTML（見出しベース）
    description?: string;
    tags?: string[];
  };
  headings: Heading[];
  config: BlogConfig;
  subscriptionAccess: {
    showFullContent: boolean;
    cutoffHeadingId: string | null;
    hasActiveSubscription: boolean;
  };
}

export async function loader({ params, request, context }: LoaderFunctionArgs) {
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

  // リクエストURLを解析
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  // セッションを取得してuserIdを確認
  const session = await getSession(request, context as unknown as Parameters<typeof getSession>[1]);
  const userId = session?.userId ?? null;
  const isAuthenticated = userId !== null;

  // カテゴリベースのアクセス制御: 認証必須
  const postsSpec = loadSpec<BlogPostsSpec>('blog/posts');
  const accessControl = postsSpec.access_control || {};
  const publicCategories = accessControl.public_categories || [];

  if (!isAuthenticated && !publicCategories.includes(post.category)) {
    const returnTo = encodeURIComponent(url.pathname);
    return redirect(`/login?returnTo=${returnTo}`);
  }

  // NOTE: コンテンツはビルド時にHTML変換済み、見出しもビルド時に抽出済み
  // NOTE: visibleContent/hiddenContentもビルド時に分割済み
  const headings = post.headings;

  // ブログ設定を取得
  const config = await loadBlogConfig();

  // OGP画像の設定を取得
  const spec = loadSpec<BlogCommonSpec>('blog/common');
  const ogpImageWidth = spec.ogp.image.width;
  const ogpImageHeight = spec.ogp.image.height;

  // サブスクリプション状態を取得（セッションからuserIdを使用）
  const subscriptionStatus = await getSubscriptionStatus(userId, context as unknown as Parameters<typeof getSubscriptionStatus>[1]);

  // アクセス制御判定（見出しベース）
  const freeContentHeading = post.freeContentHeading ?? null;
  const contentVisibility = determineContentVisibility(
    subscriptionStatus.hasActiveSubscription,
    freeContentHeading,
    headings
  );

  return json({
    post: {
      slug: post.slug,
      title: post.title,
      author: post.author,
      publishedAt: post.publishedAt,
      visibleContent: post.visibleContent,
      hiddenContent: post.hiddenContent,
      description: post.description,
      tags: post.tags,
      category: post.category,
      source: post.source,
      headings: post.headings,
      hasMermaid: post.hasMermaid, // Mermaidフラグを追加
    },
    headings,
    config,
    ogpImage: {
      width: ogpImageWidth,
      height: ogpImageHeight,
    },
    baseUrl, // 動的に取得したベースURLを追加
    subscriptionAccess: {
      showFullContent: contentVisibility.showFullContent,
      cutoffHeadingId: contentVisibility.cutoffHeadingId,
      hasActiveSubscription: subscriptionStatus.hasActiveSubscription,
    },
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
  const { post, headings, config, subscriptionAccess } = useLoaderData<typeof loader>();

  // Scroll to top on page navigation
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [post.slug]);

  return (
    <BlogLayout config={config}>
      <PostDetailSection
        post={post}
        headings={headings}
        hasMermaid={post.hasMermaid}
        subscriptionAccess={subscriptionAccess}
      />
    </BlogLayout>
  );
}
