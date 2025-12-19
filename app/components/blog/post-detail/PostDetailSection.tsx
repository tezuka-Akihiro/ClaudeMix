// PostDetailSection - 記事詳細セクション
// 記事のメタデータと本文を表示

import { useEffect } from 'react';
import { TableOfContents } from './TableOfContents';
import { formatPublishedDate } from '~/lib/blog/posts/formatPublishedDate';
import type { Heading, RenderedPost } from '~/specs/blog/types';

// Mermaid.jsのグローバル型定義を拡張
declare global {
  interface Window {
    mermaid?: {
      run: (config?: { querySelector?: string }) => Promise<void>;
      initialize: (config: unknown) => void;
    };
  }
}

export function PostDetailSection({ post, headings }: { post: RenderedPost, headings: Heading[] }) {
  // publishedAtをフォーマット（サーバー/クライアント間で一貫性のある純粋関数を使用）
  const formattedDate = formatPublishedDate(post.publishedAt);

  useEffect(() => {
    // Mermaidを動的にロード
    if (typeof window !== 'undefined' && !window.mermaid) {
      import('https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs')
        .then((mermaid) => {
          window.mermaid = mermaid.default;
          window.mermaid.initialize({ startOnLoad: false, theme: 'dark' });
          window.mermaid.run({
            querySelector: '.mermaid',
          });
        })
        .catch((error) => {
          console.error('Failed to load Mermaid:', error);
        });
    } else if (window.mermaid) {
      // すでにロード済みの場合は実行のみ
      window.mermaid.run({
        querySelector: '.mermaid',
      });
    }
  }, []); // 空配列: コンポーネントマウント時のみ実行

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
