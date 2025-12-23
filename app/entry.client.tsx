import { RemixBrowser } from "@remix-run/react";
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";

// グローバルスタイルと共通コンポーネントのCSS（全ページで読み込み）
import "./styles/globals.css";
import "./styles/blog/layer2-common.css";

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <RemixBrowser />
    </StrictMode>
  );
});
