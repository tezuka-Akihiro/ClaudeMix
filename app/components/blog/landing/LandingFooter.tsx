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
        className="landing-footer landing-footer-structure"
        data-testid="landing-footer"
      >
        <nav>
          {links.map((link) => (
            <React.Fragment key={link.label}>
              {link.isModal ? (
                <button
                  type="button"
                  onClick={() => handleLinkClick(link)}
                  className="landing-footer__link landing-footer__link--modal"
                  data-testid="footer-link"
                >
                  {link.label}
                </button>
              ) : (
                <Link
                  to={link.href || '#'}
                  className="landing-footer__link"
                  data-testid="footer-link"
                >
                  {link.label}
                </Link>
              )}
            </React.Fragment>
          ))}
        </nav>
        <p className="landing-footer__copyright">
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
