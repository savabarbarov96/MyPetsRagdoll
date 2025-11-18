import { useState, useEffect } from "react";
import { Helmet } from 'react-helmet-async';
import ModernNavigation from "@/components/ModernNavigation";
import CinematicVideoHero from "@/components/CinematicVideoHero";
import SEOIntroSection from "@/components/SEOIntroSection";
import FeaturedModelsSection from "@/components/FeaturedModelsSection";
import FAQSection from "@/components/FAQSection";
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
    <>
      <Helmet>
        <title>Ragdoll Котки и Котенца за Продажба | BleuRoi Развъдник България</title>
        <meta name="description" content="Купи чистокръвни Ragdoll котенца с родословие от лицензиран развъдник BleuRoi. Породисти Рагдол котки за семейства – нежни, спокойни и красиви. Лиценз 47090/2024." />
        <meta name="keywords" content="ragdoll котки, котенца рагдол, купи ragdoll коте, развъдник ragdoll българия, породисти котки с родословие, рагдол цена, котка за деца, спокойна котка" />
        <meta property="og:title" content="Ragdoll Котки и Котенца за Продажба | BleuRoi Развъдник България" />
        <meta property="og:description" content="Купи чистокръвни Ragdoll котенца с родословие от лицензиран развъдник BleuRoi. Породисти Рагдол котки за семейства." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.origin} />
        <link rel="canonical" href={window.location.origin} />
      </Helmet>

      <div className="min-h-screen bg-background relative">
        <BackgroundAnimations />

        {/* Navigation overlaid on video */}
        <ModernNavigation />

        <div className="relative">
          <div id="home">
            <CinematicVideoHero />
          </div>

          {/* SEO Introduction Section */}
          <SEOIntroSection />

          <div id="models">
            <FeaturedModelsSection />
          </div>

          {/* FAQ Section */}
          <FAQSection />

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

        {/* Structured Data for Organization */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "PetStore",
            "name": "BleuRoi Ragdoll Cattery",
            "description": "Лицензиран развъдник на чистокръвни Ragdoll котки в България",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "Сестри Дукови 4",
              "addressLocality": "Гоце Делчев",
              "postalCode": "2900",
              "addressCountry": "BG"
            },
            "url": "https://www.ragdollbleuroi.eu",
            "priceRange": "$$-$$$",
            "sameAs": [
              "https://www.facebook.com/bleuroi.ragdoll",
              "https://www.instagram.com/bleuroi.ragdoll",
              "https://www.tiktok.com/@bleuroi.ragdol.cattery"
            ]
          })}
        </script>
      </div>
    </>
  );
};

export default Index;
