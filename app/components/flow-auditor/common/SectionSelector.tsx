// SectionSelector - Dropdown Component (components層)
// Dropdown for selecting section from current service

import React from 'react';

interface SectionSelectorProps {
  sections: string[]; // セクション一覧(例: ["common", "design-flow", "implementation-flow"])
  selectedSection: string; // 選択中のセクション名
  onChange: (sectionName: string) => void; // セクション変更ハンドラ
  disabled?: boolean; // 無効化フラグ(サービス未選択時等)
}

export const SectionSelector: React.FC<SectionSelectorProps> = ({
  sections,
  selectedSection,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="select-container">
      <label
        htmlFor="section-selector"
        className="select-label"
        aria-label="セクション選択"
      >
        セクション:
      </label>
      <select
        id="section-selector"
        data-testid="section-selector"
        value={selectedSection}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || sections.length === 0}
        className="select-input"
      >
        {sections.map((section) => (
          <option
            key={section}
            value={section}
            className="select-option"
          >
            {section}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SectionSelector;
