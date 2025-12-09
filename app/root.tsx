import {
  Links,
  Meta,
  Outlet,
  Scripts,
} from "@remix-run/react";

export default function App() {
  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <Meta />
        <Links />
      </head>
      <body>
        <div id="root">
          <Outlet />
        </div>
        <Scripts />
        <script
          type="module"
          dangerouslySetInnerHTML={{
            __html: `
              import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
              window.mermaid = mermaid;
              mermaid.initialize({ startOnLoad: false, theme: 'dark' });
            `,
          }}
        />
      </body>
    </html>
  );
}
