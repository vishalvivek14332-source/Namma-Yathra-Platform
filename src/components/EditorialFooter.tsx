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
    <footer className="relative w-full select-none overflow-hidden" aria-label="Namma Yatra Footer">
      
      {/* ============================================================ */}
      {/* DESKTOP VIEW (>= lg / 1024px): 100% Pixel-Identical Artwork  */}
      {/* with Interactive Hotspot Buttons                             */}
      {/* ============================================================ */}
      <div className="hidden lg:block relative w-full overflow-hidden">
        {/* Exact cropped footer banner from Endofpage.png */}
        <img
          src="/images/footer_banner_exact.png"
          alt="Namma Yatra - Your Karnataka Your Journey"
          className="w-full h-auto block select-none pointer-events-none"
          loading="eager"
        />

        {/* 1. Brand Logo & Title Hotspot */}
        <button
          type="button"
          onClick={onNavigateHome}
          aria-label="Namma Yatra - Return to Top"
          title="Namma Yatra"
          className="absolute z-10 cursor-pointer rounded-xl transition-all duration-200 hover:ring-2 hover:ring-[#102D23]/25 focus:outline-none focus:ring-2 focus:ring-[#173D2E]"
          style={{
            left: '9.19%',
            top: '34.48%',
            width: '18.92%',
            height: '41.38%'
          }}
        />

        {/* 2. "Explore" Badge Hotspot */}
        <button
          type="button"
          onClick={onNavigateAtlas}
          aria-label="Explore Karnataka Destinations"
          title="Explore Destinations"
          className="absolute z-10 cursor-pointer rounded-full transition-all duration-200 hover:bg-[#102D23]/10 hover:ring-1 hover:ring-[#102D23]/30 focus:outline-none focus:ring-2 focus:ring-[#173D2E]"
          style={{
            left: '31.35%',
            top: '68.97%',
            width: '7.30%',
            height: '20.69%'
          }}
        />

        {/* 3. "Plan" Badge Hotspot */}
        <button
          type="button"
          onClick={onNavigatePlanner}
          aria-label="Plan Your Journey"
          title="Plan Your Journey"
          className="absolute z-10 cursor-pointer rounded-full transition-all duration-200 hover:bg-[#102D23]/10 hover:ring-1 hover:ring-[#102D23]/30 focus:outline-none focus:ring-2 focus:ring-[#173D2E]"
          style={{
            left: '39.46%',
            top: '68.97%',
            width: '7.03%',
            height: '20.69%'
          }}
        />

        {/* 4. "Experience" Badge Hotspot */}
        <button
          type="button"
          onClick={onNavigateExperiences}
          aria-label="Curated Experiences"
          title="Curated Experiences"
          className="absolute z-10 cursor-pointer rounded-full transition-all duration-200 hover:bg-[#102D23]/10 hover:ring-1 hover:ring-[#102D23]/30 focus:outline-none focus:ring-2 focus:ring-[#173D2E]"
          style={{
            left: '47.57%',
            top: '68.97%',
            width: '9.73%',
            height: '20.69%'
          }}
        />

        {/* 5. "Discover" Nav Link Hotspot */}
        <button
          type="button"
          onClick={onNavigateHome}
          aria-label="Discover"
          title="Discover"
          className="absolute z-10 cursor-pointer rounded transition-all duration-200 hover:bg-[#102D23]/10 hover:ring-1 hover:ring-[#102D23]/20 focus:outline-none focus:ring-1 focus:ring-[#173D2E]"
          style={{
            left: '71.08%',
            top: '63.79%',
            width: '5.95%',
            height: '15.52%'
          }}
        />

        {/* 6. "Trip Planner" Nav Link Hotspot */}
        <button
          type="button"
          onClick={onNavigatePlanner}
          aria-label="Trip Planner"
          title="Trip Planner"
          className="absolute z-10 cursor-pointer rounded transition-all duration-200 hover:bg-[#102D23]/10 hover:ring-1 hover:ring-[#102D23]/20 focus:outline-none focus:ring-1 focus:ring-[#173D2E]"
          style={{
            left: '77.57%',
            top: '63.79%',
            width: '6.49%',
            height: '15.52%'
          }}
        />

        {/* 7. "Karnataka Atlas" Nav Link Hotspot */}
        <button
          type="button"
          onClick={onNavigateAtlas}
          aria-label="Karnataka Atlas"
          title="Karnataka Atlas"
          className="absolute z-10 cursor-pointer rounded transition-all duration-200 hover:bg-[#102D23]/10 hover:ring-1 hover:ring-[#102D23]/20 focus:outline-none focus:ring-1 focus:ring-[#173D2E]"
          style={{
            left: '84.59%',
            top: '63.79%',
            width: '8.38%',
            height: '15.52%'
          }}
        />
      </div>

      {/* ============================================================ */}
      {/* MOBILE & TABLET VIEW (< lg / 1024px): Responsive Rich Banner */}
      {/* ============================================================ */}
      <div className="block lg:hidden bg-[#FAF6ED] border-t border-[#D5CEBF] px-5 py-8 sm:px-8 space-y-6">
        
        {/* Brand identity */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 pb-4 border-b border-[#E5DFD3]">
          <div
            onClick={onNavigateHome}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-full bg-[#102D23] flex items-center justify-center text-[#D8A735] shadow-xs group-hover:scale-105 transition-transform">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="font-editorial text-2xl font-bold text-[#102D23] leading-tight">
                Namma Yatra
              </div>
              <div className="text-[9px] uppercase tracking-widest font-semibold text-[#77786F]">
                YOUR KARNATAKA · YOUR JOURNEY
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div className="flex items-center gap-5 text-xs font-semibold text-[#292D29]">
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

        {/* Center Kannada and Subtitle */}
        <div className="space-y-1.5 text-center sm:text-left">
          <div className="font-kannada text-lg font-bold text-[#B9684B]">
            ನಮ್ಮ ಯಾತ್ರೆ · ನಿಮ್ಮ ಕರ್ನಾಟಕ · ನಮ್ಮ ಹಾಡು
          </div>
          <p className="text-xs text-[#555850] leading-relaxed">
            Your Karnataka. Your Journey. Authentic travel experiences, powered by AI.
          </p>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2">
          <button
            type="button"
            onClick={onNavigateAtlas}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFFEFA] border border-[#D5CEBF] text-xs font-semibold text-[#102D23] hover:bg-[#EDE8DE] transition-colors cursor-pointer shadow-2xs"
          >
            <Leaf className="w-3.5 h-3.5 text-[#2E6B4F]" />
            <span>Explore</span>
          </button>
          <span className="text-[#D5CEBF]">|</span>
          <button
            type="button"
            onClick={onNavigatePlanner}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFFEFA] border border-[#D5CEBF] text-xs font-semibold text-[#102D23] hover:bg-[#EDE8DE] transition-colors cursor-pointer shadow-2xs"
          >
            <Mountain className="w-3.5 h-3.5 text-[#2E6B4F]" />
            <span>Plan</span>
          </button>
          <span className="text-[#D5CEBF]">|</span>
          <button
            type="button"
            onClick={onNavigateExperiences}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFFEFA] border border-[#D5CEBF] text-xs font-semibold text-[#102D23] hover:bg-[#EDE8DE] transition-colors cursor-pointer shadow-2xs"
          >
            <Camera className="w-3.5 h-3.5 text-[#2E6B4F]" />
            <span>Experience</span>
          </button>
        </div>

      </div>

    </footer>
  );
};
