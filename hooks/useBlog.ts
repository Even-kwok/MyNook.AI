import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { 
  BlogPost, 
  BlogPostDetailed, 
  BlogCategory, 
  BlogTag, 
  BlogStats,
  CreateBlogPostData,
  UpdateBlogPostData,
  BlogSearchParams,
  BlogSearchResult
} from '../types/blog';

// ===================================================================
// Blog Posts Hooks
// ===================================================================

export const useBlogPosts = (params?: BlogSearchParams) => {
  const [posts, setPosts] = useState<BlogPostDetailed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('=== useBlogPosts Debug ===');
      console.log('Params:', params);

      // Check if blog tables exist by trying to query them
      let query = supabase
        .from('blog_posts_detailed')
        .select('*', { count: 'exact' });

      // Apply filters
      if (params?.status !== undefined) {
        console.log('Filtering by status:', params.status);
        query = query.eq('status', params.status);
      } else if (!params) {
        console.log('No params provided, showing only published posts');
        // Default to published posts for public view (when no params provided)
        query = query.eq('status', 'published');
      } else {
        console.log('Params provided but no status filter, showing all posts');
      }
      // If params is provided but status is undefined, show all posts (for admin)

      if (params?.category) {
        query = query.eq('category_id', params.category);
      }

      if (params?.author) {
        query = query.eq('author_id', params.author);
      }

      if (params?.language) {
        query = query.eq('language', params.language);
      }

      if (params?.query) {
        query = query.or(`title.ilike.%${params.query}%,content.ilike.%${params.query}%,excerpt.ilike.%${params.query}%`);
      }

      // Apply sorting
      const sortBy = params?.sortBy || 'published_at';
      const sortOrder = params?.sortOrder || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      if (params?.limit) {
        query = query.limit(params.limit);
      }
      if (params?.offset) {
        query = query.range(params.offset, params.offset + (params.limit || 10) - 1);
      }

      const { data, error: fetchError, count } = await query;

      console.log('Query result:', { data, error: fetchError, count });
      console.log('Posts found:', data?.length || 0);

      if (fetchError) throw fetchError;

      setPosts(data || []);
      setTotal(count || 0);
    } catch (err) {
      console.warn('Blog posts fetch failed (tables may not exist yet):', err);
      setError(err instanceof Error ? err.message : 'Blog tables not set up yet');
      setPosts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [JSON.stringify(params)]);

  return { posts, loading, error, total, refetch: fetchPosts };
};

export const useBlogPost = (slug: string) => {
  const [post, setPost] = useState<BlogPostDetailed | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPost = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('blog_posts_detailed')
        .select('*')
        .eq('slug', slug)
        .single();

      if (fetchError) throw fetchError;

      setPost(data);

      // Record view if post is published
      if (data?.status === 'published') {
        await recordView(data.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch blog post');
    } finally {
      setLoading(false);
    }
  };

  const recordView = async (postId: string) => {
    try {
      // Get user agent and referrer
      const userAgent = navigator.userAgent;
      const referrer = document.referrer;

      await supabase
        .from('blog_post_views')
        .insert({
          post_id: postId,
          user_agent: userAgent,
          referrer: referrer || null
        });

      // Update view count
      await supabase.rpc('increment_blog_post_views', { post_id: postId });
    } catch (err) {
      console.warn('Failed to record blog post view:', err);
    }
  };

  useEffect(() => {
    if (slug) {
      fetchPost();
    }
  }, [slug]);

  return { post, loading, error, refetch: fetchPost };
};

// ===================================================================
// Blog Categories Hooks
// ===================================================================

