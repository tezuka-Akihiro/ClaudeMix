import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PostsSection from './PostsSection';
import type { PostsPageData } from '~/specs/blog/types';
import { loadSpec, type BlogPostsSpec } from '../../../../tests/utils/loadSpec';

// Helper function to render component with Router context
const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

interface MockPostsSectionProps extends PostsPageData {
  isAuthenticated: boolean;
}

describe('PostsSection', () => {
  let mockProps: MockPostsSectionProps;
  let spec: BlogPostsSpec;

  beforeAll(async () => {
    // Load spec.yaml dynamically to ensure tests stay in sync with spec
    spec = await loadSpec('blog', 'posts');
  });

  beforeEach(() => {
    mockProps = {
      posts: [
        {
          slug: 'test-post-1',
          title: 'Test Post 1',
          publishedAt: '2024-01-01',
          category: 'Category 1',
          tags: [],
        },
        {
          slug: 'test-post-2',
          title: 'Test Post 2',
          publishedAt: '2024-01-02',
          category: 'Category 2',
          tags: [],
        },
      ],
      isAuthenticated: true,
      pagination: {
        currentPage: 1,
        totalPages: 5,
      },
      availableFilters: {
        categories: ['Category 1', 'Category 2'],
        tags: ['Tag 1', 'Tag 2'],
        tagGroups: [],
      },
      selectedFilters: {
        category: '',
        tags: [],
      },
      categorySpec: {
        categories: spec.categories,
        defaultEmoji: spec.business_rules.display.default_category_emoji,
      },
    };
  });

  describe('Rendering', () => {
    it('should display the section title', () => {
      renderWithRouter(<PostsSection {...mockProps} />);
      expect(screen.getByTestId('posts-section-title')).toHaveTextContent('Articles');
    });

    it('should render a grid of post cards when posts are available', () => {
      renderWithRouter(<PostsSection {...mockProps} />);
      const postCards = screen.getAllByTestId('post-card');
      expect(postCards).toHaveLength(mockProps.posts.length);
      expect(screen.getByText('Test Post 1')).toBeInTheDocument();
      expect(screen.getByText('Test Post 2')).toBeInTheDocument();
    });

    it('should display an empty message when no posts are available', () => {
      mockProps.posts = [];
      renderWithRouter(<PostsSection {...mockProps} />);
      expect(screen.getByTestId('posts-section-empty')).toHaveTextContent('記事がまだありません');
      expect(screen.queryByTestId('post-card-grid')).not.toBeInTheDocument();
    });
  });

  describe('Pagination', () => {
    it('should render pagination when totalPages is greater than 1', () => {
      mockProps.pagination.totalPages = 2;
      renderWithRouter(<PostsSection {...mockProps} />);
      expect(screen.getByTestId('pagination')).toBeInTheDocument();
    });

    it('should not render pagination when totalPages is 1', () => {
      mockProps.pagination.totalPages = 1;
      renderWithRouter(<PostsSection {...mockProps} />);
      expect(screen.queryByTestId('pagination')).not.toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    it('should render the filter toggle button', () => {
      renderWithRouter(<PostsSection {...mockProps} />);
      expect(screen.getByTestId('filter-toggle-button')).toBeInTheDocument();
    });

    it('should open the filter panel when the toggle button is clicked', () => {
      renderWithRouter(<PostsSection {...mockProps} />);
      const toggleButton = screen.getByTestId('filter-toggle-button');
      
      // Initially, panel is not visible
      expect(screen.queryByTestId('filter-panel')).not.toBeInTheDocument();
      
      fireEvent.click(toggleButton);
      
      // After click, panel is visible
      expect(screen.getByTestId('filter-panel')).toBeInTheDocument();
    });

    it('should pass correct filter data to FilterPanel', () => {
      mockProps.selectedFilters = { category: 'Category 1', tags: ['Tag 1'] };
      renderWithRouter(<PostsSection {...mockProps} />);
      
      // Open the panel to check its contents
      fireEvent.click(screen.getByTestId('filter-toggle-button'));
      
      const categorySelector = screen.getByRole('combobox');
      expect(categorySelector).toHaveValue('Category 1');
      
      const tagButton = screen.getByRole('button', { name: 'Tag 1' });
      expect(tagButton).toHaveAttribute('aria-pressed', 'true');
    });
  });
});
