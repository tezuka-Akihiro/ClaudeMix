// TagGrid - Component (components層)
// タグ選択用のグリッド表示

import React, { useState, useEffect, useRef } from 'react';
import type { TagGroup } from '~/specs/blog/types';

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
  const prevSelectedTagsRef = useRef<string[]>([]);

  // selectedTags プロップの内容が実際に変更された場合のみ selected ステートを同期
  useEffect(() => {
    // 配列の内容を比較（順序を無視）
    const prevSet = new Set(prevSelectedTagsRef.current);
    const currentSet = new Set(selectedTags);

    const isDifferent =
      prevSet.size !== currentSet.size ||
      !Array.from(currentSet).every(tag => prevSet.has(tag));

    if (isDifferent) {
      setSelected(new Set(selectedTags));
      prevSelectedTagsRef.current = [...selectedTags];
    }
  }, [selectedTags]);

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
