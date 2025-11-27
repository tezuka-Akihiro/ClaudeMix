// loadServiceList.server - Data-IO Layer (data-io層)
// Load service list from project.toml

import fs from 'fs';
import path from 'path';
import * as toml from '@iarna/toml';

export async function loadServiceList(): Promise<string[]> {
  try {
    const projectTomlPath = path.join(process.cwd(), 'scripts', 'project.toml');
    const content = fs.readFileSync(projectTomlPath, 'utf-8');
    const parsed = toml.parse(content) as any;

    if (!parsed.services) {
      return [];
    }

    return Object.keys(parsed.services);
  } catch (error) {
    console.error('Failed to load service list:', error);
    return [];
  }
}
