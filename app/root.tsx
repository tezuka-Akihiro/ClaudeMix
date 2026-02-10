import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
// セルフホスティングフォント (Lighthouse最適化: 外部リクエスト削減)
import "@fontsource/oswald/400.css";
import "@fontsource/oswald/500.css";
import "@fontsource/oswald/700.css";

export function links() {
  return [];
}

export default function App() {
  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <Meta />
        {/* クリティカルCSS: 初期レンダリングに必要な最小限のスタイル */}
        <style
          dangerouslySetInnerHTML={{
            __html: `*,*::before,*::after{box-sizing:border-box}html{scroll-behavior:auto}:root{--color-background-primary:#111;--color-text-primary:#E8E8E8;--color-accent-gold:#D4BC89;--color-interactive-primary:#22d3ee;--spacing-3:16px;--spacing-4:24px;--font-heading-primary:'Oswald'}`,
          }}
        />
        <Links />
        {/* FOUC防止: テーマをlocalStorageから即座に適用 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme') ||
                  (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                document.documentElement.setAttribute('data-theme', theme);
              })();
            `,
          }}
        />
      </head>
      <body>
        <div id="root">
          <Outlet />
        </div>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
