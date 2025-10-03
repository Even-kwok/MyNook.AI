import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '../context/LanguageContext';
import { IconHeart, IconBookmark } from './Icons';
import { SEOHead, generateBlogListStructuredData } from './SEOHead';
import { useBlogPosts, useBlogCategories } from '../hooks/useBlog';
import type { BlogSEOMeta } from '../types/blog';

const blogPosts = [
    {
      id: 'post-1',
      imageUrl: 'https://storage.googleapis.com/aistudio-hosting/blog/blog_1.png',
      author: {
        name: 'AI Writer',
        avatarUrl: 'https://storage.googleapis.com/aistudio-hosting/blog/avatar.png'
      },
      titleKey: 'blog.post.post1.title',
      excerptKey: 'blog.post.post1.excerpt',
      tags: ["Minimalist", "Japandi", "Style Guide"],
      tagKeys: ['minimalist', 'japandi', 'style-guide'],
      readMoreLink: '#'
    },
    {
      id: 'post-2',
      imageUrl: 'https://storage.googleapis.com/aistudio-hosting/blog/blog_2.png',
      author: {
        name: 'AI Writer',
        avatarUrl: 'https://storage.googleapis.com/aistudio-hosting/blog/avatar.png'
      },
      titleKey: 'blog.post.post2.title',
      excerptKey: 'blog.post.post2.excerpt',
      tags: ["Small Spaces", "AI Design", "+1"],
      tagKeys: ['small-spaces', 'ai-design', 'plus-one'],
      readMoreLink: '#'
    },
    {
      id: 'post-3',
      imageUrl: 'https://storage.googleapis.com/aistudio-hosting/blog/blog_3.png',
      author: {
        name: 'AI Writer',
        avatarUrl: 'https://storage.googleapis.com/aistudio-hosting/blog/avatar.png'
      },
      titleKey: 'blog.post.post3.title',
      excerptKey: 'blog.post.post3.excerpt',
      tags: ["Lighting", "How-To", "Pro Tips"],
      tagKeys: ['lighting', 'how-to', 'pro-tips'],
      readMoreLink: '#'
    },
    {
      id: 'post-4',
      imageUrl: 'https://storage.googleapis.com/aistudio-hosting/blog/blog_4.png',
      author: {
        name: 'AI Writer',
        avatarUrl: 'https://storage.googleapis.com/aistudio-hosting/blog/avatar.png'
      },
      titleKey: 'blog.post.post4.title',
      excerptKey: 'blog.post.post4.excerpt',
      tags: ["Color Theory", "AI Tools", "Guides"],
      tagKeys: ['color-theory', 'ai-tools', 'guides'],
      readMoreLink: '#'
    }
];

const tags = [
    { key: 'all', nameKey: 'blog.tags.all' },
    { key: 'ai-tools-guide', nameKey: 'blog.tags.ai-tools-guide' },
    { key: 'api-development', nameKey: 'blog.tags.api-development' },
    { key: 'chat-guides', nameKey: 'blog.tags.chat-guides' },
    { key: 'model-comparison', nameKey: 'blog.tags.model-comparison' },
    { key: 'technical-skills', nameKey: 'blog.tags.technical-skills' },
    { key: 'image-generation', nameKey: 'blog.tags.image-generation' },
    { key: 'product-review', nameKey: 'blog.tags.product-review' },
    { key: 'optimization', nameKey: 'blog.tags.optimization' },
    { key: 'how-to', nameKey: 'blog.tags.how-to' },
];

