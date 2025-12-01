// sectionListBuilder - Pure Logic (lib層)
// Extract section list from project.toml for selected service

interface ProjectConfig {
  services: {
    [serviceName: string]: {
      sections: {
        [sectionKey: string]: {
          name: string;
        };
      };
    };
  };
}

export interface SectionInfo {
  key: string;    // セクションキー（例: "common", "design-flow"）
  name: string;   // 表示名（例: "Common Components", "設計フロー"）
}

export function buildSectionList(
  projectConfig: ProjectConfig | null,
  serviceName: string
): SectionInfo[] {
  if (!projectConfig || !serviceName) {
    return [];
  }

  const service = projectConfig.services[serviceName];
  if (!service || !service.sections) {
    return [];
  }

  // セクションキーと表示名の両方を含むオブジェクト配列を返す
  return Object.entries(service.sections).map(([key, section]) => ({
    key,
    name: section.name,
  }));
}
