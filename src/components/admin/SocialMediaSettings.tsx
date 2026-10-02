import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Facebook, Instagram, Save, BarChart, Search, Eye, CheckCircle, AlertCircle, MapPin } from 'lucide-react';
import { 
  useSocialMediaSettings, 
  useUpdateSocialMediaSettings,
  useSettingsByType,
  useUpsertSetting,
  useLocationSettings,
  useUpdateLocationSettings
} from '@/services/convexSiteSettingsService';

const SocialMediaSettings = () => {
  const socialSettings = useSocialMediaSettings();
  const updateSocialSettings = useUpdateSocialMediaSettings();
  const analyticsSettings = useSettingsByType('analytics');
  const locationSettings = useLocationSettings();
  const updateLocationSettings = useUpdateLocationSettings();
  const upsertSetting = useUpsertSetting();
  
  const [formData, setFormData] = useState({
    facebook: '',
    instagram: '',
    tiktok: '',
  });

  const [analyticsData, setAnalyticsData] = useState({
    googleSearchConsole: '',
    metaPixelId: '',
    googleAnalyticsId: '',
  });

  const [locationData, setLocationData] = useState({
    address: '',
    displayName: '',
    googleMapsUrl: '',
    appleMapsUrl: '',
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Load existing settings into form
  useEffect(() => {
    if (socialSettings) {
      setFormData({
        facebook: socialSettings.facebook_url || '',
        instagram: socialSettings.instagram_url || '',
        tiktok: socialSettings.tiktok_url || '',
      });
    }
  }, [socialSettings]);

  // Load analytics settings
  useEffect(() => {
    if (analyticsSettings) {
      const settings = analyticsSettings.reduce((acc, setting) => {
        try {
          acc[setting.key] = JSON.parse(setting.value);
        } catch {
          acc[setting.key] = setting.value;
        }
        return acc;
      }, {} as Record<string, string>);

      setAnalyticsData({
        googleSearchConsole: typeof settings.google_search_console === 'string' ? settings.google_search_console : '',
        metaPixelId: typeof settings.meta_pixel_id === 'string' ? settings.meta_pixel_id : '',
        googleAnalyticsId: typeof settings.google_analytics_id === 'string' ? settings.google_analytics_id : '',
      });
    }
  }, [analyticsSettings]);

  // Load location settings
  useEffect(() => {
    if (locationSettings) {
      setLocationData({
        address: typeof locationSettings.establishment_address === 'string' ? locationSettings.establishment_address : '',
        displayName: typeof locationSettings.location_display_name === 'string' ? locationSettings.location_display_name : '',
        googleMapsUrl: typeof locationSettings.google_maps_url === 'string' ? locationSettings.google_maps_url : '',
        appleMapsUrl: typeof locationSettings.apple_maps_url === 'string' ? locationSettings.apple_maps_url : '',
      });
    }
  }, [locationSettings]);

  const handleSocialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      await updateSocialSettings({
        facebook: formData.facebook || undefined,
        instagram: formData.instagram || undefined,
        tiktok: formData.tiktok || undefined,
      });
      
      setSaveMessage('Социални мрежи са запазени успешно!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Error saving social media settings:', error);
      setSaveMessage('Грешка при запазването на настройките');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAnalyticsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      // Save each analytics setting individually
      const promises = [
        upsertSetting({
          key: 'google_search_console',
          value: JSON.stringify(analyticsData.googleSearchConsole),
          type: 'analytics',
          description: 'Google Search Console verification meta tag'
        }),
        upsertSetting({
          key: 'meta_pixel_id',
          value: JSON.stringify(analyticsData.metaPixelId),
          type: 'analytics',
          description: 'Meta (Facebook) Pixel ID'
        }),
        upsertSetting({
          key: 'google_analytics_id',
          value: JSON.stringify(analyticsData.googleAnalyticsId),
          type: 'analytics',
          description: 'Google Analytics 4 Measurement ID'
        })
      ];

      await Promise.all(promises);
      
      setSaveMessage('Аналитични настройки са запазени успешно!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Error saving analytics settings:', error);
      setSaveMessage('Грешка при запазването на аналитичните настройки');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      await updateLocationSettings({
        address: locationData.address || undefined,
        displayName: locationData.displayName || undefined,
        googleMapsUrl: locationData.googleMapsUrl || undefined,
        appleMapsUrl: locationData.appleMapsUrl || undefined,
      });
      
      setSaveMessage('Настройки за локация са запазени успешно!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Error saving location settings:', error);
      setSaveMessage('Грешка при запазването на настройките за локация');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <h2 className="font-playfair text-xl font-semibold">Настройки & Аналитика</h2>
        <div className="flex items-center gap-3">
          {saveMessage && (
            <span className={`text-sm ${saveMessage.includes('Грешка') ? 'text-red-600' : 'text-green-600'}`}>
              {saveMessage}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <Accordion type="single" collapsible defaultValue="social" className="space-y-4">
          {/* Social Media Settings */}
          <AccordionItem value="social">
            <AccordionTrigger className="text-left min-h-[44px]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Instagram className="h-4 w-4 text-blue-600" />
                </div>
                <span>Социални мрежи</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Забележка:</strong> Тези настройки ще се използват в цялото уебсайт - в страничния панел, модалите за контакт и всички други места където се показват социални мрежи.
                </p>
              </div>

              <form onSubmit={handleSocialSubmit} className="space-y-6">
                {/* Facebook */}
                <div className="space-y-2">
                  <Label htmlFor="facebook" className="flex items-center gap-2">
                    <Facebook className="w-4 h-4 text-blue-600" />
                    Facebook URL
                  </Label>
                  <Input
                    id="facebook"
                    type="url"
                    value={formData.facebook}
                    onChange={(e) => setFormData(prev => ({ ...prev, facebook: e.target.value }))}
                    placeholder="https://www.facebook.com/profile.php?id=..."
                    className="w-full min-h-[44px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Пълен URL към Facebook страницата
                  </p>
                </div>

                {/* Instagram */}
                <div className="space-y-2">
                  <Label htmlFor="instagram" className="flex items-center gap-2">
                    <Instagram className="w-4 h-4 text-pink-600" />
                    Instagram URL
                  </Label>
                  <Input
                    id="instagram"
                    type="url"
                    value={formData.instagram}
                    onChange={(e) => setFormData(prev => ({ ...prev, instagram: e.target.value }))}
                    placeholder="https://www.instagram.com/bleuroi_cattery_ragdol_british/"
                    className="w-full min-h-[44px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Пълен URL към Instagram профила
                  </p>
                </div>

                {/* TikTok */}
                <div className="space-y-2">
                  <Label htmlFor="tiktok" className="flex items-center gap-2">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                    </svg>
                    TikTok URL
                  </Label>
                  <Input
                    id="tiktok"
                    type="url"
                    value={formData.tiktok}
                    onChange={(e) => setFormData(prev => ({ ...prev, tiktok: e.target.value }))}
                    placeholder="https://www.tiktok.com/@radanovprideragdoll"
                    className="w-full min-h-[44px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Пълен URL към TikTok профила  
                  </p>
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  disabled={isSaving}
                  className="w-full min-h-[44px] bg-black text-white hover:bg-gray-800 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Запазване...' : 'Запази социални мрежи'}
                </Button>
              </form>
            </AccordionContent>
          </AccordionItem>

          {/* Location Settings */}
          <AccordionItem value="location">
            <AccordionTrigger className="text-left min-h-[44px]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-orange-600" />
                </div>
                <span>Локация & Адрес</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-800">
                  <strong>Забележка:</strong> Тези настройки ще се използват за показване на локацията в страничния панел и ще позволят на посетителите лесно да намерят развъдника.
                </p>
              </div>

              <form onSubmit={handleLocationSubmit} className="space-y-6">
                {/* Address */}
                <div className="space-y-2">
                  <Label htmlFor="address" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-orange-600" />
                    Адрес
                  </Label>
                  <Input
                    id="address"
                    value={locationData.address}
                    onChange={(e) => setLocationData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="София, България"
                    className="w-full min-h-[44px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Физическият адрес на развъдника
                  </p>
                </div>

                {/* Display Name */}
                <div className="space-y-2">
                  <Label htmlFor="displayName">Име за показване</Label>
                  <Input
                    id="displayName"
                    value={locationData.displayName}
                    onChange={(e) => setLocationData(prev => ({ ...prev, displayName: e.target.value }))}
                    placeholder="BleuRoi Ragdoll Cattery"
                    className="w-full min-h-[44px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Как да се показва името в бутона за локация
                  </p>
                </div>

                {/* Google Maps URL */}
                <div className="space-y-2">
                  <Label htmlFor="googleMapsUrl">Google Maps URL (по избор)</Label>
                  <Input
                    id="googleMapsUrl"
                    type="url"
                    value={locationData.googleMapsUrl}
                    onChange={(e) => setLocationData(prev => ({ ...prev, googleMapsUrl: e.target.value }))}
                    placeholder="https://maps.google.com/?q=..."
                    className="w-full min-h-[44px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Персонализиран Google Maps линк (ако е празно ще се генерира автоматично)
                  </p>
                </div>

                {/* Apple Maps URL */}
                <div className="space-y-2">
                  <Label htmlFor="appleMapsUrl">Apple Maps URL (по избор)</Label>
                  <Input
                    id="appleMapsUrl"
                    type="url"
                    value={locationData.appleMapsUrl}
                    onChange={(e) => setLocationData(prev => ({ ...prev, appleMapsUrl: e.target.value }))}
                    placeholder="https://maps.apple.com/?q=..."
                    className="w-full min-h-[44px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Персонализиран Apple Maps линк (ако е празно ще се генерира автоматично)
                  </p>
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  disabled={isSaving}
                  className="w-full min-h-[44px] bg-orange-600 text-white hover:bg-orange-700 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Запазване...' : 'Запази настройки за локация'}
                </Button>
              </form>

              {/* Location Status indicators */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-3">Статус на настройките:</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    {locationData.address ? 
                      <CheckCircle className="w-4 h-4 text-green-600" /> : 
                      <AlertCircle className="w-4 h-4 text-gray-400" />
                    }
                    <span>Адрес: {locationData.address ? 'Настроен' : 'Не е настроен'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {locationData.displayName ? 
                      <CheckCircle className="w-4 h-4 text-green-600" /> : 
                      <AlertCircle className="w-4 h-4 text-gray-400" />
                    }
                    <span>Име за показване: {locationData.displayName ? 'Настроено' : 'Използва се адресът'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {locationData.googleMapsUrl ? 
                      <CheckCircle className="w-4 h-4 text-green-600" /> : 
                      <AlertCircle className="w-4 h-4 text-orange-400" />
                    }
                    <span>Google Maps: {locationData.googleMapsUrl ? 'Персонализиран' : 'Автоматичен'}</span>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Analytics Settings */}
          <AccordionItem value="analytics">
            <AccordionTrigger className="text-left min-h-[44px]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <BarChart className="h-4 w-4 text-green-600" />
                </div>
                <span>Аналитика & Проследяване</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Забележка:</strong> Тези настройки се използват за проследяване на посетителите и SEO оптимизация. Попълнете само тези, които използвате.
                </p>
              </div>

              <form onSubmit={handleAnalyticsSubmit} className="space-y-6">
                {/* Google Search Console */}
                <div className="space-y-2">
                  <Label htmlFor="google-console" className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-blue-600" />
                    Google Search Console
                  </Label>
                  <Input
                    id="google-console"
                    value={analyticsData.googleSearchConsole}
                    onChange={(e) => setAnalyticsData(prev => ({ ...prev, googleSearchConsole: e.target.value }))}
                    placeholder="google-site-verification=..."
                    className="w-full min-h-[44px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Кодът за верификация от Google Search Console (без &lt;meta&gt; тага)
                  </p>
                </div>

                {/* Meta Pixel */}
                <div className="space-y-2">
                  <Label htmlFor="meta-pixel" className="flex items-center gap-2">
                    <Facebook className="w-4 h-4 text-blue-600" />
                    Meta Pixel ID
                  </Label>
                  <Input
                    id="meta-pixel"
                    value={analyticsData.metaPixelId}
                    onChange={(e) => setAnalyticsData(prev => ({ ...prev, metaPixelId: e.target.value }))}
                    placeholder="1234567890123456"
                    className="w-full min-h-[44px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Facebook Pixel ID за проследяване на реклами
                  </p>
                </div>

                {/* Google Analytics */}
                <div className="space-y-2">
                  <Label htmlFor="google-analytics" className="flex items-center gap-2">
                    <BarChart className="w-4 h-4 text-orange-600" />
                    Google Analytics 4
                  </Label>
                  <Input
                    id="google-analytics"
                    value={analyticsData.googleAnalyticsId}
                    onChange={(e) => setAnalyticsData(prev => ({ ...prev, googleAnalyticsId: e.target.value }))}
                    placeholder="G-XXXXXXXXXX"
                    className="w-full min-h-[44px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Google Analytics 4 Measurement ID
                  </p>
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  disabled={isSaving}
                  className="w-full min-h-[44px] bg-green-600 text-white hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Запазване...' : 'Запази аналитика'}
                </Button>
              </form>

              {/* Status indicators */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-3">Статус на настройките:</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    {analyticsData.googleSearchConsole ? 
                      <CheckCircle className="w-4 h-4 text-green-600" /> : 
                      <AlertCircle className="w-4 h-4 text-gray-400" />
                    }
                    <span>Google Search Console: {analyticsData.googleSearchConsole ? 'Активен' : 'Не е настроен'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {analyticsData.metaPixelId ? 
                      <CheckCircle className="w-4 h-4 text-green-600" /> : 
                      <AlertCircle className="w-4 h-4 text-gray-400" />
                    }
                    <span>Meta Pixel: {analyticsData.metaPixelId ? 'Активен' : 'Не е настроен'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {analyticsData.googleAnalyticsId ? 
                      <CheckCircle className="w-4 h-4 text-green-600" /> : 
                      <AlertCircle className="w-4 h-4 text-gray-400" />
                    }
                    <span>Google Analytics: {analyticsData.googleAnalyticsId ? 'Активен' : 'Не е настроен'}</span>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
};

export default SocialMediaSettings;