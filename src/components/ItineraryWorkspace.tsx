import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  TripItinerary,
  ItineraryDay,
  ItineraryStop,
  formatINR
} from '../types/itinerary';
import {
  Clock,
  MapPin,
  Trash2,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Info,
  Calendar,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Utensils,
  Eye,
  CheckCircle2,
  Sun
} from 'lucide-react';
import { DestinationWeatherCard } from './DestinationWeatherCard';
import { SafeImage } from './SafeImage';

interface ItineraryWorkspaceProps {
  itinerary: TripItinerary;
  activeDayIndex: number;
  onSelectDay: (index: number) => void;
  selectedStopId: string | null;
  onSelectStop: (stopId: string) => void;
  onRemoveStop: (dayIndex: number, stopIndex: number) => void;
  onMoveStop: (dayIndex: number, stopIndex: number, direction: 'up' | 'down') => void;
  onRegenerateDay: (dayNumber: number, customPrompt?: string) => Promise<void>;
  isRegenerating: boolean;
}

export const ItineraryWorkspace: React.FC<ItineraryWorkspaceProps> = ({
  itinerary,
  activeDayIndex,
  onSelectDay,
  selectedStopId,
  onSelectStop,
  onRemoveStop,
  onMoveStop,
  onRegenerateDay,
  isRegenerating,
}) => {
  const [showRegenModal, setShowRegenModal] = useState(false);
  const [regenPrompt, setRegenPrompt] = useState('');
  const [expandedStopId, setExpandedStopId] = useState<string | null>(null);

  const currentDay: ItineraryDay | undefined = itinerary.days[activeDayIndex];

  const handleTriggerRegen = async () => {
    if (!currentDay) return;
    await onRegenerateDay(currentDay.dayNumber, regenPrompt);
    setShowRegenModal(false);
    setRegenPrompt('');
  };

  return (
    <div className="space-y-6">
      {/* Unscheduled Selected Destinations Notice */}
      {itinerary.unscheduledDestinations && itinerary.unscheduledDestinations.length > 0 && (
        <div className="p-4 bg-[#B9684B]/10 border border-[#B9684B]/30 rounded-2xl text-xs space-y-2 text-[#8C3B1F]">
          <div className="flex items-center gap-2 font-bold text-sm text-[#8C3B1F]">
            <AlertCircle className="w-4 h-4 text-[#B9684B] shrink-0" />
            <span>Notice Regarding Selected Places</span>
          </div>
          <p className="text-[#555850] leading-relaxed">
            The itinerary prioritized your selections, but <strong>{itinerary.unscheduledDestinations.length}</strong> destination(s) could not be scheduled within the {itinerary.durationDays}-day timeframe to avoid excessive driving times or late hours:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-1 text-[#292D29]">
            {itinerary.unscheduledDestinations.map((u) => (
              <li key={u.id}>
                <strong>{u.name}</strong>: <span className="text-[#555850]">{u.reason}</span>
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-[#77786F]">
            Tip: You can increase your trip duration in the planner or modify your travel pace to fit all destinations.
          </p>
        </div>
      )}

      {/* Day Navigation Segmented Tabs (Horizontal Scrollable on Mobile) */}
      <div className="flex items-center gap-1.5 p-1.5 bg-[#FFFEFA] rounded-xl border border-[#D5CEBF] shadow-xs overflow-x-auto scrollbar-none">
        {itinerary.days.map((day, idx) => {
          const isActive = idx === activeDayIndex;
          return (
            <button
              key={day.dayNumber}
              onClick={() => onSelectDay(idx)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-2 ${
                isActive
                  ? 'bg-[#173D2E] text-[#FFFEFA] shadow-xs'
                  : 'text-[#555850] hover:text-[#292D29] hover:bg-[#F7F4EC]'
              }`}
            >
              <span>Day {day.dayNumber}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono-numbers ${isActive ? 'bg-[#102D23] text-[#D8A735]' : 'bg-[#F7F4EC] text-[#77786F]'}`}>
                {day.stops.length} stops
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Day Card */}
      {currentDay && (
        <motion.div
          key={currentDay.dayNumber}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-[#FFFEFA] rounded-2xl border border-[#D5CEBF] p-6 sm:p-8 shadow-sm space-y-6"
        >
          {/* Day Title & Header Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E5DFD3]">
            <div>
              <div className="flex items-center gap-2 text-xs text-[#77786F] mb-1">
                <span className="font-semibold text-[#173D2E]">Day {currentDay.dayNumber} of {itinerary.durationDays}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-numbers">{currentDay.stops.length} Waypoints</span>
              </div>
              <h3 className="font-editorial text-2xl sm:text-3xl text-[#102D23] font-bold">
                {currentDay.title}
              </h3>
            </div>

            {/* Day Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowRegenModal(true)}
                disabled={isRegenerating}
                className="px-4 py-2 text-xs font-semibold text-[#173D2E] bg-[#173D2E]/8 hover:bg-[#173D2E]/15 rounded-lg border border-[#173D2E]/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 whitespace-nowrap"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#B9684B] ${isRegenerating ? 'animate-spin' : ''}`} />
                <span>{isRegenerating ? 'Refreshing Day...' : 'Regenerate Day'}</span>
              </button>
            </div>
          </div>

          {/* Travel & Transit Notes for the Day */}
          {currentDay.travelNotes && currentDay.travelNotes.length > 0 && (
            <div className="p-3.5 bg-[#F7F4EC] rounded-xl border border-[#D5CEBF] text-xs text-[#555850] flex items-start gap-3">
              <Info className="w-4 h-4 text-[#173D2E] shrink-0 mt-0.5" />
              <div className="space-y-1">
                {currentDay.travelNotes.map((note, nIdx) => (
                  <p key={nIdx} className="leading-relaxed">{note}</p>
                ))}
              </div>
            </div>
          )}

          {/* Day Regional Climate Overview Banner */}
          {currentDay.stops.length > 0 && (currentDay.stops[0]?.destination || currentDay.stops[0]?.customAttraction) && (
            <div className="px-3.5 py-2.5 bg-[#F7F4EC] rounded-xl border border-[#D5CEBF] text-xs text-[#555850] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-[#D8A735]" />
                <span className="font-semibold text-[#102D23]">Day {currentDay.dayNumber} Climate Profile:</span>
                <span className="text-[#292D29]">
                  {(currentDay.stops[0].destination as any)?.region || currentDay.stops[0].customAttraction?.district || 'Karnataka'}
                </span>
              </div>
              <span className="text-[11px] text-[#77786F]">
                Forecasts & seasonal packing tips enabled per stop below
              </span>
            </div>
          )}

          {/* Stops List with Rich Photography & Interactions */}
          <div className="space-y-4">
            {currentDay.stops.length === 0 ? (
              <div className="text-center py-12 text-[#77786F] text-sm">
                No scheduled stops in Day {currentDay.dayNumber}. Click Regenerate Day to populate verified destinations.
              </div>
            ) : (
              currentDay.stops.map((stop: ItineraryStop, sIdx: number) => {
                const dest: any = stop.destination || stop.customAttraction;
                const isSelected = selectedStopId === stop.id;
                const isExpanded = expandedStopId === stop.id;

                return (
                  <motion.div
                    key={stop.id}
                    layout
                    onClick={() => onSelectStop(stop.id)}
                    className={`relative rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden ${
                      isSelected
                        ? 'border-[#173D2E] bg-[#173D2E]/5 shadow-sm ring-1 ring-[#173D2E]/30'
                        : 'border-[#E5DFD3] bg-[#FFFEFA] hover:border-[#D5CEBF]'
                    }`}
                  >
                    <div className="p-5 flex flex-col sm:flex-row gap-4 items-start">
                      {/* Destination Thumbnail */}
                      {dest?.imageUrl && (
                        <div className="w-full sm:w-28 sm:h-24 h-40 rounded-lg overflow-hidden shrink-0 bg-[#EDE8DE] relative">
                          <SafeImage
                            src={dest.imageUrl}
                            alt={dest.name}
                            objectPosition={dest.objectPosition}
                          />
                          <div className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-[#173D2E] text-[#FFFEFA] flex items-center justify-center font-bold font-mono-numbers text-xs shadow z-10">
                            {sIdx + 1}
                          </div>
                        </div>
                      )}

                      {/* Content Info */}
                      <div className="flex-1 min-w-0 space-y-2">
                        {/* Time & Timing Row */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-bold text-[#102D23] font-mono-numbers text-sm">
                              {stop.arrivalTime}
                            </span>
                            <span className="text-[#D5CEBF]">·</span>
                            <span className="text-[#555850] flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-[#B9684B]" />
                              {stop.durationMinutes} mins
                            </span>
                            {dest?.district && (
                              <>
                                <span className="text-[#D5CEBF]">·</span>
                                <span className="text-[#77786F]">{dest.district}</span>
                              </>
                            )}
                          </div>

                          {/* Reorder and Delete Controls */}
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => onMoveStop(activeDayIndex, sIdx, 'up')}
                              disabled={sIdx === 0}
                              title="Move stop earlier"
                              className="p-1.5 text-[#77786F] hover:text-[#292D29] disabled:opacity-20 cursor-pointer rounded hover:bg-[#F7F4EC]"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onMoveStop(activeDayIndex, sIdx, 'down')}
                              disabled={sIdx === currentDay.stops.length - 1}
                              title="Move stop later"
                              className="p-1.5 text-[#77786F] hover:text-[#292D29] disabled:opacity-20 cursor-pointer rounded hover:bg-[#F7F4EC]"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onRemoveStop(activeDayIndex, sIdx)}
                              title="Remove stop"
                              className="p-1.5 text-[#77786F] hover:text-[#B9684B] cursor-pointer rounded hover:bg-[#B9684B]/10 ml-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Title & Kannada subtitle */}
                        <div>
                          <h4 className="text-lg font-bold text-[#102D23] leading-snug">
                            {dest?.name || stop.destinationId}
                          </h4>
                          {dest?.kannadaName && (
                            <div className="font-kannada text-xs text-[#B9684B] mt-0.5">
                              {dest.kannadaName}
                            </div>
                          )}
                        </div>

                        {/* Rationale / Experience */}
                        <p className="text-xs text-[#555850] leading-relaxed">
                          {stop.reason || dest?.shortDescription}
                        </p>

                        {/* Weather Forecast & Seasonal Advisory Component */}
                        {dest && (
                          <div className="pt-1">
                            <DestinationWeatherCard
                              lat={dest.lat}
                              lng={dest.lng}
                              region={dest.region}
                              district={dest.district}
                              destinationName={dest.name}
                            />
                          </div>
                        )}

                        {/* Footer Strip: Entry Fee & Local Food */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#E5DFD3] text-xs">
                          <div className="flex items-center gap-2 font-medium">
                            <span className="text-[#77786F]">Entry Fee:</span>
                            <span className="font-mono-numbers text-[#102D23] font-bold">
                              {stop.estimatedCostINR > 0 ? formatINR(stop.estimatedCostINR) : 'Free Admission'}
                            </span>
                          </div>

                          {dest?.localSpecialties && dest.localSpecialties.length > 0 && (
                            <div className="flex items-center gap-1.5 text-[#77786F] text-[11px]">
                              <Utensils className="w-3 h-3 text-[#B9684B]" />
                              <span>Taste: <strong className="text-[#292D29]">{dest.localSpecialties[0]}</strong></span>
                            </div>
                          )}
                        </div>

                        {/* Constraint Notice if any */}
                        {dest?.knownConstraints && dest.knownConstraints.length > 0 && (
                          <div className="pt-1 text-[11px] text-[#77786F] flex items-start gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-[#D8A735] shrink-0 mt-0.5" />
                            <span>{dest.knownConstraints[0]}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>
      )}

      {/* Regenerate Modal */}
      {showRegenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#FFFEFA] rounded-2xl border border-[#D5CEBF] max-w-md w-full p-6 sm:p-7 shadow-2xl"
          >
            <div className="text-xs font-semibold uppercase tracking-wider text-[#B9684B] mb-1">
              Targeted AI Synthesis
            </div>
            <h4 className="font-editorial text-2xl font-bold text-[#102D23] mb-2">
              Regenerate Day {currentDay?.dayNumber}
            </h4>
            <p className="text-xs text-[#555850] mb-4 leading-relaxed">
              Refresh only this specific day with alternative verified Karnataka attractions. All other days and your overarching budget will adjust automatically.
            </p>

            <div className="space-y-2 mb-5">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#292D29]">
                Custom Guidance (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Focus on ancient Hoysala temples, or outdoor waterfalls..."
                value={regenPrompt}
                onChange={(e) => setRegenPrompt(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F7F4EC] border border-[#D5CEBF] rounded-lg text-xs text-[#102D23] focus:outline-none focus:ring-2 focus:ring-[#173D2E] focus:bg-[#FFFEFA]"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowRegenModal(false)}
                className="px-4 py-2 text-xs font-medium text-[#555850] hover:text-[#292D29] rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTriggerRegen}
                disabled={isRegenerating}
                className="px-4 py-2 text-xs font-semibold text-[#FFFEFA] bg-[#173D2E] hover:bg-[#102D23] rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#D8A735]" />
                <span>{isRegenerating ? 'Refreshing Day...' : 'Refresh Day'}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
