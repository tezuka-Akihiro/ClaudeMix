// loadPostsSpec.server.test - Unit tests for shared spec loader functions
import { describe, it, expect, beforeAll } from 'vitest';
import {
  loadPostsServerConfig,
  loadPostsResponsiveConfig,
  loadProjectInfo,
} from './loadPostsSpec.server';
import { loadSharedSpec } from '~/spec-utils/specLoader.server';
import type { ServerSpec, ResponsiveSpec, ProjectSpec } from '~/specs/shared/types';

describe('loadPostsSpec.server', () => {
  let serverSpec: ServerSpec;
  let responsiveSpec: ResponsiveSpec;
  let projectSpec: ProjectSpec;

  beforeAll(() => {
    serverSpec = loadSharedSpec<ServerSpec>('server');
    responsiveSpec = loadSharedSpec<ResponsiveSpec>('responsive');
    projectSpec = loadSharedSpec<ProjectSpec>('project');
  });

  describe('loadPostsServerConfig', () => {
    it('should load server timeout from shared server spec', () => {
      const config = loadPostsServerConfig();

      expect(config).toHaveProperty('timeout');
      expect(config.timeout).toBe(serverSpec.loader.timeout);
      expect(typeof config.timeout).toBe('number');
      expect(config.timeout).toBeGreaterThan(0);
    });
  });

  describe('loadPostsResponsiveConfig', () => {
    it('should load breakpoints from shared responsive spec', () => {
      const config = loadPostsResponsiveConfig();

      expect(config).toHaveProperty('breakpoints');
      expect(config.breakpoints).toEqual(responsiveSpec.breakpoints);
      expect(config.breakpoints).toHaveProperty('mobile');
      expect(config.breakpoints).toHaveProperty('tablet');
      expect(typeof config.breakpoints.mobile).toBe('number');
      expect(typeof config.breakpoints.tablet).toBe('number');
    });
  });

  describe('loadProjectInfo', () => {
    it('should load project name from shared project spec', () => {
      const info = loadProjectInfo();

      expect(info).toHaveProperty('name');
      expect(info).toHaveProperty('copyrightName');
      expect(info.name).toBe(projectSpec.project.name);
      expect(info.copyrightName).toBe(projectSpec.project.name);
      expect(typeof info.name).toBe('string');
      expect(info.name.length).toBeGreaterThan(0);
    });
  });
});
