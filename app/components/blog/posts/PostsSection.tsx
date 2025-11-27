// PostsSection - Component (components層)
// 記事一覧のメインコンテナ（タイトルと記事カードのグリッドを表示）

import React, { useState } from 'react';
import PostCard from '~/components/blog/posts/PostCard';
import Pagination from '~/components/blog/posts/Pagination';
import { FilterToggleButton } from '~/components/blog/posts/FilterToggleButton';
import { FilterPanel } from '~/components/blog/posts/FilterPanel';
import type { PostSummary } from '~/data-io/blog/posts/fetchPosts.server';

interface PostsSectionProps {
  posts: PostSummary[];
  pagination: {
    currentPage: number;
    totalPages: number;
  };
  availableCategories: string[];
  availableTags: string[];
  selectedCategory?: string;
  selectedTags?: string[];
}

const PostsSection: React.FC<PostsSectionProps> = ({
  posts,
  pagination,
  availableCategories,
  availableTags,
  selectedCategory,
  selectedTags,
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  return (
    <section className="posts-section" data-testid="posts-section">
      {!isFilterOpen && (
        <FilterToggleButton
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          isOpen={isFilterOpen}
        />
      )}

      <FilterPanel
        availableCategories={availableCategories}
        availableTags={availableTags}
        selectedCategory={selectedCategory}
        selectedTags={selectedTags}
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
      />
      <h1 className="posts-section__title" data-testid="posts-section-title">
        Articles
      </h1>
      {posts.length === 0 ? (
        <p data-testid="posts-section-empty">記事がまだありません</p>
      ) : (
        <>
          <div className="post-card-grid" data-testid="post-card-grid">
            {posts.map((post) => (
              <PostCard
                key={post.slug}
                slug={post.slug}
                title={post.title}
                publishedAt={post.publishedAt}
                category={post.category}
                description={post.description}
                tags={post.tags}
              />
            ))}
          </div>

          {/* ページネーション */}
          {pagination.totalPages > 1 && (
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
            />
          )}
        </>
      )}
    </section>
  );
};

export default PostsSection;
