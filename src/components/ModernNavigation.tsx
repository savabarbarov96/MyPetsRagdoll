import { useState, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useActiveSection, useScrollPosition } from "@/hooks/useScrollAnimation";
import SocialContactModal from "./SocialContactModal";
import LanguageSwitcher from "./LanguageSwitcher";
import { useLanguage } from "@/hooks/useLanguage";
import ragdollLogo from "@/assets/ragdoll-logo.png";

const ModernNavigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const activeSection = useActiveSection(['home', 'models', 'males', 'females', 'kittens', 'tiktok', 'contact']);
  const { scrollY } = useScrollPosition();
  const { t } = useLanguage();
  
  const isNewsPage = location.pathname.startsWith('/news');
  const isAboutPage = location.pathname.startsWith('/about');
  const isBritishPage = location.pathname.startsWith('/british');
  const isAllCatsPage = location.pathname === '/all-cats';
  const isHomePage = location.pathname === '/';

  const scrollToSection = useCallback((sectionId: string) => {
    if (isHomePage) {
      // If we're on the home page, scroll directly
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // If we're on another page, navigate to home first then scroll
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
    setIsOpen(false);
  }, [isHomePage, navigate]);

  const navBg = scrollY > 50 ? 'bg-background/98' : 'bg-black/30';
  const navShadow = scrollY > 50 ? 'shadow-lg' : '';
  const textColor = scrollY > 50 ? 'text-foreground' : 'text-white';
  
  // Calculate scroll progress
  const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
  const scrollProgress = Math.min((scrollY / documentHeight) * 100, 100);

  return (
    <nav className={`${navBg} ${navShadow} backdrop-blur-sm fixed top-0 w-full z-50 transition-all duration-300 relative`}>
      <div className="container mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-24">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <img 
              src={ragdollLogo} 
              alt="My Pets Ragdoll Logo" 
              className="w-20 h-20 object-contain"
            />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => scrollToSection('home')}
              className={`transition-colors text-sm font-medium ${
                activeSection === 'home'
                  ? `${textColor} border-b-2 ${scrollY > 50 ? 'border-foreground' : 'border-white'}`
                  : `${scrollY > 50 ? 'text-muted-foreground hover:text-foreground' : 'text-white/80 hover:text-white'}`
              }`}
            >
              {t('navigation.home')}
            </button>
            <Link
              to="/british"
              className={`transition-colors text-sm font-medium ${
                isBritishPage
                  ? `${textColor} border-b-2 ${scrollY > 50 ? 'border-foreground' : 'border-white'}`
                  : `${scrollY > 50 ? 'text-muted-foreground hover:text-foreground' : 'text-white/80 hover:text-white'}`
              }`}
            >
              {t('navigation.british')}
            </Link>
            <Link
              to="/all-cats"
              className={`transition-colors text-sm font-medium ${
                isAllCatsPage
                  ? `${textColor} border-b-2 ${scrollY > 50 ? 'border-foreground' : 'border-white'}`
                  : `${scrollY > 50 ? 'text-muted-foreground hover:text-foreground' : 'text-white/80 hover:text-white'}`
              }`}
            >
              {t('navigation.allCats')}
            </Link>
            {/* Models dropdown */}
            <div className="relative group">
              <button
                className={`transition-colors text-sm font-medium flex items-center gap-1 ${
                  activeSection === 'models' || activeSection === 'males' || activeSection === 'females' || activeSection === 'kittens'
                    ? `${textColor} border-b-2 ${scrollY > 50 ? 'border-foreground' : 'border-white'}`
                    : `${scrollY > 50 ? 'text-muted-foreground hover:text-foreground' : 'text-white/80 hover:text-white'}`
                }`}
              >
                {t('navigation.models')}
                <svg className="w-3 h-3 transition-transform group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className={`rounded-xl shadow-xl border min-w-[200px] py-2 ${
                  scrollY > 50
                    ? 'bg-background border-border'
                    : 'bg-black/80 backdrop-blur-md border-white/20'
                }`}>
                  <div className={`px-3 py-1.5 text-xs uppercase tracking-wider font-medium ${
                    scrollY > 50 ? 'text-muted-foreground' : 'text-white/50'
                  }`}>Ragdoll</div>
                  <button
                    onClick={() => scrollToSection('models')}
                    className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                      scrollY > 50
                        ? 'text-foreground hover:bg-muted'
                        : 'text-white/90 hover:bg-white/10'
                    }`}
                  >
                    {t('navigation.models')}
                  </button>
                  <button
                    onClick={() => scrollToSection('males')}
                    className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                      scrollY > 50
                        ? 'text-foreground hover:bg-muted'
                        : 'text-white/90 hover:bg-white/10'
                    }`}
                  >
                    {t('navigation.males')}
                  </button>
                  <button
                    onClick={() => scrollToSection('females')}
                    className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                      scrollY > 50
                        ? 'text-foreground hover:bg-muted'
                        : 'text-white/90 hover:bg-white/10'
                    }`}
                  >
                    {t('navigation.females')}
                  </button>
                  <button
                    onClick={() => scrollToSection('kittens')}
                    className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                      scrollY > 50
                        ? 'text-foreground hover:bg-muted'
                        : 'text-white/90 hover:bg-white/10'
                    }`}
                  >
                    {t('navigation.kittens')}
                  </button>
                  <div className={`mx-3 my-1.5 h-px ${scrollY > 50 ? 'bg-border' : 'bg-white/20'}`} />
                  <div className={`px-3 py-1.5 text-xs uppercase tracking-wider font-medium ${
                    scrollY > 50 ? 'text-muted-foreground' : 'text-amber-300/70'
                  }`}>British Longhair & Shorthair</div>
                  <Link
                    to="/british#models"
                    className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                      scrollY > 50
                        ? 'text-foreground hover:bg-muted'
                        : 'text-white/90 hover:bg-white/10'
                    }`}
                  >
                    {t('navigation.british')} {t('navigation.models')}
                  </Link>
                  <div className={`mx-3 my-1.5 h-px ${scrollY > 50 ? 'bg-border' : 'bg-white/20'}`} />
                  <Link
                    to="/all-cats"
                    className={`block w-full text-left px-4 py-2 text-sm font-medium transition-colors ${
                      scrollY > 50
                        ? 'text-foreground hover:bg-muted'
                        : 'text-white/90 hover:bg-white/10'
                    }`}
                  >
                    {t('navigation.allCats')}
                  </Link>
                </div>
              </div>
            </div>
            <Link
              to="/news"
              className={`transition-colors text-sm font-medium ${
                isNewsPage
                  ? `${textColor} border-b-2 ${scrollY > 50 ? 'border-foreground' : 'border-white'}`
                  : `${scrollY > 50 ? 'text-muted-foreground hover:text-foreground' : 'text-white/80 hover:text-white'}`
              }`}
            >
              {t('navigation.news')}
            </Link>
            <Link
              to="/about"
              className={`transition-colors text-sm font-medium ${
                isAboutPage
                  ? `${textColor} border-b-2 ${scrollY > 50 ? 'border-foreground' : 'border-white'}`
                  : `${scrollY > 50 ? 'text-muted-foreground hover:text-foreground' : 'text-white/80 hover:text-white'}`
              }`}
            >
              За нас
            </Link>
            <button
              onClick={() => scrollToSection('tiktok')}
              className={`transition-colors text-sm font-medium ${
                activeSection === 'tiktok'
                  ? `${textColor} border-b-2 ${scrollY > 50 ? 'border-foreground' : 'border-white'}`
                  : `${scrollY > 50 ? 'text-muted-foreground hover:text-foreground' : 'text-white/80 hover:text-white'}`
              }`}
            >
              {t('navigation.tiktok')}
            </button>
            
            {/* Language Switcher */}
            <LanguageSwitcher />
            
            <Button 
              variant="outline" 
              size="sm" 
              className={scrollY > 50 
                ? "bg-card border-border text-foreground hover:bg-muted" 
                : "bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm"
              }
              onClick={() => setIsContactModalOpen(true)}
            >
              {t('navigation.contact')}
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`${textColor} ${scrollY > 50 ? 'hover:text-muted-foreground' : 'hover:text-white/80'} focus:outline-none transition-colors`}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden pb-4">
            <div className="space-y-2">
              <button
                onClick={() => scrollToSection('home')}
                className={`block px-3 py-2 transition-colors text-sm w-full text-left ${
                  activeSection === 'home' ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t('navigation.home')}
              </button>
              <Link
                to="/british"
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2 transition-colors text-sm w-full text-left ${
                  isBritishPage ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t('navigation.british')}
              </Link>
              {/* Models group */}
              <div className="px-3 pt-2 pb-1 text-xs uppercase tracking-wider text-muted-foreground/60 font-medium">
                Ragdoll {t('navigation.models')}
              </div>
              <button
                onClick={() => scrollToSection('models')}
                className={`block px-5 py-2 transition-colors text-sm w-full text-left ${
                  activeSection === 'models' ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t('navigation.models')}
              </button>
              <button
                onClick={() => scrollToSection('males')}
                className={`block px-5 py-2 transition-colors text-sm w-full text-left ${
                  activeSection === 'males' ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t('navigation.males')}
              </button>
              <button
                onClick={() => scrollToSection('females')}
                className={`block px-5 py-2 transition-colors text-sm w-full text-left ${
                  activeSection === 'females' ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t('navigation.females')}
              </button>
              <button
                onClick={() => scrollToSection('kittens')}
                className={`block px-5 py-2 transition-colors text-sm w-full text-left ${
                  activeSection === 'kittens' ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t('navigation.kittens')}
              </button>
              <div className="px-3 pt-2 pb-1 text-xs uppercase tracking-wider text-amber-600/60 font-medium">
                British Longhair & Shorthair {t('navigation.models')}
              </div>
              <Link
                to="/british#models"
                onClick={() => setIsOpen(false)}
                className="block px-5 py-2 transition-colors text-sm w-full text-left text-muted-foreground hover:text-foreground"
              >
                {t('navigation.british')} {t('navigation.models')}
              </Link>
              <div className="px-3 pt-2 pb-1 text-xs uppercase tracking-wider text-muted-foreground/60 font-medium">
                {t('navigation.allCats')}
              </div>
              <Link
                to="/all-cats"
                onClick={() => setIsOpen(false)}
                className={`block px-5 py-2 transition-colors text-sm w-full text-left ${
                  isAllCatsPage ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t('navigation.allCats')}
              </Link>
              <Link
                to="/news"
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2 transition-colors text-sm w-full text-left ${
                  isNewsPage ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t('navigation.news')}
              </Link>
              <Link
                to="/about"
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2 transition-colors text-sm w-full text-left ${
                  isAboutPage ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                За нас
              </Link>
              <button
                onClick={() => scrollToSection('tiktok')}
                className={`block px-3 py-2 transition-colors text-sm w-full text-left ${
                  activeSection === 'tiktok' ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t('navigation.tiktok')}
              </button>
              
              {/* Mobile Language Switcher */}
              <div className="px-3 py-2">
                <LanguageSwitcher />
              </div>
              
              <div className="px-3 py-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full bg-primary border-primary text-primary-foreground hover:bg-primary/90 hover:border-primary/90"
                  onClick={() => {
                    setIsContactModalOpen(true);
                    setIsOpen(false);
                  }}
                >
                  {t('navigation.contact')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Scroll Progress Bar */}
      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-200">
        <div 
          className="h-full bg-black transition-all duration-300 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Contact Modal */}
      <SocialContactModal
        cat={null}
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />
    </nav>
  );
};

export default ModernNavigation;