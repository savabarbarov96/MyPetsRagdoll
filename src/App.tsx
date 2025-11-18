import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import News from "./pages/News";
import NewsArticle from "./pages/NewsArticle";
import CatRedirect from "./pages/CatRedirect";
import Analytics from "./components/Analytics";
import { LocationBasedTheme } from "@/hooks/useTheme";
import { Helmet } from 'react-helmet-async';
import { LanguageProvider, useLanguage } from "@/hooks/useLanguage";
import PerformanceOptimizer from "./components/PerformanceOptimizer";
import { ImagePreloader, CRITICAL_IMAGES, BackgroundImagePreloader } from "./components/ImagePreloader";
import { useCriticalImagePreloader } from "@/hooks/useImagePreloader";

const AppContent = () => {
  const { t } = useLanguage();
  const { isLoading } = useCriticalImagePreloader(CRITICAL_IMAGES);
  
  // Additional images to preload in background after critical images
  const backgroundImages = [
    '/featured-cat-1.jpg',
    '/featured-cat-2.jpg',
    '/model-cat-1.jpg',
    '/model-cat-2.jpg',
    '/model-cat-3.jpg'
  ];
  
  return (
    <>
      <Toaster />
      <Sonner />
      <Analytics />
      <PerformanceOptimizer />
      
      {/* Preload critical images with loading UI */}
      <ImagePreloader 
        criticalImages={CRITICAL_IMAGES} 
        showProgress={isLoading}
      />
      
      {/* Background preload non-critical images */}
      <BackgroundImagePreloader images={backgroundImages} />
      
      <Helmet>
        <title>{t('meta.title')}</title>
        <meta name="description" content={t('meta.description')} />
        {/* Preload critical images via link tags for browsers that support it */}
        {CRITICAL_IMAGES.map((src) => (
          <link 
            key={src} 
            rel="preload" 
            as="image" 
            href={src}
            fetchPriority="high"
          />
        ))}
      </Helmet>
      
      <LocationBasedTheme>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/about" element={<About />} />
          <Route path="/news" element={<News />} />
          <Route path="/news/:slug" element={<NewsArticle />} />
          <Route path="/cat/:catId" element={<CatRedirect />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </LocationBasedTheme>
    </>
  );
};

const App = () => (
  <LanguageProvider>
    <AppContent />
  </LanguageProvider>
);

export default App;
