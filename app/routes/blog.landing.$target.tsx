// blog.landing.$target - Route: ランディングページ
// ターゲット別のランディングページを表示

import type { LoaderFunctionArgs, MetaFunction, LinksFunction } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { getLandingContent } from "~/data-io/blog/landing/getLandingContent.server";
import { getMangaAssets } from "~/data-io/blog/landing/getMangaAssets.server";
import { validateTarget } from "~/lib/blog/landing/targetValidation";
import { loadSpec } from "~/spec-loader/specLoader.server";
import type { BlogLandingSpec, LandingContent, MangaAsset } from "~/specs/blog/types";
import HeroSection from "~/components/blog/landing/HeroSection";
import ScrollSection from "~/components/blog/landing/ScrollSection";
import MangaPanelGrid from "~/components/blog/landing/MangaPanelGrid";
import CTASection from "~/components/blog/landing/CTASection";
import LandingFooter from "~/components/blog/landing/LandingFooter";

// Landing page専用のCSS
import layer2LandingStyles from "~/styles/blog/layer2-landing.css?url";
import layer2CommonStyles from "~/styles/blog/layer2-common.css?url";

export const links: LinksFunction = () => [
  // Preload critical CSS for faster rendering
  {
    rel: "preload",
    href: layer2LandingStyles,
    as: "style",
  },
  {
    rel: "preload",
    href: layer2CommonStyles,
    as: "style",
  },
  // Stylesheets
  {
    rel: "stylesheet",
    href: layer2LandingStyles,
  },
  {
    rel: "stylesheet",
    href: layer2CommonStyles,
  },
];

export interface LandingLoaderData {
  content: LandingContent;
  mangaAssets: MangaAsset[];
  spec: BlogLandingSpec;
  validatedTarget: string;
  footerLinks: Array<{ label: string; href?: string; isModal: boolean }>;
  legalContent: string;
}

export async function loader({ params, context }: LoaderFunctionArgs) {
  // landing-spec.yaml を読み込み
  const landingSpec = loadSpec<BlogLandingSpec>('blog/landing');

  // ターゲットパラメータを検証（不正値はデフォルトにフォールバック）
  const validatedTarget = validateTarget(
    params.target,
    landingSpec.targets.supported,
    landingSpec.targets.default
  );

  // Cloudflare環境変数を取得（context.env を使用）
  const env = (context as any).env;

  try {
    // コンテンツとアセットを並列取得
    const [content, mangaAssets] = await Promise.all([
      getLandingContent(validatedTarget),
      getMangaAssets(validatedTarget),
    ]);

    // フッターリンクをspec.yamlから取得・変換（is_modal → isModal）
    const footerLinks = landingSpec.footer.legal_links.map((link) => ({
      label: link.label,
      href: link.href,
      isModal: link.is_modal,
    }));

    // 環境変数から特定商取引法の内容を取得（本番環境用）
    // 設定されていない場合は spec.yaml のプレースホルダーを使用（開発環境用）
    const legalContent = env?.LEGAL_CONTENT || landingSpec.footer.legal_content;

    return json<LandingLoaderData>({
      content,
      mangaAssets,
      spec: landingSpec,
      validatedTarget,
      footerLinks,
      legalContent,
    });
  } catch (error) {
    // エラー内容をログ出力
    console.error('[Landing Loader Error]', error);

    // コンテンツファイルが存在しない場合は404
    if (error instanceof Error && error.message.includes('not found')) {
      throw new Response("Landing page not found", { status: 404 });
    }
    // その他のエラーは500
    throw new Response("Internal Server Error", { status: 500 });
  }
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) {
    return [
      { title: "Landing Page | ClaudeMix" },
      { name: "description", content: "ClaudeMix landing page" },
    ];
  }

  return [
    { title: `${data.content.catchCopy} | ClaudeMix` },
    { name: "description", content: data.content.description },
    { property: "og:title", content: data.content.catchCopy },
    { property: "og:description", content: data.content.description },
    { property: "og:type", content: "website" },
  ];
};

export default function LandingPage() {
  const { content, mangaAssets, spec, footerLinks, legalContent } = useLoaderData<typeof loader>();

  // Above-the-fold用の漫画パネル（最初のN枚）
  const heroMaxCount = spec.business_rules.manga_panel_count.hero_max;
  const heroMangaAssets = mangaAssets.slice(0, heroMaxCount);

  return (
    <main className="landing-page">
      {/* ヒーローセクション（ファーストビュー） */}
      <HeroSection
        catchCopy={content.catchCopy}
        heroMangaAssets={heroMangaAssets}
      />

      {/* スクロールセクション */}
      <ScrollSection
        description={content.description}
        threshold={spec.animation.viewport_threshold}
      />

      {/* 漫画パネルグリッド */}
      <MangaPanelGrid
        mangaAssets={mangaAssets}
        heroMaxCount={heroMaxCount}
      />

      {/* CTAセクション */}
      <CTASection ctaLinks={content.ctaLinks} />

      {/* フッター */}
      <LandingFooter links={footerLinks} legalContent={legalContent} />
    </main>
  );
}

export function ErrorBoundary() {
  return (
    <div className="landing-error">
      <h1>エラーが発生しました</h1>
      <p>ランディングページの読み込みに失敗しました。</p>
      <a href="/blog">ブログに戻る</a>
    </div>
  );
}
