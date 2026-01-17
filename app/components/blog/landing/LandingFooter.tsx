// LandingFooter - Component (components層)
// ランディングページ専用フッター（シンプル構成）

import React, { useState } from 'react';
import { Link } from '@remix-run/react';
import LegalModal from '~/components/blog/common/LegalModal';

export interface LandingFooterLink {
  label: string;
  href?: string;
  isModal: boolean;
}

interface LandingFooterProps {
  links: LandingFooterLink[];
  legalContent: string;
}

const LandingFooter: React.FC<LandingFooterProps> = ({ links, legalContent }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleLinkClick = (link: LandingFooterLink) => {
    if (link.isModal) {
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <footer
        className="blog-footer blog-footer-structure"
        data-testid="landing-footer"
      >
        <nav className="blog-footer__links blog-footer__links-structure">
          {links.map((link) => (
            <React.Fragment key={link.label}>
              {link.isModal ? (
                <button
                  type="button"
                  onClick={() => handleLinkClick(link)}
                  className="blog-footer__link blog-footer__link--modal"
                  data-testid="footer-link"
                >
                  {link.label}
                </button>
              ) : (
                <Link
                  to={link.href || '#'}
                  className="blog-footer__link"
                  data-testid="footer-link"
                >
                  {link.label}
                </Link>
              )}
            </React.Fragment>
          ))}
        </nav>
        <p className="blog-footer__copyright">
          © {new Date().getFullYear()} ClaudeMix
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

export default LandingFooter;
