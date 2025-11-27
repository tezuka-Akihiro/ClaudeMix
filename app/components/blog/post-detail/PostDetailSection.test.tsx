import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PostDetailSection } from './PostDetailSection';
import type { PostDetailSectionProps } from './PostDetailSection';
import { extractHeadings } from '../../../lib/blog/post-detail/extractHeadings';

describe('PostDetailSection', () => {
  describe('Rendering', () => {
    it('should display post title', () => {
      // Arrange
      const post: PostDetailSectionProps['post'] = {
        slug: 'test-post',
        title: 'Test Post Title',
        author: 'Test Author',
        publishedAt: '2024-05-01',
        htmlContent: '<p>Test content</p>',
      };

      // Act
      render(<PostDetailSection post={post} headings={[]} />);

      // Assert
      const titleElement = screen.getByTestId('post-title');
      expect(titleElement).toBeInTheDocument();
      expect(titleElement).toHaveTextContent('Test Post Title');
    });

    it('should display post author', () => {
      // Arrange
      const post: PostDetailSectionProps['post'] = {
        slug: 'test-post',
        title: 'Test Post',
        author: 'John Doe',
        publishedAt: '2024-05-01',
        htmlContent: '<p>Test content</p>',
      };

      // Act
      render(<PostDetailSection post={post} headings={[]} />);

      // Assert
      const authorElement = screen.getByTestId('post-author');
      expect(authorElement).toBeInTheDocument();
      expect(authorElement).toHaveTextContent('著者: John Doe');
    });

    it('should display formatted published date', () => {
      // Arrange
      const post: PostDetailSectionProps['post'] = {
        slug: 'test-post',
        title: 'Test Post',
        author: 'Test Author',
        publishedAt: '2024-05-01',
        htmlContent: '<p>Test content</p>',
      };

      // Act
      render(<PostDetailSection post={post} headings={[]} />);

      // Assert
      const dateElement = screen.getByTestId('post-published-date');
      expect(dateElement).toBeInTheDocument();
      expect(dateElement).toHaveTextContent('2024年5月1日');
      expect(dateElement).toHaveAttribute('dateTime', '2024-05-01');
    });

    it('should display post content', () => {
      // Arrange
      const post: PostDetailSectionProps['post'] = {
        slug: 'test-post',
        title: 'Test Post',
        author: 'Test Author',
        publishedAt: '2024-05-01',
        htmlContent: '<p>This is test content</p>',
      };

      // Act
      render(<PostDetailSection post={post} headings={[]} />);

      // Assert
      const contentElement = screen.getByTestId('post-content');
      expect(contentElement).toBeInTheDocument();
      expect(contentElement.innerHTML).toBe('<p>This is test content</p>');
    });

    it('should render article with correct data-testid', () => {
      // Arrange
      const post: PostDetailSectionProps['post'] = {
        slug: 'test-post',
        title: 'Test Post',
        author: 'Test Author',
        publishedAt: '2024-05-01',
        htmlContent: '<p>Test content</p>',
      };

      // Act
      render(<PostDetailSection post={post} headings={[]} />);

      // Assert
      const articleElement = screen.getByTestId('post-detail-section');
      expect(articleElement).toBeInTheDocument();
      expect(articleElement.tagName).toBe('ARTICLE');
    });
  });

  describe('Date Formatting', () => {
    it('should format different dates correctly', () => {
      // Test case 1: January 1st
      const post1: PostDetailSectionProps['post'] = {
        slug: 'test-post-1',
        title: 'Test Post 1',
        author: 'Test Author',
        publishedAt: '2024-01-01',
        htmlContent: '<p>Test content</p>',
      };

      const { unmount: unmount1 } = render(<PostDetailSection post={post1} headings={[]} />);
      let dateElement = screen.getByTestId('post-published-date');
      expect(dateElement).toHaveTextContent('2024年1月1日');
      unmount1();

      // Test case 2: December 31st
      const post2: PostDetailSectionProps['post'] = {
        slug: 'test-post-2',
        title: 'Test Post 2',
        author: 'Test Author',
        publishedAt: '2024-12-31',
        htmlContent: '<p>Test content</p>',
      };

      const { unmount: unmount2 } = render(<PostDetailSection post={post2} headings={[]} />);
      dateElement = screen.getByTestId('post-published-date');
      expect(dateElement).toHaveTextContent('2024年12月31日');
      unmount2();

      // Test case 3: Mid year
      const post3: PostDetailSectionProps['post'] = {
        slug: 'test-post-3',
        title: 'Test Post 3',
        author: 'Test Author',
        publishedAt: '2024-06-15',
        htmlContent: '<p>Test content</p>',
      };

      render(<PostDetailSection post={post3} headings={[]} />);
      dateElement = screen.getByTestId('post-published-date');
      expect(dateElement).toHaveTextContent('2024年6月15日');
    });
  });

  describe('HTML Content', () => {
    it('should render HTML content with dangerouslySetInnerHTML', () => {
      // Arrange
      const htmlContent = '<h2>Section Title</h2><p>Paragraph text</p><ul><li>Item 1</li></ul>';
      const post: PostDetailSectionProps['post'] = {
        slug: 'test-post',
        title: 'Test Post',
        author: 'Test Author',
        publishedAt: '2024-05-01',
        htmlContent,
      };

      // Act
      render(<PostDetailSection post={post} headings={[]} />);

      // Assert
      const contentElement = screen.getByTestId('post-content');
      expect(contentElement.innerHTML).toBe(htmlContent);

      // Verify specific elements within HTML content
      expect(contentElement.querySelector('h2')).toBeInTheDocument();
      expect(contentElement.querySelector('p')).toBeInTheDocument();
      expect(contentElement.querySelector('ul')).toBeInTheDocument();
    });

    it('should handle empty HTML content', () => {
      // Arrange
      const post: PostDetailSectionProps['post'] = {
        slug: 'test-post',
        title: 'Test Post',
        author: 'Test Author',
        publishedAt: '2024-05-01',
        htmlContent: '',
      };

      // Act
      render(<PostDetailSection post={post} headings={[]} />);

      // Assert
      const contentElement = screen.getByTestId('post-content');
      expect(contentElement.innerHTML).toBe('');
    });
  });

  describe('Styling', () => {
    it('should apply correct CSS classes', () => {
      // Arrange
      const post: PostDetailSectionProps['post'] = {
        slug: 'test-post',
        title: 'Test Post',
        author: 'Test Author',
        publishedAt: '2024-05-01',
        htmlContent: '<p>Test content</p>',
      };

      // Act
      render(<PostDetailSection post={post} headings={[]} />);

      // Assert
      const articleElement = screen.getByTestId('post-detail-section');
      expect(articleElement).toHaveClass('post-detail-section');
      expect(articleElement).toHaveClass('post-detail-section-structure');

      const contentElement = screen.getByTestId('post-content');
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
      const post: PostDetailSectionProps['post'] = {
        slug: 'test-post',
        title: 'Test Post',
        author: 'Test Author',
        publishedAt: '2024-05-01',
        htmlContent: '<p>Test content</p>',
      };

      // Act
      render(<PostDetailSection post={post} headings={headings} />);

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
      const post: PostDetailSectionProps['post'] = {
        slug: 'test-post',
        title: 'Test Post',
        author: 'Test Author',
        publishedAt: '2024-05-01',
        htmlContent: '<p>Test content</p>',
      };

      // Act
      render(<PostDetailSection post={post} headings={headings} />);

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
      const post: PostDetailSectionProps['post'] = {
        slug: 'test-post',
        title: 'Test Post',
        author: 'Test Author',
        publishedAt: '2024-05-01',
        htmlContent: '<p>Test content</p>',
      };

      // Act
      render(<PostDetailSection post={post} headings={headings} />);

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
      const post: PostDetailSectionProps['post'] = {
        slug: 'test-post',
        title: 'Test Post',
        author: 'Test Author',
        publishedAt: '2024-05-01',
        htmlContent: '<p>Test content</p>',
      };

      // Act
      render(<PostDetailSection post={post} headings={[]} />);

      // Assert: 目次が表示されない
      const tocContainer = screen.queryByTestId('table-of-contents');
      expect(tocContainer).not.toBeInTheDocument();
    });

    it('見出しが存在しないマークダウンの場合は目次が表示されない', () => {
      // Arrange: 見出しのないマークダウン
      const markdown = '本文のみ';
      const headings = extractHeadings(markdown);
      const post: PostDetailSectionProps['post'] = {
        slug: 'test-post',
        title: 'Test Post',
        author: 'Test Author',
        publishedAt: '2024-05-01',
        htmlContent: '<p>Test content</p>',
      };

      // Act
      render(<PostDetailSection post={post} headings={headings} />);

      // Assert: 目次が表示されない
      const tocContainer = screen.queryByTestId('table-of-contents');
      expect(tocContainer).not.toBeInTheDocument();
    });
  });
});
