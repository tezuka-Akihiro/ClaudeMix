// PostDetailSection - 記事詳細セクション
// 記事のメタデータと本文を表示

import { useEffect } from 'react';
import { TableOfContents } from './TableOfContents';
import { formatPublishedDate } from '~/lib/blog/posts/formatPublishedDate';
import type { Heading, RenderedPost } from '~/specs/blog/types';
import { Paywall } from './Paywall';

// Mermaid.jsのグローバル型定義
declare global {
  interface Window {
    mermaid?: {
      run: (config?: { querySelector?: string }) => Promise<void>;
      initialize: (config: { startOnLoad: boolean; theme: string }) => void;
    };
  }
}

interface PostDetailSectionProps {
  post: Omit<RenderedPost, 'htmlContent'> & {
    visibleContent: string;
    hiddenContent: string;
  };
  headings: Heading[];
  hasMermaid?: boolean;
  subscriptionAccess: {
    showFullContent: boolean;
    cutoffHeadingId: string | null;
    hasActiveSubscription: boolean;
  };
}

export function PostDetailSection({
  post,
  headings,
  hasMermaid = false,
  subscriptionAccess
}: PostDetailSectionProps) {
  // publishedAtをフォーマット
  const formattedDate = formatPublishedDate(post.publishedAt);

  useEffect(() => {
    // Mermaidダイアグラムが含まれる場合のみ動的にロード
    if (!hasMermaid) return;

    if (typeof window !== 'undefined' && !window.mermaid) {
      // @ts-expect-error - CDN からの動的インポートは型定義がないため
      import('https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs')
        .then((mermaid) => {
          window.mermaid = mermaid.default;
          window.mermaid!.initialize({ startOnLoad: false, theme: 'dark' });
          window.mermaid!.run({
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
  }, [hasMermaid]); // hasMermaidの変更を監視

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

      {/* 本文エリア（見出しベース可視範囲） */}
      <div
        className="post-detail-section__content prose"
        data-testid="post-content-visible"
        dangerouslySetInnerHTML={{ __html: post.visibleContent }}
      />

      {/* ペイウォール（未契約ユーザーの場合のみ表示） */}
      {!subscriptionAccess.showFullContent && <Paywall />}

      {/* 非表示コンテンツ（全文表示時のみ） */}
      {subscriptionAccess.showFullContent && post.hiddenContent && (
        <div
          className="post-detail-section__content prose"
          data-testid="post-content-hidden"
          dangerouslySetInnerHTML={{ __html: post.hiddenContent }}
        />
      )}
    </article>
  );
}
