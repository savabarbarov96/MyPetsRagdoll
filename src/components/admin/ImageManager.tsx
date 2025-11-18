import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Upload, Plus, Grip, Loader2 } from 'lucide-react';
import EnhancedImageGallery from '@/components/ui/enhanced-image-gallery';
import { useFileUpload, validateImageFile, formatFileSize } from '@/services/convexFileService';
import { Id } from '../../../convex/_generated/dataModel';

interface ImageManagerProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  label?: string;
  maxImages?: number;
  associatedCatId?: Id<"cats">;
  imageType?: 'profile' | 'gallery' | 'general';
}

const ImageManager = ({ 
  images, 
  onImagesChange, 
  label = "Images",
  maxImages = 10,
  associatedCatId,
  imageType = 'gallery'
}: ImageManagerProps) => {
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryStartIndex, setGalleryStartIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  
  const { uploadFile } = useFileUpload();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;
    
    // Check total limit
    if (images.length + files.length > maxImages) {
      alert(`Максимум ${maxImages} изображения са разрешени. Можете да добавите само ${maxImages - images.length} още.`);
      return;
    }

    setIsUploading(true);
    const newImages = [...images];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileKey = `${file.name}-${Date.now()}-${i}`;

      // Validate file
      const validation = validateImageFile(file);
      if (!validation.valid) {
        alert(`${file.name}: ${validation.error}`);
        continue;
      }

      try {
        // Upload to Convex storage
        const result = await uploadFile(file, {
          associatedCatId,
          imageType,
          onProgress: (progress) => {
            setUploadProgress(prev => ({ ...prev, [fileKey]: progress }));
          }
        });

        if (result.success && result.url) {
          newImages.push(result.url);
        } else {
          alert(`Грешка при качване на ${file.name}: ${result.error}`);
        }
      } catch (error) {
        console.error('Upload error:', error);
        alert(`Грешка при качване на ${file.name}`);
      } finally {
        // Remove progress tracking for this file
        setUploadProgress(prev => {
          const { [fileKey]: _, ...rest } = prev;
          return rest;
        });
      }
    }

    onImagesChange(newImages);
    setIsUploading(false);
    
    // Reset input
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const openGallery = (startIndex: number) => {
    setGalleryStartIndex(startIndex);
    setIsGalleryOpen(true);
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">{label}</Label>
        <span className="text-sm text-muted-foreground">
          {images.length}/{maxImages}
        </span>
      </div>

      {/* Upload Area */}
      <div className="border-2 border-dashed border-border rounded-lg p-4">
        <Input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          className="hidden"
          id="image-upload"
          disabled={images.length >= maxImages || isUploading}
        />
        <Label
          htmlFor="image-upload"
          className={`flex flex-col items-center justify-center gap-2 cursor-pointer text-center ${
            images.length >= maxImages || isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted/50'
          } p-4 rounded-lg transition-colors`}
        >
          {isUploading ? (
            <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
          ) : (
            <Upload className="w-8 h-8 text-muted-foreground" />
          )}
          <div>
            <p className="font-medium">
              {isUploading 
                ? 'Качват се изображения...'
                : images.length >= maxImages 
                  ? 'Достигнат е максимумът изображения'
                  : 'Кликнете за качване или плъзнете изображения тук'
              }
            </p>
            <p className="text-sm text-muted-foreground">
              PNG, JPG, GIF, WebP до 10MB всяко
            </p>
            {Object.keys(uploadProgress).length > 0 && (
              <div className="mt-2 space-y-1">
                {Object.entries(uploadProgress).map(([fileKey, progress]) => (
                  <div key={fileKey} className="text-xs">
                    <div className="flex justify-between items-center">
                      <span>Качва се...</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-muted h-1 rounded">
                      <div 
                        className="bg-primary h-1 rounded transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Label>
      </div>

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {images.map((image, index) => (
            <div
              key={index}
              className="relative group bg-muted rounded-lg overflow-hidden aspect-square"
            >
              <img
                src={image}
                alt={`Image ${index + 1}`}
                className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                loading="lazy"
                decoding="async"
                onClick={() => openGallery(index)}
              />
              
              {/* Mobile-friendly Controls */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 sm:transition-opacity flex flex-col sm:flex-row gap-2 sm:opacity-100 md:opacity-0 md:group-hover:opacity-100">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => openGallery(index)}
                    className="text-xs min-h-[36px] min-w-[36px] bg-white/90 hover:bg-white"
                  >
                    Преглед
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => removeImage(index)}
                    className="text-xs min-h-[36px] min-w-[36px] bg-white/90 hover:bg-destructive hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Drag Handle - Hidden on mobile */}
              <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
                <div className="bg-black/60 text-white p-1 rounded cursor-move">
                  <Grip className="w-3 h-3" />
                </div>
              </div>

              {/* Image Index */}
              <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                {index + 1}
              </div>
            </div>
          ))}

          {/* Add More Button */}
          {images.length < maxImages && (
            <Label
              htmlFor="image-upload"
              className="aspect-square border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <Plus className="w-8 h-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Добави още</span>
            </Label>
          )}
        </div>
      )}

      {/* Quick Actions */}
      {images.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openGallery(0)}
            className="min-h-[44px] w-full sm:w-auto"
          >
            Преглед на всички ({images.length})
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onImagesChange([])}
            className="text-destructive hover:text-destructive min-h-[44px] w-full sm:w-auto"
          >
            Изчисти всички
          </Button>
        </div>
      )}

      {/* Enhanced Gallery Modal */}
      <EnhancedImageGallery
        images={images}
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        initialIndex={galleryStartIndex}
        title={`${label} Gallery`}
      />
    </div>
  );
};

export default ImageManager;