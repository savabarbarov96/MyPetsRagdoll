import { useState, useEffect } from "react";
import ModernNavigation from "@/components/ModernNavigation";
import CinematicVideoHero from "@/components/CinematicVideoHero";
import FeaturedModelsSection from "@/components/FeaturedModelsSection";

import GallerySection from "@/components/GallerySection";
import NewsSection from "@/components/NewsSection";
import TikTokSection from "@/components/TikTokSection";
import Footer from "@/components/Footer";
import LocationMap from "@/components/LocationMap";
import SocialSidebar from "@/components/SocialSidebar";

import CatCarePopup from "@/components/CatCarePopup";
import BackgroundAnimations from "@/components/BackgroundAnimations";
import { useOptimizedQueries } from "@/hooks/useOptimizedQueries";

const Index = () => {
  const [showCatCarePopup, setShowCatCarePopup] = useState(false);
  const { isInitialLoadComplete, enableSecondaryQueries } = useOptimizedQueries();

  useEffect(() => {
    // Show cat care popup after 3 seconds
    const timer = setTimeout(() => {
      setShowCatCarePopup(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Enable secondary queries when user scrolls or interacts
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        enableSecondaryQueries();
        window.removeEventListener('scroll', handleScroll);
      }
    };

    const handleUserInteraction = () => {
      enableSecondaryQueries();
      ['click', 'touchstart', 'keydown'].forEach(event => {
        window.removeEventListener(event, handleUserInteraction);
      });
    };

    if (isInitialLoadComplete) {
      window.addEventListener('scroll', handleScroll, { passive: true });
      ['click', 'touchstart', 'keydown'].forEach(event => {
        window.addEventListener(event, handleUserInteraction, { passive: true });
      });
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      ['click', 'touchstart', 'keydown'].forEach(event => {
        window.removeEventListener(event, handleUserInteraction);
      });
    };
  }, [isInitialLoadComplete, enableSecondaryQueries]);

  return (
    <div className="min-h-screen bg-background relative">
      <BackgroundAnimations />
      
      {/* Navigation overlaid on video */}
      <ModernNavigation />
      
      <div className="relative">
        <div id="home">
          <CinematicVideoHero />
        </div>
      <div id="models">
        <FeaturedModelsSection />
      </div>
      <div id="gallery">
        <GallerySection />
      </div>

      <div id="news">
        <NewsSection />
      </div>
      <div id="tiktok">
        <TikTokSection />
      </div>
      <div id="contact">
        <LocationMap />
        <Footer />
      </div>
      
      {/* Sticky Social Sidebar */}
      <SocialSidebar />
      
      
      {/* Cat Care Responsibility Popup */}
      {showCatCarePopup && (
        <CatCarePopup 
          onClose={() => setShowCatCarePopup(false)}
        />
      )}
      </div>
    </div>
  );
};

export default Index;
