import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useDisplayedCatsByGenderAndAge, CatData, useCatById } from "@/services/convexCatService";
import { getFallbackRagdollCatsWithIds } from "@/data/fallbackRagdollCats";
import PedigreeModal from "./PedigreeModal";
import SocialContactModal from "./SocialContactModal";
import EnhancedImageGallery from "./ui/enhanced-image-gallery";
import CatTikTokVideos from "./CatTikTokVideos";
import { useTikTokVideosByCat } from "@/services/convexTikTokService";
import CatStatusTag from "./ui/cat-status-tag";
import { useLanguage } from "@/hooks/useLanguage";
import { useCatURL } from "@/hooks/useCatURL";
import { Id } from "../../convex/_generated/dataModel";
import { Share2 } from "lucide-react";
import { toast } from "sonner";

type SectionType = 'male' | 'female' | 'kitten';

// Component for individual cat sections
interface CatSectionProps {
  title: string;
  cats: CatData[];
  onCatClick: (cat: CatData) => void;
  onPedigreeClick: (cat: CatData) => void;
  t: <T = string>(key: string) => T;
  gridVisible: boolean;
  sectionId: string;
}

const CatSection = ({ title, cats, onCatClick, onPedigreeClick, t, gridVisible, sectionId }: CatSectionProps) => {
  return (
    <div id={sectionId} className="space-y-8 scroll-mt-32">
      {/* Section Title */}
      <h3 className="font-playfair text-3xl lg:text-4xl font-light text-foreground text-center">
        {title}
      </h3>
      
      {/* 3-column grid for cats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 justify-items-center max-w-5xl mx-auto">
        {cats.map((cat, index) => {
          const displayImage = cat.image || cat.gallery?.[0] || '/british-herosection.jpg';
          return (
          <div
            key={cat._id}
            className={`group relative transition-all duration-300 max-w-xs w-full ${
              gridVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
            }`}
            style={{
              transitionDelay: gridVisible ? `${index * 0.1}s` : '0s'
            }}
          >
            {/* Main circular card */}
            <div
              className="relative cursor-pointer"
              onClick={() => onCatClick(cat)}
            >
              {/* Circular image container */}
              <div className="relative w-48 h-48 sm:w-56 sm:h-56 lg:w-64 lg:h-64 mx-auto">
                {/* Status Tag - positioned at top center */}
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-20">
                  <CatStatusTag status={cat.status} />
                </div>

                <div className="w-full h-full rounded-full overflow-hidden shadow-xl group-hover:shadow-2xl transition-shadow duration-300 border-4 border-white">
                  <img
                    src={displayImage}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                
                {/* Gradient overlay for text */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-8">
                  <div className="text-white text-center">
                    <h3 className="font-bold text-lg mb-1">{cat.name}</h3>
                    <p className="text-xs uppercase tracking-wide">{cat.subtitle}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card content below the circle */}
            <div className="mt-6 text-center space-y-3">
              <div>
                <h3 className="font-playfair text-xl font-semibold text-foreground mb-1">{cat.name}</h3>
                <p className="text-sm text-muted-foreground uppercase tracking-wide">{cat.subtitle}</p>
              </div>
              
              {/* Action buttons */}
              <div className="flex flex-col gap-2 px-2 sm:px-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors text-xs sm:text-sm"
                  onClick={() => onCatClick(cat)}
                >
                  {t('featuredModels.selectModel')}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full border-muted text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-xs sm:text-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPedigreeClick(cat);
                  }}
                >
                  {t('featuredModels.viewPedigree')}
                </Button>
              </div>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
};

