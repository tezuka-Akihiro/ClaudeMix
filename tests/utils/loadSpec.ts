/**
 * E2Eテスト用 spec.yaml ローダー
 *
 * spec.yamlからテストデータを動的に読み込むことで、
 * テストデータの一元管理を実現します。
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import yaml from 'js-yaml';
import type { TagSpec } from '~/specs/blog/types';

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
  tags: TagSpec[];
  tag_groups: {
    order: string[];
  };
  test_articles: Array<{
    slug: string;
    title: string;
    category_id: number;
    category_name: string;
    tags: string[];
    publishedAt: string;
    expected_in_filters: Record<string, boolean>;
  }>;
  ui_selectors: {
    section: Record<string, string>;
    card: Record<string, string>;
    filter: Record<string, string>;
    states: Record<string, string>;
  };
  test_data: {
    posts: Array<{
      slug: string;
      title: string;
      description: string;
      publishedAt: string;
      category: string;
      tags: string[];
    }>;
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
 * ブログ記事セクションのspec.yamlを読み込む
 *
 * @param service
 * @param section
 * @returns spec.yamlの内容
 */
export async function loadSpec<T = BlogPostsSpec>(service: string ,section: string): Promise<T> {
  const specPath = join(process.cwd(), 'app/specs/',service,'/',section + '-spec.yaml');
  const content = await readFile(specPath, 'utf-8');
  const spec = yaml.load(content) as T;

  return spec;
}

/**
 * テスト専用記事をslugで検索
 *
 * @param slug - 記事のslug
 * @returns テスト記事の情報
 */
export async function getTestArticleBySlug(slug: string) {
  const spec = await loadSpec('blog','posts');
  const article = spec.test_articles.find(a => a.slug === slug);

  if (!article) {
    throw new Error(`Test article with slug "${slug}" not found in spec.yaml`);
  }

  return article;
}

/**
 * カテゴリIDでテスト記事を検索
 *
 * @param categoryId - カテゴリID
 * @returns 該当カテゴリのテスト記事の配列
 */
export async function getTestArticlesByCategory(categoryId: number) {
  const spec = await loadSpec('blog','posts');
  return spec.test_articles.filter(a => a.category_id === categoryId);
}

/**
 * タグでテスト記事を検索
 *
 * @param tag - タグ名
 * @returns 該当タグを持つテスト記事の配列
 */
export async function getTestArticlesByTag(tag: string) {
  const spec = await loadSpec('blog','posts');
  return spec.test_articles.filter(a => a.tags.includes(tag));
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
