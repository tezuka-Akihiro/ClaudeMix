import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ThemeToggleButton } from './ThemeToggleButton';

describe('ThemeToggleButton', () => {
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
        matches: query === '(prefers-color-scheme: dark)',
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
    render(<ThemeToggleButton />);
    const button = screen.getByTestId('theme-toggle-button');
    expect(button).toBeInTheDocument();
  });

  it('should display moon icon initially (dark mode)', async () => {
    render(<ThemeToggleButton />);
    const button = screen.getByTestId('theme-toggle-button');

    // マウント後に月アイコンが表示されることを確認
    await waitFor(() => {
      expect(button.textContent).toContain('🌙');
    });
  });

  it('should toggle theme when clicked', async () => {
    render(<ThemeToggleButton />);
    const button = screen.getByTestId('theme-toggle-button');

    // 初期状態はダークモード
    await waitFor(() => {
      expect(button.textContent).toContain('🌙');
    });

    // クリックしてライトモードに切り替え
    fireEvent.click(button);

    await waitFor(() => {
      expect(button.textContent).toContain('☀️');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      expect(localStorageMock.getItem('theme')).toBe('light');
    });

    // もう一度クリックしてダークモードに戻す
    fireEvent.click(button);

    await waitFor(() => {
      expect(button.textContent).toContain('🌙');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      expect(localStorageMock.getItem('theme')).toBe('dark');
    });
  });

  it('should load saved theme from localStorage', async () => {
    // localStorageにライトモードを保存
    localStorageMock.setItem('theme', 'light');

    render(<ThemeToggleButton />);
    const button = screen.getByTestId('theme-toggle-button');

    // ライトモードのアイコンが表示されることを確認
    await waitFor(() => {
      expect(button.textContent).toContain('☀️');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });
  });

  it('should have correct aria-label based on current theme', async () => {
    render(<ThemeToggleButton />);
    const button = screen.getByTestId('theme-toggle-button');

    // 初期状態（ダークモード）のaria-label
    await waitFor(() => {
      expect(button.getAttribute('aria-label')).toBe('ライトモードに切り替え');
    });

    // ライトモードに切り替え
    fireEvent.click(button);

    await waitFor(() => {
      expect(button.getAttribute('aria-label')).toBe('ダークモードに切り替え');
    });
  });

  it('should apply data-theme attribute to html element', async () => {
    render(<ThemeToggleButton />);
    const button = screen.getByTestId('theme-toggle-button');

    // 初期状態でdata-theme属性が設定されることを確認
    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    // ライトモードに切り替え
    fireEvent.click(button);

    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });
  });
});
