import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  KARNATAKA_DESTINATIONS,
  Destination,
  REGIONS,
  getDestinationById
} from '../data/destinations';
import { TripPlannerInput, formatINR } from '../types/itinerary';
import {
  Compass,
  MapPin,
  Clock,
  Ticket,
  Utensils,
  ArrowRight,
  X,
  Landmark,
  Trees,
  Mountain,
  Waves,
  Coffee,
  Sun,
  PlusCircle,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  LayoutGrid,
  Palmtree,
  Leaf,
  Search,
  ChevronLeft,
  ChevronRight,
  Camera,
  Calendar,
  SlidersHorizontal,
  ChevronDown,
  Eye
} from 'lucide-react';
import { DestinationWeatherCard } from './DestinationWeatherCard';
import { AtlasInteractiveMap } from './AtlasInteractiveMap';
import { SafeImage } from './SafeImage';
import { NearbyExplorer } from './NearbyExplorer';
import { StartingLocation, SelectedPlace, NearbyAttraction } from '../types/itinerary';

interface CuratedShowcaseProps {
  onSelectQuickCircuit: (preset: Partial<TripPlannerInput>) => void;
  onSelectDestinationForPlan?: (destination: Destination) => void;
  startingLocation: StartingLocation | null;
  onSelectStartingLocation: (loc: StartingLocation | null) => void;
  selectedPlaces: SelectedPlace[];
  onTogglePlace: (attraction: NearbyAttraction) => void;
}

