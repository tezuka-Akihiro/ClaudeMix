// blog.landing.$target - Route: ランディングページ
// ターゲット別のランディングページを表示

import type { LoaderFunctionArgs, MetaFunction, LinksFunction } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { useLoaderData, useRouteError, isRouteErrorResponse } from "@remix-run/react";
import { getLandingContent } from "~/data-io/blog/landing/getLandingContent.server";
import { getMangaAssets } from "~/data-io/blog/landing/getMangaAssets.server";
import { validateTarget } from "~/lib/blog/landing/targetValidation";
import { resolveLegalContent } from "~/lib/blog/common/resolveLegalContent";
import { loadSpec, loadSharedSpec } from "~/spec-utils/specLoader.server";
import type { BlogLandingSpec, LandingContent, MangaAsset } from "~/specs/blog/types";
import type { ProjectSpec } from '~/specs/shared/types';
import { Link } from "@remix-run/react";
import { data as landingSpecRaw } from "~/generated/specs/blog/landing";
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
  projectName: string;
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
  const projectSpec = loadSharedSpec<ProjectSpec>('project');

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

    // 特定商取引法の内容をspecから取得し、秘匿項目を環境変数で置換
    const { content: legalContent } = resolveLegalContent({
      template: landingSpec.footer.legal_content,
      privateInfo: env?.LEGAL_PRIVATE_INFO,
    });

    return json<LandingLoaderData>({
      projectName: projectSpec.project.name,
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
      throw new Response(landingSpec.messages.error.not_found, { status: 404 });
    }
    // その他のエラーは500
    throw new Response(landingSpec.messages.error.internal_server_error, { status: 500 });
  }
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const projectName = data?.projectName || 'ClaudeMix';
  if (!data) {
    return [
      { title: `Landing Page | ${projectName}` },
      { name: "description", content: `${projectName} landing page` },
    ];
  }

  return [
    { title: `${data.content.catchCopy} | ${projectName}` },
    { name: "description", content: data.content.description },
    { property: "og:title", content: data.content.catchCopy },
    { property: "og:description", content: data.content.description },
    { property: "og:type", content: "website" },
  ];
};

export default function LandingPage() {
  const { projectName, content, mangaAssets, spec, footerLinks, legalContent } = useLoaderData<typeof loader>();

  // Above-the-fold用の漫画パネル（最初のN枚）
  const heroMaxCount = spec.business_rules.manga_panel_count.hero_max;
  const heroMangaAssets = mangaAssets.slice(0, heroMaxCount);

  return (
    <main className="landing-page">
      {/* ヒーローセクション（ファーストビュー） */}
      <HeroSection
        catchCopy={content.catchCopy}
        heroMangaAssets={heroMangaAssets}
        mangaPanelAltLabel={spec.accessibility.aria_labels.manga_panel}
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
        mangaPanelAltLabel={spec.accessibility.aria_labels.manga_panel}
      />

      {/* CTAセクション */}
      <CTASection ctaLinks={content.ctaLinks} />

      {/* フッター */}
      <LandingFooter
        links={footerLinks}
        legalContent={legalContent}
        projectName={projectName}
      />
    </main>
  );
}

export function ErrorBoundary() {
  // NOTE: ErrorBoundary runs on both server and client.
  // We use the generated spec module directly (it's bundled for client).
  const spec = landingSpecRaw as BlogLandingSpec;
  const error = useRouteError();

  let title = spec.messages.error.title;
  let message = spec.messages.error.description;

  if (isRouteErrorResponse(error)) {
    title = error.status === 404 ? "404 Not Found" : spec.messages.error.boundary_title;
    message = error.data || spec.messages.error.boundary_message;
  }

  return (
    <div className="landing-error">
      <h1 data-testid="error-title">{title}</h1>
      <p data-testid="error-message">{message}</p>
      <Link to="/blog" data-testid="back-link">{spec.messages.error.back_to_blog}</Link>
    </div>
  );
}
