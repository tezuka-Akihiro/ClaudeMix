// loadSectionList.server - Data-IO Layer (data-io層)
// Load section list from project.toml for specified service

import fs from 'fs';
import path from 'path';
import * as toml from '@iarna/toml';
import { buildSectionList, type SectionInfo } from '~/lib/flow-auditor/common/sectionListBuilder';

export async function loadSectionList(serviceName: string): Promise<SectionInfo[]> {
  try {
    const projectTomlPath = path.join(process.cwd(), 'scripts', 'project.toml');
    const content = fs.readFileSync(projectTomlPath, 'utf-8');
    const parsed = toml.parse(content) as any;

    return buildSectionList(parsed, serviceName);
  } catch (error) {
    console.error('Failed to load section list:', error);
    return [];
  }
}
