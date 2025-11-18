import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import ragdollVideo from "@/assets/ragdoll_loop.mp4";
import { useLanguage } from "@/hooks/useLanguage";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

const CinematicVideoHero = () => {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [isPortraitVideo, setIsPortraitVideo] = useState(false);
  const [videoAspectRatio, setVideoAspectRatio] = useState<number | null>(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { t } = useLanguage();
  
  // Fetch active hero video from database
  const activeHeroVideo = useQuery(api.heroVideos.getActiveHeroVideo);
  
  // Get the video source - use database video if available, otherwise fallback to static
  const videoSource = (activeHeroVideo?.src && !activeHeroVideo.src.startsWith("convex://storage/")) 
    ? activeHeroVideo.src 
    : ragdollVideo;
  
  const videoSettings = activeHeroVideo || {
    shouldAutoplay: true,
    shouldLoop: true,
    shouldMute: true
  };

  // Debug logging
  console.log('Active hero video:', activeHeroVideo);
  console.log('Video source being used:', videoSource);

  // Window resize effect for responsive handling
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 768);
    };
    
    // Set initial value
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      const handleLoadedData = () => {
        // Get video dimensions for aspect ratio analysis
        const width = video.videoWidth;
        const height = video.videoHeight;
        const aspectRatio = width / height;
        
        // Consider video portrait if aspect ratio is less than 1 (height > width)
        // or if it's close to common mobile ratios (9:16 ≈ 0.56, 3:4 ≈ 0.75)
        const isPortrait = aspectRatio < 1 || aspectRatio <= 0.8;
        
        console.log(`Video dimensions: ${width}x${height}, aspect ratio: ${aspectRatio.toFixed(2)}, isPortrait: ${isPortrait}, isMobile: ${isMobileView}`);
        
        setVideoAspectRatio(aspectRatio);
        setIsPortraitVideo(isPortrait);
        setIsVideoLoaded(true);
        setVideoError(false);
        setTimeout(() => setShowContent(true), 500);
      };

      const handleError = () => {
        console.error('Video failed to load, falling back to static video');
        setVideoError(true);
        setIsVideoLoaded(true);
        // Reset aspect ratio states on error
        setIsPortraitVideo(false);
        setVideoAspectRatio(null);
        setTimeout(() => setShowContent(true), 500);
      };

      video.addEventListener('loadeddata', handleLoadedData);
      video.addEventListener('error', handleError);

      // Force video to reload when source changes
      video.load();

      return () => {
        video.removeEventListener('loadeddata', handleLoadedData);
        video.removeEventListener('error', handleError);
      };
    }
  }, [videoSource]); // Re-run when video source changes

  const scrollToNext = () => {
    const nextSection = document.getElementById('models');
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 z-0 bg-black">
        {/* Letterbox container for portrait videos */}
        <div className={`
          absolute inset-0 flex items-center justify-center
          ${isPortraitVideo && !isMobileView 
            ? 'bg-gradient-to-r from-black via-gray-900 to-black' 
            : ''
          }
        `}>
          <video
            key={videoSource} // Force React to recreate video element when source changes
            ref={videoRef}
            autoPlay={videoSettings.shouldAutoplay}
            loop={videoSettings.shouldLoop}
            muted={videoSettings.shouldMute}
            playsInline
            className={`
              w-full h-full transition-all duration-700 ease-out
              ${isPortraitVideo 
                ? (isMobileView 
                    ? 'object-cover' // Mobile: fill screen even for portrait videos
                    : 'object-contain' // Desktop: letterbox portrait videos
                  )
                : 'object-cover' // Landscape: always fill with cropping
              }
              ${isVideoLoaded ? 'opacity-100' : 'opacity-0'}
            `}
            style={{
              // Enhanced responsive video sizing
              ...(isPortraitVideo && videoAspectRatio && !isMobileView && {
                // Desktop letterboxing for portrait videos
                maxHeight: '100vh',
                maxWidth: `min(100vw, ${100 * videoAspectRatio}vh)`,
                aspectRatio: videoAspectRatio,
              }),
              // Mobile portrait videos fill the screen
              ...(isPortraitVideo && isMobileView && {
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              })
            }}
            onLoadedData={() => setIsVideoLoaded(true)}
            onError={() => setVideoError(true)}
          >
            <source src={videoError ? ragdollVideo : videoSource} type="video/mp4" />
            {/* Fallback source */}
            <source src={ragdollVideo} type="video/mp4" />
          </video>
        </div>
        
        {/* Portrait Video Letterbox Enhancement */}
        {isPortraitVideo && !isMobileView && (
          <div className="absolute inset-0 z-5">
            {/* Subtle letterbox bars with cinematic gradient */}
            <div className="absolute top-0 left-0 right-0 h-full bg-gradient-to-r from-black via-transparent to-black opacity-60" />
            {/* Additional edge vignetting for portrait videos */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent via-transparent to-black/40" />
          </div>
        )}
        
        {/* Video Overlay for cinematic effect */}
        <div className="absolute inset-0 bg-black/20 z-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40 z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20 z-10" />
        
        {/* Cinematic vignette effect */}
        <div className="absolute inset-0 z-10" style={{
          background: 'radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0.8) 100%)'
        }} />
        
        {/* Film dots/dust particles */}
        <div className="absolute inset-0 z-10 opacity-40">
          <div className="absolute top-[10%] left-[15%] w-1 h-1 bg-black rounded-full animate-pulse" />
          <div className="absolute top-[25%] right-[20%] w-0.5 h-0.5 bg-black rounded-full animate-pulse delay-300" />
          <div className="absolute top-[40%] left-[8%] w-1.5 h-1.5 bg-black rounded-full animate-pulse delay-700" />
          <div className="absolute top-[60%] right-[12%] w-0.5 h-0.5 bg-black rounded-full animate-pulse delay-1000" />
          <div className="absolute top-[75%] left-[25%] w-1 h-1 bg-black rounded-full animate-pulse delay-500" />
          <div className="absolute top-[15%] left-[60%] w-0.5 h-0.5 bg-black rounded-full animate-pulse delay-1200" />
          <div className="absolute top-[35%] right-[45%] w-1 h-1 bg-black rounded-full animate-pulse delay-200" />
          <div className="absolute top-[55%] left-[40%] w-0.5 h-0.5 bg-black rounded-full animate-pulse delay-800" />
          <div className="absolute top-[80%] right-[30%] w-1.5 h-1.5 bg-black rounded-full animate-pulse delay-400" />
          <div className="absolute top-[20%] left-[80%] w-1 h-1 bg-black rounded-full animate-pulse delay-600" />
          <div className="absolute bottom-[10%] left-[10%] w-0.5 h-0.5 bg-black rounded-full animate-pulse delay-900" />
          <div className="absolute bottom-[30%] right-[15%] w-1 h-1 bg-black rounded-full animate-pulse delay-100" />
        </div>
        
        {/* Film scratches */}
        <div className="absolute inset-0 z-10 opacity-20">
          <div className="absolute top-0 left-[30%] w-px h-full bg-gradient-to-b from-transparent via-white/30 to-transparent animate-pulse" />
          <div className="absolute top-0 right-[25%] w-px h-full bg-gradient-to-b from-transparent via-white/20 to-transparent animate-pulse delay-500" />
        </div>
      </div>

      {/* Content Overlay */}
      <div className="relative z-20 h-full flex flex-col items-center justify-center text-white">
        {/* Title Text */}
        <div 
          className={`text-center max-w-4xl px-4 transition-all duration-1500 ease-out transform ${
            showContent 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-10'
          }`}
        >
          <h1 className="font-playfair text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-light mb-4 leading-tight">
            <span className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent drop-shadow-2xl">
              BleuRoi
            </span>
          </h1>
          
          <h2 className="font-playfair text-2xl md:text-4xl lg:text-5xl font-light mb-6 text-blue-100 drop-shadow-xl">
            BleuRoi Ragdoll Cattery
          </h2>

          <p className="text-lg md:text-xl lg:text-2xl text-white/90 font-light max-w-2xl mx-auto leading-relaxed drop-shadow-lg">
            Лицензиран Развъдник на Ragdoll Котки в България
          </p>
          <p className="text-base md:text-lg text-white/80 font-light mt-4 drop-shadow-lg">
            FIFe & WCF | Лиценз 47090/2024
          </p>
        </div>

        {/* Scroll Indicator */}
        <div 
          className={`absolute bottom-8 left-1/2 transform -translate-x-1/2 transition-all duration-1500 ease-out delay-700 ${
            showContent 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-10'
          }`}
        >
          <button
            onClick={scrollToNext}
            className="group flex flex-col items-center cursor-pointer hover:scale-110 transition-all duration-300"
            aria-label="Scroll to next section"
          >
            {/* Scroll text */}
            <span className="text-white/80 text-sm font-medium mb-2 group-hover:text-white transition-colors duration-300">
              Разгледай
            </span>
            
            {/* Animated arrow container */}
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-white/20 rounded-full blur-lg scale-150 group-hover:bg-white/30 transition-all duration-300" />
              
              {/* Arrow background */}
              <div className="relative bg-white/10 backdrop-blur-md rounded-full p-3 border border-white/20 group-hover:border-white/40 transition-all duration-300">
                <ChevronDown 
                  className="w-6 h-6 text-white animate-bounce group-hover:animate-pulse" 
                />
              </div>
            </div>
            
            {/* Scroll line indicator */}
            <div className="w-px h-16 bg-gradient-to-b from-white/40 via-white/20 to-transparent mt-4 group-hover:from-white/60 transition-all duration-300" />
          </button>
        </div>
      </div>

      {/* Loading overlay */}
      {!isVideoLoaded && (
        <div className="absolute inset-0 z-30 bg-black flex items-center justify-center">
          <div className="text-white text-center">
            <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4 mx-auto" />
            <p className="text-lg font-light">{t('common.loading') || 'Loading...'}</p>
          </div>
        </div>
      )}


      {/* Enhanced film grain overlay for cinematic effect */}
      <div className="absolute inset-0 z-15 pointer-events-none opacity-30 mix-blend-multiply">
        <div 
          className="absolute inset-0 animate-pulse" 
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cfilter id='noise'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3C/defs%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.6'/%3E%3C/svg%3E")`
          }}
        />
      </div>
      
      {/* Additional film texture overlay */}
      <div className="absolute inset-0 z-16 pointer-events-none opacity-10">
        <div className="absolute inset-0 bg-repeat" style={{
          backgroundImage: `radial-gradient(circle at 20% 30%, rgba(0,0,0,0.3) 1px, transparent 2px),
                           radial-gradient(circle at 80% 70%, rgba(0,0,0,0.2) 1px, transparent 2px),
                           radial-gradient(circle at 40% 60%, rgba(0,0,0,0.1) 1px, transparent 2px)`,
          backgroundSize: '50px 50px, 75px 75px, 100px 100px',
          animation: 'grain 0.2s infinite'
        }} />
      </div>
    </section>
  );
};

export default CinematicVideoHero;