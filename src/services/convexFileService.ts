import { useAction, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export interface FileUploadResult {
  success: boolean;
  storageId?: Id<"_storage">;
  url?: string;
  error?: string;
}

export interface UploadFileOptions {
  associatedCatId?: Id<"cats">;
  imageType: 'profile' | 'gallery' | 'general' | 'news' | 'award_certificate' | 'award_gallery' | 'business_gallery';
  onProgress?: (progress: number) => void;
}

export interface VideoUploadOptions {
  onProgress?: (progress: number) => void;
  shouldGenerateThumbnail?: boolean;
  maxDuration?: number; // seconds
  quality?: 'high' | 'medium' | 'low';
}

// Hook for uploading files to Convex storage
export const useFileUpload = () => {
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const saveUploadedFile = useMutation(api.files.saveUploadedFile);

  const uploadFile = async (
    file: File, 
    options: UploadFileOptions
  ): Promise<FileUploadResult> => {
    try {
      options.onProgress?.(0);

      // Step 1: Compress image if it's an image file to stay under Convex 1 MiB limit
      let fileToUpload = file;
      if (file.type.startsWith('image/')) {
        try {
          // Use enhanced compression with automatic WebP conversion
          const compressionOptions: ImageCompressionOptions = {
            maxSizeBytes: 800 * 1024, // 800KB for Convex storage
            maxDimension: options.imageType === 'profile' ? 1024 : 1920,
            quality: options.imageType === 'profile' ? 0.85 : 0.8,
            outputFormat: 'webp', // Always try WebP first (with automatic fallback)
            preserveMetadata: false,
            forceWebP: true // Force WebP conversion for maximum compression
          };

          fileToUpload = await compressImage(file, compressionOptions);
          
          // Enhanced logging for WebP conversion
          const originalFormat = file.type.split('/')[1];
          const finalFormat = fileToUpload.type.split('/')[1];
          const compressionRatio = Math.round((1 - fileToUpload.size / file.size) * 100);
          
          console.log(`✅ Image optimized: ${originalFormat.toUpperCase()} → ${finalFormat.toUpperCase()}`);
          console.log(`📦 Size: ${formatFileSize(file.size)} → ${formatFileSize(fileToUpload.size)} (${compressionRatio}% reduction)`);
          
          if (finalFormat === 'webp') {
            console.log(`🚀 WebP conversion successful! Additional bandwidth savings achieved.`);
          }
        } catch (compressionError) {
          console.warn('Image compression failed, uploading original:', compressionError);
          // Continue with original file if compression fails
        }
      }

      options.onProgress?.(15);

      // Step 2: Generate upload URL
      const postUrl = await generateUploadUrl();
      options.onProgress?.(30);

      // Step 3: Upload file to Convex storage
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": fileToUpload.type },
        body: fileToUpload,
      });

      if (!result.ok) {
        throw new Error(`Upload failed: ${result.status} ${result.statusText}`);
      }

      options.onProgress?.(75);

      const { storageId } = await result.json();

      // Step 4: Save file metadata
      const metadata = await saveUploadedFile({
        storageId,
        filename: file.name, // Keep original filename
        associatedCatId: options.associatedCatId,
        imageType: options.imageType,
      });

      options.onProgress?.(100);

      return {
        success: true,
        storageId,
        url: metadata.url,
      };

    } catch (error) {
      console.error('File upload failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  };

  return { uploadFile };
};

// Hook for uploading multiple files
export const useMultiFileUpload = () => {
  const { uploadFile } = useFileUpload();

  const uploadMultipleFiles = async (
    files: File[],
    options: UploadFileOptions,
    onProgress?: (fileIndex: number, progress: number, total: number) => void
  ): Promise<FileUploadResult[]> => {
    const results: FileUploadResult[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      const result = await uploadFile(file, {
        ...options,
        onProgress: (progress) => onProgress?.(i, progress, files.length),
      });

      results.push(result);
    }

    return results;
  };

  return { uploadMultipleFiles };
};

// Utility to validate image files
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Неподдържан формат. Моля, използвайте JPG, PNG, GIF или WebP.'
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'Файлът е твърде голям. Максимално 5MB.'
    };
  }

  return { valid: true };
};

// Utility to validate video files
export const validateVideoFile = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 50 * 1024 * 1024; // 50MB - reasonable for video upload
  const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Неподдържан формат на видео. Моля, използвайте MP4, WebM или MOV.'
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'Видео файлът е твърде голям. Максимално 50MB.'
    };
  }

  return { valid: true };
};

// Enhanced image compression options
export interface ImageCompressionOptions {
  maxSizeBytes?: number;
  maxDimension?: number;
  quality?: number;
  outputFormat?: 'jpeg' | 'webp' | 'png';
  preserveMetadata?: boolean;
  forceWebP?: boolean; // Force WebP conversion even if browser doesn't support it
}

// Check if browser supports WebP format
export const isWebPSupported = async (): Promise<boolean> => {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
};

// Check if canvas supports WebP encoding
export const canEncodeWebP = (): boolean => {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
};

