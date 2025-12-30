import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { PostDetailSection } from './PostDetailSection';
import type { RenderedPost } from '~/specs/blog/types';
import { extractHeadings } from '../../../lib/blog/post-detail/extractHeadings';

/**
 * テスト用のPostオブジェクトを生成するファクトリ関数（見出しベース対応）
 * @param overrides - デフォルト値を上書きするプロパティ
 */
const createMockPost = (overrides = {}) => ({
  slug: 'test-post',
  title: 'Test Post Title',
  author: 'Test Author',
  publishedAt: '2024-05-01',
  visibleContent: '<p>Test content</p>',
  hiddenContent: '',
  tags: [],
  category: 'Test Category',
  source: null,
  hasMermaid: false,
  headings: [],
  ...overrides,
});

/**
 * テスト用のsubscriptionAccessオブジェクトを生成するファクトリ関数（見出しベース対応）
 */
const createMockSubscriptionAccess = (overrides = {}) => ({
  showFullContent: true,
  cutoffHeadingId: null,
  hasActiveSubscription: true,
  ...overrides,
});

/**
 * Routerでラップしてレンダリングするヘルパー関数
 */
const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('PostDetailSection', () => {
  describe('Rendering', () => {
    it('should render basic post details correctly', () => {
      // Arrange
      const post = createMockPost({
        title: 'My Awesome Post',
        author: 'John Doe',
        publishedAt: '2024-07-26',
        visibleContent: '<h2>Hello World</h2>',
      });

      // Act
      renderWithRouter(<PostDetailSection post={post} headings={[]} subscriptionAccess={createMockSubscriptionAccess()} />);

      // Assert
      const articleElement = screen.getByTestId('post-detail-section');
      expect(articleElement).toBeInTheDocument();
      expect(articleElement.tagName).toBe('ARTICLE');
      expect(articleElement).toHaveClass('post-detail-section post-detail-section-structure');

      const titleElement = screen.getByTestId('post-title');
      expect(titleElement).toBeInTheDocument();
      expect(titleElement).toHaveTextContent('My Awesome Post');

      const authorElement = screen.getByTestId('post-author');
      expect(authorElement).toBeInTheDocument();
      expect(authorElement).toHaveTextContent('著者: John Doe');

      const dateElement = screen.getByTestId('post-published-date');
      expect(dateElement).toBeInTheDocument();
      expect(dateElement).toHaveTextContent('2024年7月26日');
      expect(dateElement).toHaveAttribute('dateTime', '2024-07-26');

      const contentElement = screen.getByTestId('post-content-visible');
      expect(contentElement).toBeInTheDocument();
      expect(contentElement.innerHTML).toBe('<h2>Hello World</h2>');
      expect(contentElement).toHaveClass('post-detail-section__content prose');
    });
  });

  describe('Date Formatting', () => {
    it.each([
      { date: '2024-01-01', expected: '2024年1月1日' },
      { date: '2024-12-31', expected: '2024年12月31日' },
      { date: '2024-06-15', expected: '2024年6月15日' },
    ])('should format date "$date" as "$expected"', ({ date, expected }) => {
      // Arrange
      const post = createMockPost({ publishedAt: date });

      // Act
      renderWithRouter(<PostDetailSection post={post} headings={[]} subscriptionAccess={createMockSubscriptionAccess()} />);

      // Assert
      const dateElement = screen.getByTestId('post-published-date');
      expect(dateElement).toHaveTextContent(expected);
      expect(dateElement).toHaveAttribute('dateTime', date);
    });
  });

  describe('HTML Content (Heading-based)', () => {
    it('should render visible content with dangerouslySetInnerHTML', () => {
      // Arrange
      const visibleContent = '<h2>Section Title</h2><p>Paragraph text</p><ul><li>Item 1</li></ul>';
      const post = createMockPost({ visibleContent });

      // Act
      renderWithRouter(<PostDetailSection post={post} headings={[]} subscriptionAccess={createMockSubscriptionAccess()} />);

      // Assert
      const contentElement = screen.getByTestId('post-content-visible');
      expect(contentElement.innerHTML).toBe(visibleContent);

      // Verify specific elements within HTML content
      expect(contentElement.querySelector('h2')).toBeInTheDocument();
      expect(contentElement.querySelector('p')).toBeInTheDocument();
      expect(contentElement.querySelector('ul')).toBeInTheDocument();
    });

    it('should handle empty visible content', () => {
      // Arrange
      const post = createMockPost({
        visibleContent: '',
        hiddenContent: '',
      });

      // Act
      renderWithRouter(<PostDetailSection post={post} headings={[]} subscriptionAccess={createMockSubscriptionAccess()} />);

      // Assert
      const contentElement = screen.getByTestId('post-content-visible');
      expect(contentElement.innerHTML).toBe('');
    });

    it('should render hidden content when showFullContent is true', () => {
      // Arrange
      const post = createMockPost({
        visibleContent: '<h2>Visible Section</h2><p>This is visible</p>',
        hiddenContent: '<h2>Hidden Section</h2><p>This is hidden</p>',
      });
      const subscriptionAccess = createMockSubscriptionAccess({
        showFullContent: true,
        hasActiveSubscription: true,
      });

      // Act
      renderWithRouter(<PostDetailSection post={post} headings={[]} subscriptionAccess={subscriptionAccess} />);

      // Assert
      const visibleElement = screen.getByTestId('post-content-visible');
      expect(visibleElement.innerHTML).toBe('<h2>Visible Section</h2><p>This is visible</p>');

      const hiddenElement = screen.getByTestId('post-content-hidden');
      expect(hiddenElement.innerHTML).toBe('<h2>Hidden Section</h2><p>This is hidden</p>');
    });

    it('should not render hidden content when showFullContent is false', () => {
      // Arrange
      const post = createMockPost({
        visibleContent: '<h2>Visible Section</h2><p>This is visible</p>',
        hiddenContent: '<h2>Hidden Section</h2><p>This is hidden</p>',
      });
      const subscriptionAccess = createMockSubscriptionAccess({
        showFullContent: false,
        hasActiveSubscription: false,
        cutoffHeadingId: 'visible-section',
      });

      // Act
      renderWithRouter(<PostDetailSection post={post} headings={[]} subscriptionAccess={subscriptionAccess} />);

      // Assert
      const visibleElement = screen.getByTestId('post-content-visible');
      expect(visibleElement.innerHTML).toBe('<h2>Visible Section</h2><p>This is visible</p>');

      // Hidden content should not be rendered
      expect(screen.queryByTestId('post-content-hidden')).not.toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should apply correct CSS classes', () => {
      // Arrange
      const post = createMockPost({
        visibleContent: '<p>Test content</p>',
      });

      // Act
      renderWithRouter(<PostDetailSection post={post} headings={[]} subscriptionAccess={createMockSubscriptionAccess()} />);

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
      renderWithRouter(<PostDetailSection post={post} headings={headings} subscriptionAccess={createMockSubscriptionAccess()} />);

      // Assert: 目次が表示される
      const tocContainer = screen.getByTestId('table-of-contents');
      expect(tocContainer).toBeInTheDocument();

      // Assert: 抽出された見出しが目次に含まれる
      expect(screen.getByText('はじめに')).toBeInTheDocument();
      expect(screen.getByText('まとめ')).toBeInTheDocument();
    });

    it('実際のマークダウン(CRLF)から抽出した見出しで目次が表示される', () => {
      // Arrange: Windows環境のマークダウンコンテンツ（CRLF改行）
      const markdown = "# タイトル\r\n\r\n## セクション1\r\n\r\n本文\r\n\r\n## セクション2\r\n\r\n本文";

      const headings = extractHeadings(markdown);
      const post = createMockPost({
        visibleContent: '<p>Test content</p>',
      });

      // Act
      renderWithRouter(<PostDetailSection post={post} headings={headings} subscriptionAccess={createMockSubscriptionAccess()} />);

      // Assert: 目次が表示される
      const tocContainer = screen.getByTestId('table-of-contents');
      expect(tocContainer).toBeInTheDocument();

      // Assert: 抽出された見出しが目次に含まれる
      expect(screen.getByText('セクション1')).toBeInTheDocument();
      expect(screen.getByText('セクション2')).toBeInTheDocument();
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
      renderWithRouter(<PostDetailSection post={post} headings={headings} subscriptionAccess={createMockSubscriptionAccess()} />);

      // Assert: 目次が表示される
      const tocContainer = screen.getByTestId('table-of-contents');
      expect(tocContainer).toBeInTheDocument();

      // Assert: コードブロック外の見出しのみが含まれる
      expect(screen.getByText('本物の見出し')).toBeInTheDocument();
      expect(screen.getByText('もう一つの本物の見出し')).toBeInTheDocument();
      expect(screen.queryByText('コードブロック内の見出し')).not.toBeInTheDocument();
    });

    it('見出しが空配列の場合は目次が表示されない', () => {
      // Arrange
      const post = {
        slug: 'test-post',
        title: 'Test Post',
        author: 'Test Author',
        publishedAt: '2024-05-01',
        visibleContent: '<p>Test content</p>',
        hiddenContent: '',
        tags: [],
        category: 'Test Category',
        source: null,
        hasMermaid: false,
        headings: [],
      };

      // Act
      renderWithRouter(<PostDetailSection post={post} headings={[]} subscriptionAccess={createMockSubscriptionAccess()} />);

      // Assert: 目次が表示されない
      const tocContainer = screen.queryByTestId('table-of-contents');
      expect(tocContainer).not.toBeInTheDocument();
    });

    it('見出しが存在しないマークダウンの場合は目次が表示されない', () => {
      // Arrange: 見出しのないマークダウン
      const markdown = '本文のみ';
      const headings = extractHeadings(markdown);
      const post = createMockPost({
        visibleContent: '<p>Test content</p>',
      });

      // Act
      renderWithRouter(<PostDetailSection post={post} headings={headings} subscriptionAccess={createMockSubscriptionAccess()} />);

      // Assert: 目次が表示されない
      const tocContainer = screen.queryByTestId('table-of-contents');
      expect(tocContainer).not.toBeInTheDocument();
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
      renderWithRouter(<PostDetailSection post={post} headings={[]} subscriptionAccess={subscriptionAccess} />);

      // Assert
      expect(screen.queryByText('続きを読むには会員登録が必要です')).not.toBeInTheDocument();
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
      renderWithRouter(<PostDetailSection post={post} headings={[]} subscriptionAccess={subscriptionAccess} />);

      // Assert
      expect(screen.getByText('続きを読むには会員登録が必要です')).toBeInTheDocument();
      expect(screen.getByText('すべての記事を読むには会員登録が必要です')).toBeInTheDocument();
      // Hidden content should not be rendered
      expect(screen.queryByTestId('post-content-hidden')).not.toBeInTheDocument();
    });
  });
});
