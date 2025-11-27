// TagGrid - Component (components層)
// タグ選択用のグリッド表示

import React, { useState } from 'react';

interface TagGridProps {
  availableTags: string[];
  selectedTags?: string[];
}

export const TagGrid: React.FC<TagGridProps> = ({ availableTags, selectedTags = [] }) => {
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedTags));

  const toggleTag = (tag: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(tag)) {
      newSelected.delete(tag);
    } else {
      newSelected.add(tag);
    }
    setSelected(newSelected);
  };

  return (
    <div className="tag-grid-structure" data-testid="tag-grid">
      {availableTags.map(tag => (
        <button
          key={tag}
          type="button"
          className="tag-button"
          aria-pressed={selected.has(tag)}
          onClick={() => toggleTag(tag)}
          data-testid="tag-button"
        >
          {tag}
        </button>
      ))}
      {Array.from(selected).map(tag => (
        <input key={tag} type="hidden" name="tags" value={tag} />
      ))}
    </div>
  );
};
