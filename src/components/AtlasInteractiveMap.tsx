import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Destination } from '../data/destinations';
import { Navigation, Layers, Maximize2, Minimize2 } from 'lucide-react';

interface AtlasInteractiveMapProps {
  destinations: Destination[];
  selectedDestinationId?: string | null;
  onSelectDestination: (dest: Destination) => void;
  onViewDetails?: (dest: Destination) => void;
}

export const AtlasInteractiveMap: React.FC<AtlasInteractiveMapProps> = ({
  destinations,
  selectedDestinationId,
  onSelectDestination,
  onViewDetails,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const markersMapRef = useRef<Map<string, { marker: L.Marker; defaultIcon: L.DivIcon; selectedIcon: L.DivIcon }>>(new Map());
  const [isExpanded, setIsExpanded] = useState(false);

  // Track whether the current selection originated from directly clicking a map marker
  const isMarkerClickRef = useRef(false);

  // Keep references to latest callbacks and data to avoid stale closures in event handlers
  const destinationsRef = useRef(destinations);
  destinationsRef.current = destinations;

  const onSelectDestinationRef = useRef(onSelectDestination);
  onSelectDestinationRef.current = onSelectDestination;

  const onViewDetailsRef = useRef(onViewDetails);
  onViewDetailsRef.current = onViewDetails;

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [14.3, 75.8],
        zoom: 7,
        zoomControl: false,
        attributionControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;
      mapInstanceRef.current = map;

      // Handle popup opened: dynamically ensure image load recalculation and wire action buttons
      map.on('popupopen', (e) => {
        const popupElement = e.popup.getElement();
        if (!popupElement) return;

        // Image load listener: recalculate popup positioning so image expansion never pushes popup outside viewport
        const img = popupElement.querySelector('img');
        if (img) {
          if (!img.complete) {
            const handleImageLoad = () => {
              e.popup.update();
            };
            img.addEventListener('load', handleImageLoad, { once: true });
            img.addEventListener('error', handleImageLoad, { once: true });
          } else {
            // Already cached/loaded, update popup bounds immediately
            e.popup.update();
          }
        }

        // Action button listener: wire up "Click to view details"
        const btn = popupElement.querySelector<HTMLButtonElement>('.atlas-view-details-btn');
        if (btn) {
          const destId = btn.getAttribute('data-dest-id');
          const targetDest = destinationsRef.current.find(d => d.id === destId);
          if (!targetDest) return;

          const handleDetailsAction = (ev: Event) => {
            // Stop event bubbling to prevent interfering with Leaflet map canvas
            ev.preventDefault();
            ev.stopPropagation();
            if ('stopImmediatePropagation' in ev) {
              (ev as any).stopImmediatePropagation();
            }

            // Close popup cleanly
            map.closePopup();

            // Update application state with selected destination ID
            onSelectDestinationRef.current(targetDest);

            // Trigger the destination detail view modal
            if (onViewDetailsRef.current) {
              onViewDetailsRef.current(targetDest);
            }
          };

          btn.onclick = handleDetailsAction;
          btn.onkeydown = (ev: KeyboardEvent) => {
            if (ev.key === 'Enter' || ev.key === ' ') {
              handleDetailsAction(ev);
            }
          };
        }
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Event delegation on container in capturing phase as an ironclad safeguard
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    const handleCapturingTrigger = (ev: MouseEvent | TouchEvent) => {
      const target = ev.target as HTMLElement | null;
      if (!target) return;

      const btn = target.closest('.atlas-view-details-btn') as HTMLButtonElement | null;
      if (btn) {
        ev.preventDefault();
        ev.stopPropagation();
        if ('stopImmediatePropagation' in ev) {
          (ev as any).stopImmediatePropagation();
        }

        const destId = btn.getAttribute('data-dest-id');
        const targetDest = destinationsRef.current.find(d => d.id === destId);
        if (targetDest) {
          mapInstanceRef.current?.closePopup();
          onSelectDestinationRef.current(targetDest);
          if (onViewDetailsRef.current) {
            onViewDetailsRef.current(targetDest);
          }
        }
      }
    };

    container.addEventListener('click', handleCapturingTrigger, true);
    container.addEventListener('touchend', handleCapturingTrigger, true);

    return () => {
      container.removeEventListener('click', handleCapturingTrigger, true);
      container.removeEventListener('touchend', handleCapturingTrigger, true);
    };
  }, []);

  // Populate/rebuild destination markers when destination list changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();
    markersMapRef.current.clear();
    const validCoords: L.LatLngTuple[] = [];

    destinations.forEach((dest) => {
      if (typeof dest.lat !== 'number' || typeof dest.lng !== 'number') return;

      const latLng: L.LatLngTuple = [dest.lat, dest.lng];
      validCoords.push(latLng);

      const defaultPinColor = dest.accentColor || '#173D2E';
      const selectedPinColor = '#B9684B';

      const defaultIcon = L.divIcon({
        className: 'custom-atlas-marker',
        html: `
          <div style="transform: scale(1.0); transform-origin: bottom center; transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);">
            <div style="background-color: ${defaultPinColor}; color: #FFFEFA; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.25); border: 2px solid #FFFEFA;">
              <span style="transform: rotate(45deg); font-size: 11px; font-weight: bold;">●</span>
            </div>
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -28],
      });

      const selectedIcon = L.divIcon({
        className: 'custom-atlas-marker',
        html: `
          <div style="transform: scale(1.25); transform-origin: bottom center; transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);">
            <div style="background-color: ${selectedPinColor}; color: #FFFEFA; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 6px 14px rgba(185,104,75,0.45); border: 2.5px solid #FFFEFA;">
              <span style="transform: rotate(45deg); font-size: 12px; font-weight: bold;">●</span>
            </div>
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -28],
      });

      const isSelected = selectedDestinationId === dest.id;

      const marker = L.marker(latLng, {
        icon: isSelected ? selectedIcon : defaultIcon,
        zIndexOffset: isSelected ? 1200 : 300,
      });

      // Semantic, responsive Leaflet popup card
      const popupHtml = `
        <div class="yatra-atlas-popup-card" style="font-family: 'Plus Jakarta Sans', system-ui, sans-serif; width: 290px; max-width: calc(100vw - 64px); overflow: hidden; border-radius: 12px; background-color: #FFFEFA;">
          ${dest.imageUrl ? `
            <div style="width: 100%; height: 105px; overflow: hidden; background: #EDE8DE; position: relative;">
              <img
                src="${dest.imageUrl}"
                alt="${dest.name}"
                style="width: 100%; height: 100%; object-fit: cover; display: block;"
                onerror="this.parentElement.style.display='none';"
              />
              <div style="position: absolute; top: 7px; left: 7px; background: rgba(255, 254, 250, 0.94); backdrop-filter: blur(4px); padding: 2px 8px; border-radius: 9999px; font-size: 9px; font-weight: 700; color: #102D23; text-transform: uppercase; letter-spacing: 0.05em; box-shadow: 0 1px 3px rgba(0,0,0,0.12);">
                ${dest.categories && dest.categories.length > 0 ? dest.categories[0] : dest.region}
              </div>
            </div>
          ` : ''}
          <div style="padding: 10px 13px;">
            <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #B9684B; font-weight: 700; margin-bottom: 2px;">
              ${dest.region}
            </div>
            <div style="font-size: 13px; font-weight: 800; color: #102D23; line-height: 1.25; margin-bottom: 2px; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
              ${dest.name}
            </div>
            ${dest.kannadaName ? `<div style="font-size: 11px; color: #77786F; font-family: 'Noto Serif Kannada', serif; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${dest.kannadaName}</div>` : ''}
            <div style="font-size: 11px; color: #555850; line-height: 1.35; margin-bottom: 8px; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
              ${dest.shortDescription}
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 10px; border-top: 1px solid #E5DFD3; padding-top: 7px; gap: 8px;">
              <span style="color: #77786F; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 95px;" title="${dest.district}">
                ${dest.district}
              </span>
              <button
                type="button"
                class="atlas-view-details-btn"
                data-dest-id="${dest.id}"
                aria-label="Click to view details for ${dest.name}"
              >
                <span>Click to view details</span>
                <span class="atlas-btn-arrow" aria-hidden="true">&rarr;</span>
              </button>
            </div>
          </div>
        </div>
      `;

      // Configure AutoPan with generous top padding (85px) to prevent collision with map header controls
      marker.bindPopup(popupHtml, {
        className: 'yatra-atlas-popup',
        maxWidth: 320,
        minWidth: 260,
        autoPan: true,
        autoPanPaddingTopLeft: L.point(30, 85),
        autoPanPaddingBottomRight: L.point(30, 30),
        keepInView: true,
        closeButton: true,
      });

      marker.on('click', () => {
        isMarkerClickRef.current = true;
        onSelectDestinationRef.current(dest);
      });

      markersGroup.addLayer(marker);
      markersMapRef.current.set(dest.id, { marker, defaultIcon, selectedIcon });

      if (isSelected) {
        marker.openPopup();
      }
    });

    if (validCoords.length > 1 && !selectedDestinationId) {
      map.fitBounds(L.latLngBounds(validCoords), { padding: [35, 35], maxZoom: 10 });
    }
  }, [destinations]);

  // Synchronize selection state without destroying all markers
  useEffect(() => {
    if (!markersMapRef.current.size) return;

    markersMapRef.current.forEach(({ marker, defaultIcon, selectedIcon }, id) => {
      const isSelected = selectedDestinationId === id;
      marker.setIcon(isSelected ? selectedIcon : defaultIcon);
      marker.setZIndexOffset(isSelected ? 1200 : 300);

      if (isSelected) {
        marker.openPopup();
      }
    });
  }, [selectedDestinationId]);

  // Smoothly center/fly to destination only when selected from an external control (e.g. thumbnails or catalogue)
  useEffect(() => {
    if (!selectedDestinationId || !mapInstanceRef.current) return;
    const dest = destinations.find(d => d.id === selectedDestinationId);
    if (!dest) return;

    const map = mapInstanceRef.current;
    const targetData = markersMapRef.current.get(dest.id);

    // If triggered by a direct marker click, Leaflet's autoPan already handles popup positioning with zero conflict
    if (isMarkerClickRef.current) {
      isMarkerClickRef.current = false;
      return;
    }

    // External selection (thumbnails/list): fly to destination and then open popup so autoPan works with full headroom
    const latLng = L.latLng(dest.lat, dest.lng);
    const isInBounds = map.getBounds().contains(latLng);

    if (isInBounds && map.getZoom() >= 9) {
      targetData?.marker.openPopup();
    } else {
      map.flyTo([dest.lat, dest.lng], Math.max(map.getZoom(), 9), { duration: 0.6 });
      const handleMoveEnd = () => {
        targetData?.marker.openPopup();
      };
      map.once('moveend', handleMoveEnd);
    }
  }, [selectedDestinationId, destinations]);

  // Handle Resize and Fullscreen Invalidation
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

  // ResizeObserver for container size changes
  useEffect(() => {
    if (!mapContainerRef.current) return;
    const observer = new ResizeObserver(() => {
      mapInstanceRef.current?.invalidateSize();
    });
    observer.observe(mapContainerRef.current);
    return () => observer.disconnect();
  }, []);

  const handleReset = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView([14.3, 75.8], 7);
  };

  return (
    <div className={`relative bg-[#EDE8DE] rounded-2xl overflow-hidden border border-[#D5CEBF] shadow-xs transition-all duration-300 ${isExpanded ? 'fixed inset-4 z-50 shadow-2xl h-[calc(100vh-2rem)]' : 'h-[440px] sm:h-[490px] lg:h-[530px] w-full'}`}>
      {/* Top Map Action Controls */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
        <button
          onClick={handleReset}
          title="Reset map to Karnataka view"
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
      <div className="absolute top-3 left-3 z-20 bg-[#FFFEFA]/95 backdrop-blur-xs py-1.5 px-3 rounded-lg border border-[#D5CEBF] shadow-xs flex items-center gap-2 text-xs text-[#292D29]">
        <Layers className="w-3.5 h-3.5 text-[#173D2E]" />
        <span className="font-semibold">Interactive Karnataka Atlas</span>
        <span className="text-[#D5CEBF]">·</span>
        <span className="text-[#77786F] font-mono-numbers">{destinations.length} plotted</span>
      </div>

      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};