export const CuratedShowcase: React.FC<CuratedShowcaseProps> = ({
  onSelectQuickCircuit,
  onSelectDestinationForPlan,
  startingLocation,
  onSelectStartingLocation,
  selectedPlaces,
  onTogglePlace
}) => {
  const [showcaseMode, setShowcaseMode] = useState<'nearby' | 'curated'>('nearby');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Selected destination in the Geographic Atlas showcase (defaults to Jog Falls like the reference)
  const defaultAtlasDest = KARNATAKA_DESTINATIONS.find(d => d.id === 'jog-falls-shivamogga') || KARNATAKA_DESTINATIONS[0];
  const [selectedAtlasDest, setSelectedAtlasDest] = useState<Destination>(defaultAtlasDest);
  
  // Modal for deep detail / advanced options
  const [modalDestination, setModalDestination] = useState<Destination | null>(null);
  const [showAllDestinations, setShowAllDestinations] = useState<boolean>(false);

  // Close modal on Escape key for accessibility
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setModalDestination(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Six Signature Editorial Destinations exactly matching the Reference Image
  const signatureDestinations = [
    {
      id: 'hampi-vijaya-vittala',
      name: 'Hampi',
      tagline: 'Living history among ancient ruins',
      kannada: 'ಹಂಪಿ',
      region: 'Northern Heritage',
      district: 'Vijayanagara',
      categoryBadge: 'HERITAGE',
      filterCategory: 'heritage',
      subtags: 'Temples • Architecture • Culture',
      imageUrl: '/images/hampi_stone_chariot.jpg',
      description: 'Capital of the 14th-century Vijayanagara Empire, strewn with monumental temples, palace pavilions, and granite boulder hills along the Tungabhadra.',
      circuitPreset: {
        origin: 'Hubballi-Dharwad',
        destinationPreference: 'Hampi & Badami UNESCO Trail',
        durationDays: 3,
        travellersCount: 2,
        totalBudgetINR: 28000,
        interests: ['Heritage', 'Adventure'] as Destination['categories'][number][]
      }
    },
    {
      id: 'rajas-seat-madikeri',
      name: 'Coorg',
      tagline: 'Into the misty hills',
      kannada: 'ಕೊಡಗು',
      region: 'Western Ghats & Hills',
      district: 'Kodagu',
      categoryBadge: 'HILLS',
      filterCategory: 'hills',
      subtags: 'Coffee • Nature • Waterfalls',
      imageUrl: '/images/coorg.jpg',
      description: 'Scotland of India — rolling emerald coffee plantations, fragrant cardamom valleys, roaring waterfalls, and sacred Cauvery headwaters.',
      circuitPreset: {
        origin: 'Bengaluru',
        destinationPreference: 'Western Ghats & Coorg Hills',
        durationDays: 3,
        travellersCount: 2,
        totalBudgetINR: 32000,
        interests: ['Nature', 'Food & Culture'] as Destination['categories'][number][]
      }
    },
    {
      id: 'mysuru-palace',
      name: 'Mysuru',
      tagline: 'Royal charm and rich culture',
      kannada: 'ಮೈಸೂರು',
      region: 'Mysuru & Cauvery',
      district: 'Mysuru',
      categoryBadge: 'HERITAGE',
      filterCategory: 'heritage',
      subtags: 'Palace • Heritage • Art',
      imageUrl: '/images/mysore_palace.jpg',
      description: 'Cultural capital of Karnataka, celebrated for the Indo-Saracenic Amba Vilas Palace, vibrant Devaraja flower market, and Dasara legacy.',
      circuitPreset: {
        origin: 'Bengaluru',
        destinationPreference: 'Mysuru & Southern Heritage',
        durationDays: 2,
        travellersCount: 2,
        totalBudgetINR: 22000,
        interests: ['Heritage', 'Food & Culture'] as Destination['categories'][number][]
      }
    },
    {
      id: 'gokarna-om-beach',
      name: 'Gokarna',
      tagline: 'Where the coast slows down',
      kannada: 'ಗೋಕರ್ಣ',
      region: 'Coastal Karnataka',
      district: 'Uttara Kannada',
      categoryBadge: 'COAST',
      filterCategory: 'coast',
      subtags: 'Beaches • Temples • Relaxation',
      imageUrl: '/images/gokarna.jpg',
      description: 'Unspoiled palm-fringed coastal town where rugged Western Ghats drop into the Arabian Sea, creating five famous crescent beaches.',
      circuitPreset: {
        origin: 'Mangaluru',
        destinationPreference: 'Coastal Karavali & Gokarna',
        durationDays: 4,
        travellersCount: 2,
        totalBudgetINR: 34000,
        interests: ['Beaches', 'Spiritual'] as Destination['categories'][number][]
      }
    },
    {
      id: 'mullayanagiri-peak',
      name: 'Chikkamagaluru',
      tagline: 'Mountain mornings',
      kannada: 'ಚಿಕ್ಕಮಗಳೂರು',
      region: 'Western Ghats & Hills',
      district: 'Chikkamagaluru',
      categoryBadge: 'HILLS',
      filterCategory: 'hills',
      subtags: 'Coffee • Trekking • Scenic Views',
      imageUrl: '/images/chikkamagaluru.jpg',
      description: 'Cradle of Indian coffee, home to Karnataka’s highest summit, Bababudan ranges, and winding mountain passes blanketed in morning fog.',
      circuitPreset: {
        origin: 'Bengaluru',
        destinationPreference: 'Chikkamagaluru Peaks & Coffee',
        durationDays: 3,
        travellersCount: 2,
        totalBudgetINR: 30000,
        interests: ['Nature', 'Adventure'] as Destination['categories'][number][]
      }
    },
    {
      id: 'badami-cave-temples',
      name: 'Badami',
      tagline: 'Carved in stone',
      kannada: 'ಬಾದಾಮಿ',
      region: 'Northern Heritage',
      district: 'Bagalkot',
      categoryBadge: 'HERITAGE',
      filterCategory: 'heritage',
      subtags: 'Cave Temples • History • Architecture',
      imageUrl: '/images/badami.jpg',
      description: 'Ancient capital of the early Chalukyas, featuring monumental 6th-century rock-cut cave temples perched above the serene waters of Agastya Lake.',
      circuitPreset: {
        origin: 'Hubballi-Dharwad',
        destinationPreference: 'Hampi & Badami UNESCO Trail',
        durationDays: 3,
        travellersCount: 2,
        totalBudgetINR: 28000,
        interests: ['Heritage', 'Adventure'] as Destination['categories'][number][]
      }
    }
  ];

  // Category filter tabs matching reference image
  const categoryFilters = [
    { id: 'all', label: 'All', icon: LayoutGrid },
    { id: 'heritage', label: 'Heritage', icon: Landmark },
    { id: 'hills', label: 'Hills', icon: Mountain },
    { id: 'coast', label: 'Coast', icon: Waves },
    { id: 'nature', label: 'Nature', icon: Leaf },
    { id: 'culture', label: 'Culture', icon: Sun },
  ];

  // Filtered signature cards based on top tab selection
  const visibleCards = useMemo(() => {
    if (activeCategory === 'all') return signatureDestinations;
    return signatureDestinations.filter(d => {
      if (activeCategory === 'heritage') return d.filterCategory === 'heritage';
      if (activeCategory === 'hills') return d.filterCategory === 'hills';
      if (activeCategory === 'coast') return d.filterCategory === 'coast';
      if (activeCategory === 'nature') return d.filterCategory === 'hills' || d.filterCategory === 'coast';
      if (activeCategory === 'culture') return d.filterCategory === 'heritage';
      return true;
    });
  }, [activeCategory]);

  // Filtered destinations for the map
  const mapDestinations = useMemo(() => {
    return KARNATAKA_DESTINATIONS.filter(dest => {
      const matchesRegion = selectedRegion === 'All' || dest.region === selectedRegion;
      const matchesSearch = !searchQuery.trim() || 
        dest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dest.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dest.shortDescription.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesRegion && matchesSearch;
    });
  }, [selectedRegion, searchQuery]);

  return (
    <div className="space-y-12 sm:space-y-16 py-4 sm:py-6 w-full max-w-full">
      
      {/* EXPLORATION MODE TOGGLE BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E5DFD3] gap-4">
        <div className="flex items-center gap-2 bg-[#FFFEFA] p-1 rounded-2xl border border-[#D5CEBF] shadow-xs">
          <button
            type="button"
            onClick={() => setShowcaseMode('nearby')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              showcaseMode === 'nearby'
                ? 'bg-[#173D2E] text-[#FFFEFA] shadow-xs'
                : 'text-[#555850] hover:text-[#102D23]'
            }`}
          >
            <Compass className="w-4 h-4 text-[#D8A735]" />
            <span>Explore Nearby Places</span>
            {selectedPlaces.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#D8A735] text-[#102D23] text-[10px] font-bold flex items-center justify-center">
                {selectedPlaces.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setShowcaseMode('curated')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              showcaseMode === 'curated'
                ? 'bg-[#173D2E] text-[#FFFEFA] shadow-xs'
                : 'text-[#555850] hover:text-[#102D23]'
            }`}
          >
            <LayoutGrid className="w-4 h-4 text-[#D8A735]" />
            <span>Curated Circuits & Atlas</span>
          </button>
        </div>

        {selectedPlaces.length > 0 && (
          <div className="text-xs text-[#173D2E] font-semibold flex items-center gap-2 bg-[#173D2E]/8 px-3.5 py-2 rounded-xl border border-[#173D2E]/20">
            <Sparkles className="w-4 h-4 text-[#D8A735] shrink-0" />
            <span>
              <strong>{selectedPlaces.length}</strong> place(s) queued for your itinerary
            </span>
          </div>
        )}
      </div>

      {/* VIEW 1: NEARBY EXPLORER */}
      {showcaseMode === 'nearby' && (
        <NearbyExplorer
          startingLocation={startingLocation}
          onSelectStartingLocation={onSelectStartingLocation}
          selectedPlaces={selectedPlaces}
          onTogglePlace={onTogglePlace}
          onViewDetails={(attraction) => {
            const dest = KARNATAKA_DESTINATIONS.find(d => d.id === attraction.id);
            if (dest) {
              setModalDestination(dest);
            }
          }}
        />
      )}

      {/* VIEW 2: CURATED CIRCUITS & ATLAS */}
      {showcaseMode === 'curated' && (
        <div className="space-y-16 sm:space-y-20">
          {/* ============================================================ */}
          {/* 1. SIGNATURE EXPERIENCES: "Places that stay with you."       */}
          {/* ============================================================ */}
          <section className="space-y-7">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 border-b border-[#E5DFD3] pb-5">
          <div>
            <div className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-[#B9684B] mb-1">
              SIGNATURE EXPERIENCES
            </div>
            <h2 className="font-editorial text-3xl sm:text-4xl lg:text-5xl text-[#102D23] font-bold tracking-tight">
              Places that stay with you.
            </h2>
            <p className="text-sm sm:text-base text-[#555850] mt-1 font-normal">
              Six ways to experience Karnataka.
            </p>
          </div>

          {/* Category Filter Tabs matching Reference Screenshot */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none max-w-full">
            {categoryFilters.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-[#173D2E] text-[#FFFEFA] shadow-xs'
                      : 'bg-[#FFFEFA] text-[#555850] border border-[#D5CEBF] hover:bg-[#EDE8DE] hover:text-[#102D23]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#D8A735]' : 'text-[#77786F]'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 6 Full-Bleed Asymmetric Photographic Cards matching Reference */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleCards.map((card) => {
            const destObj = KARNATAKA_DESTINATIONS.find(d => d.id === card.id);
            return (
              <motion.div
                key={card.id}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => {
                  if (destObj) {
                    setSelectedAtlasDest(destObj);
                    setModalDestination(destObj);
                  }
                }}
                className="group relative rounded-2xl overflow-hidden border border-[#D5CEBF] hover:border-[#173D2E] shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer aspect-[16/11] bg-[#EDE8DE] flex flex-col justify-between"
              >
                {/* Background Image */}
                <SafeImage
                  src={card.imageUrl}
                  alt={card.name}
                  objectPosition={destObj?.objectPosition}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />

                {/* Rich Bottom Gradient Overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />

                {/* Top-Left Category Badge Pill */}
                <div className="absolute top-4 left-4 z-10">
                  <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider text-[#102D23] shadow-xs">
                    {card.categoryBadge}
                  </span>
                </div>

                {/* Card Content Overlay at Bottom */}
                <div className="absolute bottom-4 left-5 right-5 z-10 text-white flex items-end justify-between gap-3">
                  <div className="space-y-1">
                    <h3 className="font-editorial text-2xl sm:text-3xl font-bold tracking-tight text-[#FFFEFA] drop-shadow-xs">
                      {card.name}
                    </h3>
                    <div className="text-xs text-white/95 font-medium drop-shadow-xs">
                      {card.tagline}
                    </div>
                    <div className="text-[11px] text-white/75 drop-shadow-xs pt-0.5">
                      {card.subtags}
                    </div>
                  </div>

                  {/* Circular White Arrow Action Button matching Reference */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectQuickCircuit(card.circuitPreset);
                    }}
                    title="Plan journey to this destination"
                    className="w-9 h-9 rounded-full bg-white hover:bg-[#F7F4EC] text-[#102D23] flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition-transform cursor-pointer"
                  >
                    <ArrowRight className="w-4 h-4 text-[#102D23]" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. GEOGRAPHIC ATLAS: 2-Column Split matching Reference Image  */}
      {/* ============================================================ */}
      <section id="atlas-section" className="space-y-6 pt-2">
        {/* Section Header with Search and Region Filter */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-[#E5DFD3] pb-4">
          <div>
            <div className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-[#B9684B] mb-1">
              GEOGRAPHIC ATLAS
            </div>
            <h3 className="font-editorial text-3xl sm:text-4xl text-[#102D23] font-bold tracking-tight">
              Explore 32 Curated Destinations
            </h3>
            <p className="text-sm text-[#555850] mt-1 font-normal">
              Verified coordinates, authentic descriptions, and interactive map of Karnataka.
            </p>
          </div>

          {/* Right Header Search & Region Select matching Reference */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-[#77786F] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="atlas-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search destinations..."
                className="w-full pl-9 pr-3.5 py-2 bg-[#FFFEFA] border border-[#D5CEBF] rounded-lg text-xs text-[#292D29] placeholder-[#77786F] focus:outline-none focus:ring-1 focus:ring-[#173D2E]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#77786F] hover:text-[#292D29]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Region Dropdown */}
            <div className="relative shrink-0">
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="appearance-none pl-3.5 pr-8 py-2 bg-[#FFFEFA] border border-[#D5CEBF] rounded-lg text-xs text-[#292D29] font-medium focus:outline-none focus:ring-1 focus:ring-[#173D2E] cursor-pointer"
              >
                <option value="All">All Karnataka Regions</option>
                {REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#77786F] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* 2-Column Split: Left Map & Thumbnails (7 cols) / Right Showcase Card (5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN (lg:col-span-7): Interactive Map + Destination Thumbnails */}
          <div className="lg:col-span-7 space-y-3">
            {/* Leaflet Map Box */}
            <div className="w-full">
              <AtlasInteractiveMap
                destinations={mapDestinations}
                selectedDestinationId={selectedAtlasDest.id}
                onSelectDestination={(dest) => setSelectedAtlasDest(dest)}
                onViewDetails={(dest) => {
                  setSelectedAtlasDest(dest);
                  setModalDestination(dest);
                }}
              />
            </div>

            {/* Horizontal Strip of Clickable Thumbnails matching Reference */}
            <div>
              <div className="flex items-center justify-between text-[11px] text-[#77786F] mb-1.5 px-0.5 font-medium">
                <span>
                  {searchQuery.trim() || selectedRegion !== 'All' 
                    ? `Filtered Destinations (${mapDestinations.length})` 
                    : 'Featured Karnataka Destinations'}
                </span>
                <span className="text-[10px] text-[#B9684B] font-semibold">
                  Click card to focus · Click details to inspect
                </span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {(searchQuery.trim() || selectedRegion !== 'All' 
                  ? mapDestinations.slice(0, 6) 
                  : signatureDestinations.map(s => KARNATAKA_DESTINATIONS.find(d => d.id === s.id) || defaultAtlasDest)
                ).map((destObj) => {
                  if (!destObj) return null;
                  const isSelected = selectedAtlasDest.id === destObj.id;
                  return (
                    <div
                      key={destObj.id}
                      className={`group relative rounded-xl overflow-hidden aspect-[4/3] border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#173D2E] ring-2 ring-[#173D2E] shadow-sm'
                          : 'border-[#D5CEBF] hover:border-[#173D2E]/60'
                      }`}
                      onClick={() => {
                        setSelectedAtlasDest(destObj);
                      }}
                      title={`Select ${destObj.name} on map`}
                    >
                      <SafeImage
                        src={destObj.imageUrl}
                        alt={destObj.name}
                        objectPosition={destObj.objectPosition}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-between p-1.5 pointer-events-none">
                        <div className="flex justify-end pointer-events-auto">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAtlasDest(destObj);
                              setModalDestination(destObj);
                            }}
                            title={`View full details for ${destObj.name}`}
                            className="w-5 h-5 rounded-full bg-black/50 hover:bg-[#173D2E] text-white flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                          >
                            <Eye className="w-2.5 h-2.5 text-[#D8A735]" />
                          </button>
                        </div>
                        <span className="text-[10px] font-bold text-white truncate w-full text-center drop-shadow-xs">
                          {destObj.name.split('(')[0].trim()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Atlas Destination List / Catalogue Accordion */}
            <div className="pt-2">
              <div className="flex items-center justify-between py-2 border-t border-[#E5DFD3]">
                <div className="flex items-center gap-2">
                  <Compass className="w-3.5 h-3.5 text-[#173D2E]" />
                  <span className="text-xs font-bold text-[#102D23]">
                    Atlas Destination List
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EDE8DE] text-[#555850] font-mono-numbers font-medium">
                    {mapDestinations.length} destinations
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAllDestinations(!showAllDestinations)}
                  className="text-xs font-semibold text-[#173D2E] hover:text-[#B9684B] flex items-center gap-1 cursor-pointer py-1 px-2.5 rounded-lg hover:bg-[#EDE8DE] transition-colors"
                >
                  <span>{showAllDestinations ? 'Hide Destination List' : 'Browse All in List'}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showAllDestinations ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {showAllDestinations && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 max-h-[380px] overflow-y-auto pr-1">
                  {mapDestinations.map((dest) => {
                    const isSelected = selectedAtlasDest.id === dest.id;
                    return (
                      <div
                        key={dest.id}
                        className={`p-3 rounded-xl border transition-all duration-200 bg-[#FFFEFA] flex flex-col justify-between gap-2.5 ${
                          isSelected
                            ? 'border-[#173D2E] ring-1 ring-[#173D2E] shadow-xs bg-[#F7F4EC]/60'
                            : 'border-[#E5DFD3] hover:border-[#173D2E]/50 hover:shadow-xs'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="w-14 h-14 rounded-lg overflow-hidden bg-[#EDE8DE] shrink-0 border border-[#E5DFD3]">
                            <SafeImage
                              src={dest.imageUrl}
                              alt={dest.name}
                              objectPosition={dest.objectPosition}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[9px] uppercase font-bold text-[#B9684B] truncate">
                              {dest.categories[0] || dest.region}
                            </div>
                            <h5 className="font-editorial text-xs font-bold text-[#102D23] truncate">
                              {dest.name}
                            </h5>
                            {dest.kannadaName && (
                              <div className="text-[10px] text-[#77786F] font-kannada truncate">
                                {dest.kannadaName}
                              </div>
                            )}
                            <div className="text-[10px] text-[#77786F] mt-0.5 truncate">
                              {dest.district} District
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-[#E5DFD3] pt-2 text-xs">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAtlasDest(dest);
                              const mapEl = document.getElementById('atlas-section');
                              if (mapEl) {
                                mapEl.scrollIntoView({ behavior: 'smooth' });
                              }
                            }}
                            className="text-[11px] font-semibold text-[#555850] hover:text-[#102D23] flex items-center gap-1 cursor-pointer"
                          >
                            <MapPin className="w-3 h-3 text-[#173D2E]" />
                            <span>Focus Map</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAtlasDest(dest);
                              setModalDestination(dest);
                            }}
                            className="text-[11px] font-bold text-[#173D2E] hover:text-[#B9684B] flex items-center gap-1 cursor-pointer group"
                          >
                            <span>Click to view details</span>
                            <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN (lg:col-span-5): Featured Destination Showcase Card matching Reference */}
          <div className="lg:col-span-5">
            <div className="bg-[#FFFEFA] rounded-2xl border border-[#D5CEBF] overflow-hidden shadow-sm flex flex-col justify-between">
              
              {/* Photo Area with NATURE badge, carousel arrows, and photo counter */}
              <div
                className="relative aspect-[16/10] bg-[#EDE8DE] overflow-hidden group cursor-pointer"
                onClick={() => setModalDestination(selectedAtlasDest)}
                title="Click to inspect full destination details"
              >
                <SafeImage
                  src={selectedAtlasDest.imageUrl}
                  alt={selectedAtlasDest.name}
                  objectPosition={selectedAtlasDest.objectPosition}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
                />

                {/* Top-Left Category Badge */}
                <div className="absolute top-3.5 left-3.5 z-10">
                  <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider text-[#102D23] shadow-xs">
                    {selectedAtlasDest.categories[0] || 'NATURE'}
                  </span>
                </div>

                {/* Left/Right carousel arrows */}
                <div className="absolute inset-y-0 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const idx = KARNATAKA_DESTINATIONS.findIndex(d => d.id === selectedAtlasDest.id);
                      const prevIdx = idx <= 0 ? KARNATAKA_DESTINATIONS.length - 1 : idx - 1;
                      setSelectedAtlasDest(KARNATAKA_DESTINATIONS[prevIdx]);
                    }}
                    className="w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors pointer-events-auto cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const idx = KARNATAKA_DESTINATIONS.findIndex(d => d.id === selectedAtlasDest.id);
                      const nextIdx = idx >= KARNATAKA_DESTINATIONS.length - 1 ? 0 : idx + 1;
                      setSelectedAtlasDest(KARNATAKA_DESTINATIONS[nextIdx]);
                    }}
                    className="w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors pointer-events-auto cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Photo counter bottom right */}
                <div className="absolute bottom-3 right-3 z-10 bg-black/60 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded font-mono-numbers flex items-center gap-1">
                  <Camera className="w-3 h-3 text-[#D8A735]" />
                  <span>1 / 5</span>
                </div>
              </div>

              {/* Destination Detail Content */}
              <div className="p-5 sm:p-6 space-y-4">
                {/* Title & District */}
                <div>
                  <h4
                    className="font-editorial text-2xl sm:text-3xl font-bold text-[#102D23] leading-tight hover:text-[#B9684B] transition-colors cursor-pointer"
                    onClick={() => setModalDestination(selectedAtlasDest)}
                    title="Click to view full destination details"
                  >
                    {selectedAtlasDest.name.split('(')[0].trim()}
                  </h4>
                  <div className="text-xs text-[#77786F] mt-0.5 font-medium flex items-center justify-between">
                    <span>{selectedAtlasDest.district} District</span>
                    {selectedAtlasDest.kannadaName && (
                      <span className="font-kannada text-xs text-[#77786F]">
                        {selectedAtlasDest.kannadaName}
                      </span>
                    )}
                  </div>
                </div>

                {/* Tags row */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#555850]">
                  <span className="flex items-center gap-1 text-[#B9684B] font-medium">
                    <MapPin className="w-3 h-3" />
                    {selectedAtlasDest.categories[0]}
                  </span>
                  <span className="text-[#D5CEBF]">·</span>
                  <span>{selectedAtlasDest.region}</span>
                  <span className="text-[#D5CEBF]">·</span>
                  <span className="flex items-center gap-1">
                    <Camera className="w-3 h-3 text-[#77786F]" />
                    Photography
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-[#555850] leading-relaxed line-clamp-3">
                  {selectedAtlasDest.shortDescription}
                </p>

                {/* 3 Metric Boxes matching Reference */}
                <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
                  <div className="p-2.5 bg-[#F7F4EC] rounded-xl border border-[#E5DFD3] text-center">
                    <div className="text-[10px] text-[#77786F] flex items-center justify-center gap-1 mb-0.5">
                      <Clock className="w-3 h-3 text-[#B9684B]" />
                      <span>Estimated Visit</span>
                    </div>
                    <div className="font-bold text-[#102D23] font-mono-numbers text-xs">
                      {Math.round(selectedAtlasDest.recommendedDurationMinutes / 60)} Hours
                    </div>
                  </div>

                  <div className="p-2.5 bg-[#F7F4EC] rounded-xl border border-[#E5DFD3] text-center">
                    <div className="text-[10px] text-[#77786F] flex items-center justify-center gap-1 mb-0.5">
                      <Calendar className="w-3 h-3 text-[#D8A735]" />
                      <span>Best Season</span>
                    </div>
                    <div className="font-bold text-[#102D23] text-xs truncate">
                      Oct - Mar
                    </div>
                  </div>

                  <div className="p-2.5 bg-[#F7F4EC] rounded-xl border border-[#E5DFD3] text-center">
                    <div className="text-[10px] text-[#77786F] flex items-center justify-center gap-1 mb-0.5">
                      <Compass className="w-3 h-3 text-[#173D2E]" />
                      <span>Region</span>
                    </div>
                    <div className="font-bold text-[#102D23] text-xs truncate">
                      {selectedAtlasDest.district}
                    </div>
                  </div>
                </div>

                {/* Action Buttons matching Reference */}
                <div className="pt-2 flex items-center justify-between gap-3">
                  <button
                    onClick={() => {
                      if (onSelectDestinationForPlan) {
                        onSelectDestinationForPlan(selectedAtlasDest);
                      }
                      const plannerEl = document.getElementById('planner-form');
                      if (plannerEl) {
                        plannerEl.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="flex-1 py-3 px-4 bg-[#173D2E] hover:bg-[#102D23] text-[#FFFEFA] font-medium text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#D8A735]" />
                    <span>Add to Trip Itinerary</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalDestination(selectedAtlasDest)}
                    className="px-4 py-3 text-xs font-semibold text-[#173D2E] hover:text-[#102D23] bg-[#F7F4EC] hover:bg-[#EDE8DE] border border-[#D5CEBF] rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap group"
                    title={`View complete details for ${selectedAtlasDest.name}`}
                  >
                    <Eye className="w-3.5 h-3.5 text-[#B9684B]" />
                    <span>View Full Details</span>
                    <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>
    </div>
  )}

      {/* ============================================================ */}
      {/* 3. DESTINATION DEEP DETAIL MODAL (Advanced Options)          */}
      {/* ============================================================ */}
      {modalDestination && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalDestination(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-[#FFFEFA] rounded-2xl border border-[#D5CEBF] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto overflow-x-hidden"
          >
            {/* Modal Image Header */}
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#EDE8DE]">
              <SafeImage
                src={modalDestination.imageUrl}
                alt={modalDestination.name}
                objectPosition={modalDestination.objectPosition}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#102D23]/90 via-[#102D23]/30 to-transparent pointer-events-none" />
              
              <button
                onClick={() => setModalDestination(null)}
                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="absolute bottom-4 left-6 right-6 text-white">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs uppercase font-semibold tracking-wider text-[#D8A735]">
                    {modalDestination.region} · {modalDestination.district}
                  </span>
                </div>
                <h3 className="font-editorial text-2xl sm:text-3xl font-bold leading-tight">
                  {modalDestination.name}
                </h3>
                {modalDestination.kannadaName && (
                  <div className="font-kannada text-sm text-stone-200 mt-0.5">
                    {modalDestination.kannadaName}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 text-xs text-[#555850]">
              {/* Seasonal Weather Component */}
              <DestinationWeatherCard
                lat={modalDestination.lat}
                lng={modalDestination.lng}
                region={modalDestination.region}
                district={modalDestination.district}
                destinationName={modalDestination.name}
                compact={false}
              />

              <div>
                <span className="font-bold text-[#292D29] block mb-1">Overview</span>
                <p className="leading-relaxed">{modalDestination.shortDescription}</p>
              </div>

              {modalDestination.historicalSignificance && (
                <div className="p-3.5 bg-[#F7F4EC] rounded-xl border border-[#E5DFD3]">
                  <span className="font-bold text-[#102D23] block mb-1 flex items-center gap-1.5">
                    <Landmark className="w-3.5 h-3.5 text-[#B9684B]" />
                    Historical & Cultural Heritage
                  </span>
                  <p className="leading-relaxed">{modalDestination.historicalSignificance}</p>
                </div>
              )}

              {/* Specs Grid with Peak Elevation */}
              {(() => {
                const elevationText = modalDestination.id === 'mullayanagiri-peak'
                  ? '1,930 m (6,330 ft)'
                  : modalDestination.shortDescription.match(/\b\d[\d,]*\s*(?:meters|m|ft)\b/i)?.[0];
                return (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-[#F7F4EC] rounded-xl border border-[#E5DFD3]">
                      <span className="text-[10px] uppercase font-semibold text-[#77786F] block">Recommended Time</span>
                      <span className="font-mono-numbers text-sm font-bold text-[#292D29]">
                        {Math.round(modalDestination.recommendedDurationMinutes / 60)} Hours
                      </span>
                    </div>

                    <div className="p-3 bg-[#F7F4EC] rounded-xl border border-[#E5DFD3]">
                      <span className="text-[10px] uppercase font-semibold text-[#77786F] block">Entry Fee</span>
                      <span className="font-mono-numbers text-sm font-bold text-[#292D29]">
                        {modalDestination.avgEntryFeeINR > 0 ? formatINR(modalDestination.avgEntryFeeINR) : 'Free Admission'}
                      </span>
                    </div>

                    {elevationText ? (
                      <div className="p-3 bg-[#F7F4EC] rounded-xl border border-[#E5DFD3]">
                        <span className="text-[10px] uppercase font-semibold text-[#77786F] block flex items-center gap-1">
                          <Mountain className="w-3 h-3 text-[#173D2E]" />
                          Peak Elevation
                        </span>
                        <span className="font-mono-numbers text-sm font-bold text-[#102D23]">
                          {elevationText}
                        </span>
                      </div>
                    ) : (
                      <div className="p-3 bg-[#F7F4EC] rounded-xl border border-[#E5DFD3] col-span-2 sm:col-span-1">
                        <span className="text-[10px] uppercase font-semibold text-[#77786F] block">Coordinates</span>
                        <span className="font-mono-numbers text-xs font-bold text-[#292D29]">
                          {modalDestination.lat.toFixed(3)}°N, {modalDestination.lng.toFixed(3)}°E
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div>
                <span className="font-bold text-[#292D29] block mb-1">Ideal Visiting Window</span>
                <p>{modalDestination.bestTimeToVisit}</p>
              </div>

              {modalDestination.localSpecialties && modalDestination.localSpecialties.length > 0 && (
                <div>
                  <span className="font-bold text-[#292D29] block mb-1">Authentic Regional Flavours</span>
                  <p className="flex items-center gap-1.5 text-[#102D23] font-medium">
                    <Utensils className="w-3.5 h-3.5 text-[#B9684B]" />
                    {modalDestination.localSpecialties.join(' · ')}
                  </p>
                </div>
              )}

              {modalDestination.knownConstraints && modalDestination.knownConstraints.length > 0 && (
                <div className="p-3 bg-[#B9684B]/10 rounded-xl border border-[#B9684B]/20 text-[#8C3B1F] text-xs">
                  <span className="font-bold block mb-0.5">Planning Considerations & Constraints:</span>
                  <ul className="list-disc list-inside space-y-0.5">
                    {modalDestination.knownConstraints.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#F7F4EC] border-t border-[#E5DFD3] flex items-center justify-between">
              <span className="text-[11px] text-[#77786F]">
                Verified ASI & Karnataka Tourism Data
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setModalDestination(null)}
                  className="px-4 py-2 bg-[#FFFEFA] hover:bg-[#EDE8DE] text-[#292D29] border border-[#D5CEBF] text-xs font-medium rounded-lg transition-colors cursor-pointer"
                >
                  Close
                </button>
                {onSelectDestinationForPlan && (
                  <button
                    onClick={() => {
                      onSelectDestinationForPlan(modalDestination);
                      setModalDestination(null);
                    }}
                    className="px-4 py-2 bg-[#173D2E] hover:bg-[#102D23] text-white text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-[#D8A735]" />
                    <span>Include in Planner</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
};
