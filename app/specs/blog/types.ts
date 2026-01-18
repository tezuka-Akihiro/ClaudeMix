// app/types/blog.types.ts

export interface TagSpec {
  name: string;
  category: 'technical' | 'nature';
  group: 'Remix' | 'Cloudflare' | 'Claude Code' | 'other' | '起業';
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
    load_more: {
      posts_per_load: number;
      initial_load: number;
    };
    display: {
      max_tags_per_card: number;
      default_category_emoji: string;
    };
  };
  access_control: {
    public_categories: string[];
  };
  posts_config: {
    page_title: string;
    posts_directory: string;
    frontmatter_fields: string[];
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
  hasMermaid: boolean;
  content: string;
  visibleContent: string;
  hiddenContent: string;
  headings: Heading[];
  freeContentHeading?: string | null;
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
  siteUrl: string;
  siteName: string;
}

/**
 * ナビゲーションメニューの項目
 */
export interface MenuItem {
  label: string;
  path: string;
}

/**
 * フッターリンクの項目
 */
export interface FooterLink {
  label: string;
  href?: string;
  isModal: boolean;
}

/**
 * 追加読み込み（Load More）に関するすべての情報を持つ基底の型
 */
export interface LoadMoreInfo {
  loadedCount: number;
  totalPosts: number;
  hasMore: boolean;
  postsPerLoad: number;
}

/**
 * 記事の見出し情報
 * h2〜h4（##〜####）を対象とし、目次表示およびペイウォール区切り指定に使用
 */
export interface Heading {
  level: 2 | 3 | 4;
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
  loadMoreInfo: Pick<LoadMoreInfo, 'loadedCount' | 'hasMore'>;
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
    home_path: string;
    site_url: string;
  };
  navigation: {
    menu_items: MenuItem[];
    animation: {
      fade_duration_ms: number;
      transition_timing: string;
    };
  };
  footer: {};
  theme: {
    modes: string[];
    default_mode: string;
    storage: {
      key: string;
    };
    html_attribute: {
      name: string;
      light_value: string;
      dark_value: string;
    };
    icons: {
      light: string;
      dark: string;
    };
  };
  accessibility: {
    aria_labels: {
      menu_button: string;
      menu_button_open: string;
      navigation_menu: string;
      close_menu: string;
      home_link: string;
      theme_toggle_button: string;
      theme_toggle_button_light: string;
      theme_toggle_button_dark: string;
      legal_modal_close: string;
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
      name: string;
      family: string;
      fetch: {
        apiUrl: string;
        userAgent: string;
        cacheName: string;
        contentType: string;
        cacheControl: string;
        urlRegex: string;
      };
    };
  };
}

/**
 * Landing page section types
 */

/**
 * CTAリンクの情報
 */
export interface CTALink {
  label: string;
  url: string;
  aria_label: string;
}

/**
 * 漫画アセットの情報
 */
export interface MangaAsset {
  fileName: string;
  path: string;
  order: number;
}

/**
 * ランディングページのコンテンツ情報
 */
export interface LandingContent {
  targetSlug: string;
  catchCopy: string;
  description: string;
  ctaButtonText: string;
  ctaLinks: CTALink[];
  mangaPanelCount: number;
}

/**
 * Landing section spec.yamlの型定義
 */
export interface BlogLandingSpec {
  metadata: {
    version: string;
    last_updated: string;
  };
  targets: {
    supported: string[];
    default: string;
  };
  colors: {
    primary: string;
    dark: string;
    accent: string;
  };
  animation: {
    viewport_threshold: number;
    duration_ms: number;
    easing: string;
    types: string[];
  };
  cta: {
    buttons: CTALink[];
  };
  performance: {
    critical_css_inline: boolean;
    image_format: string;
    lazy_load: boolean;
  };
  accessibility: {
    aria_labels: {
      hero_section: string;
      scroll_section: string;
      manga_panel_grid: string;
      cta_section: string;
      landing_footer: string;
    };
  };
  business_rules: {
    manga_panel_count: {
      hero_min: number;
      hero_max: number;
      total_max: number;
    };
  };
  footer: {
    legal_links: Array<{
      label: string;
      href?: string;
      is_modal: boolean;
    }>;
    legal_content: string;
  };
}