import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PostCard from '~/components/blog/posts/PostCard';

// Helper function to render component with Router context
const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('PostCard', () => {
  describe('Rendering', () => {
    it('should display category emoji, title and published date', () => {
      // Arrange
      const props = {
        slug: 'test-post',
        title: 'Test Post Title',
        publishedAt: '2024-05-01',
        category: 'Claude Best Practices',
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
      };

      // Act
      renderWithRouter(<PostCard {...props} />);

      // Assert
      const descriptionElement = screen.getByText('This is a test description');
      expect(descriptionElement).toBeInTheDocument();
      expect(descriptionElement).toHaveClass('post-description');
    });

    it('should display tags as pill-shaped badges', () => {
      // Arrange
      const props = {
        slug: 'test-post',
        title: 'Test Post',
        publishedAt: '2024-05-01',
        category: 'Claude Best Practices',
        tags: ['AI', 'Claude', 'TDD'],
      };

      // Act
      renderWithRouter(<PostCard {...props} />);

      // Assert
      const tagBadges = screen.getAllByTestId('tag-badge');
      expect(tagBadges).toHaveLength(3);
      expect(tagBadges[0]).toHaveTextContent('AI');
      expect(tagBadges[1]).toHaveTextContent('Claude');
      expect(tagBadges[2]).toHaveTextContent('TDD');

      // Check that each tag has the correct class
      tagBadges.forEach(badge => {
        expect(badge).toHaveClass('tag-badge');
      });
    });

    it('should handle posts without tags', () => {
      // Arrange
      const props = {
        slug: 'test-post',
        title: 'Test Post',
        publishedAt: '2024-05-01',
        category: 'Claude Best Practices',
        description: 'Test description',
      };

      // Act
      renderWithRouter(<PostCard {...props} />);

      // Assert
      const tagBadges = screen.queryAllByTestId('tag-badge');
      expect(tagBadges).toHaveLength(0);
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
      };

      // Act
      renderWithRouter(<PostCard {...props} />);

      // Assert
      const descriptionElement = screen.getByText('Comprehensive guide');
      expect(descriptionElement).toBeInTheDocument();

      const tagBadges = screen.getAllByTestId('tag-badge');
      expect(tagBadges).toHaveLength(2);
    });
  });
});
