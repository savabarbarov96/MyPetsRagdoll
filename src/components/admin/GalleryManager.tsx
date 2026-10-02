import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { GlowButton, RippleButton } from '@/components/ui/animated-button';
import { Plus, Edit, Trash2, Save, Eye, Image, Calendar, Tag, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAdminQuery as useQuery, useAdminMutation as useMutation } from '@/lib/adminConvex';
import { api } from '../../../convex/_generated/api';
import { useCats, type CatData } from '@/services/convexCatService';
import { Id } from '../../../convex/_generated/dataModel';

type GalleryCategory = "award" | "certificate" | "photo" | "trophy" | "achievement";

interface GalleryItem {
  _id: Id<"gallery">;
  title: string;
  description?: string;
  imageUrl: string;
  category: GalleryCategory;
  date?: string;
  isPublished: boolean;
  sortOrder: number;
  uploadedAt: number;
  associatedCatId?: Id<"cats">;
  tags?: string[];
}

interface GalleryFormData {
  title: string;
  description: string;
  imageUrl: string;
  category: GalleryCategory;
  date: string;
  associatedCatId: string; // Empty string for no selection
  tags: string[];
  newTag: string;
}

const initialFormData: GalleryFormData = {
  title: '',
  description: '',
  imageUrl: '',
  category: 'photo',
  date: '',
  associatedCatId: '',
  tags: [],
  newTag: '',
};

const GALLERY_CATEGORIES: { value: GalleryCategory; label: string }[] = [
  { value: 'award', label: 'Награда' },
  { value: 'certificate', label: 'Сертификат' },
  { value: 'photo', label: 'Снимка' },
  { value: 'trophy', label: 'Трофей' },
  { value: 'achievement', label: 'Постижение' },
];

