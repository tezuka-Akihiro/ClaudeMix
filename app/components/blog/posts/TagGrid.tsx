// TagGrid - Component (components層)
// タグ選択用のグリッド表示

import React, { Fragment, useState } from 'react';

interface TagGroup {
  group: string;
  tags: string[];
}

interface TagGridProps {
  availableTags?: string[];
  tagGroups?: TagGroup[];
  selectedTags?: string[];
}

export const TagGrid: React.FC<TagGridProps> = ({
  availableTags = [],
  tagGroups,
  selectedTags = [],
}) => {
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

  const renderTagButton = (tag: string) => (
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
  );

  return (
    <div className="tag-grid tag-grid-structure" data-testid="tag-grid">
      {tagGroups && tagGroups.length > 0 ? (
        // グループ化された表示
        tagGroups.map(({ group, tags }) => (
          <div
            key={group}
            className="tag-group-container-structure"
            data-testid="tag-group-container"
          >
            <h3 className="tag-group-header" data-testid="tag-group-header">
              {group}
            </h3>
            <div className="tag-group-grid-structure">
              {tags.map(renderTagButton)}
            </div>
          </div>
        ))
      ) : (
        // グループ化されていない従来の表示（フォールバック）
        <div className="tag-group-grid-structure">
          {availableTags.map(renderTagButton)}
        </div>
      )}

      {Array.from(selected).map(tag => (
        <input key={tag} type="hidden" name="tags" value={tag} />
      ))}
    </div>
  );
};
