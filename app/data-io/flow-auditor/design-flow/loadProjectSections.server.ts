// loadProjectSections - 🔌 副作用層
// project.tomlから対象サービスのセクション定義を取得
// データベース、API、ファイルシステムなどの外部リソースとの相互作用

import fs from 'fs';
import path from 'path';
import toml from '@iarna/toml';

export interface LoadProjectSectionsOptions {
  service: string;
}

export interface Section {
  name: string;
}

export interface LoadProjectSectionsResult {
  sections: Section[];
}

/**
 * project.tomlから対象サービスのセクション定義を取得
 *
 * @param options - 処理オプション
 * @returns 処理結果: { sections: { name: string }[] }
 */
export async function loadProjectSections(options: LoadProjectSectionsOptions): Promise<LoadProjectSectionsResult> {
  try {
    const projectTomlPath = path.join(process.cwd(), 'scripts', 'project.toml');

    if (!fs.existsSync(projectTomlPath)) {
      throw new Error('project.toml file not found');
    }

    const content = fs.readFileSync(projectTomlPath, 'utf8');
    const projectConfig = toml.parse(content) as any;

    if (!projectConfig.services || !projectConfig.services[options.service]) {
      throw new Error(`Service "${options.service}" not found in project.toml`);
    }

    const serviceConfig = projectConfig.services[options.service];
    const sections: Section[] = [];

    if (serviceConfig.sections) {
      for (const sectionName of Object.keys(serviceConfig.sections)) {
        sections.push({ name: sectionName });
      }
    }

    return {
      sections
    };
  } catch (error) {
    console.error(`loadProjectSections failed:`, error);
    throw new Error(`loadProjectSections operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * loadProjectSectionsの設定検証
 */
export function validateLoadProjectSectionsOptions(options: unknown): options is LoadProjectSectionsOptions {
  if (!options || typeof options !== 'object') {
    return false;
  }

  const opts = options as any;
  return typeof opts.service === 'string' && opts.service.length > 0;
}