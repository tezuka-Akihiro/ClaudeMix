// app/lib/blog/posts/groupTagsByCategory.ts

import type { TagSpec } from '~/specs/blog/types';

export type TagGroup = {
  group: string;
  tags: string[];
};

const GROUP_ORDER = ['Remix', 'Cloudflare', 'Claude Code', 'other'];

/**
 * タグをグループごとに分類し、定義された順序でソートする純粋関数
 * @param availableTags - 記事から抽出された利用可能なタグの配列
 * @param tagsSpec - spec.yamlから読み込んだタグの定義
 * @returns グループ化およびソートされたタグの配列
 */
export function groupTags(
  availableTags: string[],
  tagsSpec: TagSpec[],
): TagGroup[] {
  const availableTagSet = new Set(availableTags);
  const groups = new Map<string, string[]>();

  for (const tag of tagsSpec) {
    if (availableTagSet.has(tag.name)) {
      if (!groups.has(tag.group)) {
        groups.set(tag.group, []);
      }
      groups.get(tag.group)!.push(tag.name);
    }
  }

  return GROUP_ORDER.filter(groupName => groups.has(groupName)).map(groupName => ({
    group: groupName,
    tags: groups.get(groupName)!,
  }));
}