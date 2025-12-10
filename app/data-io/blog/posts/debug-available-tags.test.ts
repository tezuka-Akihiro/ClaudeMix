import { describe, it, expect } from 'vitest';
import { fetchAvailableFilters } from './fetchAvailableFilters.server';

describe('Debug Available Tags', () => {
  it('should show all available tags and tag groups', async () => {
    const filters = await fetchAvailableFilters();

    console.log('\n=== Available Categories ===');
    console.log(filters.categories);

    console.log('\n=== Available Tags (sorted) ===');
    console.log(filters.tags);

    console.log('\n=== Tag Groups ===');
    filters.tagGroups.forEach(group => {
      console.log(`${group.group}:`, group.tags);
    });

    // Check if Playwright and Vitest are in available tags
    expect(filters.tags).toContain('Playwright');
    expect(filters.tags).toContain('Vitest');
  });
});
