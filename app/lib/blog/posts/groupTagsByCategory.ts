// app/lib/blog/posts/groupTagsByCategory.ts

import type { TagSpec, TagGroup } from '~/specs/blog/types';

/**
 * タグをグループごとに分類し、定義された順序でソートする純粋関数（spec値注入パターン）
 * @param availableTags - 記事から抽出された利用可能なタグの配列
 * @param tagsSpec - spec.yamlから読み込んだタグの定義
 * @param groupOrder - spec.yamlから読み込んだグループ表示順序
 * @returns グループ化およびソートされたタグの配列
 */
export function groupTags(
  availableTags: string[],
  tagsSpec: TagSpec[],
  groupOrder: string[]
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

  return groupOrder.filter(groupName => groups.has(groupName)).map(groupName => ({
    group: groupName,
    tags: groups.get(groupName)!,
  }));
}