// app/data-io/blog/posts/loadPostsSpec.server.ts

import { loadSpec, loadSharedSpec } from '~/spec-loader/specLoader.server';
import type { BlogPostsSpec } from '~/specs/blog/types';
import type { ProjectSpec, ServerSpec, ResponsiveSpec } from '~/specs/shared/types';

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

/**
 * サーバー設定をshared specから取得
 */
export function loadPostsServerConfig() {
  const serverSpec = loadSharedSpec<ServerSpec>('server');
  return {
    timeout: serverSpec.loader.timeout,
  };
}

/**
 * レスポンシブ設定をshared specから取得
 */
export function loadPostsResponsiveConfig() {
  const responsiveSpec = loadSharedSpec<ResponsiveSpec>('responsive');
  return {
    breakpoints: responsiveSpec.breakpoints,
  };
}

/**
 * プロジェクト情報をshared specから取得
 */
export function loadProjectInfo() {
  const projectSpec = loadSharedSpec<ProjectSpec>('project');
  return {
    name: projectSpec.project.name,
    copyrightName: projectSpec.project.name,
  };
}