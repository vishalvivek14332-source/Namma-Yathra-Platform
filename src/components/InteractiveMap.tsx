import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Destination } from '../data/destinations';
import { ItineraryStop } from '../types/itinerary';
import { Maximize2, Minimize2, Navigation, Layers, MapPin, Compass, Clock, Ticket } from 'lucide-react';

interface InteractiveMapProps {
  stops: ItineraryStop[];
  selectedStopId?: string | null;
  onSelectStop?: (stopId: string) => void;
  dayNumber?: number | 'all';
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  stops,
  selectedStopId,
  onSelectStop,
  dayNumber = 'all',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      try {
        // Center on Karnataka geographical center (14.2° N, 75.8° E)
        const map = L.map(mapContainerRef.current, {
          center: [14.2, 75.8],
          zoom: 7,
          zoomControl: false,
          attributionControl: true,
        });

        // Clean OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 18,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
        }).addTo(map);

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        const markersLayer = L.layerGroup().addTo(map);
        markersLayerRef.current = markersLayer;
        mapInstanceRef.current = map;
      } catch (err: any) {
        console.error('Error initializing Leaflet map:', err);
        setMapError('Map initialization encountered an issue.');
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers when stops or selectedStopId change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    const validCoordinates: L.LatLngTuple[] = [];

    stops.forEach((stop, index) => {
      const dest = stop.destination;
      if (!dest || typeof dest.lat !== 'number' || typeof dest.lng !== 'number') return;

      const isSelected = selectedStopId === stop.id;
      const orderNum = index + 1;
      const latLng: L.LatLngTuple = [dest.lat, dest.lng];
      validCoordinates.push(latLng);

      // Pin Color: Terracotta for selected, Forest Green for unselected
      const pinColor = isSelected ? '#B9684B' : '#173D2E';
      const pinScale = isSelected ? 'scale(1.25)' : 'scale(1.0)';
      const zIndexOffset = isSelected ? 1200 : 200;

      const iconHtml = `
        <div style="transform: ${pinScale}; transform-origin: bottom center; transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);">
          <div style="background-color: ${pinColor}; color: #FFFEFA; width: 34px; height: 34px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 6px 14px rgba(16,45,35,0.35); border: 2.5px solid #FFFEFA;">
            <span style="transform: rotate(45deg); font-weight: 800; font-size: 13px; font-family: 'Plus Jakarta Sans', sans-serif;">${orderNum}</span>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-map-marker',
        html: iconHtml,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
        popupAnchor: [0, -34],
      });

      const marker = L.marker(latLng, {
        icon: customIcon,
        zIndexOffset: zIndexOffset,
      });

      // Refined Editorial Popup Card with Image Preview
      const popupContent = `
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; min-width: 190px; max-width: min(270px, calc(100vw - 64px)); overflow: hidden; border-radius: 8px;">
          ${dest.imageUrl ? `
            <div style="width: 100%; height: 95px; overflow: hidden; background: #EDE8DE;">
              <img src="${dest.imageUrl}" alt="${dest.name}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'"/>
            </div>
          ` : ''}
          <div style="padding: 10px 12px;">
            <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #B9684B; font-weight: 700; margin-bottom: 2px;">
              Stop ${orderNum} · ${dest.district}
            </div>
            <div style="font-size: 14px; font-weight: 800; color: #102D23; line-height: 1.25; margin-bottom: 3px;">
              ${dest.name}
            </div>
            ${dest.kannadaName ? `<div style="font-size: 11px; color: #77786F; font-family: 'Noto Serif Kannada', serif; margin-bottom: 6px;">${dest.kannadaName}</div>` : ''}
            <div style="font-size: 11px; color: #555850; line-height: 1.4; margin-bottom: 8px;">
              ${dest.shortDescription}
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; border-top: 1px solid #E5DFD3; padding-top: 6px; color: #292D29; font-weight: 600;">
              <span>⏱ ${stop.durationMinutes || dest.recommendedDurationMinutes} mins</span>
              <span>🎫 ${dest.avgEntryFeeINR > 0 ? `₹${dest.avgEntryFeeINR}` : 'Free Entry'}</span>
            </div>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('click', () => {
        if (onSelectStop) {
          onSelectStop(stop.id);
        }
      });

      markersGroup.addLayer(marker);

      if (isSelected) {
        marker.openPopup();
      }
    });

    // Fit map bounds to show all active markers smoothly
    if (validCoordinates.length > 1) {
      const bounds = L.latLngBounds(validCoordinates);
      map.fitBounds(bounds, { padding: [45, 45], maxZoom: 12, animate: true });
    } else if (validCoordinates.length === 1) {
      map.setView(validCoordinates[0], 11, { animate: true });
    }
  }, [stops, selectedStopId, onSelectStop]);

  // Invalidate map on resize or fullscreen toggle
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const timer = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 200);

    const handleResize = () => {
      mapInstanceRef.current?.invalidateSize();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [isExpanded]);

  // ResizeObserver for DOM container
  useEffect(() => {
    if (!mapContainerRef.current) return;
    const observer = new ResizeObserver(() => {
      mapInstanceRef.current?.invalidateSize();
    });
    observer.observe(mapContainerRef.current);
    return () => observer.disconnect();
  }, []);

  // Center on selected stop when changed externally
  useEffect(() => {
    if (!selectedStopId || !mapInstanceRef.current) return;
    const targetStop = stops.find(s => s.id === selectedStopId);
    if (targetStop && targetStop.destination) {
      mapInstanceRef.current.flyTo(
        [targetStop.destination.lat, targetStop.destination.lng],
        12,
        { duration: 0.8 }
      );
    }
  }, [selectedStopId, stops]);

  const handleResetView = () => {
    if (!mapInstanceRef.current || stops.length === 0) return;
    const coords: L.LatLngTuple[] = stops
      .filter(s => s.destination)
      .map(s => [s.destination!.lat, s.destination!.lng]);
    if (coords.length > 0) {
      mapInstanceRef.current.fitBounds(L.latLngBounds(coords), { padding: [45, 45] });
    } else {
      mapInstanceRef.current.setView([14.2, 75.8], 7);
    }
  };

  return (
    <div className={`relative bg-[#EDE8DE] rounded-2xl overflow-hidden border border-[#D5CEBF] transition-all duration-300 ${isExpanded ? 'fixed inset-4 z-50 shadow-2xl h-[calc(100vh-2rem)]' : 'h-[460px] lg:h-[580px] w-full'}`}>
      {/* Top Map Action Controls */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
        <button
          onClick={handleResetView}
          title="Reset map view to all stops"
          className="p-2 bg-[#FFFEFA]/95 hover:bg-[#FFFEFA] text-[#292D29] rounded-lg shadow-sm border border-[#D5CEBF] transition-colors cursor-pointer"
        >
          <Navigation className="w-4 h-4 text-[#173D2E]" />
        </button>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          title={isExpanded ? 'Exit full screen' : 'Expand full screen'}
          className="p-2 bg-[#FFFEFA]/95 hover:bg-[#FFFEFA] text-[#292D29] rounded-lg shadow-sm border border-[#D5CEBF] transition-colors cursor-pointer"
        >
          {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Map Header Indicator */}
      <div className="absolute top-3 left-3 z-20 bg-[#FFFEFA]/95 backdrop-blur-xs py-1.5 px-3.5 rounded-lg border border-[#D5CEBF] shadow-xs flex items-center gap-2 text-xs text-[#292D29]">
        <Layers className="w-3.5 h-3.5 text-[#173D2E]" />
        <span className="font-semibold">
          {dayNumber === 'all' ? 'All Itinerary Waypoints' : `Day ${dayNumber} Stops`}
        </span>
        <span className="text-[#D5CEBF]">·</span>
        <span className="text-[#77786F] font-mono-numbers">{stops.length} location{stops.length === 1 ? '' : 's'}</span>
      </div>

      {/* Map Transit Notice (Section 7 Anti-fabrication compliance) */}
      <div className="absolute bottom-6 left-3 right-3 sm:right-auto z-20 bg-[#FFFEFA]/90 backdrop-blur-xs py-2 px-3 rounded-lg border border-[#D5CEBF] text-[11px] text-[#555850] shadow-xs max-w-sm">
        <span className="font-semibold text-[#102D23]">OpenStreetMap Atlas:</span> Pins depict verified ASI & KSTDC coordinates. Transit accounts for Karnataka Western Ghats & highway terrain.
      </div>

      {mapError && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#F7F4EC] p-6 text-center text-sm text-[#77786F]">
          <div>
            <p className="font-semibold text-[#292D29] mb-1">Atlas Viewer</p>
            <p>{mapError}</p>
          </div>
        </div>
      )}

      {/* Leaflet DOM container */}
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};
