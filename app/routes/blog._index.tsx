// blog/index - Route (routes層)
// ブログトップページのRoute

import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
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
import "~/styles/blog/layer2-common.css";
// 記事一覧ページ専用のCSS（PostCard, FilterPanel, LoadMoreButton等）
import "~/styles/blog/layer2-posts.css";

export const meta: MetaFunction = () => {
  return [
    { title: "Blog - Articles" },
    {
      name: "description",
      content: "Browse our collection of articles covering web development, programming, and technology."
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
    categorySpec: {
      categories: spec.categories,
      defaultEmoji: spec.business_rules.display.default_category_emoji,
    },
    pageTitle: spec.posts_config.page_title,
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
    categorySpec,
    pageTitle,
  } = useLoaderData<typeof loader>();

  return (
    <BlogLayout config={config}>
      <PostsSection
        posts={posts}
        isAuthenticated={isAuthenticated}
        loadMoreInfo={loadMoreInfo}
        availableFilters={availableFilters}
        selectedFilters={selectedFilters}
        categorySpec={categorySpec}
        pageTitle={pageTitle}
      />
    </BlogLayout>
  );
}
