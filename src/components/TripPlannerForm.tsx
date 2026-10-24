import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  TripPlannerInput,
  BudgetStyle,
  TravelPace,
  TravelMode,
  formatINR
} from '../types/itinerary';
import {
  SUPPORTED_ORIGINS,
  EXPERIENCE_CATEGORIES,
  Destination
} from '../data/destinations';
import {
  MapPin,
  Calendar,
  Users,
  Compass,
  Wallet,
  Clock,
  Sparkles,
  AlertCircle,
  Check,
  ChevronDown,
  ArrowRight,
  Shield,
  Layers,
  Landmark,
  Trees,
  Mountain,
  Waves,
  Coffee,
  Sun,
  Heart
} from 'lucide-react';
import { SafeImage } from './SafeImage';

interface TripPlannerFormProps {
  onPlanTrip: (input: TripPlannerInput) => Promise<void>;
  isLoading: boolean;
  initialValues?: Partial<TripPlannerInput>;
}

export const TripPlannerForm: React.FC<TripPlannerFormProps> = ({
  onPlanTrip,
  isLoading,
  initialValues,
}) => {
  // Form State
  const [origin, setOrigin] = useState<string>(initialValues?.origin || 'Bengaluru');
  const [customOrigin, setCustomOrigin] = useState<string>('');
  const [isCustomOrigin, setIsCustomOrigin] = useState<boolean>(false);
  
  const [destinationPreference, setDestinationPreference] = useState<string>(
    initialValues?.destinationPreference || 'All Karnataka Highlights'
  );
  const [startDate, setStartDate] = useState<string>(
    initialValues?.startDate || new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
  );
  const [durationDays, setDurationDays] = useState<number>(initialValues?.durationDays || 3);
  const [travellersCount, setTravellersCount] = useState<number>(initialValues?.travellersCount || 2);
  const [totalBudgetINR, setTotalBudgetINR] = useState<number>(initialValues?.totalBudgetINR || 35000);
  const [budgetStyle, setBudgetStyle] = useState<BudgetStyle>(initialValues?.budgetStyle || 'comfortable');
  
  const [interests, setInterests] = useState<string[]>(
    (initialValues?.interests as string[]) || ['Heritage', 'Nature', 'Food']
  );
  const [travelPace, setTravelPace] = useState<TravelPace>(initialValues?.travelPace || 'balanced');
  const [travelMode, setTravelMode] = useState<TravelMode>(initialValues?.travelMode || 'private-cab');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingStep, setLoadingStep] = useState<number>(0);

  // Sync when initialValues changes
  useEffect(() => {
    if (initialValues) {
      if (initialValues.startingLocation) {
        const startName = initialValues.startingLocation.displayName || initialValues.startingLocation.name;
        if (SUPPORTED_ORIGINS.includes(startName as any)) {
          setOrigin(startName);
          setIsCustomOrigin(false);
        } else {
          setCustomOrigin(startName);
          setIsCustomOrigin(true);
        }
      } else if (initialValues.origin) {
        if (SUPPORTED_ORIGINS.includes(initialValues.origin as any)) {
          setOrigin(initialValues.origin);
          setIsCustomOrigin(false);
        } else {
          setCustomOrigin(initialValues.origin);
          setIsCustomOrigin(true);
        }
      }
      if (initialValues.durationDays) setDurationDays(initialValues.durationDays);
      if (initialValues.travellersCount) setTravellersCount(initialValues.travellersCount);
      if (initialValues.totalBudgetINR) setTotalBudgetINR(initialValues.totalBudgetINR);
      if (initialValues.interests) setInterests(initialValues.interests as string[]);
      if (initialValues.destinationPreference) setDestinationPreference(initialValues.destinationPreference);
      if (initialValues.budgetStyle) setBudgetStyle(initialValues.budgetStyle);
    }
  }, [initialValues]);

  // Loading steps animation
  useEffect(() => {
    let timer: any;
    if (isLoading) {
      setLoadingStep(0);
      timer = setInterval(() => {
        setLoadingStep((prev) => (prev < 3 ? prev + 1 : prev));
      }, 1200);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(timer);
  }, [isLoading]);

  const toggleInterest = (category: string) => {
    if (interests.includes(category)) {
      if (interests.length > 1) {
        setInterests(interests.filter(c => c !== category));
      }
    } else {
      setInterests([...interests, category]);
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    const finalOrigin = isCustomOrigin ? customOrigin.trim() : origin;

    if (!finalOrigin) {
      errs.origin = 'Please enter a valid starting city or town.';
    }
    if (durationDays < 1 || durationDays > 10) {
      errs.durationDays = 'Duration must be between 1 and 10 days.';
    }
    if (travellersCount < 1 || travellersCount > 15) {
      errs.travellersCount = 'Travellers must be between 1 and 15.';
    }
    if (totalBudgetINR < 3000) {
      errs.totalBudgetINR = 'Please provide a realistic travel budget (min ₹3,000).';
    }
    if (interests.length === 0) {
      errs.interests = 'Select at least one travel interest.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const finalOrigin = isCustomOrigin ? customOrigin.trim() : origin;

    // Map common string chips to typed categories
    const mappedInterests = interests.map(i => {
      if (i === 'Food') return 'Food & Culture';
      if (i === 'Family') return 'Food & Culture';
      return i;
    }) as Destination['categories'][number][];

    const inputData: TripPlannerInput = {
      origin: finalOrigin,
      destinationPreference,
      durationDays,
      startDate,
      travellersCount,
      totalBudgetINR,
      budgetStyle,
      interests: mappedInterests,
      travelPace,
      travelMode,
      dietaryPreferences: initialValues?.dietaryPreferences || 'No restrictions',
      selectedPlaces: initialValues?.selectedPlaces,
      startingLocation: initialValues?.startingLocation
    };

    await onPlanTrip(inputData);
  };

  const availableInterests = [
    'Heritage',
    'Nature',
    'Beaches',
    'Adventure',
    'Food',
    'Spiritual',
    'Family'
  ];

  const loadingMessages = [
    'Consulting 32 certified Karnataka destination records...',
    'Synthesizing geographic clusters and road transits...',
    'Balancing visit schedules with sunrise/sunset timing...',
    'Finalizing deterministic lodging and fare math...'
  ];

  return (
    <div id="planner-form" className="bg-[#FFFEFA] rounded-2xl border border-[#D5CEBF] p-6 sm:p-8 md:p-10 shadow-lg relative overflow-hidden">
      
      {/* Top Banner Row matching Reference Image */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center mb-8 border-b border-[#E5DFD3] pb-8">
        {/* Left Editorial Header */}
        <div className="lg:col-span-7 space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-widest text-[#B9684B]">
            INTELLIGENT TRIP SYNTHESIZER
          </div>
          <h3 className="font-editorial text-3xl sm:text-4xl text-[#102D23] font-bold tracking-tight">
            Plan Your Karnataka Journey
          </h3>
          <p className="text-sm text-[#555850] max-w-xl font-normal leading-relaxed">
            Tell us your preferences and let AI create a personalized itinerary.
          </p>
        </div>

        {/* Right Atmospheric Coastal Graphic matching Reference */}
        <div className="lg:col-span-5 relative rounded-2xl overflow-hidden aspect-[16/7] border border-[#D5CEBF] bg-[#EDE8DE] shadow-xs">
          <img
            src="/images/gokarna.jpg"
            alt="Karnataka Coastline"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-black/60 via-black/20 to-transparent" />
          
          <div className="absolute top-3 right-4 text-right pointer-events-none select-none">
            <span className="font-editorial italic text-base sm:text-lg font-bold text-[#FFFEFA] drop-shadow-sm block leading-tight">
              From misty hills
            </span>
            <span className="font-editorial italic text-base sm:text-lg font-bold text-[#D8A735] drop-shadow-sm block leading-tight">
              to golden shores
            </span>
          </div>

          <div className="absolute bottom-3 right-4 bg-[#FFFEFA]/95 backdrop-blur-md px-3 py-1 rounded-full border border-white/40 text-[10px] font-semibold text-[#102D23] flex items-center gap-1.5 shadow-sm">
            <MapPin className="w-3 h-3 text-[#B9684B]" />
            <span>Your Journey Awaits</span>
          </div>
        </div>
      </div>

      {/* Selected Places from Exploration Banner */}
      {initialValues?.selectedPlaces && initialValues.selectedPlaces.length > 0 && (
        <div className="mb-6 p-4 rounded-2xl bg-[#173D2E]/8 border border-[#173D2E]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D8A735]" />
              <span className="font-bold text-xs text-[#102D23]">
                Prioritizing {initialValues.selectedPlaces.length} Custom Selected Destinations
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#173D2E] text-[#D8A735] font-bold">
                Live Exploration
              </span>
            </div>
            <p className="text-[11px] text-[#555850]">
              Starting from <strong>{initialValues.startingLocation?.displayName || initialValues.origin}</strong>. These places will be scheduled first in order of geographical proximity.
            </p>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            {initialValues.selectedPlaces.slice(0, 4).map((p, idx) => (
              <span key={p.id} className="px-2 py-1 rounded-lg bg-[#FFFEFA] border border-[#D5CEBF] text-[10px] font-semibold text-[#102D23] whitespace-nowrap shadow-2xs">
                {idx + 1}. {p.name}
              </span>
            ))}
            {initialValues.selectedPlaces.length > 4 && (
              <span className="text-[10px] font-bold text-[#77786F]">
                +{initialValues.selectedPlaces.length - 4} more
              </span>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-7">
        
        {/* ============================================================ */}
        {/* ROW 1: Starting Location, Trip Duration, Start Date, Travellers */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Starting Location */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#292D29] block">
              Starting Location
            </label>
            <div className="relative">
              <select
                value={isCustomOrigin ? 'custom' : origin}
                onChange={(e) => {
                  if (e.target.value === 'custom') {
                    setIsCustomOrigin(true);
                  } else {
                    setIsCustomOrigin(false);
                    setOrigin(e.target.value);
                  }
                }}
                className="w-full appearance-none px-3.5 py-2.5 bg-[#F7F4EC] border border-[#D5CEBF] rounded-lg text-xs font-medium text-[#102D23] focus:outline-none focus:ring-1 focus:ring-[#173D2E] focus:bg-[#FFFEFA] transition-all cursor-pointer pr-8"
              >
                <option value="Bengaluru">Bengaluru (Hub)</option>
                <option value="Mysuru">Mysuru</option>
                <option value="Hubballi-Dharwad">Hubballi-Dharwad</option>
                <option value="Mangaluru">Mangaluru</option>
                <option value="Belagavi">Belagavi</option>
                <option value="Shivamogga">Shivamogga</option>
                <option value="Udupi">Udupi</option>
                <option value="Goa (Border)">Goa (Border)</option>
                <option value="Hyderabad (Border)">Hyderabad (Border)</option>
                <option value="custom">+ Specify Other Location</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#77786F] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            {isCustomOrigin && (
              <input
                type="text"
                placeholder="Enter city or town..."
                value={customOrigin}
                onChange={(e) => setCustomOrigin(e.target.value)}
                className="w-full mt-1.5 px-3 py-1.5 bg-[#FFFEFA] border border-[#B9684B] rounded-lg text-xs text-[#102D23] focus:outline-none focus:ring-1 focus:ring-[#173D2E]"
              />
            )}
            {errors.origin && <p className="text-[11px] text-[#B9684B] flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" />{errors.origin}</p>}
          </div>

          {/* Trip Duration */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#292D29] block">
              Trip Duration
            </label>
            <div className="relative">
              <select
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                className="w-full appearance-none px-3.5 py-2.5 bg-[#F7F4EC] border border-[#D5CEBF] rounded-lg text-xs font-medium text-[#102D23] focus:outline-none focus:ring-1 focus:ring-[#173D2E] focus:bg-[#FFFEFA] transition-all cursor-pointer pr-8 font-mono-numbers"
              >
                <option value={1}>1 Day (Express)</option>
                <option value={2}>2 Days (Weekend)</option>
                <option value={3}>3 Days (Recommended)</option>
                <option value={4}>4 Days</option>
                <option value={5}>5 Days</option>
                <option value={6}>6 Days</option>
                <option value={7}>7 Days (Deep Circuit)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#77786F] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Start Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#292D29] block">
              Start Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F7F4EC] border border-[#D5CEBF] rounded-lg text-xs font-medium text-[#102D23] focus:outline-none focus:ring-1 focus:ring-[#173D2E] focus:bg-[#FFFEFA] transition-all font-mono-numbers cursor-pointer"
              />
            </div>
          </div>

          {/* Travellers Stepper matching Reference */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#292D29] block">
              Travellers
            </label>
            <div className="flex items-center bg-[#F7F4EC] border border-[#D5CEBF] rounded-lg h-10 px-2 justify-between">
              <button
                type="button"
                onClick={() => setTravellersCount(Math.max(1, travellersCount - 1))}
                className="w-7 h-7 rounded bg-white hover:bg-[#EDE8DE] text-[#292D29] border border-[#D5CEBF] flex items-center justify-center font-bold text-sm cursor-pointer transition-colors"
              >
                -
              </button>
              <span className="font-mono-numbers font-bold text-sm text-[#102D23]">
                {travellersCount}
              </span>
              <button
                type="button"
                onClick={() => setTravellersCount(Math.min(15, travellersCount + 1))}
                className="w-7 h-7 rounded bg-white hover:bg-[#EDE8DE] text-[#292D29] border border-[#D5CEBF] flex items-center justify-center font-bold text-sm cursor-pointer transition-colors"
              >
                +
              </button>
            </div>
          </div>

        </div>

        {/* ============================================================ */}
        {/* ROW 2: Total Budget, Budget Style, Interests, Travel Pace    */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-5 border-t border-[#E5DFD3]">
          
          {/* Total Budget (INR) with ticks slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#292D29]">
                Total Budget (INR)
              </label>
            </div>
            <div className="px-3 py-1.5 bg-[#F7F4EC] border border-[#D5CEBF] rounded-lg text-xs font-bold font-mono-numbers text-[#102D23]">
              {formatINR(totalBudgetINR)}
            </div>
            <input
              type="range"
              min={10000}
              max={200000}
              step={5000}
              value={totalBudgetINR}
              onChange={(e) => setTotalBudgetINR(Number(e.target.value))}
              className="w-full accent-[#173D2E] cursor-pointer mt-1"
            />
            {/* Ticks matching Reference Image */}
            <div className="flex justify-between text-[10px] text-[#77786F] font-mono-numbers pt-0.5">
              <span>₹10K</span>
              <span>₹50K</span>
              <span>₹1L</span>
              <span>₹2L+</span>
            </div>
          </div>

          {/* Budget Style Segmented Buttons */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#292D29] block">
              Budget Style
            </label>
            <div className="flex items-center p-1 bg-[#F7F4EC] border border-[#D5CEBF] rounded-lg gap-1">
              {[
                { id: 'economical' as BudgetStyle, label: 'Economy' },
                { id: 'comfortable' as BudgetStyle, label: 'Comfort' },
                { id: 'premium' as BudgetStyle, label: 'Luxury' }
              ].map((style) => {
                const isActive = budgetStyle === style.id;
                return (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setBudgetStyle(style.id)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#173D2E] text-white shadow-xs'
                        : 'text-[#555850] hover:text-[#102D23]'
                    }`}
                  >
                    {style.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interests Pill Chips matching Reference */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#292D29] block">
              Interests
            </label>
            <div className="flex flex-wrap gap-1.5">
              {availableInterests.map((interest) => {
                const isSelected = interests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#173D2E] text-white shadow-xs'
                        : 'bg-[#F7F4EC] text-[#555850] border border-[#D5CEBF] hover:bg-[#EDE8DE]'
                    }`}
                  >
                    {interest}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Travel Pace Segmented Buttons */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#292D29] block">
              Travel Pace
            </label>
            <div className="flex items-center p-1 bg-[#F7F4EC] border border-[#D5CEBF] rounded-lg gap-1">
              {[
                { id: 'relaxed' as TravelPace, label: 'Relaxed' },
                { id: 'balanced' as TravelPace, label: 'Balanced' },
                { id: 'packed' as TravelPace, label: 'Packed' }
              ].map((pace) => {
                const isActive = travelPace === pace.id;
                return (
                  <button
                    key={pace.id}
                    type="button"
                    onClick={() => setTravelPace(pace.id)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#173D2E] text-white shadow-xs'
                        : 'text-[#555850] hover:text-[#102D23]'
                    }`}
                  >
                    {pace.label}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* ============================================================ */}
        {/* SUBMIT BUTTON ROW                                            */}
        {/* ============================================================ */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#E5DFD3]">
          <div className="text-xs text-[#77786F]">
            Powered by Gemini 3.8 and verified Karnataka Tourism coordinates.
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto px-8 py-3.5 bg-[#173D2E] hover:bg-[#102D23] disabled:opacity-50 text-[#FFFEFA] font-semibold text-xs sm:text-sm rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer active:scale-98"
          >
            <Sparkles className="w-4 h-4 text-[#D8A735]" />
            <span>{isLoading ? 'Synthesizing Itinerary with Gemini...' : 'Plan My Journey'}</span>
            <ArrowRight className="w-4 h-4 text-[#D8A735]" />
          </button>
        </div>

        {/* Loading Progress State */}
        {isLoading && (
          <div className="p-4 bg-[#F7F4EC] rounded-xl border border-[#D5CEBF] text-xs text-[#173D2E] flex items-center gap-3 animate-pulse">
            <Sparkles className="w-4 h-4 text-[#D8A735] shrink-0 animate-spin" />
            <span className="font-medium">{loadingMessages[loadingStep]}</span>
          </div>
        )}

      </form>
    </div>
  );
};
