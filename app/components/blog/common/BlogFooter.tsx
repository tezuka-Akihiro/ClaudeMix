// BlogFooter - Component (components層)
// ブログフッター（コピーライト表記のみ）

import React from 'react';
import { data as defaultSpec } from '~/generated/specs/blog/common';
import type { BlogCommonSpec } from '~/specs/blog/types';
import { extractTestId } from '~/spec-utils/extractTestId';

interface BlogFooterProps {
  copyright: string;
  spec?: BlogCommonSpec;
}

const BlogFooter: React.FC<BlogFooterProps> = ({ copyright, spec = defaultSpec }) => {
  const { ui_selectors } = spec;

  return (
    <footer
      className="blog-footer blog-footer-structure"
      data-testid={extractTestId(ui_selectors.footer.blog_footer)}
    >
      <p
        className="blog-footer__copyright"
        data-testid={extractTestId(ui_selectors.footer.copyright)}
      >
        {copyright}
      </p>
    </footer>
  );
};

export default BlogFooter;
