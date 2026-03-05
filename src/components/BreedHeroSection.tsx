import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";

const BreedHeroSection = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const scrollToRagdoll = () => {
    const section = document.getElementById("home");
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative w-full h-screen min-h-[600px] overflow-hidden">
      {/* Full-screen Background Image */}
      <div className="absolute inset-0">
        <img
          src="/intro.jpg"
          alt="BleuRoi Cattery - Premium Ragdoll & British cats raised with love"
          className="w-full h-full object-cover object-center"
          fetchPriority="high"
        />
        {/* Bottom gradient for button area readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      </div>

      {/* Buttons at bottom center */}
      <div className="absolute bottom-12 md:bottom-16 left-0 right-0 z-10 flex justify-center px-4">
        <div className="flex flex-col sm:flex-row gap-4 md:gap-6 w-full max-w-xl">
          {/* British Button (left - matches left cat in image) */}
          <button
            onClick={() => navigate('/british')}
            className="group relative flex-1 overflow-hidden rounded-2xl border-2 border-amber-300/50 backdrop-blur-md bg-amber-900/30 px-6 py-4 md:py-5 text-white transition-all duration-500 hover:bg-amber-700/40 hover:border-amber-300/80 hover:scale-105 hover:shadow-2xl hover:shadow-amber-500/25"
          >
            {/* Shimmer on hover */}
            <div className="absolute inset-0 -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] bg-gradient-to-r from-transparent via-amber-100/15 to-transparent transition-transform duration-700 ease-out pointer-events-none" />

            <span className="relative flex flex-col items-center gap-1">
              <span className="text-[10px] uppercase tracking-[0.3em] text-amber-200/70 font-light">
                BleuRoi
              </span>
              <span className="text-xl md:text-2xl font-playfair font-semibold tracking-wide drop-shadow-lg">
                {t("breedHero.britishLonghair")}
              </span>
            </span>
          </button>

          {/* Ragdoll Button (right - matches right cat in image) */}
          <button
            onClick={scrollToRagdoll}
            className="group relative flex-1 overflow-hidden rounded-2xl border-2 border-blue-200/40 backdrop-blur-md bg-blue-900/30 px-6 py-4 md:py-5 text-white transition-all duration-500 hover:bg-blue-800/40 hover:border-blue-200/70 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25"
          >
            {/* Shimmer on hover */}
            <div className="absolute inset-0 -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] bg-gradient-to-r from-transparent via-blue-100/15 to-transparent transition-transform duration-700 ease-out pointer-events-none" />

            <span className="relative flex flex-col items-center gap-1">
              <span className="text-[10px] uppercase tracking-[0.3em] text-blue-200/70 font-light">
                BleuRoi
              </span>
              <span className="text-xl md:text-2xl font-playfair font-semibold tracking-wide drop-shadow-lg">
                {t("breedHero.ragdolls")}
              </span>
            </span>
          </button>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-3 md:bottom-5 left-1/2 -translate-x-1/2 z-10 animate-bounce">
        <div className="w-5 h-8 rounded-full border-2 border-white/30 flex items-start justify-center p-1">
          <div className="w-1 h-2 rounded-full bg-white/50" />
        </div>
      </div>
    </section>
  );
};

export default BreedHeroSection;
