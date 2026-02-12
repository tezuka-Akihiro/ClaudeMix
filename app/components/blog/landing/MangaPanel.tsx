// MangaPanel - Component (components層)
// 漫画パネル表示コンポーネント

import React from 'react';
import type { MangaAsset } from '~/specs/blog/types';

interface MangaPanelProps {
  asset: MangaAsset;
  loading?: 'lazy' | 'eager';
  altLabel?: string;
  fetchPriority?: 'high' | 'low' | 'auto';
}

const MangaPanel: React.FC<MangaPanelProps> = ({
  asset,
  loading = 'lazy',
  altLabel = '漫画パネル',
  fetchPriority = 'auto',
}) => {
  return (
    <div className="manga-panel" data-testid="manga-panel">
      <img
        src={asset.path}
        alt={`${altLabel} ${asset.order}`}
        loading={loading}
        fetchPriority={fetchPriority}
        decoding="async"
        width="400"
        height="300"
      />
    </div>
  );
};

export default MangaPanel;
