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
    rollupOptions: {
      external: [
        // テストファイルをビルドから除外
        /\.test\.(ts|tsx|js|jsx)$/,
        /\.spec\.(ts|tsx|js|jsx)$/,
      ],
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
  },
});