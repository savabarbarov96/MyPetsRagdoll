import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar, Tag, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GalleryItem, getCategoryLabel, getCategoryColor, formatGalleryDate } from '@/services/convexGalleryService';

interface GalleryModalProps {
  item: GalleryItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const GalleryModal = ({ item, isOpen, onClose }: GalleryModalProps) => {
  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <div className="relative">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Image - ensure full image visible */}
          <div className="aspect-[16/10] overflow-hidden flex items-center justify-center bg-black">
            <img
              src={item.imageUrl}
              alt={item.title}
              className="max-w-full max-h-full object-contain"
              loading="lazy"
              decoding="async"
            />
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Header with category */}
            <div className="flex items-start gap-3">
              <Badge 
                variant="secondary" 
                className={`${getCategoryColor(item.category)} font-medium flex-shrink-0`}
              >
                {getCategoryLabel(item.category)}
              </Badge>
              <DialogHeader className="flex-1">
                <DialogTitle className="font-playfair text-2xl font-bold text-left">
                  {item.title}
                </DialogTitle>
              </DialogHeader>
            </div>

            {/* Description */}
            {item.description && (
              <div className="prose prose-sm max-w-none">
                <p className="text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            )}

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pt-2 border-t border-border">
              {item.date && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{formatGalleryDate(item.date)}</span>
                </div>
              )}
              {item.tags && item.tags.length > 0 && (
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  <span>{item.tags.length} {item.tags.length === 1 ? 'таг' : 'тага'}</span>
                </div>
              )}
            </div>

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-foreground">Тагове:</h4>
                <div className="flex flex-wrap gap-2">
                  {item.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GalleryModal;