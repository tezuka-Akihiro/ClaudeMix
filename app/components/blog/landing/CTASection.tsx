// CTASection - Component (components層)
// CTA（Call To Action）ボタン群を表示するセクション

import React from 'react';
import { Link } from '@remix-run/react';
import type { CTALink } from '~/specs/blog/types';

interface CTASectionProps {
  ctaLinks: CTALink[];
}

const CTASection: React.FC<CTASectionProps> = ({ ctaLinks }) => {
  return (
    <section
      className="cta-section cta-section-structure"
      data-testid="cta-section"
    >
      {ctaLinks.map((link) => (
        <Link
          key={link.label}
          to={link.url}
          className="cta-button"
          aria-label={link.aria_label}
          data-testid="cta-button"
        >
          {link.label}
        </Link>
      ))}
    </section>
  );
};

export default CTASection;
