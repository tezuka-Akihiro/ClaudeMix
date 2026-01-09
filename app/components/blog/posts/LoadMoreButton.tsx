// LoadMoreButton - UI Component
// もっと見るボタンコンポーネント

import React from 'react';

interface LoadMoreButtonProps {
  onClick: () => void;
  isLoading: boolean;
  hasMore: boolean;
}

const LoadMoreButton: React.FC<LoadMoreButtonProps> = ({ onClick, isLoading, hasMore }) => {
  // 全件読み込み済みの場合は表示しない
  if (!hasMore) {
    return null;
  }

  return (
    <div className="load-more-container load-more-container-structure" data-testid="load-more-container">
      <button
        type="button"
        onClick={onClick}
        disabled={isLoading}
        className="load-more-button"
        data-testid="load-more-button"
        aria-label="さらに記事を読み込む"
        aria-busy={isLoading}
      >
        {isLoading ? (
          <>
            <span className="loading-spinner" data-testid="loading-spinner" aria-hidden="true">
              ⏳
            </span>
            <span>Loading...</span>
          </>
        ) : (
          <span>More</span>
        )}
      </button>
    </div>
  );
};

export default LoadMoreButton;
