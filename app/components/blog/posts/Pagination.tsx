// Pagination - UI Component (components層)
// ページネーションUIコンポーネント

import React from 'react';
import { Link } from '@remix-run/react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages }) => {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  // 表示するページ番号を制限（現在ページ ±2）
  const visiblePages = pages.filter(
    page => Math.abs(page - currentPage) <= 2 || page === 1 || page === totalPages
  );

  return (
    <nav className="pagination-nav pagination-nav-structure" aria-label="ページネーション" data-testid="pagination">
      {/* 前へボタン */}
      {currentPage > 1 && (
        <Link
          to={`/blog?page=${currentPage - 1}`}
          className="pagination-button pagination-button--prev"
          aria-label="前のページ"
        >
          ← 前へ
        </Link>
      )}

      {/* ページ番号 */}
      <div className="pagination-numbers pagination-numbers-structure">
        {visiblePages.map((page, index) => {
          const showEllipsis =
            index > 0 && visiblePages[index - 1] !== page - 1;

          return (
            <React.Fragment key={page}>
              {showEllipsis && <span className="pagination-ellipsis">...</span>}
              {page === currentPage ? (
                <span className="pagination-number pagination-number--active" aria-current="page">
                  {page}
                </span>
              ) : (
                <Link
                  to={`/blog?page=${page}`}
                  className="pagination-number"
                  aria-label={`ページ ${page}`}
                >
                  {page}
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* 次へボタン */}
      {currentPage < totalPages && (
        <Link
          to={`/blog?page=${currentPage + 1}`}
          className="pagination-button pagination-button--next"
          aria-label="次のページ"
        >
          次へ →
        </Link>
      )}
    </nav>
  );
};

export default Pagination;
