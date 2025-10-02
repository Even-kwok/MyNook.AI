import React from 'react';
import type { BlogSEOMeta } from '../types/blog';

interface SEOHeadProps {
  meta: BlogSEOMeta;
}

export const SEOHead: React.FC<SEOHeadProps> = ({ meta }) => {
  React.useEffect(() => {
    // Update document title
    document.title = meta.title;

    // Update meta tags
    const updateMetaTag = (name: string, content: string) => {
      let element = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
      if (!element) {
        element = document.createElement('meta');
        element.name = name;
        document.head.appendChild(element);
      }
      element.content = content;
    };

    const updatePropertyTag = (property: string, content: string) => {
      let element = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute('property', property);
        document.head.appendChild(element);
      }
      element.content = content;
    };

    // Basic meta tags
    updateMetaTag('description', meta.description);
    if (meta.keywords) {
      updateMetaTag('keywords', meta.keywords);
    }

    // Open Graph tags
    updatePropertyTag('og:title', meta.ogTitle || meta.title);
    updatePropertyTag('og:description', meta.ogDescription || meta.description);
    updatePropertyTag('og:type', 'article');
    if (meta.ogImage) {
      updatePropertyTag('og:image', meta.ogImage);
    }
    if (meta.ogUrl) {
      updatePropertyTag('og:url', meta.ogUrl);
    }

    // Twitter Card tags
    updateMetaTag('twitter:card', meta.twitterCard || 'summary_large_image');
    updateMetaTag('twitter:title', meta.twitterTitle || meta.title);
    updateMetaTag('twitter:description', meta.twitterDescription || meta.description);
    if (meta.twitterImage) {
      updateMetaTag('twitter:image', meta.twitterImage);
    }

    // Canonical URL
    if (meta.canonical) {
      let canonicalElement = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!canonicalElement) {
        canonicalElement = document.createElement('link');
        canonicalElement.rel = 'canonical';
        document.head.appendChild(canonicalElement);
      }
      canonicalElement.href = meta.canonical;
    }

    // Structured Data (JSON-LD)
    if (meta.structuredData) {
      let scriptElement = document.querySelector('script[type="application/ld+json"]') as HTMLScriptElement;
      if (!scriptElement) {
        scriptElement = document.createElement('script');
        scriptElement.type = 'application/ld+json';
        document.head.appendChild(scriptElement);
      }
      scriptElement.textContent = JSON.stringify(meta.structuredData);
    }

    // Additional SEO meta tags
    updateMetaTag('robots', 'index, follow');
    updateMetaTag('author', 'AI Studio Team');
    updateMetaTag('viewport', 'width=device-width, initial-scale=1.0');
    
    // Language and locale
    document.documentElement.lang = 'en';
    updatePropertyTag('og:locale', 'en_US');

  }, [meta]);

  return null; // This component doesn't render anything
};

// Helper function to generate structured data for blog posts
export const generateBlogPostStructuredData = (post: any, siteUrl: string) => {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.excerpt || post.meta_description,
    "image": post.featured_image_url ? [post.featured_image_url] : undefined,
    "datePublished": post.published_at,
    "dateModified": post.updated_at,
    "author": {
      "@type": "Person",
      "name": post.author_name || "AI Studio Team",
      "url": `${siteUrl}/author/${post.author_id}`
    },
    "publisher": {
      "@type": "Organization",
      "name": "AI Studio",
      "logo": {
        "@type": "ImageObject",
        "url": `${siteUrl}/logo.png`
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${siteUrl}/blog/${post.slug}`
    },
    "articleSection": post.category_name,
    "keywords": post.meta_keywords || post.tag_names?.join(', '),
    "wordCount": post.content ? post.content.split(' ').length : undefined,
    "url": `${siteUrl}/blog/${post.slug}`
  };
};

// Helper function to generate structured data for blog list page
export const generateBlogListStructuredData = (posts: any[], siteUrl: string) => {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "AI Studio Blog",
    "description": "Latest insights, tutorials, and updates about AI-powered interior design",
    "url": `${siteUrl}/blog`,
    "publisher": {
      "@type": "Organization",
      "name": "AI Studio",
      "logo": {
        "@type": "ImageObject",
        "url": `${siteUrl}/logo.png`
      }
    },
    "blogPost": posts.map(post => ({
      "@type": "BlogPosting",
      "headline": post.title,
      "description": post.excerpt,
      "url": `${siteUrl}/blog/${post.slug}`,
      "datePublished": post.published_at,
      "author": {
        "@type": "Person",
        "name": post.author_name || "AI Studio Team"
      }
    }))
  };
};

// Helper function to generate breadcrumb structured data
export const generateBreadcrumbStructuredData = (breadcrumbs: Array<{name: string, url: string}>) => {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": crumb.url
    }))
  };
};

