// PostsSection - Component (components層)
// 記事一覧のメインコンテナ（タイトルと記事カードのグリッドを表示）

import React, { useState, useEffect } from 'react';
import { useFetcher } from '@remix-run/react';
import PostCard from '~/components/blog/posts/PostCard';
import LoadMoreButton from '~/components/blog/posts/LoadMoreButton';
import { FilterToggleButton } from '~/components/blog/posts/FilterToggleButton';
import { FilterPanel } from '~/components/blog/posts/FilterPanel';
import type { PostsPageData, PostSummary, BlogPostsSpec } from '~/specs/blog/types';

interface PostsSectionProps extends PostsPageData {
  isAuthenticated: boolean;
  pageTitle: string;
  publicCategories: string[];
  messages: BlogPostsSpec['messages'];
  accessibility: BlogPostsSpec['accessibility'];
  dateFormat: BlogPostsSpec['date_format'];
}

const PostsSection: React.FC<PostsSectionProps> = ({
  posts: initialPosts,
  isAuthenticated,
  loadMoreInfo: initialLoadMoreInfo,
  availableFilters,
  selectedFilters,
  pageTitle,
  publicCategories,
  messages,
  accessibility,
  dateFormat,
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [posts, setPosts] = useState<PostSummary[]>(initialPosts);
  const [loadMoreInfo, setLoadMoreInfo] = useState(initialLoadMoreInfo);
  const fetcher = useFetcher();

  const { categories: availableCategories, tags: availableTags, tagGroups } = availableFilters;
  const { category: selectedCategory, tags: selectedTags } = selectedFilters;

  // fetcherで取得した記事を追加
  useEffect(() => {
    if (fetcher.data && typeof fetcher.data === 'object' && 'posts' in fetcher.data) {
      const data = fetcher.data as { posts: PostSummary[]; loadMoreInfo: typeof initialLoadMoreInfo };
      setPosts(prevPosts => [...prevPosts, ...data.posts]);
      setLoadMoreInfo(data.loadMoreInfo);
    }
  }, [fetcher.data]);

  const handleLoadMore = () => {
    const params = new URLSearchParams();
    params.append('loaded', loadMoreInfo.loadedCount.toString());

    if (selectedFilters.category) {
      params.append('category', selectedFilters.category);
    }

    if (selectedFilters.tags && selectedFilters.tags.length > 0) {
      selectedFilters.tags.forEach(tag => {
        params.append('tags', tag);
      });
    }

    fetcher.load(`/blog?${params.toString()}`);
  };

  const isLoading = fetcher.state === 'loading' || fetcher.state === 'submitting';

  return (
    <section className="posts-section" data-testid="posts-section">
      {!isFilterOpen && (
        <FilterToggleButton
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          isOpen={isFilterOpen}
          label={messages.filter.button_label}
        />
      )}

      <FilterPanel
        availableCategories={availableCategories}
        availableTags={availableTags}
        tagGroups={tagGroups} // FilterPanel に tagGroups を渡す
        selectedCategory={selectedCategory}
        selectedTags={selectedTags}
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filterMessages={messages.filter}
      />
      <h1 className="posts-section__title" data-testid="page-title">
        {pageTitle}
      </h1>
      {posts.length === 0 ? (
        <p data-testid="posts-section-empty">{messages.empty_state.description}</p>
      ) : (
        <>
          <div className="post-card-grid" data-testid="post-card-grid">
            {posts.map((post, index) => {
              // 公開カテゴリ以外は認証必須
              const isLocked = !isAuthenticated && !publicCategories.includes(post.category);

              return (
                <PostCard
                  key={post.slug}
                  slug={post.slug}
                  title={post.title}
                  publishedAt={post.publishedAt}
                  category={post.category}
                  description={post.description}
                  tags={post.tags}
                  thumbnailUrl={post.thumbnailUrl}
                  isLocked={isLocked}
                  lockMessage={messages.lock_message}
                  dateSeparator={dateFormat.display_separator}
                  isPriority={index < 2}
                />
              );
            })}
          </div>

          {/* もっと見るボタン */}
          <LoadMoreButton
            onClick={handleLoadMore}
            isLoading={isLoading}
            hasMore={loadMoreInfo.hasMore}
            messages={messages.load_more}
            ariaLabel={accessibility.aria_labels.load_more_button}
          />
        </>
      )}
    </section>
  );
};

export default PostsSection;
