/**
 * テスト用 spec.yaml ローダー
 *
 * {section}-spec.yamlから定数を動的に読み込むことで、SsoTを実現します。
 * テストデータは基本的に使用せず、どうしても必要な場合はスクリプトにハードコードしてください。
 * {section}-spec.yaml にテストデータを追加することは避けてください。
 */

import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import { load } from 'js-yaml';
import matter from 'gray-matter';
import type { BlogPostsSpec } from '~/specs/blog/types';
import type { AccountAuthenticationSpec, AccountProfileSpec } from '~/specs/account/types';

// Re-export the types for convenience
export type { BlogPostsSpec, AccountAuthenticationSpec, AccountProfileSpec };

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
export async function loadSpec<T = BlogPostsSpec>(service: string ,section: string): Promise<T> {
  const specPath = join(process.cwd(), 'app/specs/',service,'/',section + '-spec.yaml');
  const content = await readFile(specPath, 'utf-8');
  const spec = load(content) as T;

  return spec;
}

/**
 * Shared spec.yamlを読み込む
 *
 * @param specName - 'project', 'validation', 'responsive', 'server' のいずれか
 * @returns spec.yamlの内容
 */
export async function loadSharedSpec<T>(specName: string): Promise<T> {
  const specPath = join(process.cwd(), 'app/specs/shared/', specName + '-spec.yaml');
  const content = await readFile(specPath, 'utf-8');
  const spec = load(content) as T;

  return spec;
}

/**
 * テスト専用記事（test-e2e-*.md）を読み込む
 *
 * @returns テスト記事のフロントマター配列
 */
export async function loadTestArticles(): Promise<TestArticleFrontmatter[]> {
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
