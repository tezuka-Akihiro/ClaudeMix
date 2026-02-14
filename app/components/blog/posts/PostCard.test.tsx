import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

describe('PostCard', () => {
  let spec: BlogPostsSpec;
  let baseProps: Omit<React.ComponentProps<typeof PostCard>, 'slug'>;

  beforeAll(async () => {
    // Load spec.yaml dynamically to ensure tests stay in sync with spec
    spec = await loadSpec<BlogPostsSpec>('blog', 'posts');

    baseProps = {
      title: 'Test Post Title',
      publishedAt: '2024-05-01',
      category: spec.categories[0].name,
      description: 'A test description.',
      tags: [spec.tags[0].name, spec.tags[1].name],
      thumbnailUrl: null,
      lockMessage: spec.messages.lock_message,
      dateSeparator: spec.date_format.display_separator,
    };
  });

  describe('Rendering', () => {
    it('should display title and published date', () => {
      // Arrange
      const props = { ...baseProps, slug: 'test-post', category: spec.categories[0].name };

      // Act
      renderWithRouter(<PostCard {...props} />);

      // Assert
      const titleElement = screen.getByTestId(getTestId(spec.ui_selectors.card.post_title));
      const dateElement = screen.getByTestId(getTestId(spec.ui_selectors.card.post_date));

      expect(titleElement).toBeInTheDocument();
      expect(titleElement).toHaveTextContent(props.title);
      expect(dateElement).toBeInTheDocument();
      expect(dateElement).toHaveTextContent(`2024${spec.date_format.display_separator}05${spec.date_format.display_separator}01`);
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
      const sep = spec.date_format.display_separator;
      const testCases = [
        { publishedAt: '2024-01-01', expected: `2024${sep}01${sep}01` },
        { publishedAt: '2024-12-31', expected: `2024${sep}12${sep}31` },
        { publishedAt: '2024-07-15', expected: `2024${sep}07${sep}15` },
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

  describe('Thumbnail', () => {
    it('should display thumbnail when thumbnailUrl is provided', () => {
      // Arrange
      const props: React.ComponentProps<typeof PostCard> = {
        ...baseProps,
        slug: 'thumbnail-test',
        thumbnailUrl: 'https://assets.example.com/blog/thumbnail-test/thumbnail.avif',
      };

      // Act
      renderWithRouter(<PostCard {...props} />);

      // Assert
      const thumbnailContainer = screen.getByTestId('thumbnail-container');
      const thumbnailImage = screen.getByTestId('thumbnail-image');

      expect(thumbnailContainer).toBeInTheDocument();
      expect(thumbnailImage).toBeInTheDocument();
      expect(thumbnailImage).toHaveAttribute('src', props.thumbnailUrl);
      expect(thumbnailImage).toHaveAttribute('loading', 'lazy');
      expect(thumbnailImage).toHaveAttribute('decoding', 'async');
      expect(thumbnailImage).toHaveAttribute('alt', `${props.title}のサムネイル`);
    });

    it('should display srcset when variant object is provided for thumbnailUrl', () => {
      // Arrange
      const variantThumbnail = {
        lg: 'https://assets.example.com/blog/test/lg.avif',
        sm: 'https://assets.example.com/blog/test/sm.avif'
      };
      const props: React.ComponentProps<typeof PostCard> = {
        ...baseProps,
        slug: 'srcset-test',
        thumbnailUrl: variantThumbnail,
      };

      // Act
      renderWithRouter(<PostCard {...props} />);

      // Assert
      const thumbnailImage = screen.getByTestId('thumbnail-image');
      expect(thumbnailImage).toHaveAttribute('src', variantThumbnail.lg);
      expect(thumbnailImage).toHaveAttribute('srcSet', `${variantThumbnail.sm} 1000w, ${variantThumbnail.lg} 1200w`);
      expect(thumbnailImage).toHaveAttribute('sizes', `(max-width: ${spec.thumbnail.image_sizes.mobile_breakpoint}px) calc(100vw - ${spec.thumbnail.image_sizes.mobile_padding}px), ${spec.thumbnail.image_sizes.default_width}px`);
    });

    it('should not display thumbnail when thumbnailUrl is null', () => {
      // Arrange
      const props: React.ComponentProps<typeof PostCard> = {
        ...baseProps,
        slug: 'no-thumbnail-test',
        thumbnailUrl: null,
      };

      // Act
      renderWithRouter(<PostCard {...props} />);

      // Assert
      const thumbnailContainer = screen.queryByTestId('thumbnail-container');
      expect(thumbnailContainer).not.toBeInTheDocument();
    });

    it('should fallback to default image when thumbnailUrl fails to load', () => {
      // Arrange
      const category = spec.categories[spec.categories.length - 1].name; // 'インフォメーション'
      const fallbackUrl = spec.thumbnail.display.default_mapping![category];

      const props: React.ComponentProps<typeof PostCard> = {
        ...baseProps,
        slug: 'error-thumbnail-test',
        category,
        thumbnailUrl: 'https://invalid-url.com/image.avif',
      };

      // Act
      renderWithRouter(<PostCard {...props} />);
      const thumbnailImage = screen.getByTestId('thumbnail-image');

      // Simulating error
      fireEvent.error(thumbnailImage);

      // Assert
      const updatedThumbnailImage = screen.getByTestId('thumbnail-image');
      const expectedSrc = typeof fallbackUrl === 'string' ? fallbackUrl : fallbackUrl.lg;
      expect(updatedThumbnailImage).toHaveAttribute('src', expectedSrc);
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
      expect(lockMessage).toHaveTextContent(spec.messages.lock_message);
    });
  });
});
