import React from 'react';
import { Compass, Leaf, Mountain, Camera } from 'lucide-react';

interface EditorialFooterProps {
  onNavigateHome?: () => void;
  onNavigatePlanner?: () => void;
  onNavigateAtlas?: () => void;
  onNavigateExperiences?: () => void;
}

export const EditorialFooter: React.FC<EditorialFooterProps> = ({
  onNavigateHome,
  onNavigatePlanner,
  onNavigateAtlas,
  onNavigateExperiences
}) => {
  return (
    <footer className="relative w-full select-none overflow-hidden z-10 pt-8 pb-12 sm:pb-16" aria-label="Namma Yatra Footer">
      {/* Translucent ivory deckle container allowing the scenic coastal background to shine through */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#FAF6ED]/85 backdrop-blur-md rounded-3xl border border-[#D5CEBF]/80 shadow-lg p-6 sm:p-8 lg:p-10 space-y-8">
          
          {/* Top row: Brand Identity on Left, Quick Navigation Links on Right */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 pb-6 border-b border-[#E5DFD3]/80">
            {/* Logo */}
            <div
              onClick={onNavigateHome}
              className="flex items-center gap-3.5 cursor-pointer group"
            >
              <div className="w-11 h-11 rounded-full bg-[#102D23] flex items-center justify-center text-[#D8A735] shadow-xs group-hover:scale-105 transition-transform">
                <Compass className="w-6 h-6" />
              </div>
              <div>
                <div className="font-editorial text-2xl sm:text-3xl font-bold text-[#102D23] leading-tight">
                  Namma Yatra
                </div>
                <div className="text-[10px] uppercase tracking-widest font-bold text-[#77786F]">
                  YOUR KARNATAKA · YOUR JOURNEY
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="flex items-center gap-6 sm:gap-8 text-xs sm:text-sm font-bold text-[#292D29]">
              <button
                type="button"
                onClick={onNavigateHome}
                className="hover:text-[#102D23] transition-colors cursor-pointer"
              >
                Discover
              </button>
              <button
                type="button"
                onClick={onNavigatePlanner}
                className="hover:text-[#102D23] transition-colors cursor-pointer"
              >
                Trip Planner
              </button>
              <button
                type="button"
                onClick={onNavigateAtlas}
                className="hover:text-[#102D23] transition-colors cursor-pointer"
              >
                Karnataka Atlas
              </button>
            </div>
          </div>

          {/* Middle: Red Kannada typography and Subtitle */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1.5 text-center md:text-left">
              <div className="font-kannada text-xl sm:text-2xl font-bold text-[#B9684B]">
                ನಮ್ಮ ಯಾತ್ರೆ · ನಿಮ್ಮ ಕರ್ನಾಟಕ · ನಮ್ಮ ಹಾಡು
              </div>
              <p className="text-xs sm:text-sm text-[#555850] max-w-xl leading-relaxed">
                Your Karnataka. Your Journey. Authentic travel experiences, powered by AI.
              </p>
            </div>

            {/* 3 Interactive Badges */}
            <div className="flex items-center gap-3 shrink-0 flex-wrap justify-center">
              <button
                type="button"
                onClick={onNavigateAtlas}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FFFEFA] border border-[#D5CEBF] text-xs font-bold text-[#102D23] hover:bg-[#EDE8DE] hover:border-[#102D23] transition-all cursor-pointer shadow-xs active:scale-98"
              >
                <Leaf className="w-3.5 h-3.5 text-[#2E6B4F]" />
                <span>Explore</span>
              </button>
              <span className="text-[#D5CEBF]">|</span>
              <button
                type="button"
                onClick={onNavigatePlanner}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FFFEFA] border border-[#D5CEBF] text-xs font-bold text-[#102D23] hover:bg-[#EDE8DE] hover:border-[#102D23] transition-all cursor-pointer shadow-xs active:scale-98"
              >
                <Mountain className="w-3.5 h-3.5 text-[#2E6B4F]" />
                <span>Plan</span>
              </button>
              <span className="text-[#D5CEBF]">|</span>
              <button
                type="button"
                onClick={onNavigateExperiences}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FFFEFA] border border-[#D5CEBF] text-xs font-bold text-[#102D23] hover:bg-[#EDE8DE] hover:border-[#102D23] transition-all cursor-pointer shadow-xs active:scale-98"
              >
                <Camera className="w-3.5 h-3.5 text-[#2E6B4F]" />
                <span>Experience</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
};
