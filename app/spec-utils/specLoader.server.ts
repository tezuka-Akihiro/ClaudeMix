// app/spec-utils/specLoader.server.ts

import { getSpec, getSharedSpec } from '~/generated/specs/index';

/**
 * 指定された機能パスに対応するspec.yaml（生成済みESモジュール）を読み込みます。
 * 3段階マージ（Shared -> Common -> Section）が適用された状態で取得されます。
 *
 * @param featurePath 'blog/posts' のような機能パス
 * @returns マージ済みのSpecオブジェクト
 */
export function loadSpec<T>(featurePath: string): T {
  return getSpec<T>(featurePath);
}

/**
 * 共有（Shared）specをロードします。
 *
 * @param specName 'validation', 'responsive', 'server', 'project', 'ui-patterns' のいずれか
 * @returns SharedSpecオブジェクト
 */
export function loadSharedSpec<T>(specName: string): T {
  return getSharedSpec<T>(specName);
}
