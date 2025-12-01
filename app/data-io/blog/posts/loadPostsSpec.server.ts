// app/data-io/blog/posts/loadPostsSpec.server.ts

import { loadSpec } from '~/spec-loader/specLoader.server';
import type { BlogPostsSpec } from '~/specs/blog/types';

/**
 * ブログ記事機能のspecをロードする
 *
 * 内部で汎用specローダーを呼び出し、
 * 機能固有のパスと型情報をカプセル化する。
 */
export function loadPostsSpec(): BlogPostsSpec {
  // ここで具体的なパスと型を指定する責務を負う
  return loadSpec<BlogPostsSpec>('blog/posts');
}