export const BlogPage: React.FC = () => {
    const { t } = useTranslation();
    const [activeCategory, setActiveCategory] = useState('all');
    
    // Load data from database (with error handling)
    const { posts, loading: postsLoading, error: postsError } = useBlogPosts({
        status: 'published',
        category: activeCategory === 'all' ? undefined : activeCategory,
        sortBy: 'published_at',
        sortOrder: 'desc'
    });
    const { categories, loading: categoriesLoading, error: categoriesError } = useBlogCategories();

    // SEO Meta data
    const seoMeta: BlogSEOMeta = {
        title: 'AI Studio Blog - Interior Design Insights & Tutorials',
        description: 'Discover the latest trends, tips, and tutorials in AI-powered interior design. Learn how to transform your space with cutting-edge technology.',
        keywords: 'AI interior design, home decoration, design tutorials, interior design tips, AI tools, smart home design',
        canonical: `${window.location.origin}/blog`,
        ogTitle: 'AI Studio Blog - Transform Your Space with AI',
        ogDescription: 'Explore expert insights and tutorials on AI-powered interior design. Get inspired and learn new techniques.',
        ogImage: 'https://storage.googleapis.com/aistudio-hosting/blog/og-blog.png',
        ogUrl: `${window.location.origin}/blog`,
        twitterCard: 'summary_large_image',
        twitterTitle: 'AI Studio Blog - Interior Design Made Smart',
        twitterDescription: 'Discover AI-powered interior design tips, trends, and tutorials.',
        twitterImage: 'https://storage.googleapis.com/aistudio-hosting/blog/twitter-blog.png',
        structuredData: posts.length > 0 ? generateBlogListStructuredData(posts, window.location.origin) : undefined
    };

    // Determine if we should use database or fallback to hardcoded content
    // Only use hardcoded content if we have confirmed errors AND not loading
    const hasConfirmedErrors = (postsError || categoriesError) && !postsLoading && !categoriesLoading;
    const hasSuccessfulData = !postsError && !categoriesError && (posts.length > 0 || categories.length > 0);
    const useDatabaseContent = hasSuccessfulData || (!hasConfirmedErrors && (postsLoading || categoriesLoading));
    
    // Use database posts if available, otherwise fallback to hardcoded (only when confirmed no database)
    const displayPosts = (hasSuccessfulData || (postsLoading || categoriesLoading)) ? posts : blogPosts;
    
    // Filter posts based on active category
    const filteredPosts = activeCategory === 'all'
        ? displayPosts
        : displayPosts.filter(post => {
            if (hasSuccessfulData) {
                return post.category_id === activeCategory;
            } else {
                return post.tagKeys?.includes(activeCategory);
            }
        });

    // Create filter options based on available data
    const filterOptions = [
        { key: 'all', nameKey: 'blog.tags.all', name: 'All Posts' },
        ...(hasSuccessfulData && categories.length > 0 
            ? categories.map(cat => ({
                key: cat.id,
                nameKey: `blog.categories.${cat.category_key}`,
                name: cat.display_name
            }))
            : hasConfirmedErrors ? tags.map(tag => ({
                key: tag.key,
                nameKey: tag.nameKey,
                name: t(tag.nameKey)
            })) : []
        )
    ];

    return (
        <>
            <SEOHead meta={seoMeta} />
            <main className="flex-1 overflow-y-auto bg-slate-50 scrollbar-hide">
            <motion.section 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-indigo-50/50 py-16 sm:py-24 px-4 text-center"
            >
                <div className="container mx-auto max-w-4xl">
                    <p className="text-indigo-600 font-semibold">{t('blog.heroTitle')}</p>
                    <h1 className="mt-2 text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight">{t('blog.heroSubtitle')}</h1>
                    <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">{t('blog.heroDescription')}</p>
                </div>
            </motion.section>

            <section className="py-8">
                <div className="container mx-auto max-w-5xl flex justify-center flex-wrap gap-2 px-4">
                    {/* Show loading while checking database */}
                    {(categoriesLoading || postsLoading) ? (
                        <div className="flex items-center justify-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
                            <span className="ml-2 text-slate-600">Loading categories...</span>
                        </div>
                    ) : (
                        <>
                            {/* Show database error notice if there's an error */}
                            {hasConfirmedErrors && (
                                <div className="w-full mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <p className="text-sm text-yellow-800">
                                        📝 Blog database not set up yet. Showing demo content. 
                                        <span className="font-medium">Run the blog migrations to enable full functionality.</span>
                                    </p>
                                </div>
                            )}
                            
                            {filterOptions.map((option, index) => (
                                <motion.button
                                    key={option.key}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                    onClick={() => setActiveCategory(option.key)}
                                    className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                                        activeCategory === option.key 
                                        ? 'bg-indigo-600 text-white shadow' 
                                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                                    }`}
                                >
                                    {option.name}
                                </motion.button>
                            ))}
                        </>
                    )}
                </div>
            </section>

            <section className="pb-16 px-4">
                <div className="container mx-auto max-w-5xl">
                    <motion.div 
                        initial="hidden"
                        animate="visible"
                        variants={{
                            visible: { transition: { staggerChildren: 0.1 } }
                        }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-8"
                    >
                        {postsLoading ? (
                            <div className="col-span-full flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                                <span className="ml-4 text-slate-600">Loading blog posts...</span>
                            </div>
                        ) : filteredPosts.length === 0 ? (
                            <div className="col-span-full text-center py-12">
                                <div className="text-6xl mb-4">📝</div>
                                <h3 className="text-lg font-medium text-slate-900 mb-2">No blog posts found</h3>
                                <p className="text-slate-600">Try selecting a different category or check back later for new content.</p>
                            </div>
                        ) : (
                            filteredPosts.map(post => {
                                // Handle both database posts and hardcoded posts
                                const isDbPost = hasSuccessfulData && 'slug' in post;
                                const postTitle = isDbPost ? post.title : t(post.titleKey);
                                const postExcerpt = isDbPost ? post.excerpt : t(post.excerptKey);
                                const postImage = isDbPost ? post.featured_image_url : post.imageUrl;
                                const postTags = isDbPost ? post.tag_names || [] : post.tags;
                                const postLink = isDbPost ? `/blog/${post.slug}` : post.readMoreLink;
                                const authorName = isDbPost ? post.author_name || 'AI Studio Team' : post.author.name;
                                
                                return (
                                    <motion.div 
                                        key={post.id}
                                        variants={{
                                            hidden: { opacity: 0, y: 20 },
                                            visible: { opacity: 1, y: 0 }
                                        }}
                                        className="bg-white rounded-xl shadow-md overflow-hidden transition-shadow hover:shadow-xl flex flex-col"
                                    >
                                        <div className="aspect-video overflow-hidden">
                                            <img 
                                                src={postImage || 'https://via.placeholder.com/600x400?text=Blog+Post'} 
                                                alt={postTitle} 
                                                className="w-full h-full object-cover" 
                                            />
                                        </div>
                                        <div className="p-6 flex flex-col flex-grow">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                                                    <span className="text-xs font-semibold text-white">
                                                        {authorName[0]?.toUpperCase()}
                                                    </span>
                                                </div>
                                                <span className="text-sm font-semibold text-slate-800">{authorName}</span>
                                                {isDbPost && post.published_at && (
                                                    <span className="text-xs text-slate-500">
                                                        {new Date(post.published_at).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                            
                                            {/* Category badge for database posts */}
                                            {isDbPost && post.category_name && (
                                                <div className="mb-3">
                                                    <span 
                                                        className="inline-block px-2 py-1 text-xs font-medium rounded-full text-white"
                                                        style={{ backgroundColor: post.category_color || '#6366f1' }}
                                                    >
                                                        {post.category_name}
                                                    </span>
                                                </div>
                                            )}
                                            
                                            <h2 className="text-xl font-bold text-slate-900 leading-snug mb-2">{postTitle}</h2>
                                            {postExcerpt && (
                                                <p className="text-slate-600 text-sm flex-grow mb-4 line-clamp-3">{postExcerpt}</p>
                                            )}
                                            
                                            <div className="mt-4 flex flex-wrap gap-2">
                                                {postTags.slice(0, 3).map((tag, index) => (
                                                    <span key={index} className="bg-slate-100 text-slate-600 text-xs font-medium px-2.5 py-1 rounded-full">
                                                        {tag}
                                                    </span>
                                                ))}
                                                {postTags.length > 3 && (
                                                    <span className="bg-slate-100 text-slate-600 text-xs font-medium px-2.5 py-1 rounded-full">
                                                        +{postTags.length - 3} more
                                                    </span>
                                                )}
                                            </div>
                                            
                                            <div className="mt-6 pt-4 border-t border-slate-200 flex justify-between items-center">
                                                <a 
                                                    href={postLink} 
                                                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                                                >
                                                    Read More →
                                                </a>
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    {isDbPost && (
                                                        <>
                                                            <span className="flex items-center gap-1 text-xs">
                                                                <IconHeart className="w-4 h-4"/>
                                                                {post.like_count || 0}
                                                            </span>
                                                            <span className="flex items-center gap-1 text-xs">
                                                                👁️ {post.view_count || 0}
                                                            </span>
                                                        </>
                                                    )}
                                                    <button className="p-2 rounded-full hover:bg-slate-100 hover:text-red-500 transition-colors">
                                                        <IconHeart className="w-5 h-5"/>
                                                    </button>
                                                    <button className="p-2 rounded-full hover:bg-slate-100 hover:text-slate-700 transition-colors">
                                                        <IconBookmark className="w-5 h-5"/>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </motion.div>
                </div>
            </section>
        </main>
        </>
    );
};
