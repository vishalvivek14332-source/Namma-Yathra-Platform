import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import { motion, AnimatePresence } from 'motion/react';
import {
  NearbyAttraction,
  StartingLocation,
  SelectedPlace,
  AttractionCategory
} from '../types/itinerary';
import {
  requestBrowserLocation,
  searchKarnatakaLocations,
  fetchNearbyAttractions,
  reverseGeocodeLocation,
  GeolocationError
} from '../services/nearbyService';
import { SafeImage } from './SafeImage';
import {
  Compass,
  MapPin,
  Navigation,
  Search,
  SlidersHorizontal,
  Clock,
  Ticket,
  Plus,
  Check,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Landmark,
  Trees,
  Mountain,
  Waves,
  Coffee,
  Sparkles,
  Map as MapIcon,
  List,
  Eye,
  Info,
  ChevronDown,
  Utensils,
  ExternalLink,
  RotateCcw
} from 'lucide-react';

interface NearbyExplorerProps {
  startingLocation: StartingLocation | null;
  onSelectStartingLocation: (loc: StartingLocation | null) => void;
  selectedPlaces: SelectedPlace[];
  onTogglePlace: (attraction: NearbyAttraction) => void;
  onViewDetails?: (attraction: NearbyAttraction) => void;
}

const RADIUS_OPTIONS = [5, 10, 25, 50, 100];

const CATEGORIES: { id: AttractionCategory | 'All'; label: string; icon: any }[] = [
  { id: 'All', label: 'All', icon: Sparkles },
  { id: 'Heritage', label: 'Heritage', icon: Landmark },
  { id: 'Nature', label: 'Nature', icon: Trees },
  { id: 'Waterfalls', label: 'Waterfalls', icon: Waves },
  { id: 'Beaches', label: 'Beaches', icon: Waves },
  { id: 'Temples', label: 'Temples', icon: Landmark },
  { id: 'Wildlife', label: 'Wildlife', icon: Trees },
  { id: 'Food', label: 'Food', icon: Coffee },
  { id: 'Adventure', label: 'Adventure', icon: Mountain },
  { id: 'Family', label: 'Family', icon: Sparkles },
];

import { POPULAR_HUBS } from '../data/destinations';

const getCategoryFallbackImage = (category?: string) => {
  switch (category) {
    case 'Food':
      return '/images/food_bengaluru_darshini.jpg';
    case 'Nature':
    case 'Adventure':
    case 'Waterfalls':
    case 'Wildlife':
      return '/images/coorg.jpg';
    case 'Beaches':
      return '/images/gokarna.jpg';
    case 'Temples':
    case 'Spiritual':
      return '/images/chamundeshwari_temple.jpg';
    case 'Heritage':
    default:
      return '/images/hampi.jpg';
  }
};

