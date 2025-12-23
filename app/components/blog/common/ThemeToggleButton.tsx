import { useEffect, useState } from 'react';

/**
 * ThemeToggleButton - テーマ切り替えボタンコンポーネント
 *
 * ライトモード/ダークモードを切り替え、ユーザーの選択を localStorage に保存します。
 * テーマ設定は app/specs/blog/common-spec.yaml で定義されています。
 */
export function ThemeToggleButton() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [mounted, setMounted] = useState(false);

  // クライアント側でのみ実行
  useEffect(() => {
    setMounted(true);

    // localStorage からテーマを読み込む
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;

    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      // デフォルトはシステム設定を参照
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const defaultTheme = prefersDark ? 'dark' : 'light';
      setTheme(defaultTheme);
      document.documentElement.setAttribute('data-theme', defaultTheme);
    }
  }, []);

  // テーマ切り替えハンドラ
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // サーバーサイドレンダリング時は何も表示しない（ハイドレーションエラー防止）
  if (!mounted) {
    return (
      <button
        data-testid="theme-toggle-button"
        aria-label="テーマを切り替え"
        className="blog-header__theme-button"
      >
        <span className="blog-header__theme-icon">🌙</span>
      </button>
    );
  }

  // アイコン: ライトモード時は太陽、ダークモード時は月
  const icon = theme === 'light' ? '☀️' : '🌙';
  const ariaLabel = theme === 'light' ? 'ダークモードに切り替え' : 'ライトモードに切り替え';

  return (
    <button
      data-testid="theme-toggle-button"
      aria-label={ariaLabel}
      onClick={toggleTheme}
      className="blog-header__theme-button"
    >
      <span className="blog-header__theme-icon">{icon}</span>
    </button>
  );
}
