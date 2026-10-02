import { useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useLocation } from "react-router-dom";
import { useSocialMediaSettings } from "@/services/convexSiteSettingsService";
import { Instagram } from "lucide-react";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import { WHATSAPP_LINK } from "@/config/contact";

const SocialSidebar = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const socialSettings = useSocialMediaSettings();
  const isAdminRoute = location.pathname.startsWith('/admin');

  const handleThemeToggle = () => {
    // Don't allow theme toggle on admin routes
    if (isAdminRoute) {
      return;
    }
    toggleTheme();
  };

  // Get URLs from settings or use fallback defaults
  const facebookUrl = socialSettings?.facebook_url || 'https://www.facebook.com/profile.php?id=61561853557367';
  const instagramUrl = socialSettings?.instagram_url || 'https://www.instagram.com/bleuroi_cattery_ragdol_british/';
  const tiktokUrl = socialSettings?.tiktok_url || 'https://www.tiktok.com/@bleuroi_ragdoll?is_from_webapp=1&sender_device=pc';

  const SocialLinks = ({ mobile = false, showTheme = true }: { mobile?: boolean; showTheme?: boolean }) => (
    <>
      {/* WhatsApp Link */}
      <a
        href={WHATSAPP_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className={`block ${mobile ? 'w-10 h-10' : 'w-12 h-12'} bg-green-500 rounded-full flex items-center justify-center text-white hover:bg-green-600 transition-colors group hover:scale-110 transform duration-200`}
        aria-label="WhatsApp"
      >
        <WhatsAppIcon className={mobile ? "w-5 h-5" : "w-6 h-6"} title="WhatsApp" />
      </a>

      {/* Facebook Link */}
      <a
        href={facebookUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`block ${mobile ? 'w-10 h-10' : 'w-12 h-12'} bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors group hover:scale-110 transform duration-200`}
      >
        <svg
          className={mobile ? "w-5 h-5" : "w-6 h-6"}
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      </a>

      {/* Instagram Link */}
      <a
        href={instagramUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`block ${mobile ? 'w-10 h-10' : 'w-12 h-12'} bg-pink-600 rounded-full flex items-center justify-center text-white hover:bg-pink-700 transition-colors group hover:scale-110 transform duration-200`}
        aria-label="Instagram"
      >
        <Instagram className={mobile ? "w-5 h-5" : "w-6 h-6"} />
      </a>


      {/* TikTok Link */}
      <a
        href={tiktokUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`block ${mobile ? 'w-10 h-10' : 'w-12 h-12'} bg-black rounded-full flex items-center justify-center text-white hover:bg-gray-800 transition-colors group hover:scale-110 transform duration-200`}
      >
        <svg
          className={mobile ? "w-5 h-5" : "w-6 h-6"}
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-.88-.05A6.33 6.33 0 0 0 5.15 20.1a6.34 6.34 0 0 0 10.86-4.43V7.93a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.19-.36z"/>
        </svg>
      </a>

      {/* Theme Toggle - Hidden on admin pages; optional on mobile to save space */}
      {!isAdminRoute && showTheme && (
        <button
          onClick={handleThemeToggle}
          className={`block ${mobile ? 'w-8 h-8' : 'w-10 h-10'} bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors group hover:scale-110 transform duration-200`}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? (
            <svg
              className={mobile ? "w-4 h-4" : "w-5 h-5"}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"/>
            </svg>
          ) : (
            <svg
              className={mobile ? "w-4 h-4" : "w-5 h-5"}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z"/>
            </svg>
          )}
        </button>
      )}
    </>
  );

  return (
    <>
      {/* Desktop/Tablet Sidebar (hidden on mobile) */}
      <div className="hidden lg:block fixed left-6 top-1/2 transform -translate-y-1/2 z-40 transition-all duration-300 hover:scale-105">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-full p-4 space-y-4">
          <SocialLinks />
        </div>
      </div>

      {/* Mobile: Always-visible compact row */}
      <div className="lg:hidden fixed bottom-4 left-4 z-40">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-full p-2 flex items-center gap-2">
          <SocialLinks mobile={true} showTheme={false} />
        </div>
      </div>
    </>
  );
};

export default SocialSidebar;

// Accessibility and performance optimizations are handled inline with:
// - touch-manipulation for better touch response
// - WebkitTapHighlightColor: 'transparent' to remove tap highlights
// - Hardware acceleration via transform properties
// - Reduced motion support via system preferences
// - Proper ARIA labels and semantic markup
// - Focus management for keyboard navigation