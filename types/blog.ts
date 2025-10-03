// ===================================================================
// Blog System TypeScript Types
// ===================================================================

export interface BlogCategory {
  id: string;
  category_key: string;
  display_name: string;
  description?: string;
  color: string;
  icon?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BlogTag {
  id: string;
  tag_key: string;
  display_name: string;
  color: string;
  usage_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  excerpt?: string;
  content: string;
  featured_image_url?: string;
  category_id?: string;
  author_id?: string;
  
  // SEO fields
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  canonical_url?: string;
  
  // Status and publishing
  status: 'draft' | 'published' | 'archived';
  published_at?: string;
  scheduled_at?: string;
  
  // Statistics
  view_count: number;
  like_count: number;
  comment_count: number;
  
  // Multi-language
  language: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface BlogPostDetailed extends BlogPost {
  category_name?: string;
  category_color?: string;
  author_email?: string;
  author_name?: string;
  tag_names?: string[];
  tag_colors?: string[];
}

export interface BlogPostTag {
  id: string;
  post_id: string;
  tag_id: string;
  created_at: string;
}

export interface BlogPostView {
  id: string;
  post_id: string;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  referrer?: string;
  viewed_at: string;
}

export interface BlogPostLike {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface BlogStats {
  published_posts: number;
  draft_posts: number;
  active_categories: number;
  active_tags: number;
  total_views: number;
  total_likes: number;
}

// Form types for creating/editing
export interface CreateBlogPostData {
  title: string;
  subtitle?: string;
  excerpt?: string;
  content: string;
  featured_image_url?: string;
  category_id?: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  canonical_url?: string;
  status: 'draft' | 'published';
  scheduled_at?: string;
  language?: string;
  tag_ids?: string[];
}

export interface UpdateBlogPostData extends Partial<CreateBlogPostData> {
  id: string;
}

export interface CreateBlogCategoryData {
  category_key: string;
  display_name: string;
  description?: string;
  color?: string;
  icon?: string;
  display_order?: number;
}

export interface CreateBlogTagData {
  tag_key: string;
  display_name: string;
  color?: string;
}

// SEO Meta data interface
export interface BlogSEOMeta {
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  twitterCard?: 'summary' | 'summary_large_image';
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  structuredData?: any; // JSON-LD structured data
}

// Blog search and filter types
export interface BlogSearchParams {
  query?: string;
  category?: string;
  tags?: string[];
  status?: 'draft' | 'published' | 'archived';
  author?: string;
  language?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'created_at' | 'published_at' | 'updated_at' | 'view_count' | 'like_count';
  sortOrder?: 'asc' | 'desc';
}

export interface BlogSearchResult {
  posts: BlogPostDetailed[];
  total: number;
  hasMore: boolean;
}

// Blog analytics types
export interface BlogAnalytics {
  totalViews: number;
  totalLikes: number;
  totalPosts: number;
  viewsThisMonth: number;
  likesThisMonth: number;
  postsThisMonth: number;
  topPosts: Array<{
    id: string;
    title: string;
    views: number;
    likes: number;
  }>;
  topCategories: Array<{
    id: string;
    name: string;
    postCount: number;
    totalViews: number;
  }>;
  topTags: Array<{
    id: string;
    name: string;
    usageCount: number;
  }>;
}

// Blog RSS feed types
export interface BlogRSSItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  guid: string;
  author?: string;
  category?: string;
  enclosure?: {
    url: string;
    type: string;
    length: number;
  };
}

export interface BlogRSSFeed {
  title: string;
  description: string;
  link: string;
  language: string;
  lastBuildDate: string;
  items: BlogRSSItem[];
}

// Blog sitemap types
export interface BlogSitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

export interface BlogSitemap {
  urls: BlogSitemapUrl[];
}

