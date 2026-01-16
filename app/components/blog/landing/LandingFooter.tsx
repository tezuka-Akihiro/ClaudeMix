// LandingFooter - Component (components層)
// ランディングページ専用フッター（シンプル構成）

import React from 'react';
import { Link } from '@remix-run/react';

interface LandingFooterProps {
  links: Array<{ label: string; href: string }>;
}

const LandingFooter: React.FC<LandingFooterProps> = ({ links }) => {
  return (
    <footer
      className="landing-footer landing-footer-structure"
      data-testid="landing-footer"
    >
      <nav>
        {links.map((link, index) => (
          <Link
            key={link.label}
            to={link.href}
            className="landing-footer__link"
            data-testid="footer-link"
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <p className="landing-footer__copyright">
        © {new Date().getFullYear()} ClaudeMix
      </p>
    </footer>
  );
};

export default LandingFooter;