export const NearbyExplorer: React.FC<NearbyExplorerProps> = ({
  startingLocation,
  onSelectStartingLocation,
  selectedPlaces,
  onTogglePlace,
  onViewDetails
}) => {
  // Whether we are viewing statewide "All Karnataka" or a specific coordinate hub
  const [isAllKarnataka, setIsAllKarnataka] = useState<boolean>(
    !startingLocation || startingLocation.name === 'All Karnataka'
  );

  // User-pinned location state (allows user to drop a pin anywhere on the map)
  const [pinnedLocation, setPinnedLocation] = useState<StartingLocation | null>(null);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState<boolean>(false);

  // Filters & Search State
  const [radiusKm, setRadiusKm] = useState<number>(25);
  const [selectedCategory, setSelectedCategory] = useState<AttractionCategory | 'All'>('All');
  const [textFilter, setTextFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'distance' | 'name'>('distance');
  const [viewMode, setViewMode] = useState<'split' | 'list'>('split');
  const [isMobileMapCollapsed, setIsMobileMapCollapsed] = useState<boolean>(false);

  // Location search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<StartingLocation[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState<boolean>(false);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);

  // GPS / Browser Geolocation state
  const [isGpsLoading, setIsGpsLoading] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Attractions list state
  const [attractions, setAttractions] = useState<NearbyAttraction[]>([]);
  const [totalFoundCount, setTotalFoundCount] = useState<number>(0);
  const [isLoadingAttractions, setIsLoadingAttractions] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedAttractionId, setSelectedAttractionId] = useState<string | null>(null);

  // Map DOM and instance references
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const startMarkerRef = useRef<L.Marker | null>(null);
  const pinnedMarkerRef = useRef<L.Marker | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const attractionsLayerRef = useRef<L.LayerGroup | null>(null);
  const markerLookupRef = useRef<Map<string, L.Marker>>(new Map());

  // Debounced search for Karnataka locations
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingLocation(true);
      try {
        const results = await searchKarnatakaLocations(searchQuery);
        setSearchResults(results);
        setShowDropdown(true);
      } catch (err) {
        console.warn('Location search error:', err);
      } finally {
        setIsSearchingLocation(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Request GPS Location handler
  const handleUseMyLocation = async () => {
    setIsGpsLoading(true);
    setGpsError(null);
    try {
      const coords = await requestBrowserLocation();
      const newLoc: StartingLocation = {
        name: 'My Current Location',
        displayName: 'My Current Location (GPS)',
        district: 'Current Location',
        lat: coords.lat,
        lng: coords.lng,
        isCurrentLocation: true,
        isCustom: true
      };
      setIsAllKarnataka(false);
      setPinnedLocation(null);
      if (pinnedMarkerRef.current) {
        pinnedMarkerRef.current.remove();
        pinnedMarkerRef.current = null;
      }
      onSelectStartingLocation(newLoc);
      setSearchQuery('');
      setShowDropdown(false);
    } catch (err: any) {
      const geoErr = err as GeolocationError;
      setGpsError(geoErr.message || 'Could not determine your location.');
    } finally {
      setIsGpsLoading(false);
    }
  };

  // Restore Statewide "All Karnataka" view & reset any active pin/radius
  const handleResetToAllKarnataka = () => {
    setIsAllKarnataka(true);
    setPinnedLocation(null);
    onSelectStartingLocation(null);
    setSearchQuery('');
    setShowDropdown(false);
    setGpsError(null);

    if (pinnedMarkerRef.current) {
      pinnedMarkerRef.current.remove();
      pinnedMarkerRef.current = null;
    }
    if (radiusCircleRef.current) {
      radiusCircleRef.current.remove();
      radiusCircleRef.current = null;
    }
    if (startMarkerRef.current) {
      startMarkerRef.current.remove();
      startMarkerRef.current = null;
    }

    const map = mapInstanceRef.current;
    if (map) {
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      map.setView([14.65, 75.8], isMobile ? 6 : 7, { animate: true });
    }
  };

  // Clear pin without losing view
  const handleClearPin = () => {
    setPinnedLocation(null);
    if (pinnedMarkerRef.current) {
      pinnedMarkerRef.current.remove();
      pinnedMarkerRef.current = null;
    }
    if (radiusCircleRef.current) {
      radiusCircleRef.current.remove();
      radiusCircleRef.current = null;
    }
    if (!startingLocation || startingLocation.isCustom) {
      handleResetToAllKarnataka();
    }
  };

  // Explore from pinned location with selected radius
  const handleExploreFromPinnedLocation = (customRadius?: number) => {
    if (!pinnedLocation) return;
    const r = customRadius ?? radiusKm;
    setRadiusKm(r);
    setIsAllKarnataka(false);
    onSelectStartingLocation(pinnedLocation);

    const map = mapInstanceRef.current;
    if (map) {
      if (radiusCircleRef.current) {
        radiusCircleRef.current.setLatLng([pinnedLocation.lat, pinnedLocation.lng]);
        radiusCircleRef.current.setRadius(r * 1000);
      } else {
        radiusCircleRef.current = L.circle([pinnedLocation.lat, pinnedLocation.lng], {
          radius: r * 1000,
          color: '#D8A735',
          fillColor: '#D8A735',
          fillOpacity: 0.08,
          weight: 2,
          dashArray: '5, 5'
        }).addTo(map);
      }
      map.fitBounds(radiusCircleRef.current.getBounds().pad(0.12), { animate: true });
      map.closePopup();
    }
  };

  // Set location from search or preset hub
  const handleSelectLocation = (loc: StartingLocation & { isAllKarnataka?: boolean }) => {
    if (loc.isAllKarnataka || loc.name === 'All Karnataka') {
      handleResetToAllKarnataka();
    } else {
      setIsAllKarnataka(false);
      setPinnedLocation(null);
      if (pinnedMarkerRef.current) {
        pinnedMarkerRef.current.remove();
        pinnedMarkerRef.current = null;
      }
      onSelectStartingLocation(loc);

      const map = mapInstanceRef.current;
      if (map) {
        if (radiusCircleRef.current) {
          radiusCircleRef.current.setLatLng([loc.lat, loc.lng]);
          radiusCircleRef.current.setRadius(radiusKm * 1000);
        } else {
          radiusCircleRef.current = L.circle([loc.lat, loc.lng], {
            radius: radiusKm * 1000,
            color: '#D8A735',
            fillColor: '#D8A735',
            fillOpacity: 0.08,
            weight: 2,
            dashArray: '5, 5'
          }).addTo(map);
        }
        map.fitBounds(radiusCircleRef.current.getBounds().pad(0.12), { animate: true });
      }
    }
    setSearchQuery('');
    setShowDropdown(false);
    setGpsError(null);
  };

  // Reset Filters control
  const handleResetFilters = () => {
    setSelectedCategory('All');
    setTextFilter('');
    setRadiusKm(25);
    setSortBy('distance');
    if (pinnedLocation) {
      handleExploreFromPinnedLocation(25);
    }
  };

  // Fetch nearby attractions when startingLocation, isAllKarnataka, radiusKm, or selectedCategory changes
  useEffect(() => {
    let isMounted = true;
    setIsLoadingAttractions(true);
    setFetchError(null);

    const params: any = {
      category: selectedCategory,
      allKarnataka: isAllKarnataka
    };

    if (startingLocation && !isAllKarnataka) {
      params.lat = startingLocation.lat;
      params.lng = startingLocation.lng;
      params.radiusKm = radiusKm;
    } else {
      params.allKarnataka = true;
      if (startingLocation) {
        params.lat = startingLocation.lat;
        params.lng = startingLocation.lng;
      }
    }

    fetchNearbyAttractions(params)
      .then((data) => {
        if (!isMounted) return;
        setAttractions(data.attractions);
        setTotalFoundCount(data.totalFound);
      })
      .catch((err) => {
        if (!isMounted) return;
        setFetchError('Could not load destinations for this selection. Please try a different category or hub.');
      })
      .finally(() => {
        if (isMounted) setIsLoadingAttractions(false);
      });

    return () => {
      isMounted = false;
    };
  }, [startingLocation, isAllKarnataka, radiusKm, selectedCategory]);

  // Filter and sort attractions locally for instantaneous search
  const filteredAttractions = useMemo(() => {
    let result = [...attractions];

    if (textFilter.trim()) {
      const q = textFilter.toLowerCase().trim();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          (a.district && a.district.toLowerCase().includes(q)) ||
          a.shortDescription.toLowerCase().includes(q) ||
          (a.kannadaName && a.kannadaName.includes(q)) ||
          (a.cuisine && a.cuisine.toLowerCase().includes(q)) ||
          (a.speciality && a.speciality.toLowerCase().includes(q))
      );
    }

    if (sortBy === 'distance' && !isAllKarnataka) {
      result.sort((a, b) => a.distanceKm - b.distanceKm);
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [attractions, textFilter, sortBy, isAllKarnataka]);

  // Map Initialization
  useEffect(() => {
    if (!mapContainerRef.current) return;

    let resizeObserver: ResizeObserver | null = null;
    let handleWindowResize: (() => void) | null = null;

    if (!mapInstanceRef.current) {
      // Karnataka center coordinates: 14.65° N, 75.80° E
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      const centerLat = startingLocation && !isAllKarnataka ? startingLocation.lat : 14.65;
      const centerLng = startingLocation && !isAllKarnataka ? startingLocation.lng : 75.8;
      const initZoom = isAllKarnataka ? (isMobile ? 6 : 7) : 10;

      const map = L.map(mapContainerRef.current, {
        center: [centerLat, centerLng],
        zoom: initZoom,
        zoomControl: false,
        attributionControl: true,
        scrollWheelZoom: false,
        touchZoom: true,
        dragging: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      const attractionsLayer = L.layerGroup().addTo(map);
      attractionsLayerRef.current = attractionsLayer;
      mapInstanceRef.current = map;

      // Allow clicking or tapping anywhere on map canvas to set or move pin
      map.on('click', async (e: L.LeafletMouseEvent) => {
        const target = e.originalEvent?.target as HTMLElement | null;
        if (target && (target.closest('.leaflet-marker-icon') || target.closest('.leaflet-popup') || target.closest('.leaflet-control'))) {
          return;
        }

        const { lat, lng } = e.latlng;
        const initialLoc: StartingLocation = {
          name: 'Pinned Location',
          displayName: `Pinned Location (${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E)`,
          district: 'Karnataka',
          lat,
          lng,
          isCustom: true
        };

        setPinnedLocation(initialLoc);
        setIsReverseGeocoding(true);

        try {
          const geo = await reverseGeocodeLocation(lat, lng);
          setPinnedLocation({
            name: geo.name || 'Pinned Location',
            displayName: geo.displayName || `Pinned Location (${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E)`,
            district: geo.district || 'Karnataka',
            lat,
            lng,
            isCustom: true
          });
        } catch {
          // Retain coordinates on geocoding error/timeout
        } finally {
          setIsReverseGeocoding(false);
        }
      });

      // Auto-invalidate map size when container dimensions change
      if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
        resizeObserver = new ResizeObserver(() => {
          map.invalidateSize();
        });
        resizeObserver.observe(mapContainerRef.current);
      }

      handleWindowResize = () => {
        map.invalidateSize();
      };
      window.addEventListener('resize', handleWindowResize);
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (handleWindowResize) {
        window.removeEventListener('resize', handleWindowResize);
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Invalidate map size whenever viewMode or isMobileMapCollapsed changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [viewMode, isMobileMapCollapsed]);

  // Sync Pinned Location Marker and Popup on Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!pinnedLocation) {
      if (pinnedMarkerRef.current) {
        pinnedMarkerRef.current.remove();
        pinnedMarkerRef.current = null;
      }
      return;
    }

    const latLng: L.LatLngTuple = [pinnedLocation.lat, pinnedLocation.lng];

    if (pinnedMarkerRef.current) {
      pinnedMarkerRef.current.setLatLng(latLng);
    } else {
      const pinIcon = L.divIcon({
        className: 'custom-pinned-location-marker',
        html: `
          <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background: rgba(216, 167, 53, 0.45); animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: relative; width: 32px; height: 32px; border-radius: 50%; background: #173D2E; border: 3px solid #D8A735; color: #D8A735; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(0,0,0,0.45);">
              <span style="font-size: 15px;">📍</span>
            </div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
        popupAnchor: [0, -22]
      });

      const marker = L.marker(latLng, { icon: pinIcon, zIndexOffset: 2500 }).addTo(map);
      pinnedMarkerRef.current = marker;
    }

    // Popup for the pinned marker with coordinates and direct "Explore Near This Location" CTA
    const popupContent = `
      <div class="pinned-location-popup" style="font-family: system-ui, sans-serif; padding: 6px 4px; text-align: left; min-width: 220px;">
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
          <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #D8A735;"></span>
          <strong style="color: #173D2E; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;">Pinned Location</strong>
        </div>
        <div style="font-size: 13px; font-weight: 700; color: #102D23; margin-bottom: 2px;">
          ${pinnedLocation.name || 'Selected Pin'}
        </div>
        <div style="font-size: 11px; color: #555850; margin-bottom: 8px;">
          ${pinnedLocation.lat.toFixed(4)}° N, ${pinnedLocation.lng.toFixed(4)}° E
          ${pinnedLocation.district ? `<span style="display: block; color: #77786F; font-size: 10px;">${pinnedLocation.district}</span>` : ''}
        </div>
        <div style="display: flex; gap: 4px; margin-top: 6px;">
          <button
            type="button"
            id="pinned-popup-explore-btn"
            style="flex: 1; background: #173D2E; color: #D8A735; border: 1px solid #D8A735; padding: 6px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;"
          >
            🧭 Explore Near Pin
          </button>
          <button
            type="button"
            id="pinned-popup-clear-btn"
            style="background: #F7F4EC; color: #77786F; border: 1px solid #D5CEBF; padding: 6px 8px; border-radius: 8px; font-size: 11px; font-weight: 600; cursor: pointer;"
          >
            Clear
          </button>
        </div>
      </div>
    `;

    pinnedMarkerRef.current.bindPopup(popupContent, { maxWidth: 260 }).openPopup();
  }, [pinnedLocation]);

  // Sync Start Location Marker (for Presets & GPS) and Map View Extent
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (isAllKarnataka) {
      if (startMarkerRef.current) {
        startMarkerRef.current.remove();
        startMarkerRef.current = null;
      }
      if (radiusCircleRef.current) {
        radiusCircleRef.current.remove();
        radiusCircleRef.current = null;
      }
      return;
    }

    if (!startingLocation) return;

    const latLng: L.LatLngTuple = [
      startingLocation.lat,
      startingLocation.lng
    ];

    // If startingLocation is preset hub (not pinned location which has its own pinned marker)
    if (!pinnedLocation) {
      if (startMarkerRef.current) {
        startMarkerRef.current.setLatLng(latLng);
      } else {
        const startIcon = L.divIcon({
          className: 'custom-start-marker',
          html: `
            <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
              <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background: rgba(216, 167, 53, 0.4); animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="position: relative; width: 28px; height: 28px; border-radius: 50%; background: #173D2E; border: 3px solid #D8A735; color: #D8A735; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.35);">
                <span style="font-size: 13px;">📍</span>
              </div>
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        const marker = L.marker(latLng, { icon: startIcon, zIndexOffset: 1000 }).addTo(map);
        marker.bindPopup(`
          <div style="font-family: system-ui, sans-serif; padding: 4px 8px; text-align: center;">
            <strong style="color: #173D2E; font-size: 12px; display: block;">Starting Hub</strong>
            <span style="color: #555850; font-size: 11px;">${startingLocation.displayName || startingLocation.name}</span>
          </div>
        `);

        startMarkerRef.current = marker;
      }
    } else if (startMarkerRef.current) {
      startMarkerRef.current.remove();
      startMarkerRef.current = null;
    }
  }, [startingLocation, isAllKarnataka, pinnedLocation]);


  // Sync Attraction Markers on Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = attractionsLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    markerLookupRef.current.clear();

    const bounds = L.latLngBounds([]);

    filteredAttractions.forEach((attraction) => {
      const isSelected = selectedPlaces.some((p) => p.id === attraction.id);
      const isHighlighted = selectedAttractionId === attraction.id;
      const isFood = attraction.category === 'Food';

      const pinColor = isSelected ? '#D8A735' : isFood ? '#B9684B' : attraction.isVerified ? '#173D2E' : '#77786F';
      const textColor = isSelected ? '#102D23' : '#FFFEFA';
      const symbol = isSelected ? '✓' : isFood ? '☕' : '●';

      const icon = L.divIcon({
        className: 'nearby-attraction-marker',
        html: `
          <div style="transform: scale(${isHighlighted ? 1.25 : 1.0}); transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);">
            <div style="background-color: ${pinColor}; color: ${textColor}; width: 28px; height: 28px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.25); border: 2px solid #FFFEFA;">
              <span style="transform: rotate(45deg); font-size: 10px; font-weight: bold;">
                ${symbol}
              </span>
            </div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -26],
      });

      const marker = L.marker([attraction.lat, attraction.lng], {
        icon,
        zIndexOffset: isSelected ? 900 : isHighlighted ? 1000 : 400,
      });

      bounds.extend([attraction.lat, attraction.lng]);

      const feeText = attraction.avgEntryFeeINR !== undefined
        ? `₹${attraction.avgEntryFeeINR}`
        : 'Check fee';

      const verifiedBadge = attraction.isVerified
        ? `<span style="background: rgba(23, 61, 46, 0.12); color: #173D2E; padding: 2px 6px; border-radius: 9999px; font-size: 9px; font-weight: 700;">${attraction.verifiedBadge || 'Curator Verified'}</span>`
        : `<span style="background: rgba(185, 104, 75, 0.12); color: #B9684B; padding: 2px 6px; border-radius: 9999px; font-size: 9px; font-weight: 700;">OpenStreetMap Landmark</span>`;

      const displayImg = attraction.imageUrl || (isFood ? '/images/food_bengaluru_darshini.jpg' : '');

      const popupHtml = `
        <div class="nearby-atlas-popup" style="font-family: system-ui, sans-serif; width: 260px; max-width: calc(100vw - 64px); border-radius: 10px; overflow: hidden; background: #FFFEFA;">
          ${displayImg ? `
            <div style="width: 100%; height: 95px; overflow: hidden; background: #EDE8DE;">
              <img src="${displayImg}" alt="${attraction.name}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.parentElement.style.display='none';" />
            </div>
          ` : ''}
          <div style="padding: 10px 12px;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px; margin-bottom: 4px;">
              <span style="font-size: 9px; text-transform: uppercase; font-weight: 800; color: #B9684B;">
                ${attraction.category}
              </span>
              ${!isAllKarnataka && attraction.distanceKm > 0 ? `
                <span style="font-size: 10px; font-weight: 700; color: #173D2E;">
                  ${attraction.distanceKm} km aerial
                </span>
              ` : `
                <span style="font-size: 10px; font-weight: 700; color: #173D2E;">
                  ${attraction.district || 'Karnataka'}
                </span>
              `}
            </div>
            <h5 style="margin: 0 0 2px 0; font-size: 13px; font-weight: 800; color: #102D23; line-height: 1.25;">
              ${attraction.name}
            </h5>
            ${attraction.kannadaName ? `<div style="font-size: 10px; color: #77786F; margin-bottom: 4px;">${attraction.kannadaName}</div>` : ''}
            <div style="margin: 4px 0 6px 0;">${verifiedBadge}</div>
            <p style="margin: 0 0 8px 0; font-size: 10.5px; color: #555850; line-height: 1.35; max-height: 38px; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
              ${attraction.shortDescription}
            </p>
            <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #E5DFD3; padding-top: 6px; font-size: 10px;">
              <span style="color: #77786F;">Entry: <strong>${feeText}</strong></span>
              <button
                type="button"
                class="nearby-popup-toggle-btn"
                data-id="${attraction.id}"
                style="background: ${isSelected ? '#173D2E' : '#D8A735'}; color: ${isSelected ? '#D8A735' : '#102D23'}; border: none; padding: 4px 9px; border-radius: 6px; font-weight: 700; font-size: 10px; cursor: pointer; display: flex; align-items: center; gap: 3px;"
              >
                ${isSelected ? '✓ Added' : '+ Add to Journey'}
              </button>
            </div>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        maxWidth: 280,
        className: 'yatra-atlas-popup',
      });

      marker.on('click', () => {
        setSelectedAttractionId(attraction.id);
      });

      marker.addTo(layer);
      markerLookupRef.current.set(attraction.id, marker);
    });

    // Wire up popup button clicks via event listener
    map.on('popupopen', (e) => {
      const popupEl = e.popup.getElement();
      if (!popupEl) return;

      const btn = popupEl.querySelector<HTMLButtonElement>('.nearby-popup-toggle-btn');
      if (btn) {
        btn.onclick = (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          const targetId = btn.getAttribute('data-id');
          const target = attractions.find((a) => a.id === targetId);
          if (target) {
            onTogglePlace(target);
            map.closePopup();
          }
        };
      }

      const exploreBtn = popupEl.querySelector<HTMLButtonElement>('#pinned-popup-explore-btn');
      if (exploreBtn) {
        exploreBtn.onclick = (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          handleExploreFromPinnedLocation();
        };
      }

      const clearBtn = popupEl.querySelector<HTMLButtonElement>('#pinned-popup-clear-btn');
      if (clearBtn) {
        clearBtn.onclick = (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          handleResetToAllKarnataka();
        };
      }
    });

    // In All Karnataka view, fit bounds to show all markers across the state only if no pin is currently placed
    if (isAllKarnataka && bounds.isValid() && filteredAttractions.length > 0 && !pinnedLocation) {
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 8 });
    }
  }, [filteredAttractions, selectedPlaces, selectedAttractionId, isAllKarnataka, pinnedLocation]);

  // Center on marker when card is clicked
  const handleCardClick = (attraction: NearbyAttraction) => {
    setSelectedAttractionId(attraction.id);
    const marker = markerLookupRef.current.get(attraction.id);
    if (marker && mapInstanceRef.current) {
      mapInstanceRef.current.setView(
        [attraction.lat, attraction.lng],
        Math.max(mapInstanceRef.current.getZoom(), 12),
        { animate: true }
      );
      marker.openPopup();
    }
  };

  return (
    <div className="space-y-6 pb-28">
      {/* 1. LOCATION & FILTER BAR */}
      <div className="bg-[#FFFEFA] rounded-2xl border border-[#D5CEBF] p-4 sm:p-5 shadow-xs space-y-4">
        {/* Top Row: Search or GPS Trigger & View Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#173D2E] text-[#D8A735] flex items-center justify-center shrink-0">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-editorial text-lg font-bold text-[#102D23] leading-tight">
                {isAllKarnataka ? 'Explore All Karnataka' : `Explore Near ${startingLocation?.name || 'Selected Hub'}`}
              </h3>
              <p className="text-xs text-[#77786F]">
                {isAllKarnataka
                  ? 'Browsing all curated landmarks and culinary experiences across Karnataka'
                  : 'Discover verified heritage monuments, nature escapes, beaches, and local eateries'}
              </p>
            </div>
          </div>

          {/* Action Buttons: GPS + View Toggle + Reset */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleUseMyLocation}
              disabled={isGpsLoading}
              className="px-3 py-1.5 rounded-xl bg-[#F7F4EC] hover:bg-[#EDE8DE] text-[#173D2E] border border-[#D5CEBF] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              title="Use your phone or computer GPS location"
            >
              <Navigation className={`w-3.5 h-3.5 text-[#B9684B] ${isGpsLoading ? 'animate-spin' : ''}`} />
              <span>{isGpsLoading ? 'Locating...' : 'My Location'}</span>
            </button>

            <button
              type="button"
              onClick={handleResetFilters}
              className="px-2.5 py-1.5 rounded-xl bg-[#F7F4EC] hover:bg-[#EDE8DE] text-[#77786F] hover:text-[#102D23] border border-[#D5CEBF] text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Reset category, radius, and text filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            <div className="bg-[#F7F4EC] p-0.5 rounded-xl border border-[#D5CEBF] flex items-center">
              <button
                type="button"
                onClick={() => setViewMode('split')}
                title="Split Map & Cards View"
                aria-label="Split Map and Cards View"
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                  viewMode === 'split'
                    ? 'bg-[#FFFEFA] text-[#173D2E] shadow-xs'
                    : 'text-[#77786F] hover:text-[#102D23]'
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Map</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                title="List View"
                aria-label="List View"
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-[#FFFEFA] text-[#173D2E] shadow-xs'
                    : 'text-[#77786F] hover:text-[#102D23]'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">List</span>
              </button>
            </div>
          </div>
        </div>

        {/* GPS Error Notification if Denied */}
        {gpsError && (
          <div className="p-3 bg-[#B9684B]/10 border border-[#B9684B]/30 rounded-xl text-xs text-[#8C3B1F] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#B9684B]" />
              <span>{gpsError}</span>
            </div>
            <button
              onClick={() => setGpsError(null)}
              className="text-[#8C3B1F] hover:text-[#5C2310] font-semibold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Search Autocomplete Input */}
        <div className="relative">
          <div className="relative flex items-center">
            <MapPin className="w-4 h-4 text-[#77786F] absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowDropdown(true)}
              placeholder="Search a Karnataka city, town, or landmark (e.g., Mysuru, Hampi, Madikeri, Gokarna, Badami)..."
              className="w-full pl-10 pr-10 py-2.5 bg-[#F7F4EC] border border-[#D5CEBF] rounded-xl text-xs text-[#292D29] placeholder-[#77786F] focus:outline-none focus:border-[#173D2E] focus:bg-[#FFFEFA] transition-all"
            />
            {isSearchingLocation && (
              <RefreshCw className="w-3.5 h-3.5 text-[#77786F] animate-spin absolute right-3.5" />
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {showDropdown && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#FFFEFA] border border-[#D5CEBF] rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-[#E5DFD3] max-h-60 overflow-y-auto">
              {searchResults.map((loc, idx) => (
                <button
                  key={`${loc.name}-${idx}`}
                  type="button"
                  onClick={() => handleSelectLocation(loc)}
                  className="w-full text-left px-4 py-2.5 hover:bg-[#F7F4EC] flex items-center justify-between text-xs text-[#292D29] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#173D2E]" />
                    <span className="font-semibold text-[#102D23]">{loc.displayName || loc.name}</span>
                  </div>
                  {loc.district && <span className="text-[10px] text-[#77786F] uppercase">{loc.district}</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Hub Chips */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <span className="text-[11px] text-[#77786F] font-semibold mr-1">Popular Hubs:</span>
          {POPULAR_HUBS.map((hub) => {
            const isCurrent =
              hub.isAllKarnataka ? (isAllKarnataka && !pinnedLocation) : (!isAllKarnataka && startingLocation?.name === hub.name);
            return (
              <button
                key={hub.name}
                id={`hub-btn-${hub.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                type="button"
                onClick={() => handleSelectLocation(hub)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                  isCurrent
                    ? 'bg-[#173D2E] text-[#D8A735] font-bold shadow-xs'
                    : 'bg-[#F7F4EC] hover:bg-[#EDE8DE] text-[#555850] border border-[#E5DFD3]'
                }`}
              >
                {hub.name}
              </button>
            );
          })}
        </div>

        {/* Search Radius & Category Controls */}
        <div className="pt-3 border-t border-[#E5DFD3] flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Radius Selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-[#555850] flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#B9684B]" />
              <span>Radius:</span>
            </span>
            {isAllKarnataka && !pinnedLocation ? (
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#173D2E]/10 text-[#173D2E] border border-[#173D2E]/20">
                Statewide (All Regions)
              </span>
            ) : (
              <div className="flex items-center gap-1.5">
                {RADIUS_OPTIONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setRadiusKm(r);
                      if (pinnedLocation) {
                        handleExploreFromPinnedLocation(r);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      radiusKm === r
                        ? 'bg-[#173D2E] text-[#FFFEFA] shadow-xs'
                        : 'bg-[#F7F4EC] hover:bg-[#EDE8DE] text-[#555850] border border-[#D5CEBF]'
                    }`}
                  >
                    {r} km
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filter within results & Sorting */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3 h-3 text-[#77786F] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={textFilter}
                onChange={(e) => setTextFilter(e.target.value)}
                placeholder="Filter results..."
                className="pl-7 pr-3 py-1 bg-[#F7F4EC] border border-[#D5CEBF] rounded-lg text-xs text-[#292D29] focus:outline-none focus:border-[#173D2E]"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1 bg-[#F7F4EC] border border-[#D5CEBF] rounded-lg text-xs text-[#555850] font-medium focus:outline-none focus:border-[#173D2E]"
            >
              {!isAllKarnataka && <option value="distance">Sort by Distance</option>}
              <option value="name">Sort by Name</option>
            </select>
          </div>
        </div>

        {/* 2. CATEGORY PILLS */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                id={`category-pill-${cat.id.toLowerCase()}`}
                data-category={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-[#173D2E] text-[#FFFEFA] shadow-xs'
                    : 'bg-[#F7F4EC] hover:bg-[#EDE8DE] text-[#555850] border border-[#E5DFD3]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#D8A735]' : 'text-[#77786F]'}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* PINNED LOCATION ACTION BAR */}
      {pinnedLocation && (
        <div
          id="pinned-location-action-bar"
          className="bg-[#173D2E] text-[#FFFEFA] rounded-2xl p-4 sm:p-5 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 border border-[#D8A735]/40"
        >
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#D8A735]/20 border border-[#D8A735] flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-[#D8A735]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#D8A735] bg-[#D8A735]/15 px-2 py-0.5 rounded-full">
                  📍 Pinned Map Location
                </span>
                {isReverseGeocoding && (
                  <span className="text-[10px] text-[#EDE8DE] flex items-center gap-1">
                    <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                    <span>Resolving place...</span>
                  </span>
                )}
              </div>
              <h4 className="font-editorial text-base sm:text-lg font-bold text-[#FFFEFA] mt-0.5 leading-snug">
                {pinnedLocation.displayName || pinnedLocation.name}
              </h4>
              <div className="text-xs text-[#EDE8DE]/80 font-mono flex items-center gap-2 mt-0.5">
                <span>{pinnedLocation.lat.toFixed(4)}° N, {pinnedLocation.lng.toFixed(4)}° E</span>
                {pinnedLocation.district && (
                  <span className="text-[#D8A735]">· {pinnedLocation.district}</span>
                )}
              </div>
            </div>
          </div>

          {/* Radius Selector & Explore Action */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2 md:pt-0 border-t md:border-t-0 border-[#D8A735]/20">
            <div className="flex items-center gap-1 bg-[#102D23] p-1 rounded-xl border border-[#D8A735]/30">
              <span className="text-[10px] text-[#EDE8DE]/70 px-2 font-medium">Radius:</span>
              {RADIUS_OPTIONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  id={`pin-radius-${r}km`}
                  onClick={() => {
                    setRadiusKm(r);
                    if (!isAllKarnataka) {
                      handleExploreFromPinnedLocation(r);
                    }
                  }}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    radiusKm === r
                      ? 'bg-[#D8A735] text-[#102D23] shadow-xs'
                      : 'text-[#EDE8DE] hover:bg-[#173D2E]'
                  }`}
                >
                  {r} km
                </button>
              ))}
            </div>

            <button
              type="button"
              id="explore-near-location-btn"
              onClick={() => handleExploreFromPinnedLocation()}
              className="px-4 py-2 bg-[#D8A735] hover:bg-[#e0b040] text-[#102D23] rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <Compass className="w-4 h-4 text-[#102D23]" />
              <span>Explore Near This Location</span>
            </button>

            <button
              type="button"
              id="clear-pin-btn"
              onClick={handleClearPin}
              className="px-3 py-2 bg-[#FFFEFA]/10 hover:bg-[#FFFEFA]/20 text-[#FFFEFA] rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              title="Clear Pin and Restore Statewide View"
            >
              <span>Clear Pin</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. MAIN EXPLORATION VIEW: SPLIT MAP & CARDS OR FULL LIST */}
      {viewMode === 'split' ? (
        <div className="grid grid-cols-1 lg:grid-cols-[55fr_45fr] gap-6 items-start">
          {/* LEAFLET MAP CONTAINER (55% width on desktop, 100% on tablet/mobile) */}
          <div className="bg-[#FFFEFA] rounded-2xl border border-[#D5CEBF] p-3 sm:p-4 shadow-xs flex flex-col lg:sticky lg:top-24 lg:h-[72vh] lg:min-h-[520px] lg:max-h-[760px] w-full">
            <div className="flex items-center justify-between px-1 py-1.5 text-xs text-[#77786F] mb-1.5 shrink-0">
              <span className="flex items-center gap-1.5 font-semibold text-[#173D2E]">
                <MapPin className="w-3.5 h-3.5 text-[#D8A735]" />
                <span className="truncate max-w-[220px] sm:max-w-none">
                  {isAllKarnataka ? 'All Karnataka Destination Map' : `Nearby Map: ${startingLocation?.name || 'Selected Point'}`}
                </span>
              </span>

              <div className="flex items-center gap-2">
                <span className="hidden md:inline text-[11px] text-[#77786F]">
                  Click or tap map to drop a pin
                </span>
                {/* Mobile collapse / expand toggle */}
                <button
                  type="button"
                  id="mobile-map-toggle-btn"
                  onClick={() => setIsMobileMapCollapsed((prev) => !prev)}
                  className="lg:hidden px-2.5 py-1 rounded-lg bg-[#F7F4EC] hover:bg-[#EDE8DE] text-[#173D2E] border border-[#D5CEBF] text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  title={isMobileMapCollapsed ? 'Expand Map' : 'Collapse Map to give more room to destination cards'}
                >
                  <MapIcon className="w-3 h-3 text-[#B9684B]" />
                  <span>{isMobileMapCollapsed ? 'Expand Map' : 'Collapse Map'}</span>
                </button>
              </div>
            </div>

            {/* Map Canvas */}
            <div
              className={`w-full transition-all duration-300 rounded-xl overflow-hidden border border-[#E5DFD3] z-10 ${
                isMobileMapCollapsed
                  ? 'h-0 hidden'
                  : 'h-[44vh] min-h-[300px] max-h-[420px] lg:h-auto lg:min-h-0 lg:max-h-none lg:flex-1'
              }`}
              style={{ touchAction: 'pan-x pan-y' }}
            >
              <div ref={mapContainerRef} className="w-full h-full" />
            </div>

            {/* Mobile helper notice when map is visible */}
            {!isMobileMapCollapsed && (
              <div className="lg:hidden mt-2 px-1 text-[10.5px] text-[#77786F] flex items-center justify-between">
                <span>Tap any pin to view or tap elsewhere to drop pin</span>
                <span className="text-[#173D2E] font-medium">{filteredAttractions.length} pins</span>
              </div>
            )}
          </div>

          {/* ATTRACTION CARDS LIST (45% width on desktop, 100% on tablet/mobile) */}
          <div className="flex flex-col gap-3 lg:h-[72vh] lg:min-h-[520px] lg:max-h-[760px] w-full min-w-0">
            {/* Header with counter */}
            <div className="flex items-center justify-between text-xs sm:text-sm text-black font-bold px-1 shrink-0">
              <div className="text-black font-bold">
                Showing <strong className="text-black font-black">{filteredAttractions.length}</strong>{' '}
                {selectedCategory === 'Food' ? 'culinary experiences & food venues' : 'destinations'}{' '}
                {isAllKarnataka ? (
                  <span>across <strong className="text-black font-black">All Karnataka</strong></span>
                ) : (
                  <span>within <strong className="text-black font-black">{radiusKm} km</strong> of <strong className="text-black font-black">{startingLocation?.name || 'Selected Point'}</strong></span>
                )}
              </div>
              {!isAllKarnataka && (
                <span className="text-[11px] text-[#8C3B1F] font-bold shrink-0">
                  Straight-line distance
                </span>
              )}
            </div>

            {/* Loading State */}
            {isLoadingAttractions && (
              <div className="p-8 text-center bg-[#FFFEFA] rounded-2xl border border-[#D5CEBF] space-y-3">
                <RefreshCw className="w-6 h-6 animate-spin text-[#173D2E] mx-auto" />
                <p className="text-xs text-[#555850]">
                  Scanning curated Karnataka records and OpenStreetMap geographic nodes...
                </p>
              </div>
            )}

            {/* Empty State */}
            {!isLoadingAttractions && filteredAttractions.length === 0 && (
              <div className="p-8 text-center bg-[#FFFEFA] rounded-2xl border border-[#D5CEBF] space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#EDE8DE] flex items-center justify-center mx-auto text-[#77786F]">
                  <Compass className="w-6 h-6" />
                </div>
                <h4 className="font-editorial text-lg font-bold text-[#102D23]">
                  No Destinations Found
                </h4>
                <p className="text-xs text-[#555850] max-w-sm mx-auto">
                  No matching places found for "{selectedCategory}". Try selecting "All" categories or switching to "All Karnataka".
                </p>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAllKarnataka(true);
                      onSelectStartingLocation({
                        name: 'All Karnataka',
                        displayName: 'All Karnataka (Statewide View)',
                        district: 'Karnataka',
                        lat: 14.5204,
                        lng: 75.7224
                      });
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#173D2E] text-[#FFFEFA] text-xs font-semibold cursor-pointer"
                  >
                    View All Karnataka
                  </button>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="px-3 py-1.5 rounded-lg bg-[#F7F4EC] text-[#555850] border border-[#D5CEBF] text-xs font-semibold cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            )}

            {/* Scrollable Results Container on Desktop, Normal flow on Mobile/Tablet */}
            {!isLoadingAttractions && filteredAttractions.length > 0 && (
              <div className="lg:overflow-y-auto lg:flex-1 lg:pr-1.5 custom-scrollbar min-h-0">
                {/* Cards Grid: 1 column on mobile, 2 columns on tablet (sm:), 1 column inside 45% desktop panel (lg:) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                  {filteredAttractions.map((attraction) => {
                    const isSelected = selectedPlaces.some((p) => p.id === attraction.id);
                    const isCardHighlighted = selectedAttractionId === attraction.id;
                    const isFood = attraction.category === 'Food';
                    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${attraction.lat},${attraction.lng}`;
                    const cardImage = attraction.imageUrl || getCategoryFallbackImage(attraction.category);

                    return (
                      <div
                        key={attraction.id}
                        id={`attraction-card-${attraction.id}`}
                        onClick={() => handleCardClick(attraction)}
                        className={`bg-[#FFFEFA] rounded-2xl border transition-all overflow-hidden flex flex-col cursor-pointer w-full group ${
                          isSelected
                            ? 'border-[#D8A735] shadow-md ring-2 ring-[#D8A735]/40'
                            : isCardHighlighted
                            ? 'border-[#173D2E] shadow-md ring-1 ring-[#173D2E]/30'
                            : 'border-[#D5CEBF] hover:border-[#173D2E]/60 shadow-xs hover:shadow-md'
                        }`}
                      >
                        {/* Photo Header (Aspect 16:9) */}
                        <div className="relative w-full aspect-[16/9] bg-[#EDE8DE] overflow-hidden shrink-0">
                          <SafeImage
                            src={cardImage}
                            fallbackSrc={getCategoryFallbackImage(attraction.category)}
                            alt={attraction.name}
                            objectPosition={attraction.objectPosition}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />

                          {/* Category & Verification Badges on Left, Distance/Region on Right */}
                          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 pointer-events-none z-10">
                            <div className="flex items-center gap-1.5 flex-wrap max-w-[65%]">
                              <span className="px-2.5 py-0.5 rounded-full bg-[#FFFEFA]/95 text-[#102D23] font-bold text-[9.5px] uppercase tracking-wider backdrop-blur-md shadow-xs">
                                {isFood ? (attraction.destinationType ? attraction.destinationType.replace('_', ' ') : 'Food') : attraction.category}
                              </span>
                              {attraction.isVerified ? (
                                <span className="px-2 py-0.5 rounded-full bg-[#173D2E]/90 text-[#D8A735] font-semibold text-[9.5px] flex items-center gap-1 backdrop-blur-md shadow-xs">
                                  <ShieldCheck className="w-3 h-3 text-[#D8A735]" /> Curator
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-[#FFFEFA]/90 text-[#B9684B] font-semibold text-[9.5px] backdrop-blur-md shadow-xs">
                                  OSM Landmark
                                </span>
                              )}
                            </div>

                            <div className="px-2.5 py-0.5 rounded-full bg-[#102D23]/90 text-[#FFFEFA] font-bold text-[10.5px] backdrop-blur-md shadow-xs shrink-0">
                              {!isAllKarnataka && attraction.distanceKm > 0 ? `${attraction.distanceKm} km` : (attraction.district || 'Karnataka')}
                            </div>
                          </div>
                        </div>

                        {/* Body Content */}
                        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-0.5 min-w-0">
                                <h4 className="font-editorial text-base sm:text-lg font-bold text-[#102D23] leading-snug break-words group-hover:text-[#173D2E] transition-colors">
                                  {attraction.name}
                                </h4>
                                {attraction.kannadaName && (
                                  <div className="text-[11.5px] text-[#77786F] font-kannada font-medium">
                                    {attraction.kannadaName}
                                  </div>
                                )}
                              </div>
                              {attraction.district && (
                                <span className="text-[11px] text-[#77786F] font-medium shrink-0 bg-[#F7F4EC] px-2 py-0.5 rounded-md border border-[#E5DFD3]">
                                  {attraction.district}
                                </span>
                              )}
                            </div>

                            {/* Food-specific tags (Cuisine, Speciality) */}
                            {isFood && (attraction.cuisine || attraction.speciality) && (
                              <div className="mt-2 space-y-1">
                                {attraction.cuisine && (
                                  <div className="text-[11px] text-[#8C3B1F] font-semibold flex items-center gap-1">
                                    <Utensils className="w-3 h-3 text-[#B9684B]" />
                                    <span>{attraction.cuisine}</span>
                                  </div>
                                )}
                                {attraction.speciality && (
                                  <div className="text-[10.5px] text-[#555850] italic">
                                    Speciality: {attraction.speciality}
                                  </div>
                                )}
                              </div>
                            )}

                            <p className="text-xs text-[#555850] mt-1.5 line-clamp-2 leading-relaxed break-words">
                              {attraction.shortDescription}
                            </p>

                            {/* Opening hours if available */}
                            {attraction.openingHours && (
                              <div className="mt-1.5 text-[10.5px] text-[#77786F] flex items-center gap-1">
                                <Clock className="w-3 h-3 text-[#77786F]" />
                                <span>Hours: {attraction.openingHours}</span>
                              </div>
                            )}
                          </div>

                          {/* Practical Metadata & Action Row */}
                          <div className="pt-3 border-t border-[#E5DFD3] flex items-center justify-between gap-2 text-xs text-[#77786F]">
                            <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
                              <span className="flex items-center gap-1" title="Estimated visit duration">
                                <Clock className="w-3.5 h-3.5 text-[#B9684B]" />
                                <span>~{attraction.recommendedDurationMinutes || 60}m</span>
                              </span>
                              <span className="flex items-center gap-1" title="Entry fee or average meal cost">
                                <Ticket className="w-3.5 h-3.5 text-[#173D2E]" />
                                <span>
                                  {attraction.avgEntryFeeINR !== undefined
                                    ? `₹${attraction.avgEntryFeeINR}`
                                    : 'Check fee'}
                                </span>
                              </span>
                              <a
                                href={directionsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-[#173D2E] hover:text-[#D8A735] flex items-center gap-1 font-medium transition-colors cursor-pointer"
                                title="Get Google Maps directions"
                              >
                                <ExternalLink className="w-3 h-3 text-[#173D2E]" />
                                <span className="hidden sm:inline">Directions</span>
                              </a>
                            </div>

                            {/* "Add to My Journey" Button */}
                            <button
                              type="button"
                              id={`toggle-place-btn-${attraction.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                onTogglePlace(attraction);
                              }}
                              className={`px-3 sm:px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                                isSelected
                                  ? 'bg-[#173D2E] text-[#D8A735] hover:bg-[#102D23]'
                                  : 'bg-[#D8A735] hover:bg-[#C99827] text-[#102D23] shadow-xs active:scale-[0.98]'
                              }`}
                            >
                              {isSelected ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-[#D8A735]" />
                                  <span>Added</span>
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3.5 h-3.5 text-[#102D23]" />
                                  <span>Add to Journey</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* FULL LIST VIEW: No map, 3-column cards grid */
        <div className="space-y-4">
          {/* Header with counter */}
          <div className="flex items-center justify-between text-xs sm:text-sm text-black font-bold px-1">
            <div className="text-black font-bold">
              Showing <strong className="text-black font-black">{filteredAttractions.length}</strong>{' '}
              {selectedCategory === 'Food' ? 'culinary experiences & food venues' : 'destinations'}{' '}
              {isAllKarnataka ? (
                <span>across <strong className="text-black font-black">All Karnataka</strong></span>
              ) : (
                <span>within <strong className="text-black font-black">{radiusKm} km</strong> of <strong className="text-black font-black">{startingLocation?.name || 'Selected Point'}</strong></span>
              )}
            </div>
            {!isAllKarnataka && (
              <span className="text-[11px] text-[#8C3B1F] font-bold shrink-0">
                Straight-line distance
              </span>
            )}
          </div>

          {/* Loading State */}
          {isLoadingAttractions && (
            <div className="p-8 text-center bg-[#FFFEFA] rounded-2xl border border-[#D5CEBF] space-y-3">
              <RefreshCw className="w-6 h-6 animate-spin text-[#173D2E] mx-auto" />
              <p className="text-xs text-[#555850]">
                Scanning curated Karnataka records and OpenStreetMap geographic nodes...
              </p>
            </div>
          )}

          {/* Empty State */}
          {!isLoadingAttractions && filteredAttractions.length === 0 && (
            <div className="p-8 text-center bg-[#FFFEFA] rounded-2xl border border-[#D5CEBF] space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#EDE8DE] flex items-center justify-center mx-auto text-[#77786F]">
                <Compass className="w-6 h-6" />
              </div>
              <h4 className="font-editorial text-lg font-bold text-[#102D23]">
                No Destinations Found
              </h4>
              <p className="text-xs text-[#555850] max-w-sm mx-auto">
                No matching places found for "{selectedCategory}". Try selecting "All" categories or switching to "All Karnataka".
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAllKarnataka(true);
                    onSelectStartingLocation({
                      name: 'All Karnataka',
                      displayName: 'All Karnataka (Statewide View)',
                      district: 'Karnataka',
                      lat: 14.5204,
                      lng: 75.7224
                    });
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#173D2E] text-[#FFFEFA] text-xs font-semibold cursor-pointer"
                >
                  View All Karnataka
                </button>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-3 py-1.5 rounded-lg bg-[#F7F4EC] text-[#555850] border border-[#D5CEBF] text-xs font-semibold cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          )}

          {/* 3-column Cards Grid in List Mode */}
          {!isLoadingAttractions && filteredAttractions.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredAttractions.map((attraction) => {
                const isSelected = selectedPlaces.some((p) => p.id === attraction.id);
                const isCardHighlighted = selectedAttractionId === attraction.id;
                const isFood = attraction.category === 'Food';
                const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${attraction.lat},${attraction.lng}`;
                const cardImage = attraction.imageUrl || getCategoryFallbackImage(attraction.category);

                return (
                  <div
                    key={attraction.id}
                    id={`attraction-card-${attraction.id}`}
                    onClick={() => handleCardClick(attraction)}
                    className={`bg-[#FFFEFA] rounded-2xl border transition-all overflow-hidden flex flex-col cursor-pointer w-full group ${
                      isSelected
                        ? 'border-[#D8A735] shadow-md ring-2 ring-[#D8A735]/40'
                        : isCardHighlighted
                        ? 'border-[#173D2E] shadow-md ring-1 ring-[#173D2E]/30'
                        : 'border-[#D5CEBF] hover:border-[#173D2E]/60 shadow-xs hover:shadow-md'
                    }`}
                  >
                    {/* Photo Header (Aspect 16:9) */}
                    <div className="relative w-full aspect-[16/9] bg-[#EDE8DE] overflow-hidden shrink-0">
                      <SafeImage
                        src={cardImage}
                        fallbackSrc={getCategoryFallbackImage(attraction.category)}
                        alt={attraction.name}
                        objectPosition={attraction.objectPosition}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />

                      {/* Category & Verification Badges on Left, Distance/Region on Right */}
                      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 pointer-events-none z-10">
                        <div className="flex items-center gap-1.5 flex-wrap max-w-[65%]">
                          <span className="px-2.5 py-0.5 rounded-full bg-[#FFFEFA]/95 text-[#102D23] font-bold text-[9.5px] uppercase tracking-wider backdrop-blur-md shadow-xs">
                            {isFood ? (attraction.destinationType ? attraction.destinationType.replace('_', ' ') : 'Food') : attraction.category}
                          </span>
                          {attraction.isVerified ? (
                            <span className="px-2 py-0.5 rounded-full bg-[#173D2E]/90 text-[#D8A735] font-semibold text-[9.5px] flex items-center gap-1 backdrop-blur-md shadow-xs">
                              <ShieldCheck className="w-3 h-3 text-[#D8A735]" /> Curator
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-[#FFFEFA]/90 text-[#B9684B] font-semibold text-[9.5px] backdrop-blur-md shadow-xs">
                              OSM Landmark
                            </span>
                          )}
                        </div>

                        <div className="px-2.5 py-0.5 rounded-full bg-[#102D23]/90 text-[#FFFEFA] font-bold text-[10.5px] backdrop-blur-md shadow-xs shrink-0">
                          {!isAllKarnataka && attraction.distanceKm > 0 ? `${attraction.distanceKm} km` : (attraction.district || 'Karnataka')}
                        </div>
                      </div>
                    </div>

                    {/* Body Content */}
                    <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5 min-w-0">
                            <h4 className="font-editorial text-base sm:text-lg font-bold text-[#102D23] leading-snug break-words group-hover:text-[#173D2E] transition-colors">
                              {attraction.name}
                            </h4>
                            {attraction.kannadaName && (
                              <div className="text-[11.5px] text-[#77786F] font-kannada font-medium">
                                {attraction.kannadaName}
                              </div>
                            )}
                          </div>
                          {attraction.district && (
                            <span className="text-[11px] text-[#77786F] font-medium shrink-0 bg-[#F7F4EC] px-2 py-0.5 rounded-md border border-[#E5DFD3]">
                              {attraction.district}
                            </span>
                          )}
                        </div>

                        {/* Food-specific tags (Cuisine, Speciality) */}
                        {isFood && (attraction.cuisine || attraction.speciality) && (
                          <div className="mt-2 space-y-1">
                            {attraction.cuisine && (
                              <div className="text-[11px] text-[#8C3B1F] font-semibold flex items-center gap-1">
                                <Utensils className="w-3 h-3 text-[#B9684B]" />
                                <span>{attraction.cuisine}</span>
                              </div>
                            )}
                            {attraction.speciality && (
                              <div className="text-[10.5px] text-[#555850] italic">
                                Speciality: {attraction.speciality}
                              </div>
                            )}
                          </div>
                        )}

                        <p className="text-xs text-[#555850] mt-1.5 line-clamp-2 leading-relaxed break-words">
                          {attraction.shortDescription}
                        </p>

                        {/* Opening hours if available */}
                        {attraction.openingHours && (
                          <div className="mt-1.5 text-[10.5px] text-[#77786F] flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#77786F]" />
                            <span>Hours: {attraction.openingHours}</span>
                          </div>
                        )}
                      </div>

                      {/* Practical Metadata & Action Row */}
                      <div className="pt-3 border-t border-[#E5DFD3] flex items-center justify-between gap-2 text-xs text-[#77786F]">
                        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
                          <span className="flex items-center gap-1" title="Estimated visit duration">
                            <Clock className="w-3.5 h-3.5 text-[#B9684B]" />
                            <span>~{attraction.recommendedDurationMinutes || 60}m</span>
                          </span>
                          <span className="flex items-center gap-1" title="Entry fee or average meal cost">
                            <Ticket className="w-3.5 h-3.5 text-[#173D2E]" />
                            <span>
                              {attraction.avgEntryFeeINR !== undefined
                                ? `₹${attraction.avgEntryFeeINR}`
                                : 'Check fee'}
                            </span>
                          </span>
                          <a
                            href={directionsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-[#173D2E] hover:text-[#D8A735] flex items-center gap-1 font-medium transition-colors cursor-pointer"
                            title="Get Google Maps directions"
                          >
                            <ExternalLink className="w-3 h-3 text-[#173D2E]" />
                            <span className="hidden sm:inline">Directions</span>
                          </a>
                        </div>

                        {/* "Add to My Journey" Button */}
                        <button
                          type="button"
                          id={`toggle-place-btn-${attraction.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onTogglePlace(attraction);
                          }}
                          className={`px-3 sm:px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                            isSelected
                              ? 'bg-[#173D2E] text-[#D8A735] hover:bg-[#102D23]'
                              : 'bg-[#D8A735] hover:bg-[#C99827] text-[#102D23] shadow-xs active:scale-[0.98]'
                          }`}
                        >
                          {isSelected ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-[#D8A735]" />
                              <span>Added</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5 text-[#102D23]" />
                              <span>Add to Journey</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
