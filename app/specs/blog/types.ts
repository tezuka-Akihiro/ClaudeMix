// app/types/blog.types.ts

export interface TagSpec {
  name: string;
  category: 'technical' | 'nature';
  group: 'Remix' | 'Cloudflare' | 'Claude Code' | 'other';
  description: string;
}

export interface BlogPostsSpec {
  tags: TagSpec[];
  categories: Array<{
    id: number;
    name: string;
    emoji: string;
    description: string;
    use_case: string;
  }>;
  tag_groups: {
    order: string[];
  };
  business_rules: {
    pagination: {
      posts_per_page: number;
      default_page: number;
    };
    display: {
      max_tags_per_card: number;
      default_category_emoji: string;
    };
  };
}

export interface TagGroup {
  group: string;
  tags: string[];
}

/**
 * ブログ記事のすべての情報を持つ基底の型 (Single Source of Truth)
 * app/generated/blog-posts.ts の BlogPost をフラット化した構造。
 */
export interface Post {
  slug: string;
  title: string;
  publishedAt: string;
  summary: string;
  author: string;
  tags: string[];
  category: string;
  source: string | null;
  description?: string;
  testOnly: boolean;
  content: string;
  headings: Heading[];
}

/**
 * 記事一覧で利用する、Postから派生した型
 */
export type PostSummary = Pick<
  Post,
  'slug' | 'title' | 'publishedAt' | 'category' | 'description' | 'tags'
>;

/**
 * 記事をフィルタリングするためのオプション
 */
export interface FilterOptions {
  category?: string;
  tags?: string[];
}

/**
 * UIで利用可能なフィルターの選択肢（カテゴリ一覧、タグ一覧など）
 */
export interface AvailableFilters {
  categories: string[];
  tags: string[];
  tagGroups: TagGroup[];
}

/**
 * サイト全体の設定情報
 */
export interface BlogConfig {
  blogTitle: string;
  menuItems: MenuItem[];
  copyright: string;
}

/**
 * ナビゲーションメニューの項目
 */
export interface MenuItem {
  label: string;
  path: string;
}

/**
 * ページネーションに関するすべての情報を持つ基底の型
 */
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalPosts: number;
  postsPerPage: number;
  offset: number;
}

/**
 * 記事の見出し情報
 */
export interface Heading {
  level: 2;
  text: string;
  id: string;
}

/**
 * フィルター適用後の記事一覧データ
 */
export interface FilteredPostsResult {
  posts: PostSummary[];
  total: number;
}

/**
 * 記事一覧ページ（PostsSection）で利用するすべてのデータ
 */
export interface PostsPageData {
  posts: PostSummary[];
  pagination: Pick<PaginationInfo, 'currentPage' | 'totalPages'>;
  availableFilters: AvailableFilters;
  selectedFilters: FilterOptions;
  categorySpec: {
    categories: Array<{ name: string; emoji: string }>;
    defaultEmoji: string;
  };
}

/**
 * 記事詳細ページでレンダリングするための記事データ
 * Post型のcontent(markdown)をhtmlContent(html)に置き換えたもの
 */
export type RenderedPost = Omit<Post, 'content' | 'summary' | 'testOnly'> & {
  htmlContent: string;
};

/**
 * Blog commonセクションのspec.yamlの型定義
 */
export interface BlogCommonSpec {
  blog_config: {
    title: string;
    copyright: string;
    home_path: string;
  };
  navigation: {
    menu_items: MenuItem[];
    animation: {
      fade_duration_ms: number;
      transition_timing: string;
    };
  };
  ogp: {
    image: {
      width: number;
      height: number;
      format: string;
    };
    cache: {
      maxAge: number;
      directive: string;
    };
    layout: {
      paddingX: string;
      paddingY: string;
      contentGap: string;
    };
    colors: {
      background: {
        gradientStart: string;
        gradientEnd: string;
        gradientAngle: string;
      };
      text: {
        primary: string;
        description: string;
        author: string;
      };
    };
    title: {
      maxLength: number;
      fontSize: number;
      maxLines: number;
    };
    description: {
      maxLength: number;
      fontSize: number;
      maxLines: number;
    };
    author: {
      fontSize: number;
      prefix: string;
    };
    font: {
      family: string;
    };
  };
}