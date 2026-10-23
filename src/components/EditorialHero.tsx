import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight,
  MapPin,
  Mountain,
  Leaf,
  ChevronLeft,
  ChevronRight,
  Play,
  Sparkles,
  Landmark,
  Waves,
  Utensils
} from 'lucide-react';
import { SafeImage } from './SafeImage';

interface EditorialHeroProps {
  onPlanClick: () => void;
  onExploreClick: () => void;
  onSelectCategory?: (category: string) => void;
}

export const EditorialHero: React.FC<EditorialHeroProps> = ({
  onPlanClick,
  onExploreClick,
  onSelectCategory,
}) => {
  // Carousel slides using clean authentic photography
  const heroSlides = [
    {
      id: 'hampi-vijaya-vittala',
      name: 'Hampi',
      kannada: 'ಹಂಪಿ',
      district: 'Vijayanagara District',
      title: 'A journey through time',
      imageUrl: '/images/hampi_stone_chariot.jpg',
      caption: 'Stone chariot and monolithic temples of Vijayanagara'
    },
    {
      id: 'rajas-seat-madikeri',
      name: 'Coorg',
      kannada: 'ಕೊಡಗು',
      district: 'Kodagu District',
      title: 'Into the misty hills',
      imageUrl: '/images/coorg.jpg',
      caption: 'Lush coffee estates and misty Western Ghats ridges'
    },
    {
      id: 'mysuru-palace',
      name: 'Mysuru',
      kannada: 'ಮೈಸೂರು',
      district: 'Mysuru District',
      title: 'Royal charm and heritage',
      imageUrl: '/images/mysore_palace.jpg',
      caption: 'Grand Indo-Saracenic royal palace of the Wadiyars'
    },
    {
      id: 'badami-cave-temples',
      name: 'Badami',
      kannada: 'ಬಾದಾಮಿ',
      district: 'Bagalkot District',
      title: 'Carved in sandstone',
      imageUrl: '/images/badami.jpg',
      caption: 'Ancient 6th-century rock-cut sandstone cave shrines'
    },
    {
      id: 'gokarna-om-beach',
      name: 'Gokarna',
      kannada: 'ಗೋಕರ್ಣ',
      district: 'Uttara Kannada District',
      title: 'Where cliffs meet the sea',
      imageUrl: '/images/gokarna.jpg',
      caption: 'Pristine crescent beaches where cliffs meet the Arabian Sea'
    }
  ];

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const currentSlide = heroSlides[currentSlideIndex];

  const prevSlide = () => {
    setCurrentSlideIndex((prev) => (prev === 0 ? heroSlides.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentSlideIndex((prev) => (prev === heroSlides.length - 1 ? 0 : prev + 1));
  };

  // 4 Flagship Experiences matching Reference Image
  const experiences = [
    {
      id: 'ancient-kingdoms',
      category: 'heritage',
      title: 'Ancient Kingdoms',
      count: '8 destinations',
      description: 'Temples, forts and stories from a glorious past.',
      imageUrl: '/images/pattadakal.jpg',
      fallbackSrc: '/images/hampi.jpg',
      icon: Landmark
    },
    {
      id: 'western-ghats',
      category: 'hills',
      title: 'Western Ghats',
      count: '7 destinations',
      description: 'Mist-covered hills, coffee estates and breathtaking viewpoints.',
      imageUrl: '/images/coorg.jpg',
      fallbackSrc: '/images/chikmagalur.jpg',
      icon: Mountain
    },
    {
      id: 'coastal-escapes',
      category: 'coast',
      title: 'Coastal Escapes',
      count: '6 destinations',
      description: 'Pristine beaches, coastal towns and serene island getaways.',
      imageUrl: '/images/gokarna.jpg',
      fallbackSrc: '/images/murudeshwar.jpg',
      icon: Waves
    },
    {
      id: 'food-culture',
      category: 'culture',
      title: 'Food & Culture',
      count: '6 destinations',
      description: 'Local flavours, vibrant traditions and unique cultural experiences.',
      imageUrl: '/images/exp_food_karnataka.jpg',
      fallbackSrc: '/images/food_bengaluru_darshini.jpg',
      icon: Utensils
    }
  ];

  const handleExperienceClick = (category: string) => {
    if (onSelectCategory) {
      onSelectCategory(category);
    } else {
      onExploreClick();
    }
  };

  return (
    <div className="w-full flex flex-col bg-[#F7F4EC]">
      {/* ============================================================ */}
      {/* ============================================================ */}
      {/* 1. HERO SECTION WITH VIBRANT KARNATAKA PANORAMIC BACKGROUND   */}
      {/* ============================================================ */}
      <section className="karnataka-hero w-full overflow-hidden border-b border-[#E5DFD3]">
        {/* Content Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10 sm:pt-12 sm:pb-14 lg:pt-14 lg:pb-16 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Column (Desktop 6 cols / 50%): Editorial Typography & Direct CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6 space-y-6"
            >
              {/* Editorial Eyebrow */}
              <div className="text-xs sm:text-sm font-extrabold tracking-[0.2em] text-[#B9684B] uppercase">
                CURATED EXPEDITIONS ACROSS KARNATAKA
              </div>

              {/* Headline with Curved Gold Brush Stroke Underline */}
              <h1 className="font-editorial text-4xl sm:text-5xl lg:text-[3.55rem] text-[#102D23] font-bold leading-[1.08] tracking-tight">
                Find your way<br className="hidden sm:block" />{' '}
                <span className="relative inline-block">
                  through
                  {/* Organic Gold Brush Stroke matching Reference */}
                  <svg
                    className="absolute -bottom-2 left-0 w-full h-3.5 text-[#E0A238] pointer-events-none"
                    viewBox="0 0 160 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M2 9C35 15 90 15 145 7C155 5 159 6 158 8C135 13 85 18 2 12Z"
                      fill="currentColor"
                    />
                  </svg>
                </span>{' '}
                Karnataka.
              </h1>

              {/* Supporting Text matching Reference */}
              <p className="text-base sm:text-lg text-[#102D23] max-w-xl font-medium leading-relaxed drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)]">
                From ancient stone cities to mist-covered mountain roads, create a journey shaped around your time, interests and budget.
              </p>

              {/* Action Buttons matching Reference */}
              <div className="pt-2 flex flex-wrap items-center gap-3.5">
                <button
                  type="button"
                  onClick={onPlanClick}
                  className="px-7 py-3.5 bg-[#10352A] hover:bg-[#071913] text-[#FFFEFA] font-semibold text-sm rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2.5 cursor-pointer group whitespace-nowrap active:scale-[0.99]"
                >
                  <span>Plan my journey</span>
                  <ArrowRight className="w-4 h-4 text-[#D8A735] group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  type="button"
                  onClick={onExploreClick}
                  className="px-6 py-3.5 bg-[#FFFEFA] hover:bg-[#EDE8DE] text-[#10352A] border border-[#D5CEBF] font-medium text-sm rounded-xl transition-colors duration-200 flex items-center gap-2.5 cursor-pointer whitespace-nowrap active:scale-[0.99] shadow-2xs"
                >
                  <div className="w-5 h-5 rounded-full border border-[#B9684B] flex items-center justify-center text-[#B9684B]">
                    <Play className="w-2.5 h-2.5 fill-[#B9684B] translate-x-0.2" />
                  </div>
                  <span>Explore destinations</span>
                </button>
              </div>

              {/* 4 Feature/Trust Items matching Reference Image with vertical divider bars */}
              <div className="p-3 sm:p-3.5 bg-[#FFFEFA]/85 backdrop-blur-md rounded-2xl border border-white/60 shadow-xs grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-xs text-[#555850]">
                {/* 1. Curated Destinations */}
                <div className="flex items-start gap-2.5 pr-2 sm:border-r sm:border-[#D5CEBF]/60">
                  <div className="w-5 h-5 rounded-full border border-[#B9684B] flex items-center justify-center text-[#B9684B] shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-[#B9684B]" />
                  </div>
                  <div className="leading-tight">
                    <div className="font-bold text-[#102D23] text-sm font-mono-numbers">32</div>
                    <div className="text-[11px] text-[#555850] font-medium">Curated Destinations</div>
                  </div>
                </div>

                {/* 2. Distinct Circuits */}
                <div className="flex items-start gap-2.5 pr-2 sm:border-r sm:border-[#D5CEBF]/60">
                  <Mountain className="w-5 h-5 text-[#D8A735] shrink-0 mt-0.5 stroke-[1.5]" />
                  <div className="leading-tight">
                    <div className="font-bold text-[#102D23] text-sm font-mono-numbers">6</div>
                    <div className="text-[11px] text-[#555850] font-medium">Distinct Circuits</div>
                  </div>
                </div>

                {/* 3. Powered by Gemini */}
                <div className="flex items-start gap-2.5 pr-2 sm:border-r sm:border-[#D5CEBF]/60">
                  <Sparkles className="w-5 h-5 text-[#D8A735] shrink-0 mt-0.5" />
                  <div className="leading-tight">
                    <div className="text-[9px] uppercase font-bold tracking-wider text-[#77786F]">POWERED BY</div>
                    <div className="font-bold text-[#102D23] text-sm">Gemini</div>
                  </div>
                </div>

                {/* 4. Authentic Experiences */}
                <div className="flex items-start gap-2.5">
                  <Leaf className="w-5 h-5 text-[#10352A] shrink-0 mt-0.5 stroke-[1.5]" />
                  <div className="leading-tight">
                    <div className="font-bold text-[#102D23] text-xs">Authentic Karnataka</div>
                    <div className="text-[11px] text-[#77786F]">Experiences</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right Column (Desktop 6 cols / 50%): Large Destination Photography with Reference Visuals */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6 relative mt-4 lg:mt-0"
            >
              {/* The Main Panoramic Photo Container */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-[#D5CEBF] bg-[#EDE8DE] aspect-[4/3] sm:aspect-[16/11]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSlide.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.45 }}
                    className="w-full h-full"
                  >
                    <SafeImage
                      src={currentSlide.imageUrl}
                      alt={currentSlide.name}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                </AnimatePresence>

                {/* Handwritten Cursive Annotation from Reference */}
                <div className="absolute top-5 left-6 z-20 pointer-events-none select-none">
                  <div className="flex flex-col items-start drop-shadow-md">
                    <span className="font-editorial italic text-3xl sm:text-4xl font-bold text-white tracking-tight">
                      {currentSlide.name}
                    </span>
                    <span className="text-xs sm:text-sm font-medium text-white/90 italic -mt-0.5">
                      {currentSlide.title}
                    </span>
                    {/* Decorative curved SVG dotted arrow */}
                    <svg className="w-16 h-8 text-[#D8A735] -rotate-12 translate-x-3 mt-1" viewBox="0 0 100 50" fill="none">
                      <path
                        d="M 10 10 Q 50 45 85 25"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeDasharray="4 4"
                        fill="none"
                      />
                      <polygon points="85,20 92,26 83,30" fill="currentColor" />
                    </svg>
                  </div>
                </div>

                {/* Subtle gradient overlay for contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

                {/* Floating Destination Badge Card (Bottom Right from Reference) */}
                <div className="absolute bottom-14 right-5 z-20 bg-[#FFFEFA]/95 backdrop-blur-md rounded-xl p-2.5 shadow-xl border border-white/60 flex items-center gap-3 max-w-[240px]">
                  <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 bg-[#EDE8DE] border border-[#E5DFD3]">
                    <img
                      src={currentSlide.imageUrl}
                      alt={currentSlide.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0 pr-1">
                    <div className="font-bold text-xs text-[#102D23] truncate leading-tight">
                      {currentSlide.name}
                    </div>
                    <div className="text-[10px] text-[#77786F] truncate mt-0.5">
                      {currentSlide.district}
                    </div>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-[#102D23] flex items-center justify-center text-white shrink-0">
                    <ArrowRight className="w-3 h-3 text-[#D8A735]" />
                  </div>
                </div>

                {/* Carousel Controls Strip at Bottom */}
                <div className="absolute bottom-3 left-6 right-6 z-20 flex items-center justify-between">
                  {/* Indicator dots: active elongated, inactives round */}
                  <div className="flex items-center gap-2">
                    {heroSlides.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCurrentSlideIndex(idx)}
                        className={`h-1.5 rounded-full transition-all cursor-pointer ${
                          idx === currentSlideIndex
                            ? 'w-7 bg-[#FFFEFA]'
                            : 'w-2 bg-white/50 hover:bg-white/80'
                        }`}
                        aria-label={`Go to slide ${idx + 1}`}
                      />
                    ))}
                  </div>

                  {/* Circular < and > arrow navigation buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={prevSlide}
                      className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/65 backdrop-blur-xs text-white flex items-center justify-center transition-colors cursor-pointer"
                      aria-label="Previous slide"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={nextSlide}
                      className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/65 backdrop-blur-xs text-white flex items-center justify-center transition-colors cursor-pointer"
                      aria-label="Next slide"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. "EXPLORE BY EXPERIENCE" SECTION: 4-CARD SHOWCASE           */}
      <section id="curated-experiences" className="relative w-full bg-[#F7F4EC] pt-10 sm:pt-14 pb-12 sm:pb-16 lg:pb-20 scroll-mt-20">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          {/* Section Header matching Reference */}
          <div className="space-y-3">
            <div className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#B9684B]">
              EXPLORE BY EXPERIENCE
            </div>

            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
              <h2 className="font-editorial text-3xl sm:text-4xl lg:text-[2.75rem] text-[#102D23] font-bold tracking-tight leading-tight">
                Find{' '}
                <span className="relative inline-block">
                  your
                  {/* Organic Gold Brush Stroke */}
                  <svg
                    className="absolute -bottom-1.5 left-0 w-full h-3 text-[#E0A238] pointer-events-none"
                    viewBox="0 0 120 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M 2 9 C 30 15, 75 15, 105 7 C 114 4, 118 5, 119 6 C 95 11, 65 17, 2 13 Z"
                      fill="currentColor"
                    />
                  </svg>
                </span>{' '}
                kind of Karnataka
              </h2>
            </div>

            <p className="text-sm sm:text-base text-[#555850] max-w-3xl font-normal leading-relaxed">
              From timeless heritage and misty hills to pristine beaches and unforgettable flavours — explore Karnataka through experiences that inspire you.
            </p>
          </div>

          {/* 4 Experience Cards Grid matching Reference Image */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {experiences.map((exp) => {
              const Icon = exp.icon;
              return (
                <motion.div
                  key={exp.id}
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => handleExperienceClick(exp.category)}
                  className="group relative rounded-2xl overflow-hidden border border-[#D5CEBF] hover:border-[#102D23] shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer aspect-[4/5] bg-[#EDE8DE] flex flex-col justify-between"
                >
                  {/* Background authentic photograph */}
                  <SafeImage
                    src={exp.imageUrl}
                    fallbackSrc={exp.fallbackSrc}
                    alt={exp.title}
                    className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                  />

                  {/* Dark gradient overlay for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

                  {/* Top-Left Category Icon & Destination Count Badge */}
                  <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-[10px] font-bold text-[#102D23] shadow-xs">
                      {exp.count}
                    </span>
                  </div>

                  {/* Card Content & Action Button at Bottom */}
                  <div className="absolute bottom-4 left-4 right-4 z-10 text-white flex items-end justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className="font-editorial text-xl sm:text-2xl font-bold tracking-tight text-[#FFFEFA] drop-shadow-xs">
                        {exp.title}
                      </h3>
                      <p className="text-xs text-white/85 line-clamp-2 leading-relaxed">
                        {exp.description}
                      </p>
                    </div>

                    {/* Circular Gold Arrow Button matching Reference */}
                    <button
                      type="button"
                      title={`Explore ${exp.title}`}
                      className="w-9 h-9 rounded-full bg-[#D8A735] hover:bg-[#C29328] text-[#102D23] flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition-transform cursor-pointer"
                    >
                      <ArrowRight className="w-4 h-4 text-[#102D23]" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

        </div>
      </section>
    </div>
  );
};
