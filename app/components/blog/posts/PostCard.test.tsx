import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { BrowserRouter } from 'react-router-dom';
import PostCard from '~/components/blog/posts/PostCard';
import { loadSpec, type BlogPostsSpec } from '../../../../tests/utils/loadSpec';

// Helper function to render component with Router context
const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('PostCard', () => {
  let spec: BlogPostsSpec;
  let mockCategorySpec: {
    categories: Array<{ name: string; emoji: string }>;
    defaultEmoji: string;
  };

  beforeAll(async () => {
    // Load spec.yaml dynamically to ensure tests stay in sync with spec
    spec = await loadSpec('blog', 'posts');
    mockCategorySpec = {
      categories: spec.categories,
      defaultEmoji: spec.business_rules.display.default_category_emoji,
    };
  });

  describe('Rendering', () => {
    it('should display category emoji, title and published date', () => {
      // Arrange
      const props = {
        slug:'test-post',
        title: 'Test Post Title',
        publishedAt: '2024-05-01',
        category: 'Claude Best Practices',
        tags: [],
        categorySpec: mockCategorySpec,
      };

      // Act
      renderWithRouter(<PostCard {...props} />);

      // Assert
      const categoryEmoji = screen.getByTestId('category-emoji');
      const titleElement = screen.getByTestId('post-card-title');
      const dateElement = screen.getByTestId('post-card-date');

      expect(categoryEmoji).toBeInTheDocument();
      expect(categoryEmoji).toHaveTextContent('📚');
      expect(titleElement).toBeInTheDocument();
      expect(titleElement).toHaveTextContent('Test Post Title');
      expect(dateElement).toBeInTheDocument();
      expect(dateElement).toHaveTextContent('2024年5月1日');
    });

    it('should render as a link element', () => {
      // Arrange
      const props = {
        slug: 'test-post',
        title: 'Test Post',
        publishedAt: '2024-05-01',
        category: 'Claude Best Practices',
        tags: [],
        categorySpec: mockCategorySpec,
      };

      // Act
      renderWithRouter(<PostCard {...props} />);

      // Assert
      const linkElement = screen.getByTestId('post-card');
      expect(linkElement).toBeInTheDocument();
      expect(linkElement.tagName).toBe('A');
    });

    it('should apply correct CSS classes', () => {
      // Arrange
      const props = {
        slug: 'test-post',
        title: 'Test Post',
        publishedAt: '2024-05-01',
        category: 'Claude Best Practices',
        tags: [],
        categorySpec: mockCategorySpec,
      };

      // Act
      renderWithRouter(<PostCard {...props} />);

      // Assert
      const linkElement = screen.getByTestId('post-card');
      expect(linkElement).toHaveClass('post-card');
      expect(linkElement).toHaveClass('post-card-structure');
    });
  });

  describe('Interaction', () => {
    it('should navigate to /blog/{slug} when clicked', () => {
      // Arrange
      const props = {
        slug: 'sample-remix-tips-2024',
        title: 'Remix Tips',
        publishedAt: '2024-05-01',
        category: 'Tutorials & Use Cases',
        tags: [],
        categorySpec: mockCategorySpec,
      };

      // Act
      renderWithRouter(<PostCard {...props} />);

      // Assert
      const linkElement = screen.getByTestId('post-card');
      expect(linkElement).toHaveAttribute('href', '/blog/sample-remix-tips-2024');
    });

    it('should have correct link for different slugs', () => {
      // Arrange
      const props = {
        slug: 'another-post',
        title: 'Another Post',
        publishedAt: '2024-06-15',
        category: 'ClaudeMix Philosophy',
        tags: [],
        categorySpec: mockCategorySpec,
      };

      // Act
      renderWithRouter(<PostCard {...props} />);

      // Assert
      const linkElement = screen.getByTestId('post-card');
      expect(linkElement).toHaveAttribute('href', '/blog/another-post');
    });
  });

  describe('Styling', () => {
    it('should have hover state styling defined', () => {
      // Arrange
      const props = {
        slug: 'test-post',
        title: 'Test Post',
        publishedAt: '2024-05-01',
        category: 'Claude Best Practices',
        tags: [],
        categorySpec: mockCategorySpec,
      };

      // Act
      renderWithRouter(<PostCard {...props} />);

      // Assert
      const linkElement = screen.getByTestId('post-card');
      // Verify that the hover class is present (Layer 2 defines :hover pseudo-class)
      expect(linkElement).toHaveClass('post-card');

      // Verify that the component has the necessary data-testid for interaction testing
      expect(linkElement).toHaveAttribute('data-testid', 'post-card');
    });
  });

  describe('Date Formatting', () => {
    it('should format date correctly for different dates', () => {
      // Arrange - Test multiple date formats
      const testCases = [
        { publishedAt: '2024-01-01', expected: '2024年1月1日' },
        { publishedAt: '2024-12-31', expected: '2024年12月31日' },
        { publishedAt: '2024-07-15', expected: '2024年7月15日' },
      ];

      testCases.forEach(({ publishedAt, expected }) => {
        const props = {
          slug: 'test-post',
          title: 'Test Post',
          publishedAt,
          category: 'Claude Best Practices',
          tags: [],
          categorySpec: mockCategorySpec,
        };

        // Act
        const { unmount } = renderWithRouter(<PostCard {...props} />);

        // Assert
        const dateElement = screen.getByTestId('post-card-date');
        expect(dateElement).toHaveTextContent(expected);

        // Cleanup
        unmount();
      });
    });
  });

  describe('Category Display', () => {
    it('should display correct emoji for each category', () => {
      // Arrange - Test all three categories
      const testCases = [
        { category: 'Claude Best Practices', expectedEmoji: '📚' },
        { category: 'ClaudeMix Philosophy', expectedEmoji: '🎨' },
        { category: 'Tutorials & Use Cases', expectedEmoji: '🚀' },
      ];

      testCases.forEach(({ category, expectedEmoji }) => {
        const props = {
          slug: 'test-post',
          title: 'Test Post',
          publishedAt: '2024-05-01',
          category,
          tags: [],
          categorySpec: mockCategorySpec,
        };

        // Act
        const { unmount } = renderWithRouter(<PostCard {...props} />);

        // Assert
        const categoryEmoji = screen.getByTestId('category-emoji');
        expect(categoryEmoji).toHaveTextContent(expectedEmoji);

        // Cleanup
        unmount();
      });
    });
  });

  describe('Metadata Enhancement', () => {
    it('should display description when provided', () => {
      // Arrange
      const props = {
        slug: 'test-post',
        title: 'Test Post',
        publishedAt: '2024-05-01',
        category: 'Claude Best Practices',
        description: 'This is a test description',
        tags: [],
        categorySpec: mockCategorySpec,
      };

      // Act
      renderWithRouter(<PostCard {...props} />);

      // Assert
      const descriptionElement = screen.getByText('This is a test description');
      expect(descriptionElement).toBeInTheDocument();
      expect(descriptionElement).toHaveClass('post-description');
    });

    it('should display tags as space-separated plain text', () => {
      // Arrange
      const props = {
        slug: 'test-post',
        title: 'Test Post',
        publishedAt: '2024-05-01',
        category: 'Claude Best Practices',
        tags: ['AI', 'Claude', 'TDD'],
        categorySpec: mockCategorySpec,
      };

      // Act
      renderWithRouter(<PostCard {...props} />);

      // Assert
      const tagBadge = screen.getByTestId('tag-badge');
      expect(tagBadge).toHaveTextContent('AI Claude TDD');
      expect(tagBadge).toHaveClass('tag-badge');
    });

    it('should handle posts without tags', () => {
      // Arrange
      const props = {
        slug: 'test-post',
        title: 'Test Post',
        publishedAt: '2024-05-01',
        category: 'Claude Best Practices',
        tags: [],
        description: 'Test description',
        categorySpec: mockCategorySpec,
      };

      // Act
      renderWithRouter(<PostCard {...props} />);

      // Assert
      const tagBadge = screen.queryByTestId('tag-badge');
      expect(tagBadge).not.toBeInTheDocument();
    });

    it('should display both description and tags together', () => {
      // Arrange
      const props = {
        slug: 'test-post',
        title: 'Test Post',
        publishedAt: '2024-05-01',
        category: 'Claude Best Practices',
        description: 'Comprehensive guide',
        tags: ['Remix', 'TypeScript'],
        categorySpec: mockCategorySpec,
      };

      // Act
      renderWithRouter(<PostCard {...props} />);

      // Assert
      const descriptionElement = screen.getByText('Comprehensive guide');
      expect(descriptionElement).toBeInTheDocument();

      const tagBadge = screen.getByTestId('tag-badge');
      expect(tagBadge).toHaveTextContent('Remix TypeScript');
    });
  });
});
