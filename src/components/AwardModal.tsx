import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Calendar, Building2, Award, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { AwardData, formatAwardDate, getCategoryLabel, getCategoryColor } from '@/services/convexAwardService';
import { useMobileDetection } from '@/hooks/useMobileDetection';

interface AwardModalProps {
  award: AwardData | null;
  isOpen: boolean;
  onClose: () => void;
}

const AwardModal = ({ award, isOpen, onClose }: AwardModalProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const { isMobile } = useMobileDetection();

  // Reset image index when award changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [award]);


  const allImages = award ? [award.certificateImage, ...award.galleryImages] : [];
  const hasMultipleImages = allImages.length > 1;

  const nextImage = () => {
    if (hasMultipleImages) {
      setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
    }
  };

  const prevImage = () => {
    if (hasMultipleImages) {
      setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isOpen) return;
    
    switch (e.key) {
      case 'ArrowLeft':
        prevImage();
        break;
      case 'ArrowRight':
        nextImage();
        break;
      case 'Escape':
        onClose();
        break;
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!award) return null;

  const modalContent = (
    <div className={`
      ${isMobile 
        ? 'fixed inset-0 z-50 bg-background overflow-y-auto' 
        : 'bg-card rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto'
      }
    `}>
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border p-4 sm:p-6 z-10">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge 
                variant="secondary" 
                className={`${getCategoryColor(award.category)} font-medium`}
              >
                {getCategoryLabel(award.category)}
              </Badge>
            </div>
            <h2 className="font-playfair text-xl sm:text-2xl font-bold text-foreground">
              {award.title}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="flex-shrink-0 h-10 w-10 rounded-full hover:bg-muted touch-manipulation"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6">
        {/* Image Gallery Section */}
        <div className="mb-6">
          <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted group">
            {/* Main Image */}
            <motion.img
              key={currentImageIndex}
              src={allImages[currentImageIndex]}
              alt={currentImageIndex === 0 ? `Сертификат за ${award.title}` : `Снимка ${currentImageIndex} от ${award.title}`}
              className="w-full h-full object-cover cursor-zoom-in"
              onClick={() => setIsImageZoomed(true)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />

            {/* Navigation Arrows */}
            {hasMultipleImages && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-200 touch-manipulation"
                  disabled={!hasMultipleImages}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-200 touch-manipulation"
                  disabled={!hasMultipleImages}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}

            {/* Zoom Icon */}
            <div className="absolute top-3 right-3 bg-black/50 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <ZoomIn className="h-4 w-4 text-white" />
            </div>

            {/* Image Counter */}
            {hasMultipleImages && (
              <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                {currentImageIndex + 1} / {allImages.length}
              </div>
            )}
          </div>

          {/* Thumbnail Strip */}
          {hasMultipleImages && (
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
              {allImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`flex-shrink-0 aspect-square w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 touch-manipulation ${
                    index === currentImageIndex 
                      ? 'border-primary shadow-sm' 
                      : 'border-transparent hover:border-muted-foreground/30'
                  }`}
                >
                  <img
                    src={image}
                    alt={`Миниатюра ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Award Details */}
        <div className="space-y-4">
          {/* Organization and Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Организация</p>
                <p className="font-medium">{award.awardingOrganization}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Дата</p>
                <p className="font-medium">{formatAwardDate(award.awardDate)}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-muted/30 rounded-xl p-4">
            <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <Award className="h-4 w-4" />
              Описание
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              {award.description}
            </p>
          </div>

          {/* Additional Achievements */}
          {award.achievements && (
            <div className="bg-primary/5 rounded-xl p-4">
              <h3 className="font-semibold text-foreground mb-2">Постижения</h3>
              <p className="text-muted-foreground leading-relaxed">
                {award.achievements}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Mobile: Full screen modal
  if (isMobile) {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            {modalContent}
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Desktop: Dialog modal
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-4xl w-full max-h-[90vh] overflow-y-auto p-0 gap-0"
        onPointerDownOutside={onClose}
      >
        {modalContent}
      </DialogContent>
    </Dialog>
  );
};

export default AwardModal;