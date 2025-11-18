// Utility for converting existing images to WebP format
import { compressImage, ImageCompressionOptions } from '@/services/convexFileService';

export interface ConversionResult {
  success: boolean;
  originalSize: number;
  convertedSize: number;
  reductionPercentage: number;
  format: string;
  error?: string;
}

// Convert a URL-based image to WebP
export const convertImageFromUrl = async (
  imageUrl: string,
  options: Partial<ImageCompressionOptions> = {}
): Promise<ConversionResult> => {
  try {
    // Fetch the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const blob = await response.blob();
    const originalSize = blob.size;
    
    // Convert blob to File object
    const file = new File([blob], 'image', { type: blob.type });
    
    // Set up WebP conversion options
    const webpOptions: ImageCompressionOptions = {
      maxSizeBytes: 800 * 1024, // 800KB for Convex
      maxDimension: 1920,
      quality: 0.85,
      outputFormat: 'webp',
      forceWebP: true,
      preserveMetadata: false,
      ...options
    };
    
    // Convert to WebP
    const convertedFile = await compressImage(file, webpOptions);
    const reductionPercentage = Math.round((1 - convertedFile.size / originalSize) * 100);
    
    return {
      success: true,
      originalSize,
      convertedSize: convertedFile.size,
      reductionPercentage,
      format: convertedFile.type.split('/')[1]
    };
    
  } catch (error) {
    return {
      success: false,
      originalSize: 0,
      convertedSize: 0,
      reductionPercentage: 0,
      format: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Batch convert multiple images
export const batchConvertImages = async (
  imageUrls: string[],
  options: Partial<ImageCompressionOptions> = {},
  onProgress?: (completed: number, total: number, result: ConversionResult) => void
): Promise<ConversionResult[]> => {
  const results: ConversionResult[] = [];
  
  for (let i = 0; i < imageUrls.length; i++) {
    const result = await convertImageFromUrl(imageUrls[i], options);
    results.push(result);
    
    if (onProgress) {
      onProgress(i + 1, imageUrls.length, result);
    }
    
    // Small delay to prevent overwhelming the browser
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
};

// Calculate total bandwidth savings
export const calculateBandwidthSavings = (results: ConversionResult[]): {
  totalOriginalSize: number;
  totalConvertedSize: number;
  totalSavings: number;
  averageReduction: number;
  successCount: number;
  failureCount: number;
} => {
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  const totalOriginalSize = successful.reduce((sum, r) => sum + r.originalSize, 0);
  const totalConvertedSize = successful.reduce((sum, r) => sum + r.convertedSize, 0);
  const totalSavings = totalOriginalSize - totalConvertedSize;
  const averageReduction = successful.length > 0 
    ? successful.reduce((sum, r) => sum + r.reductionPercentage, 0) / successful.length
    : 0;
  
  return {
    totalOriginalSize,
    totalConvertedSize,
    totalSavings,
    averageReduction: Math.round(averageReduction),
    successCount: successful.length,
    failureCount: failed.length
  };
};

// Format file size for display
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

// WebP feature detection
export const checkWebPSupport = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
};

// Generate conversion report
export const generateConversionReport = (results: ConversionResult[]): string => {
  const stats = calculateBandwidthSavings(results);
  
  return `
🚀 WebP Conversion Report
========================

📊 Summary:
• Total images processed: ${results.length}
• Successful conversions: ${stats.successCount}
• Failed conversions: ${stats.failureCount}
• Average size reduction: ${stats.averageReduction}%

💾 Bandwidth Savings:
• Original total size: ${formatFileSize(stats.totalOriginalSize)}
• Converted total size: ${formatFileSize(stats.totalConvertedSize)}
• Total savings: ${formatFileSize(stats.totalSavings)}

🎯 Impact:
• Bandwidth usage reduced by ${Math.round((stats.totalSavings / stats.totalOriginalSize) * 100)}%
• Page load times will be significantly faster
• Better user experience on mobile devices
• Reduced hosting costs

${stats.failureCount > 0 ? `
⚠️ Failed Conversions: ${stats.failureCount}
Some images could not be converted. Check console for details.
` : '✅ All images converted successfully!'}
`;
};
