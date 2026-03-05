import { Helmet } from 'react-helmet-async';
import ModernNavigation from "@/components/ModernNavigation";
import BritishHeroSection from "@/components/BritishHeroSection";
import BritishSEOIntroSection from "@/components/BritishSEOIntroSection";
import BritishFeaturedModelsSection from "@/components/BritishFeaturedModelsSection";
import BritishFAQSection from "@/components/BritishFAQSection";
import Footer from "@/components/Footer";
import LocationMap from "@/components/LocationMap";
import SocialSidebar from "@/components/SocialSidebar";
import BackgroundAnimations from "@/components/BackgroundAnimations";
import { useLanguage } from "@/hooks/useLanguage";

const British = () => {
  const { t } = useLanguage();

  return (
    <>
      <Helmet>
        <title>{t('british.meta.title')}</title>
        <meta name="description" content={t('british.meta.description')} />
        <meta name="keywords" content={t('british.meta.keywords')} />
        <meta property="og:title" content={t('british.meta.title')} />
        <meta property="og:description" content={t('british.meta.description')} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${window.location.origin}/british`} />
        <link rel="canonical" href={`${window.location.origin}/british`} />
      </Helmet>

      <div className="min-h-screen bg-background relative">
        <BackgroundAnimations />
        <ModernNavigation />

        <div className="relative">
          <div id="home">
            <BritishHeroSection />
          </div>

          <BritishSEOIntroSection />

          <div id="models">
            <BritishFeaturedModelsSection />
          </div>

          <BritishFAQSection />

          <div id="contact">
            <LocationMap />
            <Footer />
          </div>

          <SocialSidebar />
        </div>

        {/* Structured Data for British Longhair */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "PetStore",
            "name": "BleuRoi Cattery - British Longhair & British Shorthair",
            "description": "Лицензиран развъдник на чистокръвни Британски Дългокосмести и Късокосмести котки в България",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "Сестри Дукови 4",
              "addressLocality": "Гоце Делчев",
              "postalCode": "2900",
              "addressCountry": "BG"
            },
            "url": "https://www.ragdollbleuroi.eu/british",
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

export default British;
