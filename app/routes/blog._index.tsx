// blog/index - Route (routes層)
// ブログトップページのRoute

import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useEffect } from "react";
import BlogLayout from "~/components/blog/common/BlogLayout";
import PostsSection from "~/components/blog/posts/PostsSection";
import { loadBlogConfig } from "~/data-io/blog/common/loadBlogConfig.server";
import { fetchPosts } from "~/data-io/blog/posts/fetchPosts.server";
import { fetchAvailableFilters } from "~/data-io/blog/posts/fetchAvailableFilters.server";
import { calculatePagination } from "~/lib/blog/posts/calculatePagination";
import { loadPostsSpec } from "~/data-io/blog/posts/loadPostsSpec.server";
import { getSession } from "~/data-io/account/common/getSession.server";

// 共通コンポーネントのCSS（BlogHeader, BlogFooter等）
import "~/styles/blog/layer2-common.css";
// 記事一覧ページ専用のCSS（PostCard, FilterPanel, Pagination等）
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
  const pageParam = url.searchParams.get('page');
  const page = pageParam ? parseInt(pageParam, 10) : 1;

  // フィルタパラメータを取得
  const category = url.searchParams.get('category') || undefined;
  const tagsParam = url.searchParams.getAll('tags');
  const tags = tagsParam.length > 0 ? tagsParam : undefined;

  // バリデーション
  if (isNaN(page) || page < 1) {
    throw new Response('Invalid page number', { status: 400 });
  }

  // セッションを取得して認証状態を確認
  const session = await getSession(request, context as unknown as Parameters<typeof getSession>[1]);
  const isAuthenticated = session !== null;

  // データ取得（副作用層）
  const spec = loadPostsSpec();
  const postsPerPage = spec.business_rules.pagination.posts_per_page;
  const { posts, total } = await fetchPosts({
    limit: postsPerPage,
    offset: (page - 1) * postsPerPage,
    category,
    tags,
  });
  const config = await loadBlogConfig();
  const availableFilters = await fetchAvailableFilters();

  // ページネーション情報を計算（純粋ロジック層）
  const paginationData = calculatePagination(total, page, postsPerPage);

  // ページ範囲チェック
  if (page > paginationData.totalPages && paginationData.totalPages > 0) {
    throw new Response('Page not found', { status: 404 });
  }

  return json({
    posts,
    config,
    isAuthenticated,
    pagination: {
      currentPage: paginationData.currentPage,
      totalPages: paginationData.totalPages,
      total: paginationData.totalPosts,
      limit: paginationData.postsPerPage,
    },
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
    pagination,
    availableFilters,
    selectedFilters,
    categorySpec,
    pageTitle,
  } = useLoaderData<typeof loader>();

  // Scroll to top on pagination navigation
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pagination.currentPage]);

  return (
    <BlogLayout config={config}>
      <PostsSection
        posts={posts}
        isAuthenticated={isAuthenticated}
        pagination={pagination}
        availableFilters={availableFilters}
        selectedFilters={selectedFilters}
        categorySpec={categorySpec}
        pageTitle={pageTitle}
      />
    </BlogLayout>
  );
}
