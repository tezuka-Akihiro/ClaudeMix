// BlogFooter - Component (components層)
// ブログフッター（コピーライト表記）

import React from 'react';

interface BlogFooterProps {
  copyright: string;
}

const BlogFooter: React.FC<BlogFooterProps> = ({ copyright }) => {
  return (
    <footer className="blog-footer blog-footer-structure" data-testid="blog-footer">
      <p className="blog-footer__copyright" data-testid="copyright">
        {copyright}
      </p>
    </footer>
  );
};

export default BlogFooter;
