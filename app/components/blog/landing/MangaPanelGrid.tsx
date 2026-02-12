// MangaPanelGrid - Component (components層)
// 漫画パネルをグリッドレイアウトで配置

import React from 'react';
import MangaPanel from './MangaPanel';
import type { MangaAsset } from '~/specs/blog/types';

interface MangaPanelGridProps {
  mangaAssets: MangaAsset[];
  heroMaxCount?: number;
  mangaPanelAltLabel?: string;
}

const MangaPanelGrid: React.FC<MangaPanelGridProps> = ({
  mangaAssets,
  heroMaxCount = 2,
  mangaPanelAltLabel,
}) => {
  return (
    <section
      className="page-manga-panel-grid page-manga-panel-grid-structure"
      data-testid="manga-panel-grid"
    >
      {mangaAssets.map((asset, index) => (
        <MangaPanel
          key={asset.fileName}
          asset={asset}
          loading={index < heroMaxCount ? 'eager' : 'lazy'}
          altLabel={mangaPanelAltLabel}
        />
      ))}
    </section>
  );
};

export default MangaPanelGrid;
