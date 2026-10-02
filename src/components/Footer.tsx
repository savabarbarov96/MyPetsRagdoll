import { useLanguage } from "@/hooks/useLanguage";
import ragdollLogo from "@/assets/ragdoll-logo.png";
import { useSocialMediaSettings } from "@/services/convexSiteSettingsService";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import { WHATSAPP_LINK, CONTACT_PHONE_E164, CONTACT_PHONE_DISPLAY } from "@/config/contact";

const Footer = () => {
  const { t } = useLanguage();
  const socialSettings = useSocialMediaSettings();
  const facebookUrl = socialSettings?.facebook_url || 'https://www.facebook.com/Bleuroi.Ragdol.Cattery';
  const instagramUrl = socialSettings?.instagram_url || 'https://www.instagram.com/bleuroi_cattery_ragdol_british/';
  const tiktokUrl = socialSettings?.tiktok_url || 'https://www.tiktok.com/@blueroi.ragdol.cattery';
  return (
    <footer className="bg-black text-white py-8">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="text-center space-y-6">
          {/* Logo */}
          <div className="flex justify-center">
            <img 
              src={ragdollLogo} 
              alt="My Pets Ragdoll Logo" 
              className="w-16 h-16 object-contain opacity-90"
            />
          </div>
          
          {/* Contact Information */}
          <div className="space-y-2">
            <p className="text-white/90 text-sm">
  {t('footer.address')}
            </p>
            <p className="text-white/90 text-sm">
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="inline-flex items-center justify-center text-green-500 hover:text-green-400 transition-colors"
                title="WhatsApp"
              >
                <WhatsAppIcon className="w-8 h-8" />
              </a>
            </p>
            <p className="text-white/90 text-sm">
              <a 
                href={`tel:${CONTACT_PHONE_E164}`}
                className="hover:text-white transition-colors hover:underline"
              >
                {CONTACT_PHONE_DISPLAY}
              </a>
            </p>
          </div>

          {/* Social Links */}
          <div className="flex justify-center space-x-6">
            <a 
              href={facebookUrl}
              target="_blank" 
              rel="noopener noreferrer"
              className="text-white/60 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            <a 
              href={instagramUrl}
              target="_blank" 
              rel="noopener noreferrer"
              className="text-white/60 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 2C4.2 2 2 4.2 2 7v10c0 2.8 2.2 5 5 5h10c2.8 0 5-2.2 5-5V7c0-2.8-2.2-5-5-5H7zm0 2h10c1.7 0 3 1.3 3 3v10c0 1.7-1.3 3-3 3H7c-1.7 0-3-1.3-3-3V7c0-1.7 1.3-3 3-3zm5 3.5A5.5 5.5 0 106 13a5.5 5.5 0 006-5.5zm0 2A3.5 3.5 0 1112 16a3.5 3.5 0 010-7zm5.8-.9a1.1 1.1 0 11-2.2 0 1.1 1.1 0 012.2 0z" />
              </svg>
            </a>
            <a 
              href={tiktokUrl}
              target="_blank" 
              rel="noopener noreferrer"
              className="text-white/60 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-.88-.05A6.33 6.33 0 0 0 5.15 20.1a6.34 6.34 0 0 0 10.86-4.43V7.93a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.19-.36z"/>
              </svg>
            </a>
          </div>

          {/* Copyright and Credits */}
          <div className="border-t border-white/10 pt-4 space-y-2">
            <p className="text-white/40 text-sm">
      {t('footer.copyright')}
            </p>
            <p className="text-white/60 text-sm">
              Website created by{' '}
              <a 
                href="https://automationaid.eu" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white hover:text-white/80 underline underline-offset-2 transition-colors font-medium"
              >
                AutomationAid.eu
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;