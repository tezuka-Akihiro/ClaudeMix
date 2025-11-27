// checkDesignFiles - 🔌 副作用層
// 設計ドキュメントの存在確認を行う
// データベース、API、ファイルシステムなどの外部リソースとの相互作用

import { existsSync } from 'fs';
import { join } from 'path';

export interface CheckDesignFilesOptions {
  service: string;
  section: string;
}

export interface FileCheckResult {
  path: string;
  exists: boolean;
  type: 'common' | 'section';
}

export interface CheckDesignFilesResult {
  allExist: boolean;
  commonFiles: FileCheckResult[];
  sectionFiles: FileCheckResult[];
  missingFiles: string[];
}

/**
 * 設計ドキュメントの存在確認を行う
 *
 * この関数は、開発フローに従って生成されるべき設計・計画ドキュメントの
 * 存在を監査し、開発の進捗を可視化することを目的としています。
 *
 * 共通対象:
 * - `develop/{service}/REQUIREMENTS_ANALYSIS_PIPE.md`
 * - `develop/{service}/GUIDING_PRINCIPLES.md`
 *
 * セクション別対象:
 * - `develop/{service}/{section}/func-spec.md`
 * - `develop/{service}/{section}/uiux-spec.md`
 * - `develop/{service}/{section}/spec.yaml`
 * - `develop/{service}/{section}/file-list.md`
 * - `develop/{service}/{section}/TDD_WORK_FLOW.md`
 *
 * @param options - サービスとセクションの情報
 * @returns 処理結果
 */
export async function checkDesignFiles(options: CheckDesignFilesOptions): Promise<CheckDesignFilesResult> {
  try {
    const { service, section } = options;
    const projectRoot = process.cwd();

    // 共通対象ファイルのパス定義
    const commonFilePaths = [
      `develop/${service}/REQUIREMENTS_ANALYSIS_PIPE.md`,
      `develop/${service}/GUIDING_PRINCIPLES.md`,
    ];

    // セクション別対象ファイルのパス定義
    const sectionFilePaths = [
      `develop/${service}/${section}/func-spec.md`,
      `develop/${service}/${section}/uiux-spec.md`,
      `develop/${service}/${section}/spec.yaml`,
      `develop/${service}/${section}/file-list.md`,
      `develop/${service}/${section}/TDD_WORK_FLOW.md`,
    ];

    // 共通ファイルの存在確認
    const commonFiles: FileCheckResult[] = commonFilePaths.map((relativePath) => {
      const fullPath = join(projectRoot, relativePath);
      return {
        path: relativePath,
        exists: existsSync(fullPath),
        type: 'common' as const,
      };
    });

    // セクション別ファイルの存在確認
    const sectionFiles: FileCheckResult[] = sectionFilePaths.map((relativePath) => {
      const fullPath = join(projectRoot, relativePath);
      return {
        path: relativePath,
        exists: existsSync(fullPath),
        type: 'section' as const,
      };
    });

    // すべてのファイルをマージ
    const allFiles = [...commonFiles, ...sectionFiles];

    // 存在しないファイルのリスト
    const missingFiles = allFiles
      .filter((file) => !file.exists)
      .map((file) => file.path);

    // すべて存在するかどうか
    const allExist = missingFiles.length === 0;

    return {
      allExist,
      commonFiles,
      sectionFiles,
      missingFiles,
    };
  } catch (error) {
    console.error(`checkDesignFiles failed:`, error);
    throw new Error(`checkDesignFiles operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * checkDesignFilesの設定検証
 */
export function validateCheckDesignFilesOptions(options: unknown): options is CheckDesignFilesOptions {
  if (typeof options !== 'object' || options === null) {
    return false;
  }

  const opts = options as Record<string, unknown>;

  // serviceとsectionが文字列であることを確認
  if (typeof opts.service !== 'string' || opts.service.trim() === '') {
    return false;
  }

  if (typeof opts.section !== 'string' || opts.section.trim() === '') {
    return false;
  }

  return true;
}