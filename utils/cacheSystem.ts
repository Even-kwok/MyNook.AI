/**
 * 智能缓存系统
 * 用于缓存模板、用户数据等，减少数据库查询时间
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

class SmartCache<T> {
  private cache = new Map<string, CacheItem<T>>();
  private defaultTTL: number;

  constructor(defaultTTL: number = 300000) { // 5分钟默认TTL
    this.defaultTTL = defaultTTL;
  }

  set(key: string, data: T, ttl?: number): void {
    const expiry = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry
    });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    // 清理过期项目
    this.cleanup();
    return this.cache.size;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }

  // 获取缓存统计信息
  getStats() {
    this.cleanup();
    return {
      size: this.cache.size,
      items: Array.from(this.cache.entries()).map(([key, item]) => ({
        key,
        age: Date.now() - item.timestamp,
        ttl: item.expiry - Date.now()
      }))
    };
  }
}

// 模板缓存
export const templateCache = new SmartCache<any>(600000); // 10分钟

// 用户会话缓存
export const userSessionCache = new SmartCache<any>(300000); // 5分钟

// 生图结果缓存（短期）
export const generationCache = new SmartCache<string>(60000); // 1分钟

/**
 * 模板缓存管理器
 */
export class TemplateCache {
  private static instance: TemplateCache;
  private cache = new SmartCache<any>(600000); // 10分钟

  static getInstance(): TemplateCache {
    if (!TemplateCache.instance) {
      TemplateCache.instance = new TemplateCache();
    }
    return TemplateCache.instance;
  }

  async getTemplate(templateId: string): Promise<any> {
    const cacheKey = `template_${templateId}`;
    
    // 尝试从缓存获取
    const cached = this.cache.get(cacheKey);
    if (cached) {
      console.log(`📦 Template cache hit: ${templateId}`);
      return cached;
    }

    // 缓存未命中，需要从数据库获取
    console.log(`🔍 Template cache miss: ${templateId}`);
    return null;
  }

  setTemplate(templateId: string, template: any): void {
    const cacheKey = `template_${templateId}`;
    this.cache.set(cacheKey, template);
    console.log(`💾 Template cached: ${templateId}`);
  }

  async getTemplates(templateIds: string[]): Promise<{ [key: string]: any }> {
    const result: { [key: string]: any } = {};
    const missingIds: string[] = [];

    // 检查缓存
    for (const id of templateIds) {
      const template = await this.getTemplate(id);
      if (template) {
        result[id] = template;
      } else {
        missingIds.push(id);
      }
    }

    return { cached: result, missing: missingIds };
  }

  preloadUserTemplates(userId: string, templates: any[]): void {
    console.log(`🚀 Preloading ${templates.length} templates for user ${userId}`);
    
    templates.forEach(template => {
      this.setTemplate(template.template_id, template);
    });
  }

  getStats() {
    return this.cache.getStats();
  }
}

/**
 * 用户会话缓存管理器
 */
export class UserSessionCache {
  private static instance: UserSessionCache;
  private cache = new SmartCache<any>(300000); // 5分钟

  static getInstance(): UserSessionCache {
    if (!UserSessionCache.instance) {
      UserSessionCache.instance = new UserSessionCache();
    }
    return UserSessionCache.instance;
  }

  getUserData(userId: string): any {
    const cacheKey = `user_${userId}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      console.log(`👤 User cache hit: ${userId}`);
      return cached;
    }

    console.log(`🔍 User cache miss: ${userId}`);
    return null;
  }

  setUserData(userId: string, userData: any): void {
    const cacheKey = `user_${userId}`;
    this.cache.set(cacheKey, userData);
    console.log(`💾 User data cached: ${userId}`);
  }

  updateUserCredits(userId: string, credits: number): void {
    const userData = this.getUserData(userId);
    if (userData) {
      userData.credits = credits;
      this.setUserData(userId, userData);
      console.log(`🪙 User credits updated in cache: ${userId} -> ${credits}`);
    }
  }

  getStats() {
    return this.cache.getStats();
  }
}

/**
 * 智能预加载系统
 */
export class PreloadManager {
  private templateCache = TemplateCache.getInstance();
  private userCache = UserSessionCache.getInstance();

  async preloadUserData(userId: string): Promise<void> {
    try {
      console.log(`🚀 Preloading data for user: ${userId}`);
      
      // 这里可以添加实际的数据库查询逻辑
      // 例如：获取用户常用模板、用户信息等
      
      // 模拟预加载
      const startTime = Date.now();
      
      // 预加载用户信息
      // const userData = await fetchUserData(userId);
      // this.userCache.setUserData(userId, userData);
      
      // 预加载常用模板
      // const frequentTemplates = await fetchUserFrequentTemplates(userId);
      // this.templateCache.preloadUserTemplates(userId, frequentTemplates);
      
      const endTime = Date.now();
      console.log(`✅ Preload completed in ${endTime - startTime}ms`);
      
    } catch (error) {
      console.error('❌ Preload failed:', error);
    }
  }

  async preloadPopularTemplates(): Promise<void> {
    try {
      console.log('🔥 Preloading popular templates...');
      
      // 预加载热门模板
      // const popularTemplates = await fetchPopularTemplates();
      // popularTemplates.forEach(template => {
      //   this.templateCache.setTemplate(template.template_id, template);
      // });
      
      console.log('✅ Popular templates preloaded');
      
    } catch (error) {
      console.error('❌ Popular templates preload failed:', error);
    }
  }
}

/**
 * 缓存性能监控
 */
export class CacheMonitor {
  private hitCount = 0;
  private missCount = 0;
  private startTime = Date.now();

  recordHit(): void {
    this.hitCount++;
  }

  recordMiss(): void {
    this.missCount++;
  }

  getHitRate(): number {
    const total = this.hitCount + this.missCount;
    return total > 0 ? (this.hitCount / total) * 100 : 0;
  }

  getStats() {
    return {
      hits: this.hitCount,
      misses: this.missCount,
      hitRate: `${this.getHitRate().toFixed(1)}%`,
      uptime: Date.now() - this.startTime,
      templateCacheStats: TemplateCache.getInstance().getStats(),
      userCacheStats: UserSessionCache.getInstance().getStats()
    };
  }

  reset(): void {
    this.hitCount = 0;
    this.missCount = 0;
    this.startTime = Date.now();
  }
}

// 全局实例
export const templateCacheManager = TemplateCache.getInstance();
export const userSessionCacheManager = UserSessionCache.getInstance();
export const preloadManager = new PreloadManager();
export const cacheMonitor = new CacheMonitor();

// 开发模式下的缓存调试
if (import.meta.env.DEV) {
  // 每30秒输出缓存统计
  setInterval(() => {
    console.log('📊 Cache Statistics:', cacheMonitor.getStats());
  }, 30000);
}

// 页面卸载时清理缓存
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    templateCache.clear();
    userSessionCache.clear();
    generationCache.clear();
  });
}