const GalleryManager = () => {
  const galleryItems = useQuery(api.gallery.getAllGalleryItems);
  const cats = useCats();
  
  const createGalleryItem = useMutation(api.gallery.createGalleryItem);
  const updateGalleryItem = useMutation(api.gallery.updateGalleryItem);
  const deleteGalleryItem = useMutation(api.gallery.deleteGalleryItem);
  const togglePublication = useMutation(api.gallery.toggleGalleryItemPublication);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [formData, setFormData] = useState<GalleryFormData>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isDialogOpen) {
      setFormData(initialFormData);
      setEditingItem(null);
    }
  }, [isDialogOpen]);

  // Populate form when editing
  useEffect(() => {
    if (editingItem) {
      setFormData({
        title: editingItem.title,
        description: editingItem.description || '',
        imageUrl: editingItem.imageUrl,
        category: editingItem.category,
        date: editingItem.date || '',
        associatedCatId: editingItem.associatedCatId || '',
        tags: editingItem.tags || [],
        newTag: '',
      });
    }
  }, [editingItem]);

  const handleInputChange = (field: keyof GalleryFormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (url: string) => {
    setFormData(prev => ({ ...prev, imageUrl: url }));
  };

  const addTag = () => {
    if (formData.newTag.trim() && !formData.tags.includes(formData.newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, prev.newTag.trim()],
        newTag: ''
      }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.imageUrl) {
      toast({
        title: "Грешка",
        description: "Моля попълнете всички задължителни полета и качете снимка.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const itemData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        imageUrl: formData.imageUrl,
        category: formData.category,
        date: formData.date || undefined,
        associatedCatId: formData.associatedCatId ? formData.associatedCatId as Id<"cats"> : undefined,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
      };

      if (editingItem) {
        await updateGalleryItem({
          id: editingItem._id,
          ...itemData,
        });
        toast({
          title: "Успех",
          description: "Елементът от галерията е обновен успешно.",
        });
      } else {
        await createGalleryItem(itemData);
        toast({
          title: "Успех", 
          description: "Елементът от галерията е създаден успешно.",
        });
      }

      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving gallery item:', error);
      toast({
        title: "Грешка",
        description: "Възникна грешка при запазване на елемента.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (item: GalleryItem) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const handleDelete = async (itemId: Id<"gallery">) => {
    if (!confirm('Сигурни ли сте, че искате да изтриете този елемент от галерията?')) {
      return;
    }

    try {
      await deleteGalleryItem({ id: itemId });
      toast({
        title: "Успех",
        description: "Елементът от галерията е изтрит успешно.",
      });
    } catch (error) {
      console.error('Error deleting gallery item:', error);
      toast({
        title: "Грешка",
        description: "Възникна грешка при изтриване.",
        variant: "destructive",
      });
    }
  };

  const handleTogglePublication = async (itemId: Id<"gallery">) => {
    try {
      await togglePublication({ id: itemId });
      toast({
        title: "Успех",
        description: "Статусът на публикация е променен.",
      });
    } catch (error) {
      console.error('Error toggling publication:', error);
      toast({
        title: "Грешка",
        description: "Възникна грешка при промяна на статуса.",
        variant: "destructive",
      });
    }
  };

  const getCategoryLabel = (category: GalleryCategory): string => {
    const categoryItem = GALLERY_CATEGORIES.find(cat => cat.value === category);
    return categoryItem?.label || category;
  };

  const getCategoryColor = (category: GalleryCategory): string => {
    const colors = {
      award: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      certificate: 'bg-blue-100 text-blue-800 border-blue-300',
      photo: 'bg-green-100 text-green-800 border-green-300',
      trophy: 'bg-purple-100 text-purple-800 border-purple-300',
      achievement: 'bg-orange-100 text-orange-800 border-orange-300'
    };
    return colors[category];
  };

  const sortedItems = galleryItems?.sort((a, b) => b.uploadedAt - a.uploadedAt) || [];

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-playfair text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
            <Image className="h-7 w-7 text-primary" />
            Управление на галерията
          </h1>
          <p className="text-muted-foreground mt-1">
            Добавяне и редактиране на снимки в бизнес галерията
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <GlowButton size="default" className="min-h-[44px] touch-manipulation">
              <Plus className="h-4 w-4 mr-2" />
              Нов елемент
            </GlowButton>
          </DialogTrigger>

          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Редактиране на елемент' : 'Нов елемент в галерията'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <Label htmlFor="title">Заглавие *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Например: Best in Show Award 2024"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Описание</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Описание на снимката или постижението..."
                  rows={3}
                />
              </div>

              {/* Category and Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Категория *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: GalleryCategory) => handleInputChange('category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GALLERY_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="date">Дата</Label>
                  <Input
                    id="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    placeholder="2024, януари 2024, и т.н."
                  />
                </div>
              </div>

              {/* Associated Cat */}
              <div>
                <Label htmlFor="associatedCat">Свързана котка (опционално)</Label>
                <Select
                  value={formData.associatedCatId}
                  onValueChange={(value) => handleInputChange('associatedCatId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Изберете котка..." />
                  </SelectTrigger>
                  <SelectContent>
                    {cats?.map((cat: CatData) => (
                      <SelectItem key={cat._id} value={cat._id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Image Upload */}
              <div>
                <Label>Снимка *</Label>
                <ImageUpload
                  onUploadSuccess={handleImageUpload}
                  currentImageUrl={formData.imageUrl}
                  label="Снимка"
                  placeholder="Качете снимка"
                  required
                  uploadOptions={{ imageType: "gallery" }}
                  previewSize="large"
                />
              </div>

              {/* Tags */}
              <div>
                <Label>Тагове</Label>
                <div className="space-y-2">
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {formData.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {tag}
                          <X 
                            className="h-3 w-3 cursor-pointer hover:text-destructive" 
                            onClick={() => removeTag(tag)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Input
                      value={formData.newTag}
                      onChange={(e) => handleInputChange('newTag', e.target.value)}
                      placeholder="Добавете таг..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                    />
                    <Button type="button" variant="outline" onClick={addTag}>
                      <Tag className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isSaving}
                >
                  Отказ
                </Button>
                <RippleButton
                  type="submit"
                  disabled={isSaving}
                  className="min-w-[100px]"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Запазване...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {editingItem ? 'Обнови' : 'Създай'}
                    </>
                  )}
                </RippleButton>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Gallery Items List */}
      <div className="grid gap-4">
        {sortedItems.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Image className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Все още няма елементи в галерията.</p>
            </CardContent>
          </Card>
        ) : (
          sortedItems.map((item) => (
            <Card key={item._id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge 
                        variant="secondary" 
                        className={`${getCategoryColor(item.category)} font-medium`}
                      >
                        {getCategoryLabel(item.category)}
                      </Badge>
                      {item.isPublished ? (
                        <Badge variant="default" className="bg-green-500">
                          <Eye className="h-3 w-3 mr-1" />
                          Публикувана
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Чернова</Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg line-clamp-2">{item.title}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                      {item.date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {item.date}
                        </div>
                      )}
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Tag className="h-4 w-4" />
                          {item.tags.length} тага
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                {item.description && (
                  <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                    {item.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(item)}
                    className="touch-manipulation"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Редактирай
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTogglePublication(item._id)}
                    className="touch-manipulation"
                  >
                    {item.isPublished ? 'Скрий' : 'Публикувай'}
                  </Button>
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(item._id)}
                    className="touch-manipulation"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Изтрий
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default GalleryManager;