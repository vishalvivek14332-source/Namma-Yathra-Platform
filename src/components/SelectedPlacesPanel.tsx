import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SelectedPlace, StartingLocation } from '../types/itinerary';
import {
  Sparkles,
  ArrowRight,
  ChevronUp,
  ChevronDown,
  Trash2,
  MapPin,
  Compass,
  ArrowUp,
  ArrowDown,
  Check,
  ShieldCheck,
  X,
  Navigation
} from 'lucide-react';
import { SafeImage } from './SafeImage';

interface SelectedPlacesPanelProps {
  startingLocation: StartingLocation | null;
  selectedPlaces: SelectedPlace[];
  onRemovePlace: (id: string) => void;
  onMovePlace: (id: string, direction: 'up' | 'down') => void;
  onClearAll: () => void;
  onPlanJourney: () => void;
  onClose?: () => void;
}

export const SelectedPlacesPanel: React.FC<SelectedPlacesPanelProps> = ({
  startingLocation,
  selectedPlaces,
  onRemovePlace,
  onMovePlace,
  onClearAll,
  onPlanJourney,
  onClose
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  if (selectedPlaces.length === 0) return null;

  // Calculate cumulative straight-line distance from starting point through all destinations
  let cumulativeDistanceKm = 0;
  if (selectedPlaces.length > 0) {
    // Distance from origin to first destination
    cumulativeDistanceKm += selectedPlaces[0].distanceKm || 0;
    // Sequential distances between consecutive destinations
    for (let i = 0; i < selectedPlaces.length - 1; i++) {
      const p1 = selectedPlaces[i];
      const p2 = selectedPlaces[i + 1];
      const dLat = (p2.lat - p1.lat) * (Math.PI / 180);
      const dLon = (p2.lng - p1.lng) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(p1.lat * (Math.PI / 180)) *
          Math.cos(p2.lat * (Math.PI / 180)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      cumulativeDistanceKm += Math.round(6371 * c * 10) / 10;
    }
  }

  const startDisplayName = startingLocation?.displayName || startingLocation?.name || 'Karnataka';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-45 pointer-events-none p-3 sm:p-5 flex justify-center">
      <div className="w-full max-w-4xl pointer-events-auto bg-[#FFFEFA] border-2 border-[#173D2E]/20 shadow-2xl rounded-2xl overflow-hidden backdrop-blur-md">
        
        {/* COLLAPSED BAR / EXPANDABLE HEADER */}
        <div className="px-4 py-3 sm:px-6 sm:py-3.5 bg-[#173D2E] text-[#FFFEFA] flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-7 h-7 rounded-full bg-[#D8A735] text-[#102D23] font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
              {selectedPlaces.length}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-editorial text-base sm:text-lg font-bold tracking-tight text-[#FFFEFA] truncate">
                  My Journey List
                </h4>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#FFFEFA]/15 text-[#D8A735] hidden sm:inline">
                  Prioritized for AI
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#E5DFD3]/90 truncate">
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3 text-[#D8A735] shrink-0" />
                  <span className="truncate">From {startDisplayName}</span>
                </span>
                <span>•</span>
                <span className="shrink-0 text-[11px] text-[#D8A735]">
                  ~{Math.round(cumulativeDistanceKm)} km straight-line
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto shrink-0">
            {/* Expand / Collapse Button */}
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              aria-expanded={isExpanded}
              aria-label={isExpanded ? 'Collapse selected destinations list' : 'Expand selected destinations list'}
              className="px-3 py-1.5 rounded-lg bg-[#FFFEFA]/10 hover:bg-[#FFFEFA]/20 text-[#FFFEFA] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>{isExpanded ? 'Collapse' : 'Review List'}</span>
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-[#D8A735]" />
              ) : (
                <ChevronUp className="w-4 h-4 text-[#D8A735]" />
              )}
            </button>

            {/* Primary Action Button: "Plan My Journey" */}
            <button
              type="button"
              onClick={onPlanJourney}
              className="px-4 py-2 bg-[#D8A735] hover:bg-[#C99827] text-[#102D23] font-bold text-xs sm:text-sm rounded-xl shadow-md flex items-center gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#102D23]" />
              <span>Plan My Journey</span>
              <ArrowRight className="w-4 h-4 text-[#102D23]" />
            </button>

            {/* Dismiss / Close Button */}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Dismiss journey list"
                title="Dismiss list"
                className="p-2 rounded-xl bg-[#FFFEFA]/10 hover:bg-[#8C3B1F]/80 text-[#FFFEFA] transition-colors cursor-pointer flex items-center justify-center ml-0.5"
              >
                <X className="w-4 h-4 text-[#E5DFD3]" />
              </button>
            )}
          </div>
        </div>

        {/* EXPANDED DESTINATIONS DRAWER */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="border-t border-[#E5DFD3] bg-[#F7F4EC] p-4 sm:p-5 max-h-[50vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#E5DFD3]">
                <div className="text-xs text-[#555850]">
                  Reorder using arrows. Gemini AI and our itinerary engine will schedule these places first.
                </div>
                <button
                  type="button"
                  onClick={onClearAll}
                  className="text-xs font-semibold text-[#8C3B1F] hover:text-[#5C2310] flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </button>
              </div>

              {/* Destination Items List */}
              <div className="space-y-2">
                {selectedPlaces.map((place, idx) => (
                  <div
                    key={place.id}
                    className="p-2.5 sm:p-3 rounded-xl bg-[#FFFEFA] border border-[#D5CEBF] shadow-xs flex items-center justify-between gap-3 hover:border-[#173D2E]/40 transition-colors"
                  >
                    {/* Position Number */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-[#173D2E] text-[#D8A735] text-xs font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>

                      {/* Image Thumbnail */}
                      {place.imageUrl && (
                        <div className="w-12 h-10 rounded-lg overflow-hidden shrink-0 bg-[#EDE8DE] border border-[#E5DFD3]">
                          <SafeImage
                            src={place.imageUrl}
                            alt={place.name}
                            objectPosition={place.objectPosition}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      {/* Info */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs sm:text-sm text-[#102D23] truncate">
                            {place.name}
                          </span>
                          {place.kannadaName && (
                            <span className="text-[11px] text-[#77786F] font-kannada">
                              {place.kannadaName}
                            </span>
                          )}
                          <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded-full bg-[#173D2E]/10 text-[#173D2E]">
                            {place.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-[#77786F] mt-0.5">
                          {place.district && <span>{place.district}</span>}
                          {place.district && <span>•</span>}
                          <span className="text-[#B9684B] font-semibold">
                            {place.distanceKm} km aerial
                          </span>
                          {place.isVerified && (
                            <>
                              <span>•</span>
                              <span className="inline-flex items-center gap-0.5 text-[#173D2E] font-medium text-[10px]">
                                <ShieldCheck className="w-3 h-3 text-[#173D2E]" /> Verified
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Controls: Up, Down, Remove */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => onMovePlace(place.id, 'up')}
                        disabled={idx === 0}
                        title="Move Up in priority"
                        aria-label={`Move ${place.name} up`}
                        className="w-7 h-7 rounded-lg border border-[#D5CEBF] bg-[#FFFEFA] hover:bg-[#EDE8DE] text-[#555850] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onMovePlace(place.id, 'down')}
                        disabled={idx === selectedPlaces.length - 1}
                        title="Move Down in priority"
                        aria-label={`Move ${place.name} down`}
                        className="w-7 h-7 rounded-lg border border-[#D5CEBF] bg-[#FFFEFA] hover:bg-[#EDE8DE] text-[#555850] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemovePlace(place.id)}
                        title="Remove destination"
                        aria-label={`Remove ${place.name} from journey`}
                        className="w-7 h-7 rounded-lg border border-[#B9684B]/30 bg-[#FFFEFA] hover:bg-[#B9684B]/10 text-[#8C3B1F] flex items-center justify-center transition-colors cursor-pointer ml-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Drawer Bar */}
              <div className="mt-4 pt-3 border-t border-[#E5DFD3] flex items-center justify-between gap-4 flex-wrap">
                <span className="text-xs text-[#77786F]">
                  Total estimated straight-line span: <strong>~{Math.round(cumulativeDistanceKm)} km</strong> (driving distance may vary based on terrain).
                </span>
                <button
                  type="button"
                  onClick={onPlanJourney}
                  className="px-4 py-2 bg-[#173D2E] hover:bg-[#102D23] text-[#FFFEFA] font-bold text-xs sm:text-sm rounded-xl shadow-xs flex items-center gap-2 transition-transform hover:scale-[1.01] cursor-pointer ml-auto"
                >
                  <Sparkles className="w-4 h-4 text-[#D8A735]" />
                  <span>Plan My Journey with these {selectedPlaces.length} places</span>
                  <ArrowRight className="w-4 h-4 text-[#D8A735]" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
