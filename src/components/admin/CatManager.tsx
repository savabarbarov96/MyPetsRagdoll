import { useState } from 'react';
import { useCreateCat, useUpdateCat, useDeleteCat, useToggleCatDisplay, useCats, useCatsByBreed, CatData } from '@/services/convexCatService';
import { useFileUpload, validateImageFile } from '@/services/convexFileService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CatGallery from './CatGallery';
import ImageManager from './ImageManager';
import { Id } from '../../../convex/_generated/dataModel';

interface CatManagerProps {
  onCatSelect: (cat: CatData) => void;
  selectedCat: CatData | null;
  onAddToCanvas?: (cat: CatData) => void;
  onDropCatToCanvas?: (cat: CatData, position: { x: number; y: number }) => void;
  breed?: 'ragdoll' | 'british';
}

const CatManager = ({ onCatSelect, selectedCat, onAddToCanvas, onDropCatToCanvas, breed }: CatManagerProps) => {
  const allCats = useCats();
  const breedCats = useCatsByBreed(breed);
  // When breed is set: prefer breed-specific query, fall back to client-side filter of all cats
  const cats = breed
    ? (breedCats ?? allCats?.filter(c => c.breed === breed))
    : allCats;
  const createCat = useCreateCat();
  const updateCat = useUpdateCat();
  const deleteCat = useDeleteCat();
  const toggleCatDisplay = useToggleCatDisplay();
  const { uploadFile } = useFileUpload();

  const [isAddingCat, setIsAddingCat] = useState(false);
  const [editingCat, setEditingCat] = useState<CatData | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    subtitle: '',
    description: '',
    age: '',
    color: '',
    gender: 'male' as 'male' | 'female',
    birthDate: '',
    registrationNumber: '',
    freeText: '',
    internalNotes: '',
    status: 'Достъпен',
    isDisplayed: true,
    image: '',
    gallery: [] as string[],
    // New fields for gallery filtering
    category: 'adult' as 'kitten' | 'adult' | 'all' | undefined
  });

  const resetForm = () => {
    setFormData({
      name: '',
      subtitle: '',
      description: '',
      age: '',
      color: '',
      gender: 'male',
      birthDate: '',
      registrationNumber: '',
      freeText: '',
      internalNotes: '',
      status: 'Достъпен',
      isDisplayed: true,
      image: '',
      gallery: [],
      // New fields for gallery filtering
      category: 'adult'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // If no main image set but gallery has images, use the first gallery image
      let mainImage = formData.image;
      let galleryImages = [...formData.gallery];
      if (!mainImage && galleryImages.length > 0) {
        mainImage = galleryImages[0];
        galleryImages = galleryImages.slice(1);
      }
      // Always strip the main image from the gallery to avoid duplicates
      const cleanGallery = galleryImages.filter(img => img !== mainImage);

      if (editingCat) {
        await updateCat({
          id: editingCat._id,
          name: formData.name,
          subtitle: formData.subtitle,
          description: formData.description,
          age: formData.age,
          color: formData.color,
          gender: formData.gender,
          birthDate: formData.birthDate,
          registrationNumber: formData.registrationNumber || undefined,
          freeText: formData.freeText || undefined,
          internalNotes: formData.internalNotes || undefined,
          status: formData.status,
          isDisplayed: formData.isDisplayed,
          image: mainImage,
          gallery: cleanGallery,
          category: formData.category,
          breed: breed ?? undefined,
        });
        setEditingCat(null);
      } else {
        await createCat({
          name: formData.name,
          subtitle: formData.subtitle,
          description: formData.description,
          age: formData.age,
          color: formData.color,
          gender: formData.gender,
          birthDate: formData.birthDate,
          registrationNumber: formData.registrationNumber || undefined,
          freeText: formData.freeText || undefined,
          internalNotes: formData.internalNotes || undefined,
          status: formData.status,
          isDisplayed: formData.isDisplayed,
          image: mainImage,
          gallery: cleanGallery,
          category: formData.category,
          breed: breed ?? 'ragdoll',
        });
        setIsAddingCat(false);
      }
      
      resetForm();
    } catch (error) {
      console.error('Error saving cat:', error);
      alert('Грешка при запазването на котката');
    }
  };

  const handleEdit = (cat: CatData) => {
    setEditingCat(cat);
    setFormData({
      name: cat.name,
      subtitle: cat.subtitle,
      description: cat.description,
      age: cat.age,
      color: cat.color,
      gender: cat.gender,
      birthDate: cat.birthDate,
      registrationNumber: cat.registrationNumber || '',
      freeText: cat.freeText || '',
      internalNotes: cat.internalNotes || '',
      status: cat.status,
      isDisplayed: cat.isDisplayed,
      image: cat.image,
      gallery: cat.gallery,
      // New fields for gallery filtering
      category: cat.category || 'adult'
    });
  };

  const handleDelete = async (id: Id<"cats">) => {
    if (confirm('Сигурни ли сте, че искате да изтриете тази котка?')) {
      try {
        await deleteCat({ id });
      } catch (error) {
        console.error('Error deleting cat:', error);
        alert('Грешка при изтриването на котката');
      }
    }
  };

  const handleToggleDisplay = async (id: Id<"cats">) => {
    try {
      await toggleCatDisplay({ id });
    } catch (error) {
      console.error('Error toggling cat display:', error);
      alert('Грешка при промяната на видимостта');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate the file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    try {
      // Upload to Convex storage with compression
      const result = await uploadFile(file, {
        imageType: 'profile',
        associatedCatId: editingCat?._id,
      });

      if (result.success && result.url) {
        setFormData(prev => ({ ...prev, image: result.url }));
      } else {
        alert(result.error || 'Грешка при качването на изображението');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      alert('Грешка при качването на изображението');
    }
  };

  const showForm = isAddingCat || editingCat;

  if (showForm) {
    return (
      <div className="h-full flex flex-col">
        {/* Form Header */}
        <div className="flex items-center justify-between p-4 border-b bg-white">
          <h2 className="font-playfair text-xl font-semibold">
            {editingCat ? 'Редактиране на котка' : 'Добавяне на нова котка'}
          </h2>
          <Button
            onClick={() => {
              setIsAddingCat(false);
              setEditingCat(null);
              resetForm();
            }}
            variant="outline"
            className="min-h-[44px]"
          >
            ← Назад
          </Button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Име</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Например: OLIVER"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subtitle">Подзаглавие</Label>
                    <Input
                      id="subtitle"
                      value={formData.subtitle}
                      onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                      placeholder="Например: GINGER MAGIC"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Описание</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Описание на котката..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="age">Възраст</Label>
                    <Input
                      id="age"
                      value={formData.age}
                      onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                      placeholder="Например: 2 години"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="color">Цвят</Label>
                    <Input
                      id="color"
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      placeholder="Например: Brown tabby"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Статус</Label>
                    <Input
                      id="status"
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                      placeholder="Например: Достъпен"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Пол</Label>
                    <Select value={formData.gender} onValueChange={(value: 'male' | 'female') => setFormData(prev => ({ ...prev, gender: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Мъжки</SelectItem>
                        <SelectItem value="female">Женски</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Категория</Label>
                    <Select value={formData.category} onValueChange={(value: 'kitten' | 'adult' | 'all') => setFormData(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kitten">Коте</SelectItem>
                        <SelectItem value="adult">Възрастна</SelectItem>
                        <SelectItem value="all">Всички</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="birthDate">Дата на раждане</Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registrationNumber">Регистрационен номер</Label>
                    <Input
                      id="registrationNumber"
                      value={formData.registrationNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, registrationNumber: e.target.value }))}
                      placeholder="Например: MC-2022-001"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image">Основна снимка</Label>
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="cursor-pointer"
                  />
                  {formData.image && (
                    <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                      <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <ImageManager
                  images={formData.gallery}
                  onImagesChange={(images) => setFormData(prev => ({ ...prev, gallery: images }))}
                  label="Галерия със снимки"
                  maxImages={15}
                  associatedCatId={editingCat?._id}
                  imageType="gallery"
                />

                <div className="space-y-2">
                  <Label htmlFor="freeText">Допълнителна информация</Label>
                  <Textarea
                    id="freeText"
                    value={formData.freeText}
                    onChange={(e) => setFormData(prev => ({ ...prev, freeText: e.target.value }))}
                    placeholder="Свободен текст..."
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="internalNotes">Бележка (вътрешна)</Label>
                  <Textarea
                    id="internalNotes"
                    value={formData.internalNotes}
                    onChange={(e) => setFormData(prev => ({ ...prev, internalNotes: e.target.value }))}
                    placeholder="Вътрешни бележки..."
                    rows={2}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isDisplayed"
                    checked={formData.isDisplayed}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isDisplayed: checked }))}
                  />
                  <Label htmlFor="isDisplayed">Показване на сайта</Label>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
                  <Button type="submit" className="bg-black text-white hover:bg-gray-800 min-h-[44px] w-full sm:w-auto">
                    {editingCat ? 'Запази' : 'Добави'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-[44px] w-full sm:w-auto"
                    onClick={() => {
                      setIsAddingCat(false);
                      setEditingCat(null);
                      resetForm();
                    }}
                  >
                    Отказ
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <CatGallery
      onCatSelect={onCatSelect}
      selectedCat={selectedCat}
      onAddCat={() => setIsAddingCat(true)}
      onEditCat={handleEdit}
      onAddToCanvas={onAddToCanvas}
      onDropCatToCanvas={onDropCatToCanvas}
      onDeleteCat={handleDelete}
      onToggleDisplay={handleToggleDisplay}
      cats={cats || []}
    />
  );
};

export default CatManager;