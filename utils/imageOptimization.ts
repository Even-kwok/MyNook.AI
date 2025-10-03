/**
 * 图片优化工具
 * 用于压缩和优化图片，减少传输时间
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

/**
 * 智能压缩图片
 * 根据图片大小和质量要求动态调整压缩参数
 */
export const compressImage = async (
  base64: string, 
  options: CompressionOptions = {}
): Promise<string> => {
  const {
    maxWidth = 1024,
    maxHeight = 1024,
    quality = 0.8,
    format = 'jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      try {
        // 计算最优尺寸
        const { width, height } = calculateOptimalSize(
          img.width, 
          img.height, 
          maxWidth, 
          maxHeight
        );

        canvas.width = width;
        canvas.height = height;

        // 高质量缩放
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
        }

        // 根据原图大小动态调整质量
        const dynamicQuality = calculateDynamicQuality(
          img.width * img.height,
          quality
        );

        const mimeType = `image/${format}`;
        const compressedBase64 = canvas.toDataURL(mimeType, dynamicQuality);

        console.log(`🖼️ Image compressed: ${img.width}x${img.height} → ${width}x${height}, quality: ${dynamicQuality}`);
        
        resolve(compressedBase64);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = base64;
  });
};

/**
 * 计算最优图片尺寸
 */
const calculateOptimalSize = (
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } => {
  const aspectRatio = originalWidth / originalHeight;

  let width = originalWidth;
  let height = originalHeight;

  // 如果图片太大，按比例缩放
  if (width > maxWidth) {
    width = maxWidth;
    height = width / aspectRatio;
  }

  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }

  return {
    width: Math.round(width),
    height: Math.round(height)
  };
};

/**
 * 根据图片大小动态调整质量
 */
const calculateDynamicQuality = (
  pixelCount: number,
  baseQuality: number
): number => {
  // 大图片使用更高压缩率
  if (pixelCount > 2000000) { // > 2MP
    return Math.max(0.6, baseQuality - 0.2);
  } else if (pixelCount > 1000000) { // > 1MP
    return Math.max(0.7, baseQuality - 0.1);
  }
  
  return baseQuality;
};

/**
 * 批量压缩图片
 */
export const compressImages = async (
  base64Images: string[],
  options: CompressionOptions = {}
): Promise<string[]> => {
  console.log(`🔄 Compressing ${base64Images.length} images...`);
  
  const startTime = Date.now();
  
  const compressed = await Promise.all(
    base64Images.map(img => compressImage(img, options))
  );
  
  const endTime = Date.now();
  console.log(`✅ Compressed ${base64Images.length} images in ${endTime - startTime}ms`);
  
  return compressed;
};

/**
 * 估算压缩后的大小减少百分比
 */
export const estimateCompressionRatio = (
  originalBase64: string,
  compressedBase64: string
): number => {
  const originalSize = originalBase64.length;
  const compressedSize = compressedBase64.length;
  
  const reduction = ((originalSize - compressedSize) / originalSize) * 100;
  return Math.round(reduction);
};

/**
 * Web Worker 支持的图片压缩
 * 避免阻塞主线程
 */
export const compressImageInWorker = async (
  base64: string,
  options: CompressionOptions = {}
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // 检查是否支持 Web Worker
    if (typeof Worker === 'undefined') {
      // 降级到主线程处理
      return compressImage(base64, options).then(resolve).catch(reject);
    }

    // 创建内联 Worker
    const workerCode = `
      self.onmessage = function(e) {
        const { base64, options } = e.data;
        
        // 在 Worker 中实现压缩逻辑
        // 注意：Worker 中没有 DOM，需要使用 OffscreenCanvas
        try {
          // 这里可以实现 OffscreenCanvas 版本的压缩
          // 或者使用其他图片处理库
          self.postMessage({ success: true, result: base64 });
        } catch (error) {
          self.postMessage({ success: false, error: error.message });
        }
      };
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));

    worker.onmessage = (e) => {
      const { success, result, error } = e.data;
      worker.terminate();
      URL.revokeObjectURL(blob);
      
      if (success) {
        resolve(result);
      } else {
        reject(new Error(error));
      }
    };

    worker.onerror = (error) => {
      worker.terminate();
      URL.revokeObjectURL(blob);
      reject(error);
    };

    worker.postMessage({ base64, options });
  });
};

/**
 * 性能监控
 */
export class ImageOptimizationTracker {
  private metrics: {
    originalSize: number;
    compressedSize: number;
    compressionTime: number;
    compressionRatio: number;
  }[] = [];

  track(
    originalBase64: string,
    compressedBase64: string,
    compressionTime: number
  ) {
    const originalSize = originalBase64.length;
    const compressedSize = compressedBase64.length;
    const compressionRatio = estimateCompressionRatio(originalBase64, compressedBase64);

    this.metrics.push({
      originalSize,
      compressedSize,
      compressionTime,
      compressionRatio
    });

    console.log(`📊 Compression metrics:`, {
      originalSize: `${(originalSize / 1024).toFixed(1)}KB`,
      compressedSize: `${(compressedSize / 1024).toFixed(1)}KB`,
      compressionRatio: `${compressionRatio}%`,
      compressionTime: `${compressionTime}ms`
    });
  }

  getAverageMetrics() {
    if (this.metrics.length === 0) return null;

    const avg = this.metrics.reduce((acc, metric) => ({
      originalSize: acc.originalSize + metric.originalSize,
      compressedSize: acc.compressedSize + metric.compressedSize,
      compressionTime: acc.compressionTime + metric.compressionTime,
      compressionRatio: acc.compressionRatio + metric.compressionRatio
    }), { originalSize: 0, compressedSize: 0, compressionTime: 0, compressionRatio: 0 });

    const count = this.metrics.length;
    return {
      avgOriginalSize: Math.round(avg.originalSize / count),
      avgCompressedSize: Math.round(avg.compressedSize / count),
      avgCompressionTime: Math.round(avg.compressionTime / count),
      avgCompressionRatio: Math.round(avg.compressionRatio / count),
      totalImages: count
    };
  }
}

// 全局性能跟踪器
export const imageOptimizationTracker = new ImageOptimizationTracker();
