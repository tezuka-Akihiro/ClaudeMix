import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PostsSection from '~/components/blog/posts/PostsSection';
import type { PostSummary } from '~/data-io/blog/posts/fetchPosts.server';
import type { AvailableFilters, FilterOptions } from '~/specs/blog/types';

// Helper function to render component with Router context
const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

// Default test data
const defaultAvailableFilters: AvailableFilters = {
  categories: [],
  tags: [],
  tagGroups: [],
};

const defaultSelectedFilters: FilterOptions = {};

describe('PostsSection', () => {
  describe('Rendering', () => {
    it('should display page title "Articles"', () => {
      // Arrange
      const posts: PostSummary[] = [];
      const pagination = { currentPage: 1, totalPages: 1 };

      // Act
      renderWithRouter(
        <PostsSection
          posts={posts}
          pagination={pagination}
          availableFilters={defaultAvailableFilters}
          selectedFilters={defaultSelectedFilters}
        />
      );

      // Assert
      const titleElement = screen.getByTestId('posts-section-title');
      expect(titleElement).toBeInTheDocument();
      expect(titleElement).toHaveTextContent('Articles');
    });

    it('should render PostCard for each post', () => {
      // Arrange
      const posts: PostSummary[] = [
        { slug: 'test-post-1', title: 'Test Post 1', publishedAt: '2024-05-01' },
        { slug: 'test-post-2', title: 'Test Post 2', publishedAt: '2024-04-15' },
        { slug: 'test-post-3', title: 'Test Post 3', publishedAt: '2024-03-20' },
      ];
      const pagination = { currentPage: 1, totalPages: 1 };

      // Act
      renderWithRouter(
        <PostsSection
          posts={posts}
          pagination={pagination}
          availableFilters={defaultAvailableFilters}
          selectedFilters={defaultSelectedFilters}
        />
      );

      // Assert
      const postCards = screen.getAllByTestId('post-card');
      expect(postCards).toHaveLength(3);

      // Verify each post card contains correct title
      expect(screen.getByText('Test Post 1')).toBeInTheDocument();
      expect(screen.getByText('Test Post 2')).toBeInTheDocument();
      expect(screen.getByText('Test Post 3')).toBeInTheDocument();
    });

    it('should display empty state message when posts array is empty', () => {
      // Arrange
      const posts: PostSummary[] = [];
      const pagination = { currentPage: 1, totalPages: 1 };

      // Act
      renderWithRouter(
        <PostsSection
          posts={posts}
          pagination={pagination}
          availableFilters={defaultAvailableFilters}
          selectedFilters={defaultSelectedFilters}
        />
      );

      // Assert
      const emptyMessage = screen.getByTestId('posts-section-empty');
      expect(emptyMessage).toBeInTheDocument();
      expect(emptyMessage).toHaveTextContent('記事がまだありません');
    });

    it('should not display empty state message when posts exist', () => {
      // Arrange
      const posts: PostSummary[] = [
        { slug: 'test-post-1', title: 'Test Post 1', publishedAt: '2024-05-01' },
      ];
      const pagination = { currentPage: 1, totalPages: 1 };

      // Act
      renderWithRouter(
        <PostsSection
          posts={posts}
          pagination={pagination}
          availableFilters={defaultAvailableFilters}
          selectedFilters={defaultSelectedFilters}
        />
      );

      // Assert
      const emptyMessage = screen.queryByTestId('posts-section-empty');
      expect(emptyMessage).not.toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should apply correct CSS classes from Layer 2 and Layer 3', () => {
      // Arrange
      const posts: PostSummary[] = [
        { slug: 'test-post-1', title: 'Test Post 1', publishedAt: '2024-05-01' },
      ];
      const pagination = { currentPage: 1, totalPages: 1 };

      // Act
      renderWithRouter(
        <PostsSection
          posts={posts}
          pagination={pagination}
          availableFilters={defaultAvailableFilters}
          selectedFilters={defaultSelectedFilters}
        />
      );

      // Assert
      const sectionElement = screen.getByTestId('posts-section');
      expect(sectionElement).toHaveClass('posts-section'); // Layer 2

      const titleElement = screen.getByTestId('posts-section-title');
      expect(titleElement).toHaveClass('posts-section__title'); // Layer 2

      const gridElement = screen.getByTestId('post-card-grid');
      expect(gridElement).toHaveClass('post-card-grid'); // Layer 3
    });
  });

  describe('Data Integrity', () => {
    it('should pass correct props to PostCard components', () => {
      // Arrange
      const posts: PostSummary[] = [
        { slug: 'sample-remix-tips-2024', title: 'Remixで学ぶモダンWeb開発', publishedAt: '2024-05-01' },
      ];
      const pagination = { currentPage: 1, totalPages: 1 };

      // Act
      renderWithRouter(
        <PostsSection
          posts={posts}
          pagination={pagination}
          availableFilters={defaultAvailableFilters}
          selectedFilters={defaultSelectedFilters}
        />
      );

      // Assert
      const postCardLink = screen.getByTestId('post-card');
      expect(postCardLink).toHaveAttribute('href', '/blog/sample-remix-tips-2024');

      const titleElement = screen.getByTestId('post-card-title');
      expect(titleElement).toHaveTextContent('Remixで学ぶモダンWeb開発');

      const dateElement = screen.getByTestId('post-card-date');
      expect(dateElement).toHaveTextContent('2024年5月1日');
    });

    it('should handle multiple posts correctly', () => {
      // Arrange
      const posts: PostSummary[] = [
        { slug: 'post-1', title: 'Post 1', publishedAt: '2024-05-01' },
        { slug: 'post-2', title: 'Post 2', publishedAt: '2024-04-15' },
      ];
      const pagination = { currentPage: 1, totalPages: 1 };

      // Act
      renderWithRouter(
        <PostsSection
          posts={posts}
          pagination={pagination}
          availableFilters={defaultAvailableFilters}
          selectedFilters={defaultSelectedFilters}
        />
      );

      // Assert
      const postCardLinks = screen.getAllByTestId('post-card');
      expect(postCardLinks).toHaveLength(2);
      expect(postCardLinks[0]).toHaveAttribute('href', '/blog/post-1');
      expect(postCardLinks[1]).toHaveAttribute('href', '/blog/post-2');
    });
  });

  describe('Filter Feature', () => {
    it('should display FilterToggleButton', () => {
      // Arrange
      const posts: PostSummary[] = [];
      const pagination = { currentPage: 1, totalPages: 1 };
      const availableFilters: AvailableFilters = {
        categories: ['Tech', 'Design'],
        tags: ['AI', 'Claude'],
        tagGroups: [],
      };

      // Act
      renderWithRouter(
        <PostsSection
          posts={posts}
          pagination={pagination}
          availableFilters={availableFilters}
          selectedFilters={defaultSelectedFilters}
        />
      );

      // Assert
      const toggleButton = screen.getByTestId('filter-toggle-button');
      expect(toggleButton).toBeInTheDocument();
    });

    it('should open FilterPanel when toggle button is clicked', () => {
      // Arrange
      const posts: PostSummary[] = [];
      const pagination = { currentPage: 1, totalPages: 1 };
      const availableFilters: AvailableFilters = {
        categories: ['Tech'],
        tags: ['AI'],
        tagGroups: [],
      };

      // Act
      renderWithRouter(
        <PostsSection
          posts={posts}
          pagination={pagination}
          availableFilters={availableFilters}
          selectedFilters={defaultSelectedFilters}
        />
      );

      // Initially closed
      expect(screen.queryByTestId('filter-panel')).not.toBeInTheDocument();
      expect(screen.getByTestId('filter-toggle-button')).toBeInTheDocument();

      // Click toggle button
      const toggleButton = screen.getByTestId('filter-toggle-button');
      fireEvent.click(toggleButton);

      // Assert - panel should be open and toggle button should be hidden
      expect(screen.getByTestId('filter-panel')).toBeInTheDocument();
      expect(screen.queryByTestId('filter-toggle-button')).not.toBeInTheDocument();
    });

    it('should close FilterPanel when overlay is clicked', () => {
      // Arrange
      const posts: PostSummary[] = [];
      const pagination = { currentPage: 1, totalPages: 1 };
      const availableFilters: AvailableFilters = {
        categories: ['Tech'],
        tags: ['AI'],
        tagGroups: [],
      };

      // Act
      renderWithRouter(
        <PostsSection
          posts={posts}
          pagination={pagination}
          availableFilters={availableFilters}
          selectedFilters={defaultSelectedFilters}
        />
      );

      // Open panel
      const toggleButton = screen.getByTestId('filter-toggle-button');
      fireEvent.click(toggleButton);
      expect(screen.getByTestId('filter-panel')).toBeInTheDocument();
      expect(screen.queryByTestId('filter-toggle-button')).not.toBeInTheDocument();

      // Click overlay
      const overlay = screen.getByTestId('filter-overlay');
      fireEvent.click(overlay);

      // Assert - panel should be closed and toggle button should be visible again
      expect(screen.queryByTestId('filter-panel')).not.toBeInTheDocument();
      expect(screen.getByTestId('filter-toggle-button')).toBeInTheDocument();
    });

    it('should close FilterPanel when Escape key is pressed', () => {
      // Arrange
      const posts: PostSummary[] = [];
      const pagination = { currentPage: 1, totalPages: 1 };
      const availableFilters: AvailableFilters = {
        categories: ['Tech'],
        tags: ['AI'],
        tagGroups: [],
      };

      // Act
      renderWithRouter(
        <PostsSection
          posts={posts}
          pagination={pagination}
          availableFilters={availableFilters}
          selectedFilters={defaultSelectedFilters}
        />
      );

      // Open panel
      const toggleButton = screen.getByTestId('filter-toggle-button');
      fireEvent.click(toggleButton);
      expect(screen.getByTestId('filter-panel')).toBeInTheDocument();
      expect(screen.queryByTestId('filter-toggle-button')).not.toBeInTheDocument();

      // Press Escape key
      fireEvent.keyDown(document, { key: 'Escape' });

      // Assert - panel should be closed and toggle button should be visible again
      expect(screen.queryByTestId('filter-panel')).not.toBeInTheDocument();
      expect(screen.getByTestId('filter-toggle-button')).toBeInTheDocument();
    });

    it('should pass filter data to FilterPanel', () => {
      // Arrange
      const posts: PostSummary[] = [];
      const pagination = { currentPage: 1, totalPages: 1 };
      const availableFilters: AvailableFilters = {
        categories: ['Tech', 'Design'],
        tags: ['AI', 'Claude', 'TDD'],
        tagGroups: [],
      };
      const selectedFilters: FilterOptions = {
        category: 'Tech',
        tags: ['AI'],
      };

      // Act
      renderWithRouter(
        <PostsSection
          posts={posts}
          pagination={pagination}
          availableFilters={availableFilters}
          selectedFilters={selectedFilters}
        />
      );

      // Open panel
      const toggleButton = screen.getByTestId('filter-toggle-button');
      fireEvent.click(toggleButton);

      // Assert - verify filter components are present with correct data
      expect(screen.getByTestId('category-selector')).toBeInTheDocument();
      expect(screen.getByTestId('tag-grid')).toBeInTheDocument();

      // Verify selected category
      const selector = screen.getByTestId('category-selector') as HTMLSelectElement;
      expect(selector.value).toBe('Tech');

      // Verify selected tag
      const aiButton = screen.getByRole('button', { name: 'AI' });
      expect(aiButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should pass description and tags to PostCard', () => {
      // Arrange
      const posts: PostSummary[] = [
        {
          slug: 'test-post',
          title: 'Test Post',
          publishedAt: '2024-05-01',
          category: 'Tech',
          description: 'Test description',
          tags: ['AI', 'Claude'],
        },
      ];
      const pagination = { currentPage: 1, totalPages: 1 };
      const availableFilters: AvailableFilters = {
        categories: ['Tech'],
        tags: ['AI', 'Claude'],
        tagGroups: [],
      };

      // Act
      renderWithRouter(
        <PostsSection
          posts={posts}
          pagination={pagination}
          availableFilters={availableFilters}
          selectedFilters={defaultSelectedFilters}
        />
      );

      // Assert
      expect(screen.getByText('Test description')).toBeInTheDocument();
      expect(screen.getByText('AI')).toBeInTheDocument();
      expect(screen.getByText('Claude')).toBeInTheDocument();
    });
  });
});
