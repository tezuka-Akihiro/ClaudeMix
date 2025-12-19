// blog/index - Route (routes層)
// ブログトップページのRoute

import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { lazy, Suspense } from "react";
import BlogLayout from "~/components/blog/common/BlogLayout";
import { loadBlogConfig } from "~/data-io/blog/common/loadBlogConfig.server";
import { fetchPosts } from "~/data-io/blog/posts/fetchPosts.server";
import { fetchAvailableFilters } from "~/data-io/blog/posts/fetchAvailableFilters.server";
import { calculatePagination } from "~/lib/blog/posts/calculatePagination";
import { loadPostsSpec } from "~/data-io/blog/posts/loadPostsSpec.server";
import "~/styles/blog/posts.css";

// 記事一覧専用コンポーネントを動的インポートで遅延ロード
const PostsSection = lazy(() => import("~/components/blog/posts/PostsSection"));

export const meta: MetaFunction = () => {
  return [
    { title: "Blog - Articles" },
    {
      name: "description",
      content: "Browse our collection of articles covering web development, programming, and technology."
    },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
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
  });
}

export default function BlogIndex() {
  const {
    config,
    posts,
    pagination,
    availableFilters,
    selectedFilters,
    categorySpec,
  } = useLoaderData<typeof loader>();

  return (
    <BlogLayout config={config}>
      <Suspense fallback={<div>Loading...</div>}>
        <PostsSection
          posts={posts}
          pagination={pagination}
          availableFilters={availableFilters}
          selectedFilters={selectedFilters}
          categorySpec={categorySpec}
        />
      </Suspense>
    </BlogLayout>
  );
}
