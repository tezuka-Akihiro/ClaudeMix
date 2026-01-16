// getLandingContent.server - 🔌 副作用層
// ターゲット別のランディングページコンテンツを読み込む
// content/blog/landing/{target}/content.yaml からデータを取得

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';
import type { LandingContent } from '~/specs/blog/types';

/**
 * コンテンツYAMLの生データ構造
 * @description content/blog/landing/{target}/content.yaml のスキーマ
 */
interface ContentYaml {
  target_slug: string;
  catch_copy: string;
  description: string;
  cta_button_text: string;
  cta_links: Array<{
    label: string;
    url: string;
    aria_label: string;
  }>;
  manga_panel_count: number;
}

/**
 * ターゲット別のランディングページコンテンツを読み込む
 *
 * @param target - ターゲットスラッグ（例: 'engineer'）
 * @returns ランディングページコンテンツ
 * @throws ファイルが存在しない、またはYAMLパースに失敗した場合
 */
export async function getLandingContent(target: string): Promise<LandingContent> {
  const contentPath = join(process.cwd(), 'content', 'blog', 'landing', target, 'content.yaml');

  // ファイル存在確認
  if (!existsSync(contentPath)) {
    throw new Error(`Landing content file not found: ${contentPath}`);
  }

  try {
    // YAMLファイルを読み込み
    const fileContent = readFileSync(contentPath, 'utf-8');
    const contentYaml = yaml.load(fileContent) as ContentYaml;

    // snake_case から camelCase に変換して返却
    return {
      targetSlug: contentYaml.target_slug,
      catchCopy: contentYaml.catch_copy,
      description: contentYaml.description,
      ctaButtonText: contentYaml.cta_button_text,
      ctaLinks: contentYaml.cta_links.map(link => ({
        label: link.label,
        url: link.url,
        aria_label: link.aria_label,
      })),
      mangaPanelCount: contentYaml.manga_panel_count,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to parse landing content YAML for target "${target}": ${error.message}`);
    }
    throw new Error(`Failed to parse landing content YAML for target "${target}": Unknown error`);
  }
}
