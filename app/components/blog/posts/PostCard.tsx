// PostCard - Component (components層)
// 個別記事の表示カード（サムネイル、タイトル、投稿日を表示）

import React, { useState, useEffect } from 'react';
import { Link } from '@remix-run/react';
import { formatPublishedDate } from '~/lib/blog/posts/formatPublishedDate';
import { getFallbackThumbnailUrl } from '~/lib/blog/common/getFallbackThumbnailUrl';
import { data as postsSpec } from '~/generated/specs/blog/posts';
import type { PostSummary } from '~/specs/blog/types';

interface PostCardProps extends PostSummary {
  isLocked?: boolean;
  lockMessage?: string;
  dateSeparator?: string;
  isPriority?: boolean;
}

const PostCard: React.FC<PostCardProps> = ({
  slug,
  title,
  publishedAt,
  category,
  description,
  tags,
  thumbnailUrl,
  isLocked = false,
  lockMessage = 'ログインで読む',
  dateSeparator = '.',
  isPriority = false,
}) => {
  const [currentThumbnailUrl, setCurrentThumbnailUrl] = useState<PostSummary['thumbnailUrl']>(thumbnailUrl);
  const [hasFallbackError, setHasFallbackError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // PropとしてのthumbnailUrlが変更された場合に同期（SSRとClientでの不整合防止）
  useEffect(() => {
    setCurrentThumbnailUrl(thumbnailUrl);
    setHasFallbackError(false);
  }, [thumbnailUrl]);

  // 日付をフォーマット（ISO形式 → 日本語形式）
  const formattedDate = formatPublishedDate(publishedAt, dateSeparator);

  // エラーハンドラー
  const handleImageError = () => {
    if (hasFallbackError) return;

    const fallbackUrl = getFallbackThumbnailUrl(category, postsSpec);

    if (fallbackUrl && fallbackUrl !== currentThumbnailUrl) {
      setCurrentThumbnailUrl(fallbackUrl);
    } else {
      setHasFallbackError(true);
    }
  };

  // サムネイル表示判定
  // 1. URLが存在すること（初期またはフォールバック後）
  // 2. フォールバックも含めてエラーになっていないこと
  const shouldShowThumbnail = currentThumbnailUrl && !hasFallbackError;

  // 表示用URLとsrcsetの解決
  const displaySrc = typeof currentThumbnailUrl === 'string'
    ? currentThumbnailUrl
    : currentThumbnailUrl?.lg;

  const srcset = (typeof currentThumbnailUrl === 'object' && currentThumbnailUrl !== null)
    ? `${currentThumbnailUrl.sm} 1000w, ${currentThumbnailUrl.lg} 1200w`
    : undefined;

  return (
    <Link
      to={`/blog/${slug}`}
      className={`post-card post-card-structure${isLocked ? ' post-card--locked' : ''}`}
      data-testid="post-card"
      data-slug={slug}
      data-locked={isLocked ? 'true' : undefined}
    >
      {shouldShowThumbnail && (
        <div
          className="post-card__thumbnail"
          data-testid="thumbnail-container"
          // 全てのエラー時は空間ごと消去する（spec: fallback="hide" または最終的なフォールバック失敗）
          style={hasFallbackError ? { display: 'none' } : {}}
        >
          <img
            key={displaySrc!}
            src={displaySrc!}
            srcSet={srcset}
            sizes={srcset ? `(max-width: ${postsSpec.thumbnail.image_sizes.mobile_breakpoint}px) calc(100vw - ${postsSpec.thumbnail.image_sizes.mobile_padding}px), ${postsSpec.thumbnail.image_sizes.default_width}px` : undefined}
            alt={`${title}のサムネイル`}
            width={1200}
            height={630}
            loading={isPriority ? "eager" : "lazy"}
            {...{ fetchpriority: isPriority ? "high" : "auto" }}
            decoding="async"
            onLoad={() => setIsLoaded(true)}
            onError={handleImageError}
            data-testid="thumbnail-image"
            className="post-card__thumbnail-img"
            // 読み込み完了まで不可視にすることで、エラー時のALTテキスト一瞬表示を防止
            style={{
              opacity: isLoaded ? 1 : 0,
              transition: 'opacity 0.2s ease-in-out'
            }}
          />
        </div>
      )}
      <div className="post-card__content-structure">
        <h2 className="post-card__title" data-testid="post-title">
          {title}
        </h2>
        <p className="post-card__date" data-testid="post-date">
          {formattedDate}
        </p>
        {isLocked && (
          <p className="post-card__lock-message" data-testid="lock-message">
            {lockMessage}
          </p>
        )}
        {description && (
          <p className="post-description">{description}</p>
        )}
        {tags && tags.length > 0 && (
          <p className="tag-badge" data-testid="tag-badge">
            {tags.join(' ')}
          </p>
        )}
      </div>
    </Link>
  );
};

export default PostCard;
