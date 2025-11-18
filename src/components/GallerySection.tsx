import { useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Image, Award, Filter } from 'lucide-react';
import GalleryCard from './GalleryCard';
import GalleryModal from './GalleryModal';
import { 
  useGalleryCategoriesWithCounts, 
  GalleryItem, 
  GalleryCategory 
} from '@/services/convexGalleryService';
import { useLazyGalleryData } from '@/hooks/useOptimizedQueries';
import { useMobileDetection } from '@/hooks/useMobileDetection';
import { useIntersectionPreloader } from './ImagePreloader';

const GallerySection = () => {
  const [selectedCategory, setSelectedCategory] = useState<GalleryCategory | "all">("all");
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAllItems, setShowAllItems] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  const galleryRef = useRef<HTMLDivElement>(null);
  const { isMobile } = useMobileDetection();
  const galleryItems = useLazyGalleryData(selectedCategory, hasUserInteracted);
  const categories = useGalleryCategoriesWithCounts();

  // Preload images when gallery section comes into view
  const imagesToPreload = useMemo(() => {
    return galleryItems?.slice(0, 12).map(item => item.imageUrl) || [];
  }, [galleryItems]);

  useIntersectionPreloader(galleryRef, imagesToPreload, { 
    threshold: 0.1,
    rootMargin: '100px' 
  });

  // Filter items based on display limit
  const displayedItems = useMemo(() => {
    if (!galleryItems) return [];
    
    if (showAllItems) {
      return galleryItems;
    }
    
    // Show 6 items initially, 9 on larger screens
    const limit = isMobile ? 6 : 9;
    return galleryItems.slice(0, limit);
  }, [galleryItems, showAllItems, isMobile]);

  const handleItemClick = (item: GalleryItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const handleCategoryChange = (category: GalleryCategory | "all") => {
    setSelectedCategory(category);
    setShowAllItems(false); // Reset show all when changing categories
    setHasUserInteracted(true); // Enable data loading on interaction
  };

  // Enable data loading when section comes into view
  const handleSectionVisible = () => {
    if (!hasUserInteracted) {
      setHasUserInteracted(true);
    }
  };

  if (!categories || categories.length === 0) {
    return null; // Don't show section if no gallery items
  }

  const totalItems = galleryItems?.length || 0;
  const hasMoreItems = totalItems > displayedItems.length;

  return (
    <section 
      ref={galleryRef}
      className="py-4 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-background via-primary/5 to-muted/30 relative overflow-hidden"
      onMouseEnter={handleSectionVisible}
      onFocus={handleSectionVisible}
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-primary/15 to-transparent rounded-full blur-3xl"></div>
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12">

          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-playfair text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6"
          >
            Нашата
            <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent"> галерия</span>
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed"
          >
            Разгледайте нашата колекция от снимки, награди, сертификати и специални моменти от нашия път в развъждането на Ragdoll котки. 
            <span className="text-foreground font-medium"> Щракнете на всяка снимка за повече подробности.</span>
          </motion.p>
        </div>

        {/* Category Filter */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-8"
        >
          {isMobile ? (
            // Mobile: Horizontal scroll
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Филтрирай по категория:</span>
              </div>
              <ScrollArea className="w-full">
                <div className="flex gap-2 pb-2">
                  {categories.map((category) => (
                    <Button
                      key={category.key}
                      variant={selectedCategory === category.key ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleCategoryChange(category.key as GalleryCategory | "all")}
                      className="flex-shrink-0 whitespace-nowrap touch-manipulation min-h-[44px]"
                    >
                      {category.label}
                      {category.count > 0 && (
                        <span className="ml-1 text-xs bg-background/20 px-1.5 py-0.5 rounded-full">
                          {category.count}
                        </span>
                      )}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          ) : (
            // Desktop: Centered buttons
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              {categories.map((category) => (
                <Button
                  key={category.key}
                  variant={selectedCategory === category.key ? "default" : "outline"}
                  onClick={() => handleCategoryChange(category.key as GalleryCategory | "all")}
                  className="flex items-center gap-2"
                >
                  {category.label}
                  {category.count > 0 && (
                    <span className="text-xs bg-background/20 px-1.5 py-0.5 rounded-full">
                      {category.count}
                    </span>
                  )}
                </Button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Gallery Grid */}
        {displayedItems.length > 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10 mb-12"
          >
            {displayedItems.map((item, index) => (
              <motion.div
                key={item._id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className="transform transition-all duration-300"
              >
                <GalleryCard 
                  item={item} 
                  onClick={handleItemClick}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-12">
            <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {selectedCategory === "all" 
                ? "Все още няма публикувани елементи в галерията." 
                : "Няма елементи в тази категория."
              }
            </p>
          </div>
        )}

        {/* Show More Button */}
        {hasMoreItems && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-center"
          >
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => setShowAllItems(true)}
              className="bg-background border-border text-foreground hover:bg-muted min-h-[44px] px-8"
            >
              Покажи всички {totalItems} елемента
            </Button>
          </motion.div>
        )}

        {/* Gallery Modal */}
        <GalleryModal
          item={selectedItem}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      </div>
    </section>
  );
};

export default GallerySection;