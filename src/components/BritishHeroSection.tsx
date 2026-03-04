import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";

const BritishHeroSection = () => {
  const [showContent, setShowContent] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const scrollToModels = () => {
    const section = document.getElementById("models");
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative h-screen w-full overflow-hidden bg-black">
      {/* Image Background with letterboxing */}
      <div className="absolute inset-0 z-0 flex items-center justify-center bg-black">
        <img
          src="/british-herosection.jpg"
          alt="BleuRoi Cattery - British Longhair cats"
          className={`max-w-full max-h-full w-auto h-auto object-contain transition-opacity duration-700 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
        />

        {/* Light overlay only at the bottom for button readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60 z-10" />
      </div>

      {/* Breed Selection Buttons - pinned to bottom */}
      <div className="relative z-20 h-full flex flex-col justify-end pb-10 md:pb-14">
        <div
          className={`text-center px-4 transition-all duration-1000 ease-out transform ${
            showContent
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-6'
          }`}
        >
          <p className="text-amber-200/70 text-xs md:text-sm uppercase tracking-[0.25em] mb-3 font-light drop-shadow-lg">
            {t("breedHero.subtitle")}
          </p>
          <div className="flex flex-row gap-3 md:gap-5 w-full max-w-lg mx-auto">
            <button
              onClick={() => navigate('/')}
              className="group relative flex-1 overflow-hidden rounded-xl border border-white/20 backdrop-blur-sm bg-white/5 px-4 py-3 md:px-6 md:py-4 text-white transition-all duration-500 hover:bg-white/15 hover:border-white/40 hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(255,255,255,0.15),0_0_40px_rgba(147,197,253,0.1)]"
            >
              <div className="absolute inset-0 -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 ease-out pointer-events-none" />
              <span className="relative flex flex-col items-center gap-0.5">
                <span className="text-[10px] md:text-xs uppercase tracking-[0.2em] text-white/50 font-light">BleuRoi</span>
                <span className="text-base md:text-xl font-playfair font-semibold tracking-wide drop-shadow-lg">
                  {t("breedHero.ragdolls")}
                </span>
              </span>
            </button>

            <div className="flex items-center">
              <div className="w-px h-8 md:h-10 bg-white/20" />
            </div>

            <button
              onClick={scrollToModels}
              className="group relative flex-1 overflow-hidden rounded-xl border border-amber-300/20 backdrop-blur-sm bg-amber-500/5 px-4 py-3 md:px-6 md:py-4 text-white transition-all duration-500 hover:bg-amber-500/15 hover:border-amber-300/40 hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(251,191,36,0.15),0_0_40px_rgba(251,191,36,0.08)]"
            >
              <div className="absolute inset-0 -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] bg-gradient-to-r from-transparent via-amber-100/10 to-transparent transition-transform duration-700 ease-out pointer-events-none" />
              <span className="relative flex flex-col items-center gap-0.5">
                <span className="text-[10px] md:text-xs uppercase tracking-[0.2em] text-amber-200/50 font-light">BleuRoi</span>
                <span className="text-base md:text-xl font-playfair font-semibold tracking-wide drop-shadow-lg">
                  {t("breedHero.britishLonghair")}
                </span>
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {!imageLoaded && (
        <div className="absolute inset-0 z-30 bg-black flex items-center justify-center">
          <div className="text-white text-center">
            <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4 mx-auto" />
            <p className="text-lg font-light">{t('common.loading') || 'Loading...'}</p>
          </div>
        </div>
      )}
    </section>
  );
};

export default BritishHeroSection;
