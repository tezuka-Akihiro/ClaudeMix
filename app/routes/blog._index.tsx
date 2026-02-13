// blog/index - Route (routes層)
// ブログトップページのRoute

import type { LoaderFunctionArgs, MetaFunction, LinksFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import BlogLayout from "~/components/blog/common/BlogLayout";
import PostsSection from "~/components/blog/posts/PostsSection";
import { loadBlogConfig } from "~/data-io/blog/common/loadBlogConfig.server";
import { fetchPosts } from "~/data-io/blog/posts/fetchPosts.server";
import { fetchAvailableFilters } from "~/data-io/blog/posts/fetchAvailableFilters.server";
import { calculateLoadMore } from "~/lib/blog/posts/calculateLoadMore";
import { loadPostsSpec } from "~/data-io/blog/posts/loadPostsSpec.server";
import { getSession } from "~/data-io/account/common/getSession.server";

// 共通コンポーネントのCSS（BlogHeader, BlogFooter等）
import layer2CommonStyles from "~/styles/blog/layer2-common.css?url";
// 記事一覧ページ専用のCSS（PostCard, FilterPanel, LoadMoreButton等）
import layer2PostsStyles from "~/styles/blog/layer2-posts.css?url";

export const links: LinksFunction = () => [
  // Lighthouse最適化: レンダリングブロック軽減のためpreload
  { rel: "preload", href: layer2CommonStyles, as: "style" },
  { rel: "preload", href: layer2PostsStyles, as: "style" },
  { rel: "stylesheet", href: layer2CommonStyles },
  { rel: "stylesheet", href: layer2PostsStyles },
];

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) return [{ title: "Blog" }];
  return [
    { title: data.pageTitle },
    {
      name: "description",
      content: data.metaDescription,
    },
  ];
};

export async function loader({ request, context }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const loadedParam = url.searchParams.get('loaded');
  const loadedCount = loadedParam ? parseInt(loadedParam, 10) : 0;

  // フィルタパラメータを取得
  const category = url.searchParams.get('category') || undefined;
  const tagsParam = url.searchParams.getAll('tags');
  const tags = tagsParam.length > 0 ? tagsParam : undefined;

  // バリデーション
  if (isNaN(loadedCount) || loadedCount < 0) {
    throw new Response('Invalid loaded count', { status: 400 });
  }

  // セッションを取得して認証状態を確認
  const session = await getSession(request, context as unknown as Parameters<typeof getSession>[1]);
  const isAuthenticated = session !== null;

  // データ取得（副作用層）
  const spec = loadPostsSpec();
  const postsPerLoad = spec.business_rules.load_more.posts_per_load;
  const limit = loadedCount === 0 ? spec.business_rules.load_more.initial_load : postsPerLoad;
  const { posts, total } = await fetchPosts({
    limit,
    offset: loadedCount,
    category,
    tags,
  });
  const config = await loadBlogConfig();
  const availableFilters = await fetchAvailableFilters();

  // 追加読み込み情報を計算（純粋ロジック層）
  const newLoadedCount = loadedCount + posts.length;
  const loadMoreInfo = calculateLoadMore(total, newLoadedCount, postsPerLoad);

  return json({
    posts,
    config,
    isAuthenticated,
    loadMoreInfo,
    availableFilters,
    selectedFilters: {
      category,
      tags,
    },
    pageTitle: spec.posts_config.page_title,
    metaDescription: spec.meta.description,
    publicCategories: spec.access_control.public_categories,
    spec: {
      messages: spec.messages,
      accessibility: spec.accessibility,
      date_format: spec.date_format,
    },
  }, {
    headers: {
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      "Vary": "Cookie",
    }
  });
}

export default function BlogIndex() {
  const {
    config,
    posts,
    isAuthenticated,
    loadMoreInfo,
    availableFilters,
    selectedFilters,
    pageTitle,
    spec,
    publicCategories,
  } = useLoaderData<typeof loader>();

  return (
    <BlogLayout config={config}>
      <PostsSection
        posts={posts}
        isAuthenticated={isAuthenticated}
        loadMoreInfo={loadMoreInfo}
        availableFilters={availableFilters}
        selectedFilters={selectedFilters}
        pageTitle={pageTitle}
        messages={spec.messages}
        accessibility={spec.accessibility}
        dateFormat={spec.date_format}
        publicCategories={publicCategories}
      />
    </BlogLayout>
  );
}
