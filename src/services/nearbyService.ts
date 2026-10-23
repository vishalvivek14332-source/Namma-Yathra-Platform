import { NearbyAttraction, StartingLocation, AttractionCategory } from '../types/itinerary';

export interface GeolocationError {
  code: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'NOT_SUPPORTED' | 'UNKNOWN';
  message: string;
}

/**
 * Request browser geolocation with proper permission checks and error handling
 */
export async function requestBrowserLocation(): Promise<{ lat: number; lng: number }> {
  if (!navigator.geolocation) {
    throw {
      code: 'NOT_SUPPORTED',
      message: 'Geolocation is not supported by your browser. Please search for a city or town.'
    } as GeolocationError;
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        let code: GeolocationError['code'] = 'UNKNOWN';
        let message = 'Unable to determine your location. Please search for a city instead.';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            code = 'PERMISSION_DENIED';
            message = 'Location access was denied. You can still discover places by searching for any Karnataka city, town, or landmark.';
            break;
          case error.POSITION_UNAVAILABLE:
            code = 'POSITION_UNAVAILABLE';
            message = 'Location information is currently unavailable. Please search for a city instead.';
            break;
          case error.TIMEOUT:
            code = 'TIMEOUT';
            message = 'Location request timed out. Please try again or search for your destination.';
            break;
        }

        reject({ code, message } as GeolocationError);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 60000
      }
    );
  });
}

/**
 * Search Karnataka locations (cities, towns, landmarks)
 */
export async function searchKarnatakaLocations(query: string): Promise<StartingLocation[]> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) return [];

  try {
    const res = await fetch(`/api/geocode?q=${encodeURIComponent(trimmed)}`);
    if (!res.ok) throw new Error(`Geocoding failed: ${res.statusText}`);
    const data = await res.json();
    return data.suggestions || data.results || [];
  } catch (err) {
    console.warn('Geocoding service error:', err);
    return [];
  }
}

/**
 * Fetch nearby attractions from backend (curated catalogue + live Overpass landmarks)
 */
export async function fetchNearbyAttractions(params: {
  lat?: number;
  lng?: number;
  radiusKm?: number;
  category?: AttractionCategory | 'All';
  query?: string;
  allKarnataka?: boolean;
}): Promise<{ attractions: NearbyAttraction[]; totalFound: number }> {
  const { lat, lng, radiusKm = 25, category = 'All', query = '', allKarnataka = false } = params;

  const urlParams = new URLSearchParams();
  if (lat !== undefined && !isNaN(lat)) {
    urlParams.set('lat', lat.toString());
  }
  if (lng !== undefined && !isNaN(lng)) {
    urlParams.set('lng', lng.toString());
  }
  urlParams.set('radiusKm', radiusKm.toString());
  urlParams.set('radius', radiusKm.toString());

  if (allKarnataka) {
    urlParams.set('allKarnataka', 'true');
  }
  if (category && category !== 'All') {
    urlParams.set('category', category);
  }
  if (query.trim()) {
    urlParams.set('query', query.trim());
  }

  try {
    const res = await fetch(`/api/nearby?${urlParams.toString()}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch nearby attractions: ${res.statusText}`);
    }
    const data = await res.json();
    return {
      attractions: data.attractions || [],
      totalFound: data.totalFound ?? data.count ?? (data.attractions?.length || 0)
    };
  } catch (err) {
    console.error('Error fetching nearby attractions:', err);
    throw err;
  }
}

/**
 * Calculate straight-line distance between two coordinates in kilometers (Haversine)
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export interface ReverseGeocodeResult {
  success: boolean;
  name: string;
  displayName: string;
  district: string;
  lat: number;
  lng: number;
  source?: string;
  error?: string;
}

/**
 * Reverse geocode latitude and longitude to get identifiable place name or address,
 * with fallback to nearest Karnataka curated landmark or clean coordinate string.
 */
export async function reverseGeocodeLocation(
  lat: number,
  lng: number
): Promise<ReverseGeocodeResult> {
  try {
    const res = await fetch(`/api/reverse-geocode?lat=${lat}&lng=${lng}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return {
      success: true,
      name: data.name || 'Pinned Location',
      displayName: data.displayName || `Pinned Location (${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E)`,
      district: data.district || 'Karnataka',
      lat,
      lng,
      source: data.source
    };
  } catch (err) {
    console.warn('[nearbyService] Reverse geocode failed, using coordinates fallback:', err);
    return {
      success: true,
      name: 'Pinned Location',
      displayName: `Pinned Location (${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E)`,
      district: 'Karnataka',
      lat,
      lng,
      source: 'fallback'
    };
  }
}

