import React, { useState } from 'react';
import { Landmark } from 'lucide-react';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  alt: string;
  containerClassName?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  fallbackSrc,
  alt,
  className = '',
  containerClassName = '',
  ...props
}) => {
  const [loaded, setLoaded] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [usedFallback, setUsedFallback] = useState(false);

  const primarySrc = src?.trim();
  const validFallback = fallbackSrc?.trim();

  // If primary image failed or was empty, try fallback if available
  const activeSrc = !primarySrc 
    ? validFallback 
    : (loadFailed ? (validFallback && !usedFallback ? validFallback : undefined) : primarySrc);

  const handleError = () => {
    if (!loadFailed && validFallback && !usedFallback) {
      setLoadFailed(true);
      setUsedFallback(true);
    } else {
      setLoadFailed(true);
      setLoaded(true);
    }
  };

  // If neither primary nor fallback is available or both failed
  const showPlaceholder = !activeSrc || (loadFailed && usedFallback) || (loadFailed && !validFallback);

  return (
    <div className={`relative w-full h-full overflow-hidden bg-[#EDE8DE] ${containerClassName}`}>
      {/* Shimmer skeleton while loading */}
      {!loaded && !showPlaceholder && (
        <div 
          className="absolute inset-0 bg-gradient-to-r from-[#EDE8DE] via-[#F7F4EC] to-[#EDE8DE] animate-pulse z-0" 
          aria-hidden="true"
        />
      )}

      {/* Main Image */}
      {!showPlaceholder && activeSrc && (
        <img
          src={activeSrc}
          alt={alt}
          onLoad={() => setLoaded(true)}
          onError={handleError}
          className={`w-full h-full object-cover transition-all duration-500 ease-out ${
            loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-102'
          } ${className}`}
          {...props}
        />
      )}

      {/* Neutral Destination-Specific Placeholder */}
      {showPlaceholder && (
        <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-gradient-to-b from-[#F7F4EC] to-[#EDE8DE] select-none">
          <div className="w-8 h-8 rounded-full bg-[#173D2E]/10 flex items-center justify-center text-[#173D2E] mb-1.5 shadow-xs">
            <Landmark className="w-4 h-4 text-[#173D2E]" />
          </div>
          <span className="text-[11px] font-bold text-[#102D23] line-clamp-1 max-w-[90%]">
            {alt || 'Karnataka Attraction'}
          </span>
          <span className="text-[9px] text-[#77786F] tracking-wide mt-0.5 font-medium">
            Karnataka Explorer
          </span>
        </div>
      )}
    </div>
  );
};
