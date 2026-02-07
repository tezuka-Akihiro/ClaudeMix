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
}) => {
  const [imageError, setImageError] = useState(false);
  // 日付をフォーマット（ISO形式 → 日本語形式）
  const formattedDate = formatPublishedDate(publishedAt, dateSeparator);

  return (
    <Link
      to={`/blog/${slug}`}
      className={`post-card post-card-structure${isLocked ? ' post-card--locked' : ''}`}
      data-testid="post-card"
      data-slug={slug}
      data-locked={isLocked ? 'true' : undefined}
    >
      {thumbnailUrl && !imageError && (
        <div className="post-card__thumbnail" data-testid="thumbnail-container">
          <img
            src={thumbnailUrl}
            alt={`${title}のサムネイル`}
            loading="lazy"
            decoding="async"
            onError={() => setImageError(true)}
            data-testid="thumbnail-image"
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
