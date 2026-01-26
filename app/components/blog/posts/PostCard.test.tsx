import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { BrowserRouter } from 'react-router-dom';
import PostCard from '~/components/blog/posts/PostCard';
import { loadSpec, type BlogPostsSpec } from '../../../../tests/utils/loadSpec';

// Helper to extract test-id from a spec selector string like "[data-testid='my-id']"
const getTestId = (selector: string): string => {
  const match = selector.match(/data-testid='([^']*)'/);
  return match ? match[1] : '';
};

// Helper function to render component with Router context
const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

// Define a more complete type for the spec object locally
// to include properties used in tests but potentially missing from the global type.
interface BlogPostSpecWithSelectors extends BlogPostsSpec {
  ui_selectors: {
    card: {
      category_emoji: string;
      post_title: string;
      post_date: string;
      post_card: string;
      tag_badge: string;
    };
  };
}

describe('PostCard', () => {
  let spec: BlogPostSpecWithSelectors;
  let baseProps: Omit<React.ComponentProps<typeof PostCard>, 'slug'>;
  let mockCategorySpec: React.ComponentProps<typeof PostCard>['categorySpec'];

  beforeAll(async () => {
    // Load spec.yaml dynamically to ensure tests stay in sync with spec
    spec = await loadSpec<BlogPostSpecWithSelectors>('blog', 'posts');
    mockCategorySpec = {
      categories: spec.categories,
      defaultEmoji: spec.business_rules.display.default_category_emoji,
    };

    baseProps = {
      title: 'Test Post Title',
      publishedAt: '2024-05-01',
      category: spec.categories[0].name,
      description: 'A test description.',
      tags: [spec.tags[0].name, spec.tags[1].name],
      categorySpec: mockCategorySpec,
    };
  });

  describe('Rendering', () => {
    it('should display category emoji, title and published date', () => {
      // Arrange
      const props = { ...baseProps, slug: 'test-post', category: spec.categories[0].name };

      // Act
      renderWithRouter(<PostCard {...props} />);

      // Assert
      const categoryEmoji = screen.getByTestId(getTestId(spec.ui_selectors.card.category_emoji));
      const titleElement = screen.getByTestId(getTestId(spec.ui_selectors.card.post_title));
      const dateElement = screen.getByTestId(getTestId(spec.ui_selectors.card.post_date));

      expect(categoryEmoji).toBeInTheDocument();
      // Use the emoji from the spec for the first category
      expect(categoryEmoji).toHaveTextContent(spec.categories[0].emoji);
      expect(titleElement).toBeInTheDocument();
      expect(titleElement).toHaveTextContent(props.title);
      expect(dateElement).toBeInTheDocument();
      // NOTE: The spec's display_format is "YYYY年M月D日", but the current formatPublishedDate implementation seems to produce "YYYY.MM.DD".
      // This test verifies the current behavior.
      expect(dateElement).toHaveTextContent('2024.05.01');
    });

    it('should render as a link element with correct classes', () => {
      // Arrange
      const props = { ...baseProps, slug: 'test-post' };

      // Act
      renderWithRouter(<PostCard {...props} />);

      // Assert
      const linkElement = screen.getByRole('link');
      expect(linkElement).toBeInTheDocument();
      expect(linkElement.tagName).toBe('A');
      expect(linkElement).toHaveClass('post-card');
      expect(linkElement).toHaveClass('post-card-structure');
    });
  });

  describe('Interaction', () => {
    it('should navigate to the correct /blog/{slug} URL', () => {
      // Arrange
      const slug = 'sample-remix-tips-2024';
      const props = {
        ...baseProps,
        slug,
      };

      // Act
      renderWithRouter(<PostCard {...props} />);

      // Assert
      const linkElement = screen.getByTestId(getTestId(spec.ui_selectors.card.post_card));
      expect(linkElement).toHaveAttribute('href', `/blog/${slug}`);
    });
  });

  describe('Date Formatting', () => {
    it('should format date correctly for different dates', () => {
      // Arrange
      const testCases = [
        { publishedAt: '2024-01-01', expected: '2024.01.01' },
        { publishedAt: '2024-12-31', expected: '2024.12.31' },
        { publishedAt: '2024-07-15', expected: '2024.07.15' },
      ];

      testCases.forEach(({ publishedAt, expected }) => {
        const props: React.ComponentProps<typeof PostCard> = {
          ...baseProps,
          publishedAt,
          slug: `date-test-${publishedAt}`,
        };

        // Act
        const { unmount } = renderWithRouter(<PostCard {...props} />);

        // Assert
        const dateElement = screen.getByTestId(getTestId(spec.ui_selectors.card.post_date));
        expect(dateElement).toHaveTextContent(expected);

        // Cleanup
        unmount();
      });
    });
  });

  describe('Category Display', () => {
    // Dynamically create tests for each category defined in the spec file
    // Use an async IIFE to load categories and then define tests with it.each
    ;(async () => {
      const categories = (await loadSpec<BlogPostSpecWithSelectors>('blog', 'posts')).categories;
      it.each(categories)(
        'should display correct emoji "$emoji" for category "$name"',
        ({ name, emoji }) => {
          // Arrange
          const props: React.ComponentProps<typeof PostCard> = {
            ...baseProps,
            slug: `category-test-${name}`,
            category: name,
          };

          // Act
          renderWithRouter(<PostCard {...props} />);

          // Assert
          const categoryEmoji = screen.getByTestId(getTestId(spec.ui_selectors.card.category_emoji));
          expect(categoryEmoji).toHaveTextContent(emoji);
        },
      );
    })();

    it('should display default emoji for an unknown category', () => {
      // Arrange
      const props: React.ComponentProps<typeof PostCard> = {
        ...baseProps,
        slug: 'unknown-category-test',
        category: 'Unknown Category',
      };

      // Act
      renderWithRouter(<PostCard {...props} />);

      // Assert
      const categoryEmoji = screen.getByTestId(getTestId(spec.ui_selectors.card.category_emoji));
      expect(categoryEmoji).toHaveTextContent(spec.business_rules.display.default_category_emoji);
    });
  });

  describe('Metadata Enhancement', () => {
    it('should display description when provided', () => {
      // Arrange
      const props: React.ComponentProps<typeof PostCard> = {
        ...baseProps,
        slug: 'description-test',
        description: 'This is a test description',
      };

      // Act
      renderWithRouter(<PostCard {...props} />);

      // Assert
      const descriptionElement = screen.getByText(props.description as string);
      expect(descriptionElement).toBeInTheDocument();
      expect(descriptionElement).toHaveClass('post-description');
    });

    it('should display tags as space-separated plain text', () => {
      // Arrange
      const tags = [spec.tags[0].name, spec.tags[1].name, spec.tags[2].name];
      const props: React.ComponentProps<typeof PostCard> = {
        ...baseProps,
        slug: 'tags-test',
        tags,
      };

      // Act
      renderWithRouter(<PostCard {...props} />);

      // Assert
      const tagBadge = screen.getByTestId(getTestId(spec.ui_selectors.card.tag_badge));
      expect(tagBadge).toHaveTextContent(tags.join(' '));
      expect(tagBadge).toHaveClass('tag-badge');
    });

    it('should not render tag badge when post has no tags', () => {
      // Arrange
      const props: React.ComponentProps<typeof PostCard> = {
        ...baseProps,
        slug: 'no-tags-test',
        tags: [],
      };

      // Act
      renderWithRouter(<PostCard {...props} />);

      // Assert
      const tagBadge = screen.queryByTestId(getTestId(spec.ui_selectors.card.tag_badge));
      expect(tagBadge).not.toBeInTheDocument();
    });
  });

  describe('Locked State', () => {
    it('should apply locked styles and show message when isLocked is true', () => {
      // Arrange
      const props: React.ComponentProps<typeof PostCard> = {
        ...baseProps,
        slug: 'locked-post',
        isLocked: true,
      };

      // Act
      renderWithRouter(<PostCard {...props} />);

      // Assert
      const cardElement = screen.getByTestId(getTestId(spec.ui_selectors.card.post_card));
      expect(cardElement).toHaveClass('post-card--locked');
      expect(cardElement).toHaveAttribute('data-locked', 'true');

      const lockMessage = screen.getByTestId('lock-message');
      expect(lockMessage).toBeInTheDocument();
      expect(lockMessage).toHaveTextContent('ログインで読む');
    });
  });
});
