// PostCard - Component (components層)
// 個別記事の表示カード（カテゴリ絵文字、タイトル、投稿日を表示）

import React from 'react';
import { Link } from '@remix-run/react';
import { formatPublishedDate } from '~/lib/blog/posts/formatPublishedDate';
import { getCategoryEmoji } from '~/lib/blog/posts/categoryUtils';
import type { PostSummary } from '~/specs/blog/types';

const PostCard: React.FC<PostSummary> = ({ slug, title, publishedAt, category, description, tags }) => {
  // 日付をフォーマット（ISO形式 → 日本語形式）
  const formattedDate = formatPublishedDate(publishedAt);

  // カテゴリ絵文字を取得
  const categoryEmoji = getCategoryEmoji(category);

  return (
    <Link
      to={`/blog/${slug}`}
      className="post-card post-card-structure"
      data-testid="post-card"
      data-slug={slug}
    >
      <div className="post-card__category-emoji" data-testid="category-emoji">
        {categoryEmoji}
      </div>
      <div className="post-card__content-structure">
        <h3 className="post-card__title" data-testid="post-card-title">
          {title}
        </h3>
        <p className="post-card__date" data-testid="post-card-date">
          {formattedDate}
        </p>
        {description && (
          <p className="post-description">{description}</p>
        )}
        {tags && tags.length > 0 && (
          <div className="tag-list-structure">
            {tags.map(tag => (
              <span key={tag} className="tag-badge" data-testid="tag-badge">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
};

export default PostCard;
