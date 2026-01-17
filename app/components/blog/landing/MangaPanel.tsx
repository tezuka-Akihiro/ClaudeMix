// MangaPanel - Component (components層)
// 漫画パネル表示コンポーネント

import React from 'react';
import type { MangaAsset } from '~/specs/blog/types';

interface MangaPanelProps {
  asset: MangaAsset;
  loading?: 'lazy' | 'eager';
}

const MangaPanel: React.FC<MangaPanelProps> = ({ asset, loading = 'lazy' }) => {
  return (
    <div className="manga-panel" data-testid="manga-panel">
      <img
        src={asset.path}
        alt={`漫画パネル ${asset.order}`}
        loading={loading}
      />
    </div>
  );
};

export default MangaPanel;
