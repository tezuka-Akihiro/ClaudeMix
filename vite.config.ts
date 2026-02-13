import { vitePlugin as remix, cloudflareDevProxyVitePlugin } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

/**
 * Wranglerの[ignored-bare-import]警告を解消するためのプラグイン
 * Node.jsのビルドインモジュールの空のimport文をSSRバンドルから削除する。
 * ソースマップを壊さないよう、削除した文字数分だけスペースで埋める。
 */
const removeNodeBareImports = () => ({
  name: 'remove-node-bare-imports',
  renderChunk(code: string) {
    const nodeModules = [
      "util", "crypto", "events", "http", "https", "child_process",
      "node:assert", "node:net", "node:http", "node:stream", "node:buffer",
      "node:util", "node:querystring", "node:events", "node:diagnostics_channel",
      "node:tls", "node:zlib", "node:perf_hooks", "node:util/types",
      "node:worker_threads", "node:url", "node:async_hooks", "node:console", "node:dns",
      "string_decoder", "stream", "zlib", "fs", "buffer", "url",
      "node:crypto", "node:fs", "node:path", "node:fs/promises", "node:os"
    ];
    // import"node:console"; のような形式にマッチ
    const regex = new RegExp(`import["'](${nodeModules.join('|')})["'];`, 'g');

    // 文字数を維持しながら置換することでソースマップのズレを防ぐ
    const newCode = code.replace(regex, (match) => ' '.repeat(match.length));

    return {
      code: newCode,
      map: null, // 文字数が同じなので既存のソースマップがそのまま有効
    };
  },
});

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [
    cloudflareDevProxyVitePlugin(),
    remix({
      future: {
        // React Router v7のSplatルートの挙動をオプトインし、警告を解消
        v3_relativeSplatPath: true,
        v3_fetcherPersist: true,
        v3_lazyRouteDiscovery: true,
        v3_singleFetch: true,
        v3_throwAbortReason: true,
      },
      serverModuleFormat: "esm",
    }),
    tsconfigPaths(),
    // SSRビルド時のみ、Wranglerの警告を抑制するプラグインを適用
    isSsrBuild ? removeNodeBareImports() : null,
  ],
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./app")
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
  },
  server: {
    port: 3000,
    hmr: {
      overlay: false,  // エラーオーバーレイを無効化（リソース削減）
    },
    watch: {
      // ファイル監視の負荷を軽減
      ignored: ['**/node_modules/**', '**/test-results/**', '**/playwright-report/**']
    }
  },
  build: {
    // Lighthouse最適化: CSS/JSのバンドルサイズ削減
    cssCodeSplit: true,  // ルート別にCSS分割（未使用CSS削減）
    cssMinify: true,     // CSS圧縮を有効化
    minify: 'esbuild',   // 高速なesbuildで圧縮（terserより高速）
    target: 'es2020',    // モダンブラウザ向けにポリフィル削減
    rollupOptions: {
      external: [
        // テストファイルをビルドから除外
        /\.test\.(ts|tsx|js|jsx)$/,
        /\.spec\.(ts|tsx|js|jsx)$/,
      ],
      output: {
        // Lighthouse最適化: ベンダーとコンポーネントを分割してキャッシュ効率化
        // SSRビルドでは1つのファイルにまとめることでCloudflare Workersの起動速度を最適化
        manualChunks: isSsrBuild ? undefined : (id) => {
          // node_modulesを別チャンクに分離
          if (id.includes('node_modules')) {
            // React関連を専用チャンクに
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            // Remix関連を専用チャンクに
            if (id.includes('@remix-run')) {
              return 'vendor-remix';
            }
            // その他のベンダー
            return 'vendor';
          }
        },
        // アセットファイル名の最適化（キャッシュ効率化）
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.');
          const extType = info?.[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType || '')) {
            return `assets/images/[name]-[hash][extname]`;
          } else if (/woff2?|ttf|otf|eot/i.test(extType || '')) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
      },
      onwarn(warning, warn) {
        // UNRESOLVED_IMPORT 警告を無視 (Viteが正しく解決するため)
        if (warning.code === 'UNRESOLVED_IMPORT') {
          return;
        }
        warn(warning);
      },
    },
  },
  css: {
    postcss: './postcss.config.js',
  },
  ssr: {
    resolve: {
      externalConditions: ["workerd", "worker"],
    },
    external: ["workers-og"],  // Exclude workers-og due to WASM
    noExternal: true,  // Bundle all other dependencies for Cloudflare Workers
  },
}));
