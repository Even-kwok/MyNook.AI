/**
 * 生图性能监控和测试工具
 * 用于监控和分析生图流程的性能表现
 */

interface PerformanceMetrics {
  totalTime: number;
  compressionTime: number;
  networkTime: number;
  apiTime: number;
  renderTime: number;
  timestamp: Date;
  success: boolean;
  error?: string;
  imageSize?: number;
  compressedSize?: number;
  compressionRatio?: number;
}

interface PerformanceStats {
  averageTime: number;
  medianTime: number;
  minTime: number;
  maxTime: number;
  successRate: number;
  totalGenerations: number;
  averageCompressionRatio: number;
  performanceGain: number; // 相比24秒基线的提升
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private readonly BASELINE_TIME = 24000; // 24秒基线
  private readonly MAX_METRICS = 100; // 最多保存100条记录

  /**
   * 开始性能监控
   */
  startMonitoring(): PerformanceTracker {
    return new PerformanceTracker();
  }

  /**
   * 记录性能指标
   */
  recordMetrics(metrics: PerformanceMetrics): void {
    this.metrics.push(metrics);
    
    // 保持最新的100条记录
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics.shift();
    }

    // 实时输出性能信息
    this.logPerformanceUpdate(metrics);
  }

  /**
   * 获取性能统计
   */
  getStats(): PerformanceStats {
    if (this.metrics.length === 0) {
      return {
        averageTime: 0,
        medianTime: 0,
        minTime: 0,
        maxTime: 0,
        successRate: 0,
        totalGenerations: 0,
        averageCompressionRatio: 0,
        performanceGain: 0
      };
    }

    const successfulMetrics = this.metrics.filter(m => m.success);
    const times = successfulMetrics.map(m => m.totalTime);
    const compressionRatios = successfulMetrics
      .filter(m => m.compressionRatio !== undefined)
      .map(m => m.compressionRatio!);

    const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
    const sortedTimes = [...times].sort((a, b) => a - b);
    const medianTime = sortedTimes[Math.floor(sortedTimes.length / 2)];
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const successRate = (successfulMetrics.length / this.metrics.length) * 100;
    const averageCompressionRatio = compressionRatios.length > 0 
      ? compressionRatios.reduce((a, b) => a + b, 0) / compressionRatios.length 
      : 0;
    const performanceGain = ((this.BASELINE_TIME - averageTime) / this.BASELINE_TIME) * 100;

    return {
      averageTime: Math.round(averageTime),
      medianTime: Math.round(medianTime),
      minTime: Math.round(minTime),
      maxTime: Math.round(maxTime),
      successRate: Math.round(successRate * 100) / 100,
      totalGenerations: this.metrics.length,
      averageCompressionRatio: Math.round(averageCompressionRatio * 100) / 100,
      performanceGain: Math.round(performanceGain * 100) / 100
    };
  }

  /**
   * 获取详细的性能报告
   */
  getDetailedReport(): string {
    const stats = this.getStats();
    const recentMetrics = this.metrics.slice(-10); // 最近10次

    return `
🚀 MyNook.AI 生图性能报告
================================

📊 总体统计:
• 总生图次数: ${stats.totalGenerations}
• 平均耗时: ${stats.averageTime}ms
• 中位数耗时: ${stats.medianTime}ms
• 最快耗时: ${stats.minTime}ms
• 最慢耗时: ${stats.maxTime}ms
• 成功率: ${stats.successRate}%
• 平均压缩率: ${stats.averageCompressionRatio}%

🎯 性能提升:
• 相比24秒基线提升: ${stats.performanceGain}%
• 目标达成度: ${stats.averageTime <= 8000 ? '✅ 已达成' : '⏳ 进行中'}

📈 最近10次生图表现:
${recentMetrics.map((m, i) => 
  `${i + 1}. ${m.success ? '✅' : '❌'} ${m.totalTime}ms (压缩: ${m.compressionTime}ms, API: ${m.apiTime}ms)`
).join('\n')}

💡 优化建议:
${this.generateOptimizationSuggestions(stats)}
    `.trim();
  }

  /**
   * 生成优化建议
   */
  private generateOptimizationSuggestions(stats: PerformanceStats): string {
    const suggestions: string[] = [];

    if (stats.averageTime > 10000) {
      suggestions.push('• 考虑进一步优化图片压缩算法');
    }

    if (stats.successRate < 95) {
      suggestions.push('• 需要改善错误处理和重试机制');
    }

    if (stats.averageCompressionRatio < 50) {
      suggestions.push('• 可以提高图片压缩率以减少传输时间');
    }

    if (stats.performanceGain < 60) {
      suggestions.push('• 考虑实施更多并行处理优化');
    }

    return suggestions.length > 0 ? suggestions.join('\n') : '• 性能表现良好，继续保持！';
  }

  /**
   * 实时输出性能更新
   */
  private logPerformanceUpdate(metrics: PerformanceMetrics): void {
    const performanceGain = ((this.BASELINE_TIME - metrics.totalTime) / this.BASELINE_TIME) * 100;
    
    console.log(`⚡ 生图性能监控:`, {
      totalTime: `${metrics.totalTime}ms`,
      breakdown: {
        compression: `${metrics.compressionTime}ms`,
        network: `${metrics.networkTime}ms`,
        api: `${metrics.apiTime}ms`,
        render: `${metrics.renderTime}ms`
      },
      compression: metrics.compressionRatio ? `${metrics.compressionRatio}% reduction` : 'N/A',
      performanceGain: `${Math.round(performanceGain)}% faster than baseline`,
      status: metrics.success ? '✅ Success' : '❌ Failed'
    });
  }

  /**
   * 导出性能数据
   */
  exportData(): string {
    return JSON.stringify({
      exportTime: new Date().toISOString(),
      stats: this.getStats(),
      metrics: this.metrics
    }, null, 2);
  }

  /**
   * 清除所有数据
   */
  clear(): void {
    this.metrics = [];
  }
}

