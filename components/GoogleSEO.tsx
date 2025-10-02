import React, { useEffect } from 'react';

interface GoogleSEOProps {
  googleAnalyticsId?: string;
  googleSearchConsoleId?: string;
  googleTagManagerId?: string;
}

export const GoogleSEO: React.FC<GoogleSEOProps> = ({
  googleAnalyticsId = 'G-XXXXXXXXXX', // Replace with your actual GA4 ID
  googleSearchConsoleId = 'google-site-verification-code', // Replace with your verification code
  googleTagManagerId = 'GTM-XXXXXXX' // Replace with your GTM ID
}) => {
  useEffect(() => {
    // Google Analytics 4 (GA4)
    if (googleAnalyticsId && googleAnalyticsId !== 'G-XXXXXXXXXX') {
      // Load GA4 script
      const gaScript = document.createElement('script');
      gaScript.async = true;
      gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`;
      document.head.appendChild(gaScript);

      // Initialize GA4
      const gaConfigScript = document.createElement('script');
      gaConfigScript.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${googleAnalyticsId}', {
          page_title: document.title,
          page_location: window.location.href
        });
      `;
      document.head.appendChild(gaConfigScript);

      // Make gtag available globally for tracking events
      (window as any).gtag = (window as any).gtag || function() {
        ((window as any).dataLayer = (window as any).dataLayer || []).push(arguments);
      };
    }

    // Google Tag Manager
    if (googleTagManagerId && googleTagManagerId !== 'GTM-XXXXXXX') {
      // GTM Head script
      const gtmScript = document.createElement('script');
      gtmScript.innerHTML = `
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${googleTagManagerId}');
      `;
      document.head.appendChild(gtmScript);

      // GTM Body noscript (add to body)
      const gtmNoscript = document.createElement('noscript');
      gtmNoscript.innerHTML = `
        <iframe src="https://www.googletagmanager.com/ns.html?id=${googleTagManagerId}"
        height="0" width="0" style="display:none;visibility:hidden"></iframe>
      `;
      document.body.insertBefore(gtmNoscript, document.body.firstChild);
    }

    // Google Search Console verification
    if (googleSearchConsoleId && googleSearchConsoleId !== 'google-site-verification-code') {
      let verificationMeta = document.querySelector('meta[name="google-site-verification"]') as HTMLMetaElement;
      if (!verificationMeta) {
        verificationMeta = document.createElement('meta');
        verificationMeta.name = 'google-site-verification';
        document.head.appendChild(verificationMeta);
      }
      verificationMeta.content = googleSearchConsoleId;
    }

    // Additional SEO meta tags
    const additionalMetas = [
      { name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' },
      { name: 'googlebot', content: 'index, follow' },
      { name: 'bingbot', content: 'index, follow' },
      { name: 'format-detection', content: 'telephone=no' },
      { name: 'theme-color', content: '#6366f1' },
      { name: 'msapplication-TileColor', content: '#6366f1' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'default' }
    ];

    additionalMetas.forEach(meta => {
      let element = document.querySelector(`meta[name="${meta.name}"]`) as HTMLMetaElement;
      if (!element) {
        element = document.createElement('meta');
        element.name = meta.name;
        document.head.appendChild(element);
      }
      element.content = meta.content;
    });

  }, [googleAnalyticsId, googleSearchConsoleId, googleTagManagerId]);

  return null; // This component doesn't render anything
};

// Helper functions for tracking events
export const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, parameters);
  }
};

export const trackPageView = (pageTitle: string, pagePath: string) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('config', 'GA_MEASUREMENT_ID', {
      page_title: pageTitle,
      page_location: window.location.origin + pagePath
    });
  }
};

// Blog-specific tracking functions
export const trackBlogPostView = (postId: string, postTitle: string, category?: string) => {
  trackEvent('blog_post_view', {
    post_id: postId,
    post_title: postTitle,
    category: category,
    content_type: 'blog_post'
  });
};

export const trackBlogPostLike = (postId: string, postTitle: string) => {
  trackEvent('blog_post_like', {
    post_id: postId,
    post_title: postTitle,
    content_type: 'blog_post'
  });
};

export const trackBlogCategoryFilter = (category: string) => {
  trackEvent('blog_category_filter', {
    category: category,
    content_type: 'blog_filter'
  });
};

export const trackBlogSearch = (searchQuery: string, resultsCount: number) => {
  trackEvent('blog_search', {
    search_term: searchQuery,
    results_count: resultsCount,
    content_type: 'blog_search'
  });
};

// E-commerce tracking for subscription events
export const trackSubscription = (tierId: string, tierName: string, price: number) => {
  trackEvent('purchase', {
    transaction_id: `sub_${Date.now()}`,
    value: price,
    currency: 'USD',
    items: [{
      item_id: tierId,
      item_name: tierName,
      category: 'subscription',
      quantity: 1,
      price: price
    }]
  });
};

// AI generation tracking
export const trackAIGeneration = (featureType: string, templateId?: string) => {
  trackEvent('ai_generation', {
    feature_type: featureType,
    template_id: templateId,
    content_type: 'ai_generation'
  });
};

// User engagement tracking
export const trackUserEngagement = (action: string, element: string) => {
  trackEvent('user_engagement', {
    action: action,
    element: element,
    timestamp: new Date().toISOString()
  });
};

