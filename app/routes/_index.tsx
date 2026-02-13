// _index - Route: ホームページ（Stripe対応）
// ブログヘッダー + シンプルなメインコンテンツ + Landingフッター

import type { LoaderFunctionArgs, LinksFunction } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { Link, useLoaderData } from "@remix-run/react";
import { loadBlogConfig } from "~/data-io/blog/common/loadBlogConfig.server";
import { loadSpec, loadSharedSpec } from "~/spec-loader/specLoader.server";
import type { BlogLandingSpec, MenuItem } from "~/specs/blog/types";
import type { ProjectSpec } from "~/specs/shared/types";
import { resolveLegalContent } from "~/lib/blog/common/resolveLegalContent";
import BlogHeader from "~/components/blog/common/BlogHeader";
import LandingFooter from "~/components/blog/landing/LandingFooter";

import layer2CommonStyles from "~/styles/blog/layer2-common.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: layer2CommonStyles },
];

interface LoaderData {
  blogTitle: string;
  logoPath: string;
  menuItems: MenuItem[];
  footerLinks: Array<{ label: string; href?: string; isModal: boolean }>;
  legalContent: string;
  projectName: string;
  serviceName: string;
}

export async function loader({ context }: LoaderFunctionArgs) {
  const blogConfig = await loadBlogConfig();
  const landingSpec = loadSpec<BlogLandingSpec>("blog/landing");
  const projectSpec = loadSharedSpec<ProjectSpec>("project");

  const env = (context as any).env;

  const footerLinks = landingSpec.footer.legal_links.map((link) => ({
    label: link.label,
    href: link.href,
    isModal: link.is_modal,
  }));

  const { content: legalContent } = resolveLegalContent({
    template: landingSpec.footer.legal_content,
    privateInfo: env?.LEGAL_PRIVATE_INFO,
  });

  return json<LoaderData>({
    blogTitle: blogConfig.blogTitle,
    logoPath: blogConfig.logoPath,
    menuItems: blogConfig.menuItems,
    footerLinks,
    legalContent,
    projectName: projectSpec.project.name,
    serviceName: projectSpec.project.service_name,
  });
}

export default function Index() {
  const {
    blogTitle,
    logoPath,
    menuItems,
    footerLinks,
    legalContent,
    projectName,
    serviceName,
  } = useLoaderData<typeof loader>();

  return (
    <div className="home-page home-page-structure">
      <BlogHeader
        blogTitle={blogTitle}
        logoPath={logoPath}
        menuItems={menuItems as MenuItem[]}
      />

      <main className="home-main home-main-structure" data-testid="home-main">
        <h1 className="home-title">{projectName}</h1>
        <p className="home-description">{serviceName}</p>
        <Link to="/blog" className="home-cta-button" data-testid="home-cta">
          ブログを見る
        </Link>
      </main>

      <LandingFooter links={footerLinks} legalContent={legalContent} />
    </div>
  );
}
