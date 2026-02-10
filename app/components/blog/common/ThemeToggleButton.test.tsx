import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import { ThemeToggleButton } from './ThemeToggleButton';
import { loadSpec } from 'tests/utils/loadSpec';
import type { BlogCommonSpec } from '~/specs/blog/types';
import { extractTestId } from '~/lib/blog/common/extractTestId';

let spec: BlogCommonSpec;

describe('ThemeToggleButton', () => {
  beforeAll(async () => {
    spec = await loadSpec<BlogCommonSpec>('blog', 'common');
  });

  // localStorageのモック
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      clear: () => {
        store = {};
      },
    };
  })();

  beforeEach(() => {
    // localStorageをモック
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });

    // window.matchMediaをモック
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: query === spec.theme.media_query,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    // localStorageをクリア
    localStorageMock.clear();

    // data-theme属性をリセット
    document.documentElement.removeAttribute('data-theme');
  });

  it('should render theme toggle button', () => {
    render(<ThemeToggleButton spec={spec} />);
    const button = screen.getByTestId(
      extractTestId(spec.ui_selectors.header.theme_toggle_button)
    );
    expect(button).toBeInTheDocument();
  });

  it('should display moon icon initially (dark mode)', async () => {
    render(<ThemeToggleButton spec={spec} />);
    const button = screen.getByTestId(
      extractTestId(spec.ui_selectors.header.theme_toggle_button)
    );

    // マウント後に月アイコンが表示されることを確認
    await waitFor(() => {
      expect(button.textContent).toContain(spec.theme.icons.dark);
    });
  });

  it('should toggle theme when clicked', async () => {
    render(<ThemeToggleButton spec={spec} />);
    const button = screen.getByTestId(
      extractTestId(spec.ui_selectors.header.theme_toggle_button)
    );

    // 初期状態はダークモード
    await waitFor(() => {
      expect(button.textContent).toContain(spec.theme.icons.dark);
    });

    // クリックしてライトモードに切り替え
    fireEvent.click(button);

    await waitFor(() => {
      expect(button.textContent).toContain(spec.theme.icons.light);
      expect(
        document.documentElement.getAttribute(spec.theme.html_attribute.name)
      ).toBe(spec.theme.html_attribute.light_value);
      expect(localStorageMock.getItem(spec.theme.storage.key)).toBe(
        spec.theme.html_attribute.light_value
      );
    });

    // もう一度クリックしてダークモードに戻す
    fireEvent.click(button);

    await waitFor(() => {
      expect(button.textContent).toContain(spec.theme.icons.dark);
      expect(
        document.documentElement.getAttribute(spec.theme.html_attribute.name)
      ).toBe(spec.theme.html_attribute.dark_value);
      expect(localStorageMock.getItem(spec.theme.storage.key)).toBe(
        spec.theme.html_attribute.dark_value
      );
    });
  });

  it('should load saved theme from localStorage', async () => {
    // localStorageにライトモードを保存
    localStorageMock.setItem(
      spec.theme.storage.key,
      spec.theme.html_attribute.light_value
    );

    render(<ThemeToggleButton spec={spec} />);
    const button = screen.getByTestId(
      extractTestId(spec.ui_selectors.header.theme_toggle_button)
    );

    // ライトモードのアイコンが表示されることを確認
    await waitFor(() => {
      expect(button.textContent).toContain(spec.theme.icons.light);
      expect(
        document.documentElement.getAttribute(spec.theme.html_attribute.name)
      ).toBe(spec.theme.html_attribute.light_value);
    });
  });

  it('should have correct aria-label based on current theme', async () => {
    render(<ThemeToggleButton spec={spec} />);
    const button = screen.getByTestId(
      extractTestId(spec.ui_selectors.header.theme_toggle_button)
    );

    // 初期状態（ダークモード）のaria-label
    await waitFor(() => {
      expect(button.getAttribute('aria-label')).toBe(
        spec.accessibility.aria_labels.theme_toggle_button_dark
      );
    });

    // ライトモードに切り替え
    fireEvent.click(button);

    await waitFor(() => {
      expect(button.getAttribute('aria-label')).toBe(
        spec.accessibility.aria_labels.theme_toggle_button_light
      );
    });
  });

  it('should apply data-theme attribute to html element', async () => {
    render(<ThemeToggleButton spec={spec} />);
    const button = screen.getByTestId(
      extractTestId(spec.ui_selectors.header.theme_toggle_button)
    );

    // 初期状態でdata-theme属性が設定されることを確認
    await waitFor(() => {
      expect(
        document.documentElement.getAttribute(spec.theme.html_attribute.name)
      ).toBe(spec.theme.html_attribute.dark_value);
    });

    // ライトモードに切り替え
    fireEvent.click(button);

    await waitFor(() => {
      expect(
        document.documentElement.getAttribute(spec.theme.html_attribute.name)
      ).toBe(spec.theme.html_attribute.light_value);
    });
  });
});