const FeaturedModelsSection = () => {
  const { t } = useLanguage();
  const { generateCatURL, copyToClipboard } = useCatURL();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const sectionTitles = {
    male: t('featuredModels.sectionTitles.male'),
    female: t('featuredModels.sectionTitles.female'),
    kitten: t('featuredModels.sectionTitles.kitten')
  };
  const [selectedCat, setSelectedCat] = useState<CatData | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isPedigreeOpen, setIsPedigreeOpen] = useState(false);
  const [pedigreeCat, setPedigreeCat] = useState<CatData | null>(null);
  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);
  const [socialCat, setSocialCat] = useState<CatData | null>(null);
  const [isEnhancedGalleryOpen, setIsEnhancedGalleryOpen] = useState(false);
  const [enhancedGalleryImages, setEnhancedGalleryImages] = useState<string[]>([]);
  const [enhancedGalleryTitle, setEnhancedGalleryTitle] = useState("");
  
  // Get URL parameters for deep linking
  const catId = searchParams.get('cat');
  const modal = searchParams.get('modal');
  
  // Query for the cat from URL parameter
  const urlCat = useCatById(catId as Id<"cats"> | undefined);
  // Get cats for each section
  const maleCats = useDisplayedCatsByGenderAndAge('male');
  const femaleCats = useDisplayedCatsByGenderAndAge('female');
  const kittenCats = useDisplayedCatsByGenderAndAge('kitten');
  
  // Use fallback cats if database is empty
  const fallbackCats = getFallbackRagdollCatsWithIds('all');
  const maleCatsToShow = (maleCats && maleCats.length > 0) ? maleCats : fallbackCats.filter(cat => cat.gender === 'male');
  const femaleCatsToShow = (femaleCats && femaleCats.length > 0) ? femaleCats : fallbackCats.filter(cat => cat.gender === 'female');
  const kittenCatsToShow = (kittenCats && kittenCats.length > 0) ? kittenCats : fallbackCats.filter(cat => cat.category === 'kitten');
  const { elementRef: sectionRef, isVisible: sectionVisible } = useScrollAnimation(0.1);
  const { elementRef: headerRef, isVisible: headerVisible } = useScrollAnimation(0.1);
  const { elementRef: gridRef, isVisible: gridVisible } = useScrollAnimation(0.1);
  
  // DEBUG: Force gridVisible to true to test if scroll animation is the issue
  const gridVisibleForced = true;

  // Handle URL-based modal opening
  useEffect(() => {
    if (catId && modal) {
      if (urlCat) {
        // Cat exists, open the appropriate modal
        if (modal === 'pedigree') {
          setPedigreeCat(urlCat);
          setIsPedigreeOpen(true);
        } else if (modal === 'gallery') {
          setSelectedCat(urlCat);
          setIsGalleryOpen(true);
        } else if (modal === 'contact') {
          setSocialCat(urlCat);
          setIsSocialModalOpen(true);
        }
      } else if (urlCat === null) {
        // Cat doesn't exist, clear the URL parameters and show error
        console.warn(`Cat with ID ${catId} not found`);
        clearURLParams();
        // Optionally show a toast notification
        // toast.error('Котето не е намерено');
      }
    }
  }, [urlCat, catId, modal]);

  // Helper function to update URL parameters
  const updateURLParams = (catId: string, modalType?: 'pedigree' | 'gallery' | 'contact') => {
    const params = new URLSearchParams();
    params.set('cat', catId);
    if (modalType) {
      params.set('modal', modalType);
    }
    setSearchParams(params);
  };

  // Helper function to clear URL parameters
  const clearURLParams = () => {
    setSearchParams({});
  };

  const openGallery = (cat: CatData) => {
    setSelectedCat(cat);
    setIsGalleryOpen(true);
    updateURLParams(cat._id, 'gallery');
  };

  const closeGallery = () => {
    setIsGalleryOpen(false);
    setSelectedCat(null);
    clearURLParams();
  };

  const openPedigree = (cat: CatData) => {
    setPedigreeCat(cat);
    setIsPedigreeOpen(true);
    updateURLParams(cat._id, 'pedigree');
  };

  const closePedigree = () => {
    setIsPedigreeOpen(false);
    setPedigreeCat(null);
    clearURLParams();
  };

  const openSocialModal = (cat: CatData) => {
    setSocialCat(cat);
    setIsSocialModalOpen(true);
    updateURLParams(cat._id, 'contact');
  };

  const closeSocialModal = () => {
    setIsSocialModalOpen(false);
    setSocialCat(null);
    clearURLParams();
  };

  const openEnhancedGallery = (images: string[], title: string) => {
    setEnhancedGalleryImages(images);
    setEnhancedGalleryTitle(title);
    setIsEnhancedGalleryOpen(true);
  };

  const closeEnhancedGallery = () => {
    setIsEnhancedGalleryOpen(false);
    setEnhancedGalleryImages([]);
    setEnhancedGalleryTitle("");
  };

  // Check loading states
  const isLoading = maleCats === undefined || femaleCats === undefined || kittenCats === undefined;
  const allSectionsEmpty = (!maleCatsToShow || maleCatsToShow.length === 0) && 
                           (!femaleCatsToShow || femaleCatsToShow.length === 0) && 
                           (!kittenCatsToShow || kittenCatsToShow.length === 0);


  return (
    <>
      <section ref={sectionRef} className="py-20 bg-gradient-subtle mb-24">
        <div className="container mx-auto px-6 lg:px-8">

          {/* Section Header */}
          <div 
            ref={headerRef}
            className={`text-center mb-12 transition-all duration-1000 ${
              headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <h2 className="font-playfair text-4xl lg:text-5xl font-light text-foreground">
              {t('featuredModels.title')}
            </h2>
          </div>


          {/* Loading State */}
          {isLoading && (
            <div className="text-center mb-8">
              <p className="text-muted-foreground">{t('featuredModels.loading')}</p>
            </div>
          )}
          
          {/* Empty State */}
          {!isLoading && allSectionsEmpty && (
            <div className="text-center mb-8">
              <p className="text-muted-foreground">{t('featuredModels.noAvailable')}</p>
            </div>
          )}
          
          {/* Three Separate Sections */}
          {!isLoading && !allSectionsEmpty && (
            <div className="space-y-16">
              {/* Males Section */}
              {maleCatsToShow && maleCatsToShow.length > 0 && (
                <CatSection
                  title={sectionTitles.male}
                  cats={maleCatsToShow}
                  onCatClick={openGallery}
                  onPedigreeClick={openPedigree}
                  t={t}
                  gridVisible={gridVisibleForced}
                  sectionId="males"
                />
              )}
              
              {/* Females Section */}
              {femaleCatsToShow && femaleCatsToShow.length > 0 && (
                <CatSection
                  title={sectionTitles.female}
                  cats={femaleCatsToShow}
                  onCatClick={openGallery}
                  onPedigreeClick={openPedigree}
                  t={t}
                  gridVisible={gridVisibleForced}
                  sectionId="females"
                />
              )}
              
              {/* Kittens Section */}
              {kittenCatsToShow && kittenCatsToShow.length > 0 && (
                <CatSection
                  title={sectionTitles.kitten}
                  cats={kittenCatsToShow}
                  onCatClick={openGallery}
                  onPedigreeClick={openPedigree}
                  t={t}
                  gridVisible={gridVisibleForced}
                  sectionId="kittens"
                />
              )}
            </div>
          )}
        </div>
      </section>

      {/* Gallery Modal */}
      {isGalleryOpen && selectedCat && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-border">
              <div>
                <h3 className="font-playfair text-2xl font-semibold text-foreground">
                  {selectedCat.name}
                </h3>
                <p className="text-muted-foreground uppercase tracking-wide text-sm">
                  {selectedCat.subtitle}
                </p>
              </div>
              <Button 
                variant="minimal" 
                size="sm" 
                onClick={closeGallery}
                className="rounded-full w-10 h-10 p-0 text-amber-500 hover:text-amber-600 hover:bg-amber-50 border border-amber-300 hover:border-amber-400"
              >
                ×
              </Button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Gallery */}
                <div className="space-y-4">
                  {(() => {
                    const mainImg = selectedCat.image || selectedCat.gallery?.[0] || '/british-herosection.jpg';
                    const extraImages = selectedCat.gallery.filter(img => img !== mainImg && img !== selectedCat.image);
                    const allUniqueImages = [mainImg, ...extraImages];

                    return (
                      <>
                        <img
                          src={mainImg}
                          alt={selectedCat.name}
                          className="w-full rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => openEnhancedGallery(allUniqueImages, `${selectedCat.name} - ${t('featuredModels.galleryLabel')}`)}
                        />

                        {extraImages.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <h4 className="text-sm font-medium text-muted-foreground">
                                {t('featuredModels.morePhotos')} ({extraImages.length})
                              </h4>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEnhancedGallery(allUniqueImages, `${selectedCat.name} - ${t('featuredModels.galleryLabel')}`)}
                              >
                                Виж всички
                              </Button>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              {extraImages.slice(0, 6).map((img, index) => (
                                <img
                                  key={index}
                                  src={img}
                                  alt={`${selectedCat.name} ${index + 2}`}
                                  className="w-full h-20 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => openEnhancedGallery(allUniqueImages, `${selectedCat.name} - ${t('featuredModels.galleryLabel')}`)}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}

                  {/* TikTok Videos Section */}
                  <CatTikTokVideos catId={selectedCat._id} catName={selectedCat.name} />
                </div>

                {/* Details */}
                <div className="space-y-6">
                  <p className="text-foreground leading-relaxed">
                    {selectedCat.description}
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-muted-foreground">Възраст</span>
                      <span className="font-medium">{selectedCat.age}</span>
                    </div>
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-muted-foreground">Цвят</span>
                      <span className="font-medium">{selectedCat.color}</span>
                    </div>
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-muted-foreground">Статус</span>
                      <span className={`font-medium ${selectedCat.status === "Достъпен" ? "text-green-600" : "text-orange-600"}`}>
                        {selectedCat.status}
                      </span>
                    </div>
                    {selectedCat.registrationNumber && (
                      <div className="flex justify-between border-b border-border pb-2">
                        <span className="text-muted-foreground">Регистрационен номер</span>
                        <span className="font-medium">{selectedCat.registrationNumber}</span>
                      </div>
                    )}
                    {selectedCat.freeText && (
                      <div className="border-b border-border pb-2">
                        <span className="text-muted-foreground block mb-1">Допълнителна информация</span>
                        <span className="font-medium">{selectedCat.freeText}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    {/* Only show request button if cat is available */}
                    {(selectedCat.status === "Достъпен" || selectedCat.status === "Налична") && (
                      <Button 
                        variant="modern" 
                        className="w-full"
                        onClick={() => openSocialModal(selectedCat)}
                      >
                        Заявете сега
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      className="w-full flex items-center gap-2"
                      onClick={async () => {
                        const success = await copyToClipboard(selectedCat._id, 'gallery');
                        if (success) {
                          toast.success('Връзката е копирана!');
                        } else {
                          toast.error('Неуспешно копиране на връзката');
                        }
                      }}
                    >
                      <Share2 className="h-4 w-4" />
                      Споделете
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full bg-amber-500 border-amber-500 text-white hover:bg-amber-600 hover:border-amber-600"
                      onClick={() => openPedigree(selectedCat)}
                    >
                      Повече информация
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pedigree Modal */}
      {isPedigreeOpen && pedigreeCat && (
        <PedigreeModal
          cat={pedigreeCat}
          isOpen={isPedigreeOpen}
          onClose={closePedigree}
        />
      )}

      {/* Social Contact Modal */}
      {isSocialModalOpen && socialCat && (
        <SocialContactModal
          cat={socialCat}
          isOpen={isSocialModalOpen}
          onClose={closeSocialModal}
        />
      )}

      {/* Enhanced Image Gallery */}
      <EnhancedImageGallery
        images={enhancedGalleryImages}
        isOpen={isEnhancedGalleryOpen}
        onClose={closeEnhancedGallery}
        title={enhancedGalleryTitle}
      />
    </>
  );
};

export default FeaturedModelsSection;