import { Button } from '@/components/ui/button';
import { Facebook, Instagram, Phone } from 'lucide-react';
import { CatData } from '@/services/convexCatService';
import { useSocialMediaSettings } from '@/services/convexSiteSettingsService';
import { useLanguage } from '@/hooks/useLanguage';

interface SocialContactModalProps {
  cat: CatData | null;
  isOpen: boolean;
  onClose: () => void;
}

const SocialContactModal = ({ cat, isOpen, onClose }: SocialContactModalProps) => {
  const socialSettings = useSocialMediaSettings();
  const { t } = useLanguage();
  
  if (!isOpen) return null;

  // Use global social media settings with phone option
  const socialPlatforms = [
    {
      name: 'Phone',
      icon: Phone,
      url: 'tel:+359894474966',
      color: 'bg-green-600 hover:bg-green-700',
      isPhone: true,
    },
    {
      name: 'Facebook',
      icon: Facebook,
      url: socialSettings?.facebook_url || 'https://www.facebook.com/profile.php?id=61561853557367',
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      name: 'Instagram',
      icon: Instagram,
      url: socialSettings?.instagram_url || 'https://www.instagram.com/bleuroi_cattery_ragdol_british/',
      color: 'bg-pink-600 hover:bg-pink-700',
    },
    {
      name: 'TikTok',
      icon: () => (
        <svg
          className="w-6 h-6"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
        </svg>
      ),
      url: socialSettings?.tiktok_url || 'https://www.tiktok.com/@bleuroi_ragdoll',
      color: 'bg-black hover:bg-gray-800',
    },
  ].filter(platform => platform.url); // Only show platforms with URLs

  const handleSocialClick = (url: string, isPhone?: boolean) => {
    if (isPhone) {
      window.location.href = url;
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div 
        className="bg-card rounded-2xl max-w-md w-full mx-auto p-6 shadow-2xl transform relative"
        onClick={(e) => e.stopPropagation()}
        style={{ 
          maxHeight: 'calc(100vh - 2rem)',
          overflowY: 'auto',
          margin: 'auto'
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-playfair text-2xl font-semibold text-foreground">
            {t('contact.modalTitle')}
          </h2>
          <Button
            onClick={onClose}
            variant="outline"
            className="rounded-full w-10 h-10 p-0 border-foreground text-foreground hover:bg-foreground hover:text-background transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>

        {/* Message */}
        <div className="text-center mb-8">
          {cat ? (
            <>
              <p className="text-foreground text-lg mb-2">
                {t('contact.processStart')} <span className="font-semibold">{cat.name}</span>
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {t('contact.sendMessage')}
              </p>
            </>
          ) : (
            <>
              <p className="text-foreground text-lg mb-2">
                {t('contact.getInTouch')}
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {t('contact.socialPlatforms')}
              </p>
            </>
          )}
        </div>

        {/* Social Media Buttons */}
        <div className="space-y-4">
          {socialPlatforms.map((platform) => {
            const IconComponent = platform.icon;
            return (
              <button
                key={platform.name}
                onClick={() => handleSocialClick(platform.url, platform.isPhone)}
                className={`w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl text-white font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 ${platform.color}`}
              >
                <IconComponent />
                <span>{t('contact.connectVia')} {platform.name}</span>
              </button>
            );
          })}
        </div>

        {/* Footer Note */}
        {cat && (
          <div className="text-center mt-6 pt-4 border-t border-border">
            <p className="text-muted-foreground text-xs">
  {t('contact.mentionCat')} <span className="font-medium text-foreground">{cat.name}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialContactModal;