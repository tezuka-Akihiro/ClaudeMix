// copyrightFormatter - 🧠 純粋ロジック層
// コピーライト文字列をフォーマットする純粋関数
// 年の自動更新機能

import { getSharedSpec } from '~/generated/specs';
import type { ProjectSpec } from '~/specs/shared/types';

/**
 * コピーライト文字列をフォーマットする
 *
 * @param projectName
 * @returns フォーマットされたコピーライト文字列
 */
export function formatCopyright(projectName?: string): string {
  const currentYear = new Date().getFullYear();
  const name = projectName || getSharedSpec<ProjectSpec>('project').project.name;
  return `© ${currentYear} ${name}`;
}
