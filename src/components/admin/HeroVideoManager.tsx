import { useState, useRef } from 'react';
import { Upload, Trash2, Eye, EyeOff, Play, Pause, Camera, Video, Settings, FileVideo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAdminQuery as useQuery, useAdminMutation as useMutation } from '@/lib/adminConvex';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { 
  validateVideoFile, 
  getVideoMetadata, 
  generateVideoThumbnail, 
  formatFileSize,
  compressVideo 
} from '@/services/convexFileService';

const HeroVideoManager = () => {
  const { toast } = useToast();
  
  // Convex queries and mutations
  const heroVideos = useQuery(api.heroVideos.getAllHeroVideos) || [];
  const addHeroVideo = useMutation(api.heroVideos.addHeroVideo);
  const toggleVideoActive = useMutation(api.heroVideos.toggleVideoActive);
  const updateVideoSettings = useMutation(api.heroVideos.updateVideoSettings);
  const deleteHeroVideo = useMutation(api.heroVideos.deleteHeroVideo);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  // Local state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentFileName, setCurrentFileName] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadStage, setUploadStage] = useState<'idle' | 'processing' | 'compressing' | 'uploading' | 'finalizing'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get active and inactive videos
  const activeVideo = heroVideos.find(video => video.isActive);
  const inactiveVideos = heroVideos.filter(video => !video.isActive);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await handleFileInput(file);
    
    // Reset file input for potential re-uploads
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleFileInput = async (file: File) => {
    if (!file) return;

    // Validate file before upload
    const validation = validateVideoFile(file);
    if (!validation.valid) {
      toast({
        title: "Грешка при качване",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setCurrentFileName(file.name);
    setUploadStage('processing');
    
    try {
      // Show uploading toast
      toast({
        title: "Качване на видео",
        description: `Започване обработката на ${file.name}...`,
      });

      // Step 1: Get video metadata
      setUploadProgress(10);
      const metadata = await getVideoMetadata(file);
      
      // Step 2: Generate thumbnail
      setUploadProgress(20);
      let thumbnailBlob: Blob | null = null;
      try {
        thumbnailBlob = await generateVideoThumbnail(file);
      } catch (error) {
        console.warn('Thumbnail generation failed:', error);
      }

      // Step 3: Upload thumbnail if generated
      setUploadProgress(30);
      let thumbnailUrl: string | undefined;
      if (thumbnailBlob) {
        try {
          const thumbnailPostUrl = await generateUploadUrl();
          const thumbnailResult = await fetch(thumbnailPostUrl, {
            method: "POST",
            headers: { "Content-Type": thumbnailBlob.type },
            body: thumbnailBlob,
          });

          if (thumbnailResult.ok) {
            const { storageId: thumbnailStorageId } = await thumbnailResult.json();
            // We'll store the storage ID for now - in a real app you'd get the URL
            thumbnailUrl = `convex://storage/${thumbnailStorageId}`;
          }
        } catch (thumbnailError) {
          console.warn('Thumbnail upload failed:', thumbnailError);
        }
      }

      // Step 4: Compress video if it's large
      let fileToUpload = file;
      if (file.size > 10 * 1024 * 1024) { // Compress if larger than 10MB
        setUploadStage('compressing');
        setUploadProgress(40);
        
        toast({
          title: "Компресиране на видео",
          description: "Оптимизиране на видеото за по-бързо зареждане...",
        });

        try {
          fileToUpload = await compressVideo(file, {
            quality: 'medium',
            onProgress: (progress) => {
              // Progress during compression (40-60%)
              setUploadProgress(40 + (progress * 0.2));
            }
          });
          
          console.log(`Video compressed from ${formatFileSize(file.size)} to ${formatFileSize(fileToUpload.size)}`);
          
          toast({
            title: "Компресиране завършено",
            description: `Размерът е намален от ${formatFileSize(file.size)} на ${formatFileSize(fileToUpload.size)}`,
          });
        } catch (compressionError) {
          console.warn('Video compression failed, uploading original:', compressionError);
          toast({
            title: "Предупреждение",
            description: "Компресирането е неуспешно, качва се оригиналното видео",
            variant: "destructive",
          });
          // Continue with original file if compression fails
          fileToUpload = file;
        }
      }

      // Step 5: Upload video
      setUploadStage('uploading');
      setUploadProgress(60);
      
      const postUrl = await generateUploadUrl();
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": fileToUpload.type },
        body: fileToUpload,
      });

      if (!result.ok) {
        throw new Error(`Upload failed: ${result.status} ${result.statusText}`);
      }

      setUploadProgress(85);
      const { storageId } = await result.json();
      
      // Step 6: Save to database
      setUploadStage('finalizing');
      setUploadProgress(90);
      
      const videoUrl = `convex://storage/${storageId}`;
      
      await addHeroVideo({
        src: videoUrl,
        thumbnailSrc: thumbnailUrl,
        alt: `Hero Video - ${file.name}`,
        title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
        description: `Uploaded video: ${formatFileSize(file.size)}`,
        duration: Math.round(metadata.duration),
        fileSize: file.size,
        format: file.type,
        shouldAutoplay: true,
        shouldLoop: true,
        shouldMute: true,
      });
      
      setUploadProgress(100);
      
      toast({
        title: "Успешно качване",
        description: "Видеото беше добавено успешно!",
      });
      
    } catch (error) {
      console.error('Failed to upload video:', error);
      toast({
        title: "Грешка при качване",
        description: error instanceof Error ? error.message : "Възникна грешка при качването на видеото",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setCurrentFileName('');
      setUploadStage('idle');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const videoFile = files.find(file => file.type.startsWith('video/'));
    
    if (videoFile) {
      handleFileInput(videoFile);
    } else {
      toast({
        title: "Грешка",
        description: "Моля, пуснете валиден видео файл",
        variant: "destructive",
      });
    }
  };

  const handleUploadButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleToggleVideoActive = async (id: Id<"heroVideos">) => {
    try {
      await toggleVideoActive({ id });
      toast({
        title: "Успешна промяна",
        description: "Статусът на видеото беше променен!",
      });
    } catch (error) {
      console.error('Failed to toggle video active:', error);
      toast({
        title: "Грешка",
        description: error instanceof Error ? error.message : "Възникна грешка при промяната на статуса",
        variant: "destructive",
      });
    }
  };

  const handleRemoveVideo = async (id: Id<"heroVideos">) => {
    try {
      await deleteHeroVideo({ id });
      toast({
        title: "Успешно изтриване",
        description: "Видеото беше изтрито!",
      });
    } catch (error) {
      console.error('Failed to delete video:', error);
      toast({
        title: "Грешка при изтриване",
        description: "Възникна грешка при изтриването на видеото",
        variant: "destructive",
      });
    }
  };

  const handleUpdateVideoSettings = async (
    id: Id<"heroVideos">, 
    updates: { 
      alt?: string; 
      title?: string; 
      description?: string;
      shouldAutoplay?: boolean;
      shouldLoop?: boolean;
      shouldMute?: boolean;
    }
  ) => {
    try {
      await updateVideoSettings({ id, ...updates });
    } catch (error) {
      console.error('Failed to update video settings:', error);
      toast({
        title: "Грешка при обновяване",
        description: "Възникна грешка при обновяването на настройките",
        variant: "destructive",
      });
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStageText = () => {
    switch (uploadStage) {
      case 'processing':
        return 'Обработване...';
      case 'compressing':
        return 'Компресиране...';
      case 'uploading':
        return 'Качване...';
      case 'finalizing':
        return 'Финализиране...';
      default:
        return 'Качване...';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Управление на Hero Видео</h2>
        
        {/* Main Upload Button */}
        <div className="w-full sm:w-auto flex flex-col items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileUpload}
            className="hidden"
            disabled={isUploading}
            capture="environment"
          />
          <Button 
            size="lg"
            disabled={isUploading}
            onClick={handleUploadButtonClick}
            className="w-full sm:w-auto bg-ragdoll-blue hover:bg-ragdoll-blue/90 text-white px-8 py-4 text-lg flex items-center gap-3 shadow-lg hover:shadow-xl transition-all duration-300 min-h-[48px] touch-manipulation"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                {getStageText()}
              </>
            ) : (
              <>
                <Video className="h-6 w-6" />
                Качи Видео
              </>
            )}
          </Button>

          {/* Upload Progress */}
          {isUploading && (
            <div className="w-full max-w-md space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="truncate text-muted-foreground">
                  {currentFileName}
                </span>
                <span className="text-muted-foreground">
                  {uploadProgress}%
                </span>
              </div>
              <Progress value={uploadProgress} className="h-3" />
              <div className="text-xs text-center text-muted-foreground">
                {getStageText()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile-friendly Drag and Drop Upload Area */}
      <div
        className={`border border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragOver 
            ? 'border-ragdoll-blue bg-ragdoll-blue/5' 
            : 'border-gray-200 hover:border-ragdoll-blue/30'
        } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-100">
            <Upload className="w-8 h-8 text-gray-400" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-medium">
              {isDragOver ? 'Пуснете видеото тук' : 'Плъзнете и пуснете видео файл'}
            </p>
            <p className="text-sm text-gray-500">
              Поддържани формати: MP4, WebM, MOV (макс. 50MB)<br/>
              Видеа над 10MB се компресират автоматично
            </p>
            <Button
              variant="outline"
              onClick={handleUploadButtonClick}
              disabled={isUploading}
              className="mt-4 min-h-[44px] touch-manipulation"
            >
              <Camera className="w-4 h-4 mr-2" />
              Или изберете от устройството
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Active Video */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg text-green-600 flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Активно Видео {activeVideo && `(${formatFileSize(activeVideo.fileSize || 0)})`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeVideo ? (
              <div className="space-y-4">
                {/* Video Preview */}
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                  <video
                    src={activeVideo.src}
                    className="w-full h-full object-cover"
                    controls
                    muted
                  />
                </div>
                
                {/* Video Settings */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="video-title">Заглавие</Label>
                      <Input
                        id="video-title"
                        value={activeVideo.title || ''}
                        onChange={(e) => handleUpdateVideoSettings(activeVideo._id, { title: e.target.value })}
                        className="min-h-[44px]"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="video-alt">Alt текст</Label>
                      <Input
                        id="video-alt"
                        value={activeVideo.alt}
                        onChange={(e) => handleUpdateVideoSettings(activeVideo._id, { alt: e.target.value })}
                        className="min-h-[44px]"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="video-description">Описание</Label>
                      <Textarea
                        id="video-description"
                        value={activeVideo.description || ''}
                        onChange={(e) => handleUpdateVideoSettings(activeVideo._id, { description: e.target.value })}
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                {/* Playback Settings */}
                <div className="space-y-3">
                  <h4 className="font-medium">Настройки за възпроизвеждане</h4>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="autoplay"
                        checked={activeVideo.shouldAutoplay ?? true}
                        onCheckedChange={(checked) => 
                          handleUpdateVideoSettings(activeVideo._id, { shouldAutoplay: checked })
                        }
                      />
                      <Label htmlFor="autoplay" className="text-sm">Автоматично стартиране</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="loop"
                        checked={activeVideo.shouldLoop ?? true}
                        onCheckedChange={(checked) => 
                          handleUpdateVideoSettings(activeVideo._id, { shouldLoop: checked })
                        }
                      />
                      <Label htmlFor="loop" className="text-sm">Повторение</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="mute"
                        checked={activeVideo.shouldMute ?? true}
                        onCheckedChange={(checked) => 
                          handleUpdateVideoSettings(activeVideo._id, { shouldMute: checked })
                        }
                      />
                      <Label htmlFor="mute" className="text-sm">Без звук</Label>
                    </div>
                  </div>
                </div>

                {/* Video Info */}
                <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                  {activeVideo.duration && (
                    <div>Продължителност: {formatDuration(activeVideo.duration)}</div>
                  )}
                  {activeVideo.format && (
                    <div>Формат: {activeVideo.format}</div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleVideoActive(activeVideo._id)}
                    className="text-orange-600 hover:text-orange-700 min-h-[44px] touch-manipulation"
                  >
                    <EyeOff className="h-4 w-4 mr-2" />
                    Деактивирай
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveVideo(activeVideo._id)}
                    className="text-red-600 hover:text-red-700 min-h-[44px] touch-manipulation"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Изтрий
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileVideo className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Няма активно видео</p>
                <p className="text-sm">Качете видео и го активирайте за показване в hero секцията</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inactive Videos */}
        {inactiveVideos.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg text-orange-600 flex items-center gap-2">
                <EyeOff className="h-5 w-5" />
                Неактивни Видеа ({inactiveVideos.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {inactiveVideos.map((video) => (
                  <div key={video._id} className="border rounded-lg p-4 space-y-3">
                    {/* Video thumbnail/preview */}
                    <div className="relative aspect-video bg-black rounded overflow-hidden">
                      <video
                        src={video.src}
                        className="w-full h-full object-cover"
                        muted
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium truncate">{video.title || 'Без заглавие'}</h4>
                      <div className="text-xs text-muted-foreground space-y-1">
                        {video.duration && <div>⏱️ {formatDuration(video.duration)}</div>}
                        {video.fileSize && <div>📦 {formatFileSize(video.fileSize)}</div>}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleVideoActive(video._id)}
                        className="flex-1 text-green-600 hover:text-green-700 min-h-[40px] touch-manipulation"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Активирай
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveVideo(video._id)}
                        className="text-red-600 hover:text-red-700 min-h-[40px] touch-manipulation"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Инструкции</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2 text-muted-foreground">
            <p>• Само едно видео може да бъде активно наведнъж за hero секцията</p>
            <p>• Препоръчителни формати: MP4 (най-добра съвместимост), WebM</p>
            <p>• Максимален размер: 50MB за оптимална производителност</p>
            <p>• Препоръчителна продължителност: 10-60 секунди</p>
            <p>• Видеа над 10MB се компресират автоматично за по-бързо зареждане</p>
            <p>• Видеото се показва като фон в hero секцията с кинематографични ефекти</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HeroVideoManager;