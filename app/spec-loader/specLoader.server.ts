// app/spec-loader/specLoader.server.ts

import yaml from 'js-yaml';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

// パース結果をキャッシュするためのMap
const cache = new Map<string, unknown>();

// プリロード済みフラグ
let isPreloaded = false;

/**
 * app/specs 配下の全 spec ファイルをプリロードする
 */
function preloadAllSpecs(): void {
  if (isPreloaded) return;

  const specsDir = join(process.cwd(), 'app', 'specs');

  try {
    // specs ディレクトリ配下のサービスディレクトリを走査
    const services = readdirSync(specsDir).filter(item => {
      const itemPath = join(specsDir, item);
      return statSync(itemPath).isDirectory();
    });

    for (const service of services) {
      const serviceDir = join(specsDir, service);
      const files = readdirSync(serviceDir).filter(file => file.endsWith('-spec.yaml'));

      for (const file of files) {
        const sectionName = file.replace('-spec.yaml', '');
        const featurePath = `${service}/${sectionName}`;
        const specPath = join(serviceDir, file);

        try {
          const yamlString = readFileSync(specPath, 'utf-8');
          const parsedSpec = yaml.load(yamlString);
          cache.set(featurePath, parsedSpec);
        } catch (error) {
          console.warn(`[specLoader] Failed to preload ${featurePath}:`, error);
        }
      }
    }

    isPreloaded = true;
    console.log(`[specLoader] Preloaded ${cache.size} spec files`);
  } catch (error) {
    console.error('[specLoader] Failed to preload specs:', error);
  }
}

// サーバー起動時に自動的にプリロード
preloadAllSpecs();

/**
 * 指定された機能パスに対応するspec.yamlを読み込み、パースして返す
 * @param featurePath 'blog/posts' のような機能パス
 * @returns パース済みのSpecオブジェクト
 */
export function loadSpec<T>(featurePath: string): T {
  // プリロードが完了していない場合は実行
  if (!isPreloaded) {
    preloadAllSpecs();
  }

  if (cache.has(featurePath)) {
    return cache.get(featurePath) as T;
  }

  // キャッシュにない場合は個別に読み込み（フォールバック）
  const pathParts = featurePath.split('/');
  if (pathParts.length < 2) {
    throw new Error(`Invalid featurePath format: ${featurePath}`);
  }
  const serviceName = pathParts[0];
  const sectionName = pathParts.slice(1).join('-'); // e.g., 'posts' or 'user-settings'

  // プロジェクトルートからの絶対パスを構築
  const specPath = join(process.cwd(), 'app', 'specs', serviceName, `${sectionName}-spec.yaml`);

  try {
    const yamlString = readFileSync(specPath, 'utf-8');
    const parsedSpec = yaml.load(yamlString) as T;
    cache.set(featurePath, parsedSpec);
    return parsedSpec;
  } catch (error) {
    throw new Error(
      `Spec file not found for feature: ${featurePath} (path: ${specPath})`,
      { cause: error },
    );
  }
}