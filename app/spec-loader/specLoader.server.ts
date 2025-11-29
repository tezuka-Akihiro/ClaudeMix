// app/spec-loader/specLoader.server.ts

import yaml from 'js-yaml';

// Viteの機能で、app/spec配下の全spec.yamlをビルド時に文字列として一括インポート
// Remixの規約に合わせ、Viteが監視するappディレクトリ内にspecを配置
const specModules = import.meta.glob('/app/specs/**/*-spec.yaml', {
  query: '?raw',
  import: 'default',
  eager: true, // 即時読み込み
});

// パース結果をキャッシュするためのMap
const cache = new Map<string, unknown>();

/**
 * 指定された機能パスに対応するspec.yamlを読み込み、パースして返す
 * @param featurePath 'blog/posts' のような機能パス
 * @returns パース済みのSpecオブジェクト
 */
export function loadSpec<T>(featurePath: string): T {
  if (cache.has(featurePath)) {
    return cache.get(featurePath) as T;
  }

  // featurePath 'blog/posts' を分割してパスを組み立てる
  const pathParts = featurePath.split('/');
  if (pathParts.length < 2) {
    throw new Error(`Invalid featurePath format: ${featurePath}`);
  } 
  const serviceName = pathParts[0];
  const sectionName = pathParts.slice(1).join('-'); // e.g., 'posts' or 'user-settings'
  const modulePath = `/app/specs/${serviceName}/${sectionName}-spec.yaml`;
  const yamlString = specModules[modulePath];

  if (typeof yamlString !== 'string') {
    throw new Error(
      `Spec file not found for feature: ${featurePath} (path: ${modulePath})`,
    );
  }

  const parsedSpec = yaml.load(yamlString) as T;
  cache.set(featurePath, parsedSpec);

  return parsedSpec;
}