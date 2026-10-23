import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getDestinationWeather, WeatherData } from '../services/weatherService';
import {
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  CloudFog,
  CloudLightning,
  Droplets,
  Wind,
  Shirt,
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';

interface DestinationWeatherCardProps {
  lat: number;
  lng: number;
  region?: string;
  district?: string;
  destinationName?: string;
  compact?: boolean;
}

export const DestinationWeatherCard: React.FC<DestinationWeatherCardProps> = ({
  lat,
  lng,
  region = '',
  district = '',
  destinationName = '',
  compact = true,
}) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchWeather() {
      setLoading(true);
      try {
        const data = await getDestinationWeather(lat, lng, region, district);
        if (isMounted) {
          setWeather(data);
        }
      } catch (err) {
        console.error('Weather load error:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchWeather();
    return () => {
      isMounted = false;
    };
  }, [lat, lng, region, district]);

  const getWeatherIcon = (condition: string, code: number) => {
    if (code === 0) return <Sun className="w-4 h-4 text-amber-500" />;
    if (code === 1 || code === 2) return <CloudSun className="w-4 h-4 text-amber-500" />;
    if (code === 3) return <Cloud className="w-4 h-4 text-stone-500" />;
    if (code === 45 || code === 48) return <CloudFog className="w-4 h-4 text-teal-600" />;
    if (code >= 51 && code <= 82) return <CloudRain className="w-4 h-4 text-blue-500" />;
    if (code >= 95) return <CloudLightning className="w-4 h-4 text-amber-600" />;
    return <CloudSun className="w-4 h-4 text-amber-500" />;
  };

  if (loading) {
    return (
      <div className="inline-flex items-center gap-2 py-1 px-2.5 bg-[#F7F4EC] rounded-lg border border-[#E5DFD3] text-[11px] text-[#77786F] animate-pulse">
        <Sun className="w-3.5 h-3.5 text-amber-400 animate-spin" />
        <span>Loading forecast...</span>
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div className="w-full">
      {/* Compact Interactive Weather Strip */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded(!isExpanded);
        }}
        className="group inline-flex items-center justify-between gap-3 py-1.5 px-3 bg-[#F7F4EC] hover:bg-[#EDE8DE] border border-[#D5CEBF] rounded-lg text-xs transition-colors cursor-pointer w-full"
      >
        <div className="flex items-center gap-2">
          {getWeatherIcon(weather.condition, weather.conditionCode)}
          <span className="font-bold text-[#102D23] font-mono-numbers text-xs">
            {weather.temperature}°C
          </span>
          <span className="text-[#D5CEBF]">·</span>
          <span className="text-[#555850] font-medium truncate max-w-[140px] sm:max-w-none">
            {weather.condition}
          </span>
          <span className="text-[#77786F] font-mono-numbers text-[11px] hidden sm:inline">
            (H: {weather.tempMax}° / L: {weather.tempMin}°)
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-[#77786F] shrink-0">
          <span className="group-hover:text-[#173D2E] transition-colors">
            {isExpanded ? 'Hide Advisory' : 'Climate & Packing'}
          </span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </div>

      {/* Expandable Regional Climate Advisory & Packing Tips */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mt-2 p-3.5 bg-[#FFFEFA] rounded-xl border border-[#D5CEBF] shadow-xs space-y-2.5 text-xs text-[#555850]">
              {/* Climate Metrics */}
              <div className="grid grid-cols-3 gap-2 pb-2.5 border-b border-[#E5DFD3] text-[11px]">
                <div className="flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-blue-500" />
                  <span>Humidity: <strong className="text-[#292D29] font-mono-numbers">{weather.humidity}%</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-teal-600" />
                  <span>Breeze: <strong className="text-[#292D29] font-mono-numbers">{weather.windSpeed} km/h</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CloudRain className="w-3.5 h-3.5 text-blue-600" />
                  <span>Rain chance: <strong className="text-[#292D29] font-mono-numbers">{weather.precipitationProbability}%</strong></span>
                </div>
              </div>

              {/* Regional Climate Advisory */}
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-[#173D2E] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#102D23] block text-[11px] uppercase tracking-wide">
                    Seasonal Climate Advisory ({district || region})
                  </span>
                  <p className="text-xs leading-relaxed text-[#555850]">
                    {weather.advisoryTip}
                  </p>
                </div>
              </div>

              {/* Packing Advice */}
              <div className="flex items-start gap-2 p-2.5 bg-[#F7F4EC] rounded-lg border border-[#E5DFD3]">
                <Shirt className="w-4 h-4 text-[#B9684B] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#102D23] block text-[11px] uppercase tracking-wide">
                    Recommended Packing for this Stop
                  </span>
                  <p className="text-xs leading-relaxed text-[#555850]">
                    {weather.packingRecommendation}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