export const useBlogCategories = () => {
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('blog_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (fetchError) throw fetchError;

      setCategories(data || []);
    } catch (err) {
      console.warn('Blog categories fetch failed (tables may not exist yet):', err);
      setError(err instanceof Error ? err.message : 'Blog tables not set up yet');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return { categories, loading, error, refetch: fetchCategories };
};

// ===================================================================
// Blog Tags Hooks
// ===================================================================

export const useBlogTags = () => {
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTags = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('blog_tags')
        .select('*')
        .eq('is_active', true)
        .order('usage_count', { ascending: false });

      if (fetchError) throw fetchError;

      setTags(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch blog tags');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  return { tags, loading, error, refetch: fetchTags };
};

// ===================================================================
// Blog Stats Hook
// ===================================================================

export const useBlogStats = () => {
  const [stats, setStats] = useState<BlogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('blog_stats')
        .select('*')
        .single();

      if (fetchError) throw fetchError;

      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch blog stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return { stats, loading, error, refetch: fetchStats };
};

// ===================================================================
// Blog Management Hooks (Admin)
// ===================================================================

export const useBlogManagement = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPost = async (postData: CreateBlogPostData): Promise<BlogPost | null> => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Generate slug from title
      const slug = postData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Extract tag_ids from postData since it doesn't belong to blog_posts table
      const { tag_ids, ...blogPostData } = postData;

      const insertData = {
        ...blogPostData,
        slug,
        author_id: user.id,
        published_at: postData.status === 'published' ? new Date().toISOString() : null
      };

      console.log('Inserting blog post data:', insertData);

      const { data, error: createError } = await supabase
        .from('blog_posts')
        .insert(insertData)
        .select()
        .single();

      if (createError) {
        console.error('Supabase insert error:', createError);
        throw createError;
      }

      // Add tags if provided
      if (tag_ids && tag_ids.length > 0) {
        const tagInserts = tag_ids.map(tagId => ({
          post_id: data.id,
          tag_id: tagId
        }));

        await supabase
          .from('blog_post_tags')
          .insert(tagInserts);
      }

      return data;
    } catch (err) {
      console.error('Error creating blog post:', err);
      setError(err instanceof Error ? err.message : 'Failed to create blog post');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updatePost = async (postData: UpdateBlogPostData): Promise<BlogPost | null> => {
    try {
      setLoading(true);
      setError(null);

      const { id, tag_ids, ...updateData } = postData;

      // Update slug if title changed
      if (updateData.title) {
        updateData.slug = updateData.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      }

      // Set published_at if status changed to published
      if (updateData.status === 'published') {
        const { data: currentPost } = await supabase
          .from('blog_posts')
          .select('published_at')
          .eq('id', id)
          .single();

        if (!currentPost?.published_at) {
          updateData.published_at = new Date().toISOString();
        }
      }

      const { data, error: updateError } = await supabase
        .from('blog_posts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Update tags if provided
      if (tag_ids !== undefined) {
        // Remove existing tags
        await supabase
          .from('blog_post_tags')
          .delete()
          .eq('post_id', id);

        // Add new tags
        if (tag_ids.length > 0) {
          const tagInserts = tag_ids.map(tagId => ({
            post_id: id,
            tag_id: tagId
          }));

          await supabase
            .from('blog_post_tags')
            .insert(tagInserts);
        }
      }

      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update blog post');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deletePost = async (postId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', postId);

      if (deleteError) throw deleteError;

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete blog post');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = async (postId: string): Promise<boolean> => {
    try {
      setError(null);

      // Check if already liked
      const { data: existingLike } = await supabase
        .from('blog_post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (existingLike) {
        // Unlike
        await supabase
          .from('blog_post_likes')
          .delete()
          .eq('id', existingLike.id);

        await supabase.rpc('decrement_blog_post_likes', { post_id: postId });
        return false;
      } else {
        // Like
        await supabase
          .from('blog_post_likes')
          .insert({
            post_id: postId,
            user_id: (await supabase.auth.getUser()).data.user?.id
          });

        await supabase.rpc('increment_blog_post_likes', { post_id: postId });
        return true;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle like');
      return false;
    }
  };

  return {
    loading,
    error,
    createPost,
    updatePost,
    deletePost,
    toggleLike
  };
};
