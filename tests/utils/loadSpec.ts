/**
 * E2Eテスト用 spec.yaml ローダー
 *
 * spec.yamlからテストデータを動的に読み込むことで、
 * テストデータの一元管理を実現します。
 */

import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import { load } from 'js-yaml';
import matter from 'gray-matter';

/**
 * ブログ記事セクションのspec.yamlの型定義
 */
export interface BlogPostsSpec {
  project: {
    name: string;
    copyright_name: string;
  };
  categories: Array<{
    id: number;
    name: string;
    emoji: string;
  }>;
  ui_selectors: {
    section: Record<string, string>;
    card: Record<string, string>;
    filter: Record<string, string>;
    states: Record<string, string>;
  };
  business_rules: {
    pagination: {
      posts_per_page: number;
      default_page: number;
    };
    display: {
      max_tags_per_card: number;
      default_category_emoji: string;
    };
  };
}

/**
 * テスト記事のフロントマター型定義
 */
export interface TestArticleFrontmatter {
  slug: string;
  title: string;
  category: string;
  tags: string[];
  publishedAt: string;
  description?: string;
  author?: string;
}

/**
 * ブログ記事セクションのspec.yamlを読み込む
 *
 * @param service
 * @param section
 * @returns spec.yamlの内容
 */
export async function loadSpec(service: string ,section: string): Promise<BlogPostsSpec> {
  const specPath = join(process.cwd(), 'app/specs/',service,'/',section + '-spec.yaml');
  const content = await readFile(specPath, 'utf-8');
  const spec = load(content) as BlogPostsSpec;

  return spec;
}

/**
 * テスト専用記事（test-e2e-*.md）を読み込む
 *
 * @returns テスト記事のフロントマター配列
 */
async function loadTestArticles(): Promise<TestArticleFrontmatter[]> {
  const postsDir = join(process.cwd(), 'content/blog/posts');
  const files = await readdir(postsDir);
  const testFiles = files.filter(f => f.startsWith('test-e2e-') && f.endsWith('.md'));

  const articles: TestArticleFrontmatter[] = [];
  for (const file of testFiles) {
    const filePath = join(postsDir, file);
    const content = await readFile(filePath, 'utf-8');
    const { data } = matter(content);
    articles.push(data as TestArticleFrontmatter);
  }

  return articles;
}

/**
 * テスト専用記事をslugで検索
 *
 * @param slug - 記事のslug
 * @returns テスト記事の情報
 */
export async function getTestArticleBySlug(slug: string) {
  const articles = await loadTestArticles();
  const article = articles.find(a => a.slug === slug);

  if (!article) {
    throw new Error(`Test article with slug "${slug}" not found`);
  }

  return article;
}

/**
 * カテゴリ名でテスト記事を検索
 *
 * @param categoryId - カテゴリID
 * @returns 該当カテゴリのテスト記事の配列
 */
export async function getTestArticlesByCategory(categoryId: number) {
  const spec = await loadSpec('blog','posts');
  const category = spec.categories.find(c => c.id === categoryId);

  if (!category) {
    throw new Error(`Category with id ${categoryId} not found in spec.yaml`);
  }

  const articles = await loadTestArticles();
  return articles.filter(a => a.category === category.name);
}

/**
 * タグでテスト記事を検索
 *
 * @param tag - タグ名
 * @returns 該当タグを持つテスト記事の配列
 */
export async function getTestArticlesByTag(tag: string) {
  const articles = await loadTestArticles();
  return articles.filter(a => a.tags.includes(tag));
}

/**
 * カテゴリ情報を取得
 *
 * @param categoryId - カテゴリID
 * @returns カテゴリ情報
 */
export async function getCategoryById(categoryId: number) {
  const spec = await loadSpec('blog','posts');
  const category = spec.categories.find(c => c.id === categoryId);

  if (!category) {
    throw new Error(`Category with id ${categoryId} not found in spec.yaml`);
  }

  return category;
}
