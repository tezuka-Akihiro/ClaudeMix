import { getAllPosts } from './app/generated/blog-posts.ts';
import { loadPostsSpec } from './app/data-io/blog/posts/loadPostsSpec.server.ts';
import { groupTags } from './app/lib/blog/posts/groupTagsByCategory.ts';

// 記事からタグを抽出
const allPosts = getAllPosts();
const allTags = allPosts.flatMap(post => post.frontmatter.tags || []);
const uniqueTags = Array.from(new Set(allTags)).sort();

console.log('=== 実際に記事で使用されているタグ ===');
console.log(uniqueTags);
console.log('');

// specを読み込み
const spec = loadPostsSpec();

console.log('=== spec.yamlで定義されているタグ ===');
spec.tags.current.forEach(tag => {
  console.log(`- ${tag.name} (group: ${tag.group})`);
});
console.log('');

// グループ化
const tagGroups = groupTags(uniqueTags, spec.tags.current, spec.tag_groups.order);

console.log('=== グループ化されたタグ（フィルターに表示） ===');
tagGroups.forEach(group => {
  console.log(`${group.group}:`, group.tags);
});
console.log('');

// Playwrightとtestingの状態を確認
console.log('=== Playwright と testing の状態 ===');
console.log('Playwrightが記事で使用されている:', uniqueTags.includes('Playwright'));
console.log('testingが記事で使用されている:', uniqueTags.includes('testing'));
console.log('Playwrightがspecに定義されている:', spec.tags.current.some(t => t.name === 'Playwright'));
console.log('testingがspecに定義されている:', spec.tags.current.some(t => t.name === 'testing'));
