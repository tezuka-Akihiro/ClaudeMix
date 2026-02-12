// PostCard - Component (components層)
// 個別記事の表示カード（サムネイル、タイトル、投稿日を表示）

import React, { useState } from 'react';
import { Link } from '@remix-run/react';
import { formatPublishedDate } from '~/lib/blog/posts/formatPublishedDate';
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
  description,
  tags,
  thumbnailUrl,
  isLocked = false,
  lockMessage = 'ログインで読む',
  dateSeparator = '.',
  isPriority = false,
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // 日付をフォーマット（ISO形式 → 日本語形式）
  const formattedDate = formatPublishedDate(publishedAt, dateSeparator);

  // サムネイル表示判定
  // 1. URLが存在すること
  // 2. 読み込みエラーが発生していないこと
  const shouldShowThumbnail = thumbnailUrl && !imageError;

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
          // エラー時は空間ごと消去する（spec: fallback="hide" に準拠）
          style={imageError ? { display: 'none' } : {}}
        >
          <img
            src={thumbnailUrl}
            alt={`${title}のサムネイル`}
            width={1200}
            height={630}
            loading={isPriority ? "eager" : "lazy"}
            fetchPriority={isPriority ? "high" : "auto"}
            decoding="async"
            onLoad={() => setIsLoaded(true)}
            onError={() => setImageError(true)}
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
