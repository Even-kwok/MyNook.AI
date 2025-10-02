import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBlogPosts, useBlogCategories, useBlogTags, useBlogStats, useBlogManagement } from '../../hooks/useBlog';
import type { BlogPostDetailed, CreateBlogPostData, UpdateBlogPostData } from '../../types/blog';
import { supabase } from '../../lib/supabase';

interface BlogManagerProps {
  onClose: () => void;
}

export const BlogManager: React.FC<BlogManagerProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'posts' | 'categories' | 'tags' | 'stats'>('posts');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPostDetailed | null>(null);

  const { posts, loading: postsLoading, refetch: refetchPosts } = useBlogPosts({ 
    // Pass empty object to indicate admin view (show all posts)
  }); // Show all posts in admin by passing empty params object
  const { categories } = useBlogCategories();
  const { tags } = useBlogTags();
  const { stats } = useBlogStats();
  const { createPost, updatePost, deletePost, loading: managementLoading, error: managementError } = useBlogManagement();

  const handleCreatePost = async (postData: CreateBlogPostData) => {
    try {
      console.log('=== Blog Post Creation Debug ===');
      console.log('Creating post with data:', postData);
      console.log('Categories available:', categories);
      console.log('Management error before create:', managementError);
      
      // Check authentication status
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('Current user:', user);
      console.log('Auth error:', authError);
      
      if (!user) {
        alert('❌ Authentication Error: You are not logged in. Please refresh the page and try again.');
        return;
      }
      
      const result = await createPost(postData);
      console.log('Create result:', result);
      console.log('Management error after create:', managementError);
      
      if (result) {
        setShowCreateModal(false);
        refetchPosts();
        alert('✅ Post created successfully!');
      } else {
        const errorMsg = managementError || 'Unknown error occurred';
        console.error('Create post failed with error:', errorMsg);
        alert(`❌ Failed to create post: ${errorMsg}\n\nPlease check the browser console for more details.`);
      }
    } catch (err) {
      console.error('Error in handleCreatePost:', err);
      alert('❌ Error creating post: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleUpdatePost = async (postData: UpdateBlogPostData) => {
    const result = await updatePost(postData);
    if (result) {
      setEditingPost(null);
      refetchPosts();
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      const result = await deletePost(postId);
      if (result) {
        refetchPosts();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">📝 Blog Management</h2>
            <p className="text-slate-600 mt-1">Manage your blog posts, categories, and tags</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          {[
            { key: 'posts', label: 'Posts', icon: '📄' },
            { key: 'categories', label: 'Categories', icon: '📁' },
            { key: 'tags', label: 'Tags', icon: '🏷️' },
            { key: 'stats', label: 'Statistics', icon: '📊' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === tab.key
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'posts' && (
            <PostsTab
              posts={posts}
              loading={postsLoading}
              onCreatePost={() => setShowCreateModal(true)}
              onEditPost={setEditingPost}
              onDeletePost={handleDeletePost}
            />
          )}
          {activeTab === 'categories' && (
            <CategoriesTab categories={categories} />
          )}
          {activeTab === 'tags' && (
            <TagsTab tags={tags} />
          )}
          {activeTab === 'stats' && (
            <StatsTab stats={stats} />
          )}
        </div>

        {/* Create/Edit Modal */}
        <AnimatePresence>
          {(showCreateModal || editingPost) && (
            <BlogPostModal
              post={editingPost}
              categories={categories}
              tags={tags}
              onSave={editingPost ? handleUpdatePost : handleCreatePost}
              onClose={() => {
                setShowCreateModal(false);
                setEditingPost(null);
              }}
              loading={managementLoading}
              error={managementError}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

// Posts Tab Component
const PostsTab: React.FC<{
  posts: BlogPostDetailed[];
  loading: boolean;
  onCreatePost: () => void;
  onEditPost: (post: BlogPostDetailed) => void;
  onDeletePost: (postId: string) => void;
}> = ({ posts, loading, onCreatePost, onEditPost, onDeletePost }) => {
  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Blog Posts</h3>
          <p className="text-slate-600">Manage all your blog posts</p>
        </div>
        <button
          onClick={onCreatePost}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Post
        </button>
      </div>

      {/* Posts List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No blog posts yet</h3>
            <p className="text-slate-600 mb-4">Create your first blog post to get started</p>
            <button
              onClick={onCreatePost}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Create First Post
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-slate-900">{post.title}</h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        post.status === 'published' 
                          ? 'bg-green-100 text-green-800'
                          : post.status === 'draft'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {post.status}
                      </span>
                      {post.category_name && (
                        <span 
                          className="px-2 py-1 text-xs font-medium rounded-full text-white"
                          style={{ backgroundColor: post.category_color }}
                        >
                          {post.category_name}
                        </span>
                      )}
                    </div>
                    {post.excerpt && (
                      <p className="text-slate-600 text-sm mb-2 line-clamp-2">{post.excerpt}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>👁️ {post.view_count} views</span>
                      <span>❤️ {post.like_count} likes</span>
                      <span>📅 {new Date(post.created_at).toLocaleDateString()}</span>
                      {post.author_name && <span>✍️ {post.author_name}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => onEditPost(post)}
                      className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Edit post"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDeletePost(post.id)}
                      className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete post"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Categories Tab Component
const CategoriesTab: React.FC<{ categories: any[] }> = ({ categories }) => {
  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Blog Categories</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <div key={category.id} className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: category.color }}
              ></div>
              <h4 className="font-medium text-slate-900">{category.display_name}</h4>
            </div>
            {category.description && (
              <p className="text-slate-600 text-sm">{category.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Tags Tab Component
const TagsTab: React.FC<{ tags: any[] }> = ({ tags }) => {
  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Blog Tags</h3>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag.id}
            className="px-3 py-1 text-sm font-medium rounded-full text-white flex items-center gap-2"
            style={{ backgroundColor: tag.color }}
          >
            {tag.display_name}
            <span className="bg-white bg-opacity-20 px-1.5 py-0.5 rounded-full text-xs">
              {tag.usage_count}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
};

// Stats Tab Component
const StatsTab: React.FC<{ stats: any }> = ({ stats }) => {
  if (!stats) return <div className="p-6">Loading stats...</div>;

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-6">Blog Statistics</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg">
          <div className="text-3xl font-bold">{stats.published_posts}</div>
          <div className="text-blue-100">Published Posts</div>
        </div>
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white p-6 rounded-lg">
          <div className="text-3xl font-bold">{stats.draft_posts}</div>
          <div className="text-yellow-100">Draft Posts</div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg">
          <div className="text-3xl font-bold">{stats.total_views}</div>
          <div className="text-green-100">Total Views</div>
        </div>
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-lg">
          <div className="text-3xl font-bold">{stats.total_likes}</div>
          <div className="text-red-100">Total Likes</div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg">
          <div className="text-3xl font-bold">{stats.active_categories}</div>
          <div className="text-purple-100">Categories</div>
        </div>
        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white p-6 rounded-lg">
          <div className="text-3xl font-bold">{stats.active_tags}</div>
          <div className="text-indigo-100">Tags</div>
        </div>
      </div>
    </div>
  );
};

// Blog Post Modal Component
const BlogPostModal: React.FC<{
  post?: BlogPostDetailed | null;
  categories: any[];
  tags: any[];
  onSave: (data: CreateBlogPostData | UpdateBlogPostData) => void;
  onClose: () => void;
  loading: boolean;
  error?: string | null;
}> = ({ post, categories, tags, onSave, onClose, loading, error }) => {
  console.log('BlogPostModal - Categories received:', categories);
  console.log('BlogPostModal - Tags received:', tags);
  const [formData, setFormData] = useState({
    title: post?.title || '',
    subtitle: post?.subtitle || '',
    excerpt: post?.excerpt || '',
    content: post?.content || '',
    featured_image_url: post?.featured_image_url || '',
    category_id: post?.category_id || '',
    meta_title: post?.meta_title || '',
    meta_description: post?.meta_description || '',
    meta_keywords: post?.meta_keywords || '',
    status: post?.status || 'draft' as 'draft' | 'published',
    tag_ids: [] as string[]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (post) {
      onSave({ ...formData, id: post.id });
    } else {
      onSave(formData);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-xl font-bold text-slate-900">
            {post ? 'Edit Post' : 'Create New Post'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error creating post</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          {/* Subtitle */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Subtitle
            </label>
            <input
              type="text"
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Excerpt
            </label>
            <textarea
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Content (Markdown) *
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={12}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
              required
            />
          </div>

          {/* Featured Image */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Featured Image URL
            </label>
            <input
              type="url"
              value={formData.featured_image_url}
              onChange={(e) => setFormData({ ...formData, featured_image_url: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Category and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Category
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select category</option>
                {categories && categories.length > 0 ? (
                  categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.display_name}
                    </option>
                  ))
                ) : (
                  <option disabled>Loading categories...</option>
                )}
              </select>
              {/* Debug info */}
              <div className="text-xs text-gray-500 mt-1">
                Categories: {categories ? categories.length : 0} loaded
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'published' })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>

          {/* SEO Fields */}
          <div className="border-t border-slate-200 pt-6">
            <h4 className="text-lg font-medium text-slate-900 mb-4">SEO Settings</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Meta Title (60 chars max)
                </label>
                <input
                  type="text"
                  value={formData.meta_title}
                  onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                  maxLength={60}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <div className="text-xs text-slate-500 mt-1">
                  {formData.meta_title.length}/60 characters
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Meta Description (160 chars max)
                </label>
                <textarea
                  value={formData.meta_description}
                  onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                  maxLength={160}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <div className="text-xs text-slate-500 mt-1">
                  {formData.meta_description.length}/160 characters
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Meta Keywords (comma separated)
                </label>
                <input
                  type="text"
                  value={formData.meta_keywords}
                  onChange={(e) => setFormData({ ...formData, meta_keywords: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="keyword1, keyword2, keyword3"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
              )}
              {post ? 'Update Post' : 'Create Post'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};
