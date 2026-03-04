import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const BreedHeroSection = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { elementRef, isVisible } = useScrollAnimation(0.15);

  const scrollToModels = () => {
    const section = document.getElementById("models");
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative w-full h-[70vh] min-h-[500px] overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="/british-herosection.jpg"
          alt="BleuRoi Cattery - Ragdoll and British Longhair cats"
          className="w-full h-full object-cover object-center"
          loading="lazy"
        />
        {/* Gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/65" />
        {/* Side vignette */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />
      </div>

      {/* Content */}
      <div
        ref={elementRef}
        className={`relative z-10 h-full flex flex-col items-center justify-center px-4 transition-all duration-1000 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {/* Subtitle */}
        <p className="text-white/80 text-sm md:text-base uppercase tracking-[0.3em] mb-6 font-light drop-shadow-lg">
          {t("breedHero.subtitle")}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 md:gap-6 w-full max-w-2xl">
          {/* Ragdolls Button */}
          <button
            onClick={scrollToModels}
            className="group relative flex-1 overflow-hidden rounded-2xl border-2 border-white/30 backdrop-blur-md bg-white/10 px-8 py-5 md:py-6 text-white transition-all duration-500 hover:bg-white/20 hover:border-white/60 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20"
          >
            {/* Shimmer on hover */}
            <div className="absolute inset-0 -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 ease-out pointer-events-none" />

            <span className="relative flex flex-col items-center gap-1">
              <span className="text-xs uppercase tracking-[0.25em] text-white/70 font-light">
                BleuRoi
              </span>
              <span className="text-2xl md:text-3xl font-playfair font-semibold tracking-wide drop-shadow-lg">
                {t("breedHero.ragdolls")}
              </span>
            </span>
          </button>

          {/* Divider */}
          <div className="hidden sm:flex items-center">
            <div className="w-px h-16 bg-white/30" />
          </div>
          <div className="sm:hidden flex justify-center">
            <div className="h-px w-16 bg-white/30" />
          </div>

          {/* British Longhair Button */}
          <button
            onClick={() => navigate('/british')}
            className="group relative flex-1 overflow-hidden rounded-2xl border-2 border-amber-300/40 backdrop-blur-md bg-amber-500/10 px-8 py-5 md:py-6 text-white transition-all duration-500 hover:bg-amber-500/20 hover:border-amber-300/70 hover:scale-105 hover:shadow-2xl hover:shadow-amber-500/20"
          >
            {/* Shimmer on hover */}
            <div className="absolute inset-0 -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] bg-gradient-to-r from-transparent via-amber-100/15 to-transparent transition-transform duration-700 ease-out pointer-events-none" />

            <span className="relative flex flex-col items-center gap-1">
              <span className="text-xs uppercase tracking-[0.25em] text-amber-200/80 font-light">
                BleuRoi
              </span>
              <span className="text-2xl md:text-3xl font-playfair font-semibold tracking-wide drop-shadow-lg">
                {t("breedHero.britishLonghair")}
              </span>
            </span>
          </button>
        </div>
      </div>

    </section>
  );
};

export default BreedHeroSection;
