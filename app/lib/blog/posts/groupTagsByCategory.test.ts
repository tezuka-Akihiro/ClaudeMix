import { describe, it, expect } from 'vitest';
import { groupTags, type TagGroup } from './groupTagsByCategory';
import type { TagSpec } from '../../../specs/blog/types';

interface TestInput {
  availableTags: string[];
  tagsSpec: Partial<TagSpec>[];
}

describe('groupTags - Pure Logic Layer', () => {
  // Mock data representing tag definitions from spec.yaml
  const mockTagsSpec: TagSpec[] = [
    { name: 'SSR', group: 'Remix' },
    { name: 'Vite', group: 'Remix' },
    { name: 'Vitest', group: 'Remix' },
    { name: 'Workers', group: 'Cloudflare' },
    { name: 'Pages', group: 'Cloudflare' },
    { name: 'KV', group: 'Cloudflare' },
    { name: 'MCP', group: 'Claude Code' },
    { name: 'Skills', group: 'Claude Code' },
    { name: 'troubleshooting', group: 'other' },
    { name: 'refactoring', group: 'other' },
    { name: 'Playwright', group: 'other' }, // This group should be mapped to 'other'
    { name: 'React', group: 'Remix' },
  ].map(t => ({ ...t, category: 'technical', description: '' } as TagSpec));

  it('should group available tags according to spec and maintain group order', () => {
    // Arrange
    const input: TestInput = {
      availableTags: ['SSR', 'Workers', 'MCP', 'troubleshooting', 'Vite', 'Playwright'],
      tagsSpec: mockTagsSpec,
    };

    const expectedOutput: TagGroup[] = [
      { group: 'Remix', tags: ['SSR', 'Vite'] },
      { group: 'Cloudflare', tags: ['Workers'] },
      { group: 'Claude Code', tags: ['MCP'] },
      { group: 'other', tags: ['troubleshooting', 'Playwright'] },
    ];

    // Act
    const result = groupTags(input.availableTags, input.tagsSpec as TagSpec[]);

    // Assert
    expect(result).toEqual(expectedOutput);
  });

  it('should not include tags that are not in availableTags', () => {
    // Arrange
    const input: TestInput = {
      availableTags: ['SSR', 'Workers'], // Only these two are available
      tagsSpec: mockTagsSpec,
    };

    const expectedOutput: TagGroup[] = [
      { group: 'Remix', tags: ['SSR'] },
      { group: 'Cloudflare', tags: ['Workers'] },
    ];

    // Act
    const result = groupTags(input.availableTags, input.tagsSpec as TagSpec[]);

    // Assert
    expect(result).toEqual(expectedOutput);
  });

  it('should return empty arrays for groups with no available tags', () => {
    // Arrange
    const input: TestInput = {
      availableTags: ['SSR', 'Workers'],
      tagsSpec: mockTagsSpec,
    };

    // Act
    const result = groupTags(input.availableTags, input.tagsSpec as TagSpec[]);

    // Assert
    const claudeGroup = result.find(g => g.group === 'Claude Code');
    expect(claudeGroup).toBeUndefined(); // Groups with no tags should not be included
  });

  it('should handle empty availableTags input', () => {
    // Arrange
    const input: TestInput = {
      availableTags: [],
      tagsSpec: mockTagsSpec,
    };

    // Act
    const result = groupTags(input.availableTags, input.tagsSpec as TagSpec[]);

    // Assert
    expect(result).toEqual([]);
  });

  it('should handle empty tagsSpec input', () => {
    // Arrange
    const input: TestInput = {
      availableTags: ['SSR', 'Workers'],
      tagsSpec: [],
    };

    // Act
    const result = groupTags(input.availableTags, input.tagsSpec as TagSpec[]);

    // Assert
    // Tags without a group definition should not be included
    expect(result).toEqual([]);
  });

  it('should be deterministic (same input, same output)', () => {
    // Arrange
    const input: TestInput = {
      availableTags: ['SSR', 'Workers', 'MCP', 'troubleshooting', 'Vite'],
      tagsSpec: mockTagsSpec,
    };

    // Act
    const result1 = groupTags(input.availableTags, input.tagsSpec as TagSpec[]);
    const result2 = groupTags(input.availableTags, input.tagsSpec as TagSpec[]);

    // Assert
    expect(result1).toEqual(result2);
  });

  it('should maintain data immutability', () => {
    // Arrange
    const input: TestInput = { availableTags: ['SSR'], tagsSpec: [{ name: 'SSR', group: 'Remix' }] };
    const originalInput = JSON.parse(JSON.stringify(input));

    // Act
    groupTags(input.availableTags, input.tagsSpec as TagSpec[]);

    // Assert: Input data should not be mutated
    expect(input).toEqual(originalInput);
  });
});