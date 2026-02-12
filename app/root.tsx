import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useMatches,
} from "@remix-run/react";
// セルフホスティングフォント (Lighthouse最適化: 外部リクエスト削減)
import "@fontsource/oswald/400.css";
import "@fontsource/oswald/500.css";
import "@fontsource/oswald/700.css";

// フォントファイルのURLを取得（Lighthouse LCP/FCP最適化: 事前読み込み用）
import oswald400Latin from "@fontsource/oswald/files/oswald-latin-400-normal.woff2?url";
import oswald500Latin from "@fontsource/oswald/files/oswald-latin-500-normal.woff2?url";
import oswald700Latin from "@fontsource/oswald/files/oswald-latin-700-normal.woff2?url";

export function links() {
  return [
    {
      rel: "preload",
      href: oswald400Latin,
      as: "font",
      type: "font/woff2",
      crossOrigin: "anonymous",
    },
    {
      rel: "preload",
      href: oswald500Latin,
      as: "font",
      type: "font/woff2",
      crossOrigin: "anonymous",
    },
    {
      rel: "preload",
      href: oswald700Latin,
      as: "font",
      type: "font/woff2",
      crossOrigin: "anonymous",
    },
  ];
}

export default function App() {
  const matches = useMatches();
  // 全てのルートで handle.hydrate が false でない場合のみ JS をロードする
  const shouldHydrate = matches.every(
    (match) => (match.handle as { hydrate?: boolean })?.hydrate !== false
  );

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
        {shouldHydrate && <Scripts />}
      </body>
    </html>
  );
}
