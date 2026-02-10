import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import type { LinksFunction } from "@remix-run/node";

// セルフホスティングフォント: サブセット化されたwoff2を優先的に読み込む
// ?url を使用して Link タグで管理することで、ブラウザの優先度制御を最適化
import oswald400 from "@fontsource/oswald/400.css?url";
import oswald500 from "@fontsource/oswald/500.css?url";
import oswald700 from "@fontsource/oswald/700.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: oswald400 },
  { rel: "stylesheet", href: oswald500 },
  { rel: "stylesheet", href: oswald700 },
];

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
