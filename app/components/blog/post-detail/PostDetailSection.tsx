// PostDetailSection - 記事詳細セクション
// 記事のメタデータと本文を表示

import { useEffect } from 'react';
import { TableOfContents } from './TableOfContents';
import type { Heading } from '~/lib/blog/post-detail/extractHeadings';

// Mermaid.jsのグローバル型定義を拡張
declare global {
  interface Window {
    mermaid?: {
      contentLoaded: () => void;
    };
  }
}

export interface PostDetailSectionProps {
  post: {
    slug: string;
    title: string;
    author: string;
    publishedAt: string;
    htmlContent: string; // マークダウン変換後のHTML
    description?: string;
    tags?: string[];
  };
  headings: Heading[];
}

export function PostDetailSection({ post, headings }: PostDetailSectionProps) {
  // publishedAtをフォーマット
  const formattedDate = new Date(post.publishedAt).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  useEffect(() => {
    // window.mermaidが利用可能かチェック
    if (typeof window !== 'undefined' && window.mermaid) {
      // Mermaid図を再レンダリング
      window.mermaid.contentLoaded();
    }
  }, [post.htmlContent]);

  return (
    <article
      className="post-detail-section post-detail-section-structure"
      data-testid="post-detail-section"
    >
      {/* メタデータエリア */}
      <header className="post-detail-section__meta post-detail-section__meta-structure">
        <h1 className="post-detail-section__title" data-testid="post-title">
          {post.title}
        </h1>
        <div className="post-detail-section__meta-text">
          <span data-testid="post-author">著者: {post.author}</span>
          {' | '}
          <time dateTime={post.publishedAt} data-testid="post-published-date">
            {formattedDate}
          </time>
        </div>
      </header>

      {/* 目次 */}
      <TableOfContents headings={headings} />

      {/* 本文エリア（マークダウン変換後のHTML） */}
      <div
        className="post-detail-section__content prose"
        data-testid="post-content"
        dangerouslySetInnerHTML={{ __html: post.htmlContent }}
      />
    </article>
  );
}