/**
 * 性能追踪器
 * 用于单次生图的性能追踪
 */
export class PerformanceTracker {
  private startTime: number;
  private stages: { [key: string]: number } = {};
  private currentStage: string | null = null;

  constructor() {
    this.startTime = Date.now();
    console.log('🚀 Performance tracking started');
  }

  /**
   * 标记阶段开始
   */
  startStage(stageName: string): void {
    if (this.currentStage) {
      this.endStage();
    }
    
    this.currentStage = stageName;
    this.stages[`${stageName}_start`] = Date.now();
    console.log(`⏱️ Stage started: ${stageName}`);
  }

  /**
   * 标记阶段结束
   */
  endStage(): void {
    if (!this.currentStage) return;

    const startKey = `${this.currentStage}_start`;
    const endTime = Date.now();
    const duration = endTime - this.stages[startKey];
    
    this.stages[this.currentStage] = duration;
    console.log(`✅ Stage completed: ${this.currentStage} (${duration}ms)`);
    
    this.currentStage = null;
  }

  /**
   * 完成追踪并返回指标
   */
  complete(success: boolean, error?: string, additionalData?: any): PerformanceMetrics {
    if (this.currentStage) {
      this.endStage();
    }

    const totalTime = Date.now() - this.startTime;
    
    const metrics: PerformanceMetrics = {
      totalTime,
      compressionTime: this.stages.compression || 0,
      networkTime: this.stages.network || 0,
      apiTime: this.stages.api || 0,
      renderTime: this.stages.render || 0,
      timestamp: new Date(),
      success,
      error,
      ...additionalData
    };

    console.log(`🏁 Performance tracking completed: ${totalTime}ms (${success ? 'Success' : 'Failed'})`);
    
    return metrics;
  }

  /**
   * 获取当前进度
   */
  getCurrentProgress(): { totalTime: number; stages: { [key: string]: number } } {
    return {
      totalTime: Date.now() - this.startTime,
      stages: { ...this.stages }
    };
  }
}

/**
 * 性能基准测试
 */
export class PerformanceBenchmark {
  private monitor = new PerformanceMonitor();

  /**
   * 运行基准测试
   */
  async runBenchmark(testCount: number = 5): Promise<void> {
    console.log(`🧪 Starting performance benchmark with ${testCount} tests...`);
    
    for (let i = 0; i < testCount; i++) {
      console.log(`\n📊 Running test ${i + 1}/${testCount}...`);
      
      try {
        // 模拟生图流程
        await this.simulateImageGeneration();
      } catch (error) {
        console.error(`❌ Test ${i + 1} failed:`, error);
      }
      
      // 等待1秒再进行下一次测试
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n📈 Benchmark Results:');
    console.log(this.monitor.getDetailedReport());
  }

  /**
   * 模拟生图流程
   */
  private async simulateImageGeneration(): Promise<void> {
    const tracker = this.monitor.startMonitoring();
    
    try {
      // 模拟压缩阶段
      tracker.startStage('compression');
      await this.simulateDelay(200, 500); // 200-500ms
      tracker.endStage();

      // 模拟网络传输
      tracker.startStage('network');
      await this.simulateDelay(300, 800); // 300-800ms
      tracker.endStage();

      // 模拟API调用
      tracker.startStage('api');
      await this.simulateDelay(3000, 4000); // 3-4秒
      tracker.endStage();

      // 模拟渲染
      tracker.startStage('render');
      await this.simulateDelay(100, 300); // 100-300ms
      tracker.endStage();

      const metrics = tracker.complete(true, undefined, {
        compressionRatio: Math.random() * 30 + 50, // 50-80%
        imageSize: Math.random() * 500000 + 100000, // 100KB-600KB
        compressedSize: Math.random() * 200000 + 50000 // 50KB-250KB
      });

      this.monitor.recordMetrics(metrics);

    } catch (error) {
      const metrics = tracker.complete(false, error instanceof Error ? error.message : 'Unknown error');
      this.monitor.recordMetrics(metrics);
      throw error;
    }
  }

  /**
   * 模拟延迟
   */
  private simulateDelay(min: number, max: number): Promise<void> {
    const delay = Math.random() * (max - min) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}

// 全局性能监控实例
export const globalPerformanceMonitor = new PerformanceMonitor();

// 开发模式下启用详细日志
if (import.meta.env.DEV) {
  // 每分钟输出性能统计
  setInterval(() => {
    const stats = globalPerformanceMonitor.getStats();
    if (stats.totalGenerations > 0) {
      console.log('📊 Performance Stats:', stats);
    }
  }, 60000);
}

// 导出便捷函数
export const startPerformanceTracking = () => globalPerformanceMonitor.startMonitoring();
export const getPerformanceStats = () => globalPerformanceMonitor.getStats();
export const getPerformanceReport = () => globalPerformanceMonitor.getDetailedReport();
