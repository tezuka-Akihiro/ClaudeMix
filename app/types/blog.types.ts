// app/types/blog.types.ts

export interface TagSpec {
  name: string;
  category: 'technical' | 'nature';
  group: 'Remix' | 'Cloudflare' | 'Claude Code' | 'other';
  description: string;
}

export interface BlogPostsSpec {
  tags: {
    current: TagSpec[];
  };
  // ... 他のspec定義
}