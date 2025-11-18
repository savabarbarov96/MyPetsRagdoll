// Video optimization utility for reducing bandwidth usage
export interface VideoOptimizationSettings {
  // Quality settings
  crf: number; // Constant Rate Factor (18-28, lower = better quality)
  preset: 'ultrafast' | 'fast' | 'medium' | 'slow' | 'slower';
  
  // Resolution settings
  maxWidth: number;
  maxHeight: number;
  
  // Compression settings
  videoBitrate: string; // e.g., '1000k', '500k'
  audioBitrate: string; // e.g., '128k', '64k'
  
  // Format settings
  outputFormat: 'mp4' | 'webm';
  codec: 'h264' | 'h265' | 'vp9' | 'av1';
}

// Predefined optimization profiles
export const VIDEO_OPTIMIZATION_PROFILES = {
  // For hero videos (high quality, reasonable size)
  hero: {
    crf: 23,
    preset: 'medium',
    maxWidth: 1920,
    maxHeight: 1080,
    videoBitrate: '1500k', // Reduces ~70% from original
    audioBitrate: '128k',
    outputFormat: 'mp4' as const,
    codec: 'h264' as const
  },
  
  // For gallery videos (balanced quality/size)
  gallery: {
    crf: 25,
    preset: 'medium',
    maxWidth: 1280,
    maxHeight: 720,
    videoBitrate: '800k',
    audioBitrate: '96k',
    outputFormat: 'mp4' as const,
    codec: 'h264' as const
  },
  
  // For mobile-optimized versions
  mobile: {
    crf: 28,
    preset: 'fast',
    maxWidth: 854,
    maxHeight: 480,
    videoBitrate: '400k',
    audioBitrate: '64k',
    outputFormat: 'mp4' as const,
    codec: 'h264' as const
  },
  
  // Ultra-compressed for very low bandwidth
  minimal: {
    crf: 30,
    preset: 'fast',
    maxWidth: 640,
    maxHeight: 360,
    videoBitrate: '200k',
    audioBitrate: '32k',
    outputFormat: 'webm' as const,
    codec: 'vp9' as const
  }
} as const;

// FFmpeg command generator
export function generateFFmpegCommand(
  inputFile: string,
  outputFile: string,
  settings: VideoOptimizationSettings
): string {
  const commands = [
    'ffmpeg',
    '-i', `"${inputFile}"`,
    '-c:v', settings.codec,
    '-crf', settings.crf.toString(),
    '-preset', settings.preset,
    '-vf', `"scale=${settings.maxWidth}:${settings.maxHeight}:force_original_aspect_ratio=decrease"`,
    '-b:v', settings.videoBitrate,
    '-maxrate', settings.videoBitrate,
    '-bufsize', `${parseInt(settings.videoBitrate) * 2}k`,
    '-c:a', 'aac',
    '-b:a', settings.audioBitrate,
    '-movflags', '+faststart', // Optimize for web streaming
    '-pix_fmt', 'yuv420p', // Ensure compatibility
    `"${outputFile}"`
  ];
  
  return commands.join(' ');
}

// Calculate estimated file size reduction
export function estimateFileSizeReduction(
  originalSizeMB: number,
  profile: keyof typeof VIDEO_OPTIMIZATION_PROFILES
): {
  estimatedSizeMB: number;
  reductionPercentage: number;
  bandwidthSavings: string;
} {
  const reductionFactors = {
    hero: 0.3, // ~70% reduction
    gallery: 0.2, // ~80% reduction
    mobile: 0.1, // ~90% reduction
    minimal: 0.05 // ~95% reduction
  };
  
  const factor = reductionFactors[profile];
  const estimatedSizeMB = originalSizeMB * factor;
  const reductionPercentage = Math.round((1 - factor) * 100);
  
  return {
    estimatedSizeMB: Math.round(estimatedSizeMB * 100) / 100,
    reductionPercentage,
    bandwidthSavings: `${Math.round((originalSizeMB - estimatedSizeMB) * 100) / 100}MB saved per view`
  };
}

// Usage examples and instructions
export const OPTIMIZATION_INSTRUCTIONS = {
  currentVideoSize: '4.53MB',
  urgentAction: 'Your hero video is consuming massive bandwidth!',
  
  recommendations: [
    {
      profile: 'hero',
      description: 'High quality for hero section',
      expectedSize: '~1.36MB (70% reduction)',
      bandwidthSaving: '3.17MB per visitor',
      command: generateFFmpegCommand(
        'src/assets/ragdoll_loop.mp4',
        'src/assets/ragdoll_loop_optimized.mp4',
        VIDEO_OPTIMIZATION_PROFILES.hero
      )
    },
    {
      profile: 'mobile',
      description: 'Mobile-optimized version',
      expectedSize: '~0.45MB (90% reduction)',
      bandwidthSaving: '4.08MB per visitor',
      command: generateFFmpegCommand(
        'src/assets/ragdoll_loop.mp4',
        'src/assets/ragdoll_loop_mobile.mp4',
        VIDEO_OPTIMIZATION_PROFILES.mobile
      )
    }
  ],
  
  implementation: [
    '1. Install FFmpeg: https://ffmpeg.org/download.html',
    '2. Run the optimization commands above',
    '3. Replace original video with optimized version',
    '4. Implement responsive video loading in CinematicVideoHero.tsx',
    '5. Test bandwidth usage - should reduce by 70-90%'
  ]
};

// Responsive video loading strategy
export const RESPONSIVE_VIDEO_STRATEGY = `
// In CinematicVideoHero.tsx, implement:

const getOptimalVideoSource = () => {
  const isMobile = window.innerWidth <= 768;
  const isSlowConnection = navigator.connection?.effectiveType === 'slow-2g' || 
                           navigator.connection?.effectiveType === '2g';
  
  if (isSlowConnection) {
    return ragdollVideoMinimal; // 200k bitrate
  }
  
  if (isMobile) {
    return ragdollVideoMobile; // 400k bitrate
  }
  
  return ragdollVideoOptimized; // 1500k bitrate
};
`;
