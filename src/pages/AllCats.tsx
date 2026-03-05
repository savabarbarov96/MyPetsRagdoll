import { Helmet } from 'react-helmet-async';
import ModernNavigation from "@/components/ModernNavigation";
import FeaturedModelsSection from "@/components/FeaturedModelsSection";
import BritishFeaturedModelsSection from "@/components/BritishFeaturedModelsSection";
import Footer from "@/components/Footer";
import LocationMap from "@/components/LocationMap";
import SocialSidebar from "@/components/SocialSidebar";
import BackgroundAnimations from "@/components/BackgroundAnimations";
import { useLanguage } from "@/hooks/useLanguage";

const AllCats = () => {
  const { t } = useLanguage();

  return (
    <>
      <Helmet>
        <title>{t('allCats.meta.title')}</title>
        <meta name="description" content={t('allCats.meta.description')} />
        <meta property="og:title" content={t('allCats.meta.title')} />
        <meta property="og:description" content={t('allCats.meta.description')} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${window.location.origin}/all-cats`} />
        <link rel="canonical" href={`${window.location.origin}/all-cats`} />
      </Helmet>

      <div className="min-h-screen bg-background relative">
        <BackgroundAnimations />
        <ModernNavigation />

        <div className="relative">
          {/* Page Header */}
          <div className="pt-32 pb-16 bg-gradient-to-b from-black/5 to-transparent">
            <div className="container mx-auto px-6 lg:px-8 text-center">
              <h1 className="font-playfair text-4xl lg:text-6xl font-light text-foreground mb-4">
                {t('allCats.title')}
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                {t('allCats.subtitle')}
              </p>
            </div>
          </div>

          {/* Ragdoll Section */}
          <div id="ragdoll-models">
            <div className="container mx-auto px-6 lg:px-8 mb-8">
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-border" />
                <h2 className="font-playfair text-2xl lg:text-3xl font-light text-foreground whitespace-nowrap">
                  Ragdoll
                </h2>
                <div className="h-px flex-1 bg-border" />
              </div>
            </div>
            <FeaturedModelsSection />
          </div>

          {/* British Section */}
          <div id="british-models">
            <div className="container mx-auto px-6 lg:px-8 mb-8">
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-amber-300" />
                <h2 className="font-playfair text-2xl lg:text-3xl font-light text-amber-700 whitespace-nowrap">
                  British Longhair & Shorthair
                </h2>
                <div className="h-px flex-1 bg-amber-300" />
              </div>
            </div>
            <BritishFeaturedModelsSection />
          </div>

          <div id="contact">
            <LocationMap />
            <Footer />
          </div>

          <SocialSidebar />
        </div>
      </div>
    </>
  );
};

export default AllCats;