// Utility to compress images with advanced options
export const compressImage = async (file: File, options: ImageCompressionOptions = {}): Promise<File> => {
  const {
    maxSizeBytes = 800 * 1024, // 800KB default for Convex
    maxDimension = 1920,
    quality = 0.8,
    outputFormat = 'webp', // Default to WebP for best compression
    preserveMetadata = false,
    forceWebP = false
  } = options;

  // Determine optimal output format
  let finalOutputFormat = outputFormat;
  if (outputFormat === 'webp') {
    const webpSupported = canEncodeWebP();
    if (!webpSupported && !forceWebP) {
      finalOutputFormat = 'jpeg'; // Fallback to JPEG if WebP not supported
      console.log('WebP encoding not supported, falling back to JPEG');
    }
  }

  return new Promise((resolve, reject) => {
    // Check if we need conversion to WebP or if file is already optimized
    const needsWebPConversion = finalOutputFormat === 'webp' && !file.type.includes('webp');
    const needsCompression = file.size > maxSizeBytes;
    
    if (!needsWebPConversion && !needsCompression) {
      resolve(file);
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      try {
        // Calculate new dimensions to reduce file size
        let { width, height } = img;
        
        // Apply intelligent scaling based on image content
        const aspectRatio = width / height;
        
        // For very large images, use progressive scaling
        if (width > maxDimension * 2 || height > maxDimension * 2) {
          // First pass: scale to 150% of max dimension
          const scaleFactor = maxDimension * 1.5 / Math.max(width, height);
          width *= scaleFactor;
          height *= scaleFactor;
        }
        
        // Final scaling to max dimension
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          } else {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }
        }

        canvas.width = Math.round(width);
        canvas.height = Math.round(height);

        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Apply image smoothing for better quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw image with potential filters for optimization
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Determine output MIME type based on final format
        const outputMimeType = finalOutputFormat === 'webp' ? 'image/webp' : 
                               finalOutputFormat === 'png' ? 'image/png' : 'image/jpeg';

        // Progressive quality reduction to meet size constraints
        const tryCompress = (currentQuality: number, attempt: number = 1): void => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }

              console.log(`Compression attempt ${attempt}: ${formatFileSize(blob.size)} at quality ${currentQuality}`);

              // If still too large and we can reduce quality further
              if (blob.size > maxSizeBytes && currentQuality > 0.1) {
                // More aggressive quality reduction for larger files
                const qualityReduction = blob.size > maxSizeBytes * 2 ? 0.15 : 0.1;
                tryCompress(Math.max(0.1, currentQuality - qualityReduction), attempt + 1);
                return;
              }

              // If still too large even at lowest quality, try further dimension reduction
              if (blob.size > maxSizeBytes && currentQuality <= 0.1 && canvas.width > 800) {
                const newWidth = Math.round(canvas.width * 0.8);
                const newHeight = Math.round(canvas.height * 0.8);
                
                canvas.width = newWidth;
                canvas.height = newHeight;
                ctx.drawImage(img, 0, 0, newWidth, newHeight);
                
                tryCompress(0.6, attempt + 1); // Reset quality for smaller image
                return;
              }

              // Create new file with compressed blob
              const compressedFile = new File([blob], 
                file.name.replace(/\.[^/.]+$/, `.${outputFormat === 'jpeg' ? 'jpg' : outputFormat}`), {
                type: outputMimeType,
                lastModified: Date.now(),
              });

              console.log(`Final compression: ${formatFileSize(file.size)} → ${formatFileSize(compressedFile.size)}`);
              resolve(compressedFile);
            },
            outputMimeType,
            currentQuality
          );
        };

        // Start compression
        tryCompress(quality);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image for compression'));
    img.src = URL.createObjectURL(file);
  });
};

// Utility to get file info
export const getFileInfo = (file: File) => {
  return {
    name: file.name,
    size: file.size,
    type: file.type,
    sizeFormatted: formatFileSize(file.size),
  };
};

// Format file size for display
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Generate a thumbnail from a video file
export const generateVideoThumbnail = async (videoFile: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    video.addEventListener('loadeddata', () => {
      try {
        // Set canvas dimensions to video dimensions
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Seek to 1 second or 10% of video duration, whichever is smaller
        const seekTime = Math.min(1, video.duration * 0.1);
        video.currentTime = seekTime;
      } catch (error) {
        reject(error);
      }
    });

    video.addEventListener('seeked', () => {
      try {
        // Draw the current frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert canvas to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to generate thumbnail'));
            }
          },
          'image/jpeg',
          0.8
        );
      } catch (error) {
        reject(error);
      }
    });

    video.addEventListener('error', () => {
      reject(new Error('Failed to load video for thumbnail generation'));
    });

    // Load the video file
    video.src = URL.createObjectURL(videoFile);
    video.load();
  });
};

