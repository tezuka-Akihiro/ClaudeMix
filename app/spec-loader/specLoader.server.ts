// app/spec-loader/specLoader.server.ts

import { getSpec } from '~/generated/specs';

/**
 * 指定された機能パスに対応するspec.yamlを読み込み、パースして返す
 * @param featurePath 'blog/posts' のような機能パス
 * @returns パース済みのSpecオブジェクト
 */
export function loadSpec<T>(featurePath: string): T {
  return getSpec<T>(featurePath);
}