// HeroSection - Component (components層)
// ランディングページのファーストビュー（ヒーローセクション）

import React from 'react';
import MangaPanel from './MangaPanel';
import type { MangaAsset } from '~/specs/blog/types';

interface HeroSectionProps {
  catchCopy: string;
  heroMangaAssets: MangaAsset[];
  mangaPanelAltLabel?: string;
}

const HeroSection: React.FC<HeroSectionProps> = ({ catchCopy, heroMangaAssets, mangaPanelAltLabel }) => {
  return (
    <section
      className="hero-section hero-section-structure"
      data-testid="hero-section"
    >
      <h1 className="catch-copy" data-testid="catch-copy">
        {catchCopy}
      </h1>
      <div className="hero-manga-panels">
        {heroMangaAssets.map((asset) => (
          <MangaPanel
            key={asset.fileName}
            asset={asset}
            loading="eager"
            altLabel={mangaPanelAltLabel}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSection;
