import { vitePlugin as remix, cloudflareDevProxyVitePlugin } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

export default defineConfig({
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
        manualChunks: (id) => {
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
    noExternal: true,  // Bundle all dependencies for Cloudflare Workers
  },
});