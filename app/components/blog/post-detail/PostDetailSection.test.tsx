// PostDetailSection.test - Component Tests

import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PostDetailSection } from './PostDetailSection';
import { extractHeadings } from '~/lib/blog/post-detail/extractHeadings';
import { BrowserRouter } from 'react-router-dom';
import { loadSpec } from '../../../../tests/utils/loadSpec';
import type { RenderedPost, BlogPostDetailSpec } from '~/specs/blog/types';

describe('PostDetailSection', () => {
  let spec: BlogPostDetailSpec;

  beforeAll(async () => {
    spec = await loadSpec<BlogPostDetailSpec>('blog', 'post-detail');
  });

  const renderWithRouter = (ui: React.ReactElement) => {
    return render(<BrowserRouter>{ui}</BrowserRouter>);
  };

  const createMockPost = (overrides = {}): Omit<RenderedPost, 'htmlContent'> & {
    visibleContent: string;
    hiddenContent: string;
  } => ({
    slug: 'test-post',
    title: 'Test Post Title',
    author: 'Test Author',
    publishedAt: '2025-11-14',
    visibleContent: '<p>Test visible content</p>',
    hiddenContent: '',
    category: 'ClaudeMix 考察',
    headings: [],
    hasMermaid: false,
    tags: [],
    source: null,
    ...overrides,
  });

  const createMockSubscriptionAccess = (overrides = {}) => ({
    showFullContent: true,
    cutoffHeadingId: null,
    hasActiveSubscription: true,
    ...overrides,
  });

  describe('Basic Rendering', () => {
    it('should render post title and metadata', () => {
      // Arrange
      const post = createMockPost();

      // Act
      renderWithRouter(
        <PostDetailSection
          post={post}
          headings={[]}
          subscriptionAccess={createMockSubscriptionAccess()}
          thumbnailUrl={null}
          spec={spec}
        />
      );

      // Assert
      expect(screen.getByTestId('post-title')).toHaveTextContent('Test Post Title');
      expect(screen.getByTestId('post-author')).toHaveTextContent(`${spec.messages.ui.author_label} Test Author`);
      expect(screen.getByTestId('post-published-date')).toBeInTheDocument();
    });

    it('should render visible content as HTML', () => {
      // Arrange
      const post = createMockPost({
        visibleContent: '<h2>Visible Section</h2><p>This is visible</p>',
      });

      // Act
      renderWithRouter(
        <PostDetailSection
          post={post}
          headings={[]}
          subscriptionAccess={createMockSubscriptionAccess()}
          thumbnailUrl={null}
          spec={spec}
        />
      );

      // Assert
      const visibleElement = screen.getByTestId('post-content-visible');
      expect(visibleElement.innerHTML).toBe('<h2>Visible Section</h2><p>This is visible</p>');

      // Hidden content should not be rendered
      expect(screen.queryByTestId('post-content-hidden')).not.toBeInTheDocument();
    });

    it('should fallback to default image when thumbnailUrl fails to load', () => {
      // Arrange
      const category = 'インフォメーション';
      const fallbackUrl = spec.thumbnail.display.default_mapping![category];
      const post = createMockPost({ category });

      // Act
      renderWithRouter(
        <PostDetailSection
          post={post}
          headings={[]}
          subscriptionAccess={createMockSubscriptionAccess()}
          thumbnailUrl="https://invalid-url.com/image.avif"
          spec={spec}
        />
      );
      const thumbnailImage = screen.getByTestId('article-thumbnail-image');

      // Simulating error
      fireEvent.error(thumbnailImage);

      // Assert
      const updatedThumbnailImage = screen.getByTestId('article-thumbnail-image');
      expect(updatedThumbnailImage).toHaveAttribute('src', fallbackUrl);
    });

    it('should display srcset when variant object is provided for thumbnailUrl', () => {
      // Arrange
      const variantThumbnail = {
        lg: 'https://assets.example.com/blog/test/lg.avif',
        sm: 'https://assets.example.com/blog/test/sm.avif'
      };
      const post = createMockPost();

      // Act
      renderWithRouter(
        <PostDetailSection
          post={post}
          headings={[]}
          subscriptionAccess={createMockSubscriptionAccess()}
          thumbnailUrl={variantThumbnail}
          spec={spec}
        />
      );

      // Assert
      const thumbnailImage = screen.getByTestId('article-thumbnail-image');
      expect(thumbnailImage).toHaveAttribute('src', variantThumbnail.lg);
      expect(thumbnailImage).toHaveAttribute('srcSet', `${variantThumbnail.sm} 1000w, ${variantThumbnail.lg} 1200w`);
      expect(thumbnailImage).toHaveAttribute('sizes', "(max-width: 767px) calc(100vw - 32px), 800px");
    });
  });

  describe('Styling', () => {
    it('should apply correct CSS classes', () => {
      // Arrange
      const post = createMockPost({
        visibleContent: '<p>Test content</p>',
      });

      // Act
      renderWithRouter(
        <PostDetailSection
          post={post}
          headings={[]}
          subscriptionAccess={createMockSubscriptionAccess()}
          thumbnailUrl={null}
          spec={spec}
        />
      );

      // Assert
      const articleElement = screen.getByTestId('post-detail-section');
      expect(articleElement).toHaveClass('post-detail-section');
      expect(articleElement).toHaveClass('post-detail-section-structure');

      const contentElement = screen.getByTestId('post-content-visible');
      expect(contentElement).toHaveClass('post-detail-section__content');
      expect(contentElement).toHaveClass('prose');
    });
  });

  describe('Table of Contents Integration', () => {
    it('実際のマークダウン(LF)から抽出した見出しで目次が表示される', () => {
      // Arrange: 実際のマークダウンコンテンツ（LF改行）
      const markdown = `# タイトル

## はじめに

本文

## まとめ

本文`;

      const headings = extractHeadings(markdown);
      const post = createMockPost({
        visibleContent: '<p>Test content</p>',
      });

      // Act
      renderWithRouter(
        <PostDetailSection
          post={post}
          headings={headings}
          subscriptionAccess={createMockSubscriptionAccess()}
          thumbnailUrl={null}
          spec={spec}
        />
      );

      // Assert: 目次が表示される
      const tocContainer = screen.getByTestId('table-of-contents');
      expect(tocContainer).toBeInTheDocument();

      // Assert: 抽出された見出しが目次に含まれる
      expect(screen.getByText('はじめに')).toBeInTheDocument();
      expect(screen.getByText('まとめ')).toBeInTheDocument();
    });

    it('コードブロックを含むマークダウンから正しく見出しが抽出され目次が表示される', () => {
      // Arrange: コードブロックを含むマークダウン
      const markdown = `## 本物の見出し

\`\`\`markdown
## コードブロック内の見出し
\`\`\`

## もう一つの本物の見出し`;

      const headings = extractHeadings(markdown);
      const post = createMockPost({
        visibleContent: '<p>Test content</p>',
      });

      // Act
      renderWithRouter(
        <PostDetailSection
          post={post}
          headings={headings}
          subscriptionAccess={createMockSubscriptionAccess()}
          thumbnailUrl={null}
          spec={spec}
        />
      );

      // Assert: 目次が表示される
      const tocContainer = screen.getByTestId('table-of-contents');
      expect(tocContainer).toBeInTheDocument();

      // Assert: コードブロック外の見出しのみが含まれる
      expect(screen.getByText('本物の見出し')).toBeInTheDocument();
      expect(screen.getByText('もう一つの本物の見出し')).toBeInTheDocument();
      expect(screen.queryByText('コードブロック内の見出し')).not.toBeInTheDocument();
    });
  });

  describe('Subscription Access Control', () => {
    it('契約ユーザー（showFullContent: true）の場合、ペイウォールが表示されない', () => {
      // Arrange
      const post = createMockPost();
      const subscriptionAccess = createMockSubscriptionAccess({
        showFullContent: true,
        hasActiveSubscription: true,
      });

      // Act
      renderWithRouter(
        <PostDetailSection
          post={post}
          headings={[]}
          subscriptionAccess={subscriptionAccess}
          thumbnailUrl={null}
          spec={spec}
        />
      );

      // Assert
      expect(screen.queryByText(spec.messages.ui.paywall_message)).not.toBeInTheDocument();
    });

    it('未契約ユーザー（showFullContent: false）の場合、ペイウォールが表示される', () => {
      // Arrange
      const post = createMockPost({
        visibleContent: '<h2>Intro</h2><p>Free content</p>',
        hiddenContent: '<h2>Premium</h2><p>Paid content</p>',
      });
      const subscriptionAccess = createMockSubscriptionAccess({
        showFullContent: false,
        hasActiveSubscription: false,
        cutoffHeadingId: 'intro',
      });

      // Act
      renderWithRouter(
        <PostDetailSection
          post={post}
          headings={[]}
          subscriptionAccess={subscriptionAccess}
          thumbnailUrl={null}
          spec={spec}
        />
      );

      // Assert
      expect(screen.getByText(spec.messages.ui.paywall_message)).toBeInTheDocument();
      expect(screen.getByText(spec.promotion.title)).toBeInTheDocument();
      // Hidden content should not be rendered
      expect(screen.queryByTestId('post-content-hidden')).not.toBeInTheDocument();
    });
  });
});
