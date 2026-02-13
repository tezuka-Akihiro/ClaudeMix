// PostDetailSection - 記事詳細セクション
// 記事のメタデータと本文を表示

import { useEffect, useState } from 'react';
import { TableOfContents } from './TableOfContents';
import { formatPublishedDate } from '~/lib/blog/posts/formatPublishedDate';
import { getFallbackThumbnailUrl } from '~/lib/blog/common/getFallbackThumbnailUrl';
import type { Heading, RenderedPost, BlogPostDetailSpec } from '~/specs/blog/types';
import { Paywall } from './Paywall';
import { data as defaultSpec } from '~/generated/specs/blog/post-detail';

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
  spec: BlogPostDetailSpec;
}

export function PostDetailSection({
  post,
  headings,
  hasMermaid = false,
  subscriptionAccess,
  thumbnailUrl,
  spec,
}: PostDetailSectionProps) {
  const [currentThumbnailUrl, setCurrentThumbnailUrl] = useState<string | null>(thumbnailUrl);
  const [hasFallbackError, setHasFallbackError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // PropとしてのthumbnailUrlが変更された場合に同期
  useEffect(() => {
    setCurrentThumbnailUrl(thumbnailUrl);
    setHasFallbackError(false);
  }, [thumbnailUrl]);

  // publishedAtをフォーマット
  const formattedDate = formatPublishedDate(post.publishedAt);

  // エラーハンドラー
  const handleImageError = () => {
    if (hasFallbackError) return;

    const fallbackUrl = getFallbackThumbnailUrl(post.category, spec);
    if (fallbackUrl && fallbackUrl !== currentThumbnailUrl) {
      setCurrentThumbnailUrl(fallbackUrl);
    } else {
      setHasFallbackError(true);
    }
  };

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
          <span data-testid="post-author">{spec.messages.ui.author_label} {post.author}</span>
          {' | '}
          <time dateTime={post.publishedAt} data-testid="post-published-date">
            {formattedDate}
          </time>
        </div>
      </header>

      {/* サムネイル画像（存在する場合のみ表示） */}
      {currentThumbnailUrl && !hasFallbackError && (
        <div
          className="post-detail-section__thumbnail"
          data-testid="article-thumbnail-container"
          style={hasFallbackError ? { display: 'none' } : {}}
        >
          <img
            key={currentThumbnailUrl!}
            src={currentThumbnailUrl!}
            alt={`${post.title}のサムネイル`}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            onLoad={() => setIsLoaded(true)}
            onError={handleImageError}
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
        ariaLabel={spec.accessibility.aria_labels.toc}
      />

      {/* 本文エリア（見出しベース可視範囲） */}
      <div
        className="post-detail-section__content prose"
        data-testid="post-content-visible"
        dangerouslySetInnerHTML={{ __html: post.visibleContent }}
      />

      {/* ペイウォール（未契約ユーザーの場合のみ表示） */}
      {!subscriptionAccess.showFullContent && <Paywall spec={spec} />}

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
