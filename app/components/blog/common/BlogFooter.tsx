// BlogFooter - Component (components層)
// ブログフッター（法的リンク、コピーライト表記）

import React, { useState } from 'react';
import { Link } from '@remix-run/react';
import LegalModal from './LegalModal';

export interface FooterLink {
  label: string;
  href?: string;
  isModal: boolean;
}

interface BlogFooterProps {
  copyright: string;
  footerLinks: FooterLink[];
  legalContent: string;
}

const BlogFooter: React.FC<BlogFooterProps> = ({ copyright, footerLinks, legalContent }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleLinkClick = (link: FooterLink) => {
    if (link.isModal) {
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <footer className="blog-footer flex flex-col items-center justify-center gap-2" data-testid="blog-footer">
        <nav className="blog-footer__links flex flex-wrap items-center justify-center gap-4" data-testid="footer-links">
          {footerLinks.map((link, index) => (
            <React.Fragment key={link.label}>
              {link.isModal ? (
                <button
                  type="button"
                  onClick={() => handleLinkClick(link)}
                  className="blog-footer__link blog-footer__link--modal"
                  data-testid={`footer-link-${index}`}
                >
                  {link.label}
                </button>
              ) : (
                <Link
                  to={link.href || '#'}
                  className="blog-footer__link"
                  data-testid={`footer-link-${index}`}
                >
                  {link.label}
                </Link>
              )}
            </React.Fragment>
          ))}
        </nav>
        <p className="blog-footer__copyright" data-testid="copyright">
          {copyright}
        </p>
      </footer>
      <LegalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        content={legalContent}
      />
    </>
  );
};

export default BlogFooter;
