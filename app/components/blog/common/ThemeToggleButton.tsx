// ThemeToggleButton - Component (components層)
// テーマ（ライト/ダーク）切り替えボタン

import React, { useEffect, useState } from 'react';
import { data as defaultSpec } from '~/generated/specs/blog/common';
import type { BlogCommonSpec } from '~/specs/blog/types';
import { extractTestId } from '~/spec-utils/extractTestId';

interface ThemeToggleButtonProps {
  spec?: BlogCommonSpec;
}

export const ThemeToggleButton: React.FC<ThemeToggleButtonProps> = ({ spec = defaultSpec }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);
  const { theme: themeSpec, accessibility } = spec;

  // 初期テーマの取得
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem(themeSpec.storage.key) as 'light' | 'dark' | null;
    const initialTheme = savedTheme ||
      (window.matchMedia(themeSpec.media_query).matches ? 'dark' : 'light');

    setTheme(initialTheme);
    document.documentElement.setAttribute(themeSpec.html_attribute.name,
      initialTheme === 'light' ? themeSpec.html_attribute.light_value : themeSpec.html_attribute.dark_value);
  }, [themeSpec]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem(themeSpec.storage.key, newTheme);
    document.documentElement.setAttribute(themeSpec.html_attribute.name,
      newTheme === 'light' ? themeSpec.html_attribute.light_value : themeSpec.html_attribute.dark_value);
  };

  if (!mounted) {
    return (
      <button
        className="blog-header__theme-button"
        aria-hidden="true"
        tabIndex={-1}
        data-testid={extractTestId(spec.ui_selectors.header.theme_toggle_button)}
      >
        <div className="w-5 h-5" />
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="blog-header__theme-button"
      aria-label={
        theme === 'light'
          ? accessibility.aria_labels.theme_toggle_button_light
          : accessibility.aria_labels.theme_toggle_button_dark
      }
      data-testid={extractTestId(spec.ui_selectors.header.theme_toggle_button)}
    >
      {theme === 'light' ? themeSpec.icons.light : themeSpec.icons.dark}
    </button>
  );
};
