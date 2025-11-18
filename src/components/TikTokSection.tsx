import React, { useState, useEffect } from 'react';
import { Play, Heart, MessageCircle, Share, Bookmark, MoreHorizontal, ExternalLink } from 'lucide-react';
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useLanguage } from '@/hooks/useLanguage';

// Professional ragdoll cat images for TikTok thumbnails
const RAGDOLL_TIKTOK_THUMBNAILS = [
  '/src/assets/featured-cat-1.jpg',
  '/src/assets/featured-cat-2.jpg',
  '/src/assets/model-cat-1.jpg',
  '/src/assets/model-cat-2.jpg',
  '/src/assets/model-cat-3.jpg',
  '/src/assets/9274d091-96de-4d71-abd1-fe6214ea8876.jpg'
];

// Fallback static TikTok videos when no database content is available - REMOVED per user request
const FALLBACK_VIDEOS: any[] = [];

const TikTokSection = () => {
  const { t } = useLanguage();
  const [shouldLoadVideos, setShouldLoadVideos] = useState(false);
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set());

  // Lazy load videos only when section is interacted with
  const videos = useQuery(
    api.tiktokVideos.getVideosForMainSection,
    { limit: 6 }
  );

  // Enable loading when section comes into view or user interacts
  const handleSectionVisible = () => {
    setShouldLoadVideos(true);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoadVideos(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    const section = document.getElementById('tiktok-section');
    if (section) {
      observer.observe(section);
    }

    return () => observer.disconnect();
  }, []);
  
  // Use only database videos - no fallback videos
  const displayVideos = videos || [];

  const handleLike = (videoId: string) => {
    setLikedVideos(prev => {
      const newLiked = new Set(prev);
      if (newLiked.has(videoId)) {
        newLiked.delete(videoId);
      } else {
        newLiked.add(videoId);
      }
      return newLiked;
    });
  };

  const formatCount = (count?: number) => {
    if (!count) return '0';
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  // Don't render section if no videos available
  if (displayVideos.length === 0) {
    return null;
  }

  return (
    <section 
      id="tiktok-section"
      className="bg-black py-16 px-4"
      onMouseEnter={handleSectionVisible}
      onFocus={handleSectionVisible}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {t('tiktok.title')}
          </h2>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            {t('tiktok.subtitle')}
          </p>
        </div>

        {/* Video Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-12">
          {displayVideos.map((video) => (
            <div key={video._id} className="relative group">
              {/* Video Card */}
              <div 
                className="relative bg-gray-900 rounded-lg overflow-hidden aspect-[9/16] cursor-pointer hover:scale-105 transition-transform duration-300"
                onClick={() => window.open(video.videoUrl, '_blank')}
                >
                  {/* Thumbnail */}
                  <img 
                    src={video.thumbnail} 
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center group-hover:bg-opacity-50 transition-all">
                    <div className="bg-white bg-opacity-90 rounded-full p-3 hover:bg-opacity-100 transition-all duration-200 group-hover:scale-110">
                      <Play className="w-8 h-8 text-black ml-1" fill="currentColor" />
                    </div>
                  </div>

                  {/* External Link Icon */}
                  <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-black bg-opacity-70 text-white p-1 rounded">
                      <ExternalLink className="w-3 h-3" />
                    </div>
                  </div>

                  {/* Bottom Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black via-black/70 to-transparent">
                    {/* User Info */}
                    <div className="flex items-center mb-2">
                      <div className="w-6 h-6 bg-gradient-to-r from-pink-500 to-red-500 rounded-full flex items-center justify-center mr-2">
                        <span className="text-white text-xs font-bold">B</span>
                      </div>
                      <span className="text-white text-sm font-semibold">@bleuroi_ragdoll</span>
                    </div>

                    {/* Title */}
                    <p className="text-white text-xs font-medium mb-1 line-clamp-1">
                      {video.title}
                    </p>

                    {/* Description */}
                    {video.description && (
                      <p className="text-white text-xs mb-2 line-clamp-2 opacity-90">
                        {video.description}
                      </p>
                    )}

                    {/* Hashtags */}
                    {video.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {video.hashtags.slice(0, 2).map((tag, index) => (
                          <span key={index} className="text-blue-300 text-xs">
                            {tag.startsWith('#') ? tag : `#${tag}`}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Engagement Stats */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLike(video._id);
                          }}
                          className={`flex items-center space-x-1 transition-colors ${
                            likedVideos.has(video._id) ? 'text-red-500' : 'text-white hover:text-red-500'
                          }`}
                        >
                          <Heart className="w-4 h-4" fill={likedVideos.has(video._id) ? 'currentColor' : 'none'} />
                          <span className="text-xs">{formatCount(video.likeCount)}</span>
                        </button>
                        {video.commentCount !== undefined && (
                          <div className="flex items-center space-x-1 text-white">
                            <MessageCircle className="w-4 h-4" />
                            <span className="text-xs">{formatCount(video.commentCount)}</span>
                          </div>
                        )}
                        {video.viewCount !== undefined && (
                          <div className="flex items-center space-x-1 text-white">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                            </svg>
                            <span className="text-xs">{formatCount(video.viewCount)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

        {/* CTA Section */}
        <div className="text-center">
          <a
            href="https://www.tiktok.com/@bleuroi_ragdoll?is_from_webapp=1&sender_device=pc"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-pink-500 to-red-500 text-white font-bold text-lg rounded-full hover:from-pink-600 hover:to-red-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
            </svg>
  {t('tiktok.followButton')}
          </a>
          <p className="text-gray-400 text-sm mt-4">
  {t('tiktok.followDescription')}
          </p>
        </div>
      </div>
    </section>
  );
};

export default TikTokSection; 