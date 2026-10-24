import React from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Landmark,
  Mountain,
  Waves,
  Utensils
} from 'lucide-react';
import { SafeImage } from './SafeImage';

interface CuratedExperiencesProps {
  onExploreClick: () => void;
  onSelectCategory?: (category: string) => void;
}

export const CuratedExperiences: React.FC<CuratedExperiencesProps> = ({
  onExploreClick,
  onSelectCategory,
}) => {
  // 4 Flagship Experiences matching Reference
  const experiences = [
    {
      id: 'ancient-kingdoms',
      category: 'heritage',
      title: 'Ancient Kingdoms',
      count: '8 destinations',
      description: 'Temples, forts and stories from a glorious past.',
      imageUrl: '/images/pattadakal.jpg',
      fallbackSrc: '/images/hampi.jpg',
      objectPosition: 'center 40%',
      icon: Landmark
    },
    {
      id: 'western-ghats',
      category: 'hills',
      title: 'Western Ghats',
      count: '7 destinations',
      description: 'Mist-covered hills, coffee estates and breathtaking viewpoints.',
      imageUrl: '/images/coorg.jpg',
      fallbackSrc: '/images/chikkamagaluru.jpg',
      objectPosition: 'center 35%',
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
      objectPosition: 'center 40%',
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
      objectPosition: 'center center',
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
    <section id="curated-experiences" className="relative w-full pt-10 sm:pt-14 pb-12 sm:pb-16 lg:pb-20 scroll-mt-20 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Section Header */}
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

          <p className="text-sm sm:text-base text-[#555850] max-w-3xl font-medium leading-relaxed">
            From timeless heritage and misty hills to pristine beaches and unforgettable flavours — explore Karnataka through experiences that inspire you.
          </p>
        </div>

        {/* 4 Experience Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {experiences.map((exp) => {
            const Icon = exp.icon;
            return (
              <motion.div
                key={exp.id}
                whileHover={{ y: -6 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => handleExperienceClick(exp.category)}
                className="group relative rounded-2xl overflow-hidden border border-[#D5CEBF] hover:border-[#102D23] shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer aspect-[4/5] bg-[#EDE8DE] flex flex-col justify-between"
              >
                {/* Background authentic photograph */}
                <SafeImage
                  src={exp.imageUrl}
                  fallbackSrc={exp.fallbackSrc}
                  alt={exp.title}
                  objectPosition={exp.objectPosition}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
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

                  {/* Circular Gold Arrow Button */}
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
  );
};