// Get video metadata (duration, dimensions)
export const getVideoMetadata = async (file: File): Promise<{
  duration: number;
  width: number;
  height: number;
  size: number;
}> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');

    video.addEventListener('loadedmetadata', () => {
      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        size: file.size,
      });
    });

    video.addEventListener('error', () => {
      reject(new Error('Failed to load video metadata'));
    });

    video.src = URL.createObjectURL(file);
    video.load();
  });
};

// Basic video compression using MediaRecorder API
export const compressVideo = async (
  file: File, 
  options: VideoUploadOptions = {}
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas not supported'));
      return;
    }

    video.addEventListener('loadedmetadata', () => {
      try {
        // Set canvas size based on quality setting
        let scale = 1;
        switch (options.quality) {
          case 'low':
            scale = 0.5;
            break;
          case 'medium':
            scale = 0.7;
            break;
          case 'high':
          default:
            scale = 1;
            break;
        }

        canvas.width = video.videoWidth * scale;
        canvas.height = video.videoHeight * scale;

        // Create MediaRecorder stream from canvas
        const stream = canvas.captureStream(30);
        const recorder = new MediaRecorder(stream, {
          mimeType: 'video/webm;codecs=vp8',
          videoBitsPerSecond: options.quality === 'low' ? 500000 : 
                               options.quality === 'medium' ? 1000000 : 2000000
        });

        const chunks: Blob[] = [];
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };

        recorder.onstop = () => {
          const compressedBlob = new Blob(chunks, { type: 'video/webm' });
          const compressedFile = new File([compressedBlob], file.name.replace(/\.[^/.]+$/, '.webm'), {
            type: 'video/webm',
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        };

        recorder.onerror = (event) => {
          reject(new Error('Video compression failed'));
        };

        // Start recording
        recorder.start();

        // Play video and draw frames to canvas
        let frameCount = 0;
        const maxFrames = options.maxDuration ? options.maxDuration * 30 : Infinity;

        const drawFrame = () => {
          if (video.ended || frameCount >= maxFrames) {
            recorder.stop();
            return;
          }

          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          frameCount++;
          
          if (options.onProgress) {
            const progress = Math.min((frameCount / maxFrames) * 90, 90);
            options.onProgress(progress);
          }

          requestAnimationFrame(drawFrame);
        };

        video.play();
        drawFrame();

      } catch (error) {
        reject(error);
      }
    });

    video.addEventListener('error', () => {
      reject(new Error('Failed to load video for compression'));
    });

    video.src = URL.createObjectURL(file);
    video.load();
  });
};

// Hook for uploading videos with thumbnail generation
export const useVideoUpload = () => {
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  
  const uploadVideo = async (
    file: File,
    options: VideoUploadOptions = {}
  ): Promise<FileUploadResult & { thumbnailUrl?: string; metadata?: any }> => {
    try {
      options.onProgress?.(0);

      // Step 1: Validate video file
      const validation = validateVideoFile(file);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      options.onProgress?.(10);

      // Step 2: Get video metadata
      const metadata = await getVideoMetadata(file);
      options.onProgress?.(20);

      // Step 3: Generate thumbnail if requested
      let thumbnailUrl: string | undefined;
      if (options.shouldGenerateThumbnail) {
        try {
          const thumbnailBlob = await generateVideoThumbnail(file);
          
          // Upload thumbnail
          const thumbnailPostUrl = await generateUploadUrl();
          const thumbnailResult = await fetch(thumbnailPostUrl, {
            method: "POST",
            headers: { "Content-Type": thumbnailBlob.type },
            body: thumbnailBlob,
          });

          if (thumbnailResult.ok) {
            const { storageId: thumbnailStorageId } = await thumbnailResult.json();
            // Note: You'll need to create a function to get URL from storage ID
            // For now, we'll store the storage ID
            thumbnailUrl = `convex-thumbnail-${thumbnailStorageId}`;
          }
        } catch (thumbnailError) {
          console.warn('Thumbnail generation failed:', thumbnailError);
          // Continue without thumbnail
        }
      }

      options.onProgress?.(40);

      // Step 4: Compress video if needed (optional for now)
      let fileToUpload = file;
      // Uncomment for compression:
      // if (file.size > 10 * 1024 * 1024) { // Compress if > 10MB
      //   fileToUpload = await compressVideo(file, options);
      // }

      options.onProgress?.(60);

      // Step 5: Upload video to Convex storage
      const postUrl = await generateUploadUrl();
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": fileToUpload.type },
        body: fileToUpload,
      });

      if (!result.ok) {
        throw new Error(`Upload failed: ${result.status} ${result.statusText}`);
      }

      options.onProgress?.(90);

      const { storageId } = await result.json();
      
      // Note: You'll need to create a function in Convex to get the URL from storage ID
      // For now, we'll create a placeholder URL
      const videoUrl = `convex-video-${storageId}`;

      options.onProgress?.(100);

      return {
        success: true,
        storageId,
        url: videoUrl,
        thumbnailUrl,
        metadata,
      };

    } catch (error) {
      console.error('Video upload failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Video upload failed',
      };
    }
  };

  return { uploadVideo };
}; 