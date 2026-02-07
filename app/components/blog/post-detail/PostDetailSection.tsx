// PostDetailSection - 記事詳細セクション
// 記事のメタデータと本文を表示

import { useEffect, useState } from 'react';
import { TableOfContents } from './TableOfContents';
import { formatPublishedDate } from '~/lib/blog/posts/formatPublishedDate';
import type { Heading, RenderedPost, BlogPostDetailSpec } from '~/specs/blog/types';
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
  thumbnailUrl: string | null;
  messages: BlogPostDetailSpec['messages'];
  accessibility: BlogPostDetailSpec['accessibility'];
}

export function PostDetailSection({
  post,
  headings,
  hasMermaid = false,
  subscriptionAccess,
  thumbnailUrl,
  messages,
  accessibility,
}: PostDetailSectionProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

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

  useEffect(() => {
    // テーブルを横スクロール可能なラッパーで囲む
    const contentDivs = document.querySelectorAll('.post-detail-section__content');
    contentDivs.forEach((contentDiv) => {
      const tables = contentDiv.querySelectorAll('table');
      tables.forEach((table) => {
        // すでにラッパーで囲まれていない場合のみ処理
        if (!table.parentElement?.classList.contains('table-wrapper')) {
          const wrapper = document.createElement('div');
          wrapper.className = 'table-wrapper';
          table.parentNode?.insertBefore(wrapper, table);
          wrapper.appendChild(table);
        }
      });
    });
  }, [post.visibleContent, post.hiddenContent]);

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

      {/* サムネイル画像（存在する場合のみ表示） */}
      {thumbnailUrl && !imageError && (
        <div
          className="post-detail-section__thumbnail"
          data-testid="article-thumbnail-container"
          style={imageError ? { display: 'none' } : {}}
        >
          <img
            src={thumbnailUrl}
            alt={`${post.title}のサムネイル`}
            loading="lazy"
            decoding="async"
            onLoad={() => setIsLoaded(true)}
            onError={() => setImageError(true)}
            data-testid="article-thumbnail-image"
            style={{
              opacity: isLoaded ? 1 : 0,
              transition: 'opacity 0.2s ease-in-out'
            }}
          />
        </div>
      )}

      {/* 目次 */}
      <TableOfContents
        headings={headings}
        ariaLabel={accessibility.aria_labels.toc}
      />

      {/* 本文エリア（見出しベース可視範囲） */}
      <div
        className="post-detail-section__content prose"
        data-testid="post-content-visible"
        dangerouslySetInnerHTML={{ __html: post.visibleContent }}
      />

      {/* ペイウォール（未契約ユーザーの場合のみ表示） */}
      {!subscriptionAccess.showFullContent && (
        <Paywall
          message={messages.paywall.message}
          promotionHeading={messages.paywall.promotion_heading}
          ctaLabel={messages.paywall.cta_label}
        />
      )}

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
