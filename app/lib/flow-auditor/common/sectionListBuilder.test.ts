// sectionListBuilder.test.ts - 純粋ロジック層: ユニットテスト
// project.tomlからセクションリスト構築ロジックのテスト

import { describe, it, expect } from 'vitest';
import { buildSectionList, type SectionInfo } from './sectionListBuilder';

describe('buildSectionList', () => {
  const validProjectConfig = {
    services: {
      'flow-auditor': {
        sections: {
          common: {
            name: 'Common Components',
          },
          'design-flow': {
            name: '設計フロー',
          },
          'implementation-flow': {
            name: '実装フロー',
          },
        },
      },
      'another-service': {
        sections: {
          dashboard: {
            name: 'Dashboard',
          },
        },
      },
    },
  };

  describe('正常系', () => {
    it('有効なprojectConfigとserviceNameからセクションリストを構築する', () => {
      const result = buildSectionList(validProjectConfig, 'flow-auditor');

      expect(result).toHaveLength(3);
      expect(result).toEqual([
        { key: 'common', name: 'Common Components' },
        { key: 'design-flow', name: '設計フロー' },
        { key: 'implementation-flow', name: '実装フロー' },
      ]);
    });

    it('別のサービス名でも正しくセクションリストを構築する', () => {
      const result = buildSectionList(validProjectConfig, 'another-service');

      expect(result).toHaveLength(1);
      expect(result).toEqual([{ key: 'dashboard', name: 'Dashboard' }]);
    });

    it('セクションが1つだけの場合も正しく処理する', () => {
      const singleSectionConfig = {
        services: {
          'single-service': {
            sections: {
              only: {
                name: 'Only Section',
              },
            },
          },
        },
      };

      const result = buildSectionList(singleSectionConfig, 'single-service');

      expect(result).toEqual([{ key: 'only', name: 'Only Section' }]);
    });
  });

  describe('異常系: 空配列を返す', () => {
    it('projectConfigがnullの場合、空配列を返す', () => {
      const result = buildSectionList(null, 'flow-auditor');

      expect(result).toEqual([]);
    });

    it('serviceNameが空文字列の場合、空配列を返す', () => {
      const result = buildSectionList(validProjectConfig, '');

      expect(result).toEqual([]);
    });

    it('存在しないserviceNameを指定した場合、空配列を返す', () => {
      const result = buildSectionList(validProjectConfig, 'non-existent-service');

      expect(result).toEqual([]);
    });

    it('servicesが存在しないprojectConfigの場合、空配列を返す', () => {
      const noServicesConfig = {
        services: {},
      };

      const result = buildSectionList(noServicesConfig, 'any-service');

      expect(result).toEqual([]);
    });

    it('sectionsが存在しないserviceの場合、空配列を返す', () => {
      const noSectionsConfig = {
        services: {
          'no-sections-service': {},
        },
      };

      const result = buildSectionList(noSectionsConfig as any, 'no-sections-service');

      expect(result).toEqual([]);
    });

    it('sectionsが空オブジェクトの場合、空配列を返す', () => {
      const emptySectionsConfig = {
        services: {
          'empty-service': {
            sections: {},
          },
        },
      };

      const result = buildSectionList(emptySectionsConfig, 'empty-service');

      expect(result).toEqual([]);
    });
  });

  describe('エッジケース', () => {
    it('セクション名に特殊文字が含まれていても正しく処理する', () => {
      const specialCharConfig = {
        services: {
          'test-service': {
            sections: {
              'section-with-dash': {
                name: 'セクション名 (括弧付き)',
              },
              'section_with_underscore': {
                name: 'Section / Slash',
              },
            },
          },
        },
      };

      const result = buildSectionList(specialCharConfig, 'test-service');

      expect(result).toHaveLength(2);
      expect(result).toContainEqual({
        key: 'section-with-dash',
        name: 'セクション名 (括弧付き)',
      });
      expect(result).toContainEqual({
        key: 'section_with_underscore',
        name: 'Section / Slash',
      });
    });

    it('セクション名が空文字列でも処理する', () => {
      const emptyNameConfig = {
        services: {
          'test-service': {
            sections: {
              empty: {
                name: '',
              },
            },
          },
        },
      };

      const result = buildSectionList(emptyNameConfig, 'test-service');

      expect(result).toEqual([{ key: 'empty', name: '' }]);
    });
  });

  describe('純粋性の保証', () => {
    it('同じ入力に対して常に同じ出力を返す (決定論的)', () => {
      const result1 = buildSectionList(validProjectConfig, 'flow-auditor');
      const result2 = buildSectionList(validProjectConfig, 'flow-auditor');
      const result3 = buildSectionList(validProjectConfig, 'flow-auditor');

      expect(result1).toEqual(result2);
      expect(result2).toEqual(result3);
    });

    it('入力されたprojectConfigを変更しない (イミュータブル)', () => {
      const configCopy = JSON.parse(JSON.stringify(validProjectConfig));

      buildSectionList(validProjectConfig, 'flow-auditor');

      expect(validProjectConfig).toEqual(configCopy);
    });

    it('返されるセクションリストは新しい配列である', () => {
      const result1 = buildSectionList(validProjectConfig, 'flow-auditor');
      const result2 = buildSectionList(validProjectConfig, 'flow-auditor');

      // 値は同じだが、異なるオブジェクトインスタンス
      expect(result1).toEqual(result2);
      expect(result1).not.toBe(result2);
    });
  });

  describe('型の検証', () => {
    it('返される配列の各要素がSectionInfo型に準拠する', () => {
      const result = buildSectionList(validProjectConfig, 'flow-auditor');

      result.forEach((section: SectionInfo) => {
        expect(section).toHaveProperty('key');
        expect(section).toHaveProperty('name');
        expect(typeof section.key).toBe('string');
        expect(typeof section.name).toBe('string');
      });
    });
  });
});
