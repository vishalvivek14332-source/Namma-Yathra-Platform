import { Router, Request, Response } from 'express';
import {
  Destination,
  KARNATAKA_DESTINATIONS,
  KARNATAKA_FOOD_EXPERIENCES,
  ALL_CURATED_DESTINATIONS
} from '../data/destinations';
import { NearbyAttraction, AttractionCategory, StartingLocation } from '../types/itinerary';

export const nearbyRouter = Router();

/**
 * Pre-indexed major Karnataka cities and travel hubs with verified coordinates
 */
export const KARNATAKA_HUBS: Array<{ name: string; kannadaName: string; district: string; lat: number; lng: number }> = [
  { name: 'Bengaluru', kannadaName: 'ಬೆಂಗಳೂರು', district: 'Bengaluru Urban', lat: 12.9716, lng: 77.5946 },
  { name: 'Mysuru', kannadaName: 'ಮೈಸೂರು', district: 'Mysuru', lat: 12.2958, lng: 76.6394 },
  { name: 'Mangaluru', kannadaName: 'ಮಂಗಳೂರು', district: 'Dakshina Kannada', lat: 12.9141, lng: 74.8560 },
  { name: 'Madikeri (Coorg)', kannadaName: 'ಮಡಿಕೇರಿ (ಕೊಡಗು)', district: 'Kodagu', lat: 12.4244, lng: 75.7382 },
  { name: 'Hampi (Hospet)', kannadaName: 'ಹಂಪಿ (ಹೊಸಪೇಟೆ)', district: 'Vijayanagara', lat: 15.3350, lng: 76.4600 },
  { name: 'Chikkamagaluru', kannadaName: 'ಚಿಕ್ಕಮಗಳೂರು', district: 'Chikkamagaluru', lat: 13.3161, lng: 75.7720 },
  { name: 'Gokarna', kannadaName: 'ಗೋಕರ್ಣ', district: 'Uttara Kannada', lat: 14.5479, lng: 74.3188 },
  { name: 'Udupi', kannadaName: 'ಉಡುಪಿ', district: 'Udupi', lat: 13.3409, lng: 74.7421 },
  { name: 'Hubballi-Dharwad', kannadaName: 'ಹುಬ್ಬಳ್ಳಿ-ಧಾರವಾಡ', district: 'Dharwad', lat: 15.3647, lng: 75.1240 },
  { name: 'Belagavi', kannadaName: 'ಬೆಳಗಾವಿ', district: 'Belagavi', lat: 15.8497, lng: 74.4977 },
  { name: 'Shivamogga', kannadaName: 'ಶಿವಮೊಗ್ಗ', district: 'Shivamogga', lat: 13.9299, lng: 75.5681 },
  { name: 'Hassan', kannadaName: 'ಹಾಸನ', district: 'Hassan', lat: 13.0033, lng: 76.1004 },
  { name: 'Badami', kannadaName: 'ಬಾದಾಮಿ', district: 'Bagalkot', lat: 15.9189, lng: 75.6841 },
  { name: 'Dandeli', kannadaName: 'ದಾಂಡೇಲಿ', district: 'Uttara Kannada', lat: 15.2361, lng: 74.6173 },
  { name: 'Kalaburagi (Gulbarga)', kannadaName: 'ಕಲಬುರಗಿ', district: 'Kalaburagi', lat: 17.3297, lng: 76.8343 },
  { name: 'Vijayapura (Bijapur)', kannadaName: 'ವಿಜಯಪುರ', district: 'Vijayapura', lat: 16.8302, lng: 75.7100 },
  { name: 'Karwar', kannadaName: 'ಕಾರವಾರ', district: 'Uttara Kannada', lat: 14.8136, lng: 74.1298 },
  { name: 'Murudeshwar', kannadaName: 'ಮುರುಡೇಶ್ವರ', district: 'Uttara Kannada', lat: 14.0940, lng: 74.4899 },
  { name: 'Mandya', kannadaName: 'ಮಂಡ್ಯ', district: 'Mandya', lat: 12.5234, lng: 76.8967 },
  { name: 'Tumakuru', kannadaName: 'ತುಮಕೂರು', district: 'Tumakuru', lat: 13.3422, lng: 77.1017 },
  { name: 'Bidar', kannadaName: 'ಬೀದರ್', district: 'Bidar', lat: 17.9104, lng: 77.5199 }
];

/**
 * Calculates straight-line distance in kilometers using the Haversine formula
 */
function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Maps curated destination categories and characteristics to the 9 required categories
 */
function mapCuratedToCategories(dest: Destination): AttractionCategory[] {
  const cats: AttractionCategory[] = [];
  const lowerName = dest.name.toLowerCase();
  const lowerDesc = dest.shortDescription.toLowerCase();

  // Waterfalls
  if (lowerName.includes('fall') || lowerName.includes('abbi') || lowerName.includes('jog') || lowerDesc.includes('waterfall')) {
    cats.push('Waterfalls');
  }

  // Beaches - only genuine coastal beaches (not inland island fortresses like Srirangapatna)
  if (
    dest.categories.includes('Beaches') ||
    lowerName.includes('beach') ||
    (lowerName.includes('island') && (lowerDesc.includes('coastal') || lowerDesc.includes('arabian') || lowerDesc.includes('sea')))
  ) {
    cats.push('Beaches');
  }

  // Temples / Spiritual
  if (dest.categories.includes('Spiritual') || lowerName.includes('temple') || lowerName.includes('matha') || lowerName.includes('colossus') || lowerName.includes('shiva') || lowerName.includes('basadi')) {
    cats.push('Temples');
  }

  // Heritage
  if (dest.categories.includes('Heritage') || lowerName.includes('palace') || lowerName.includes('fort') || lowerName.includes('ruin') || lowerName.includes('cave')) {
    cats.push('Heritage');
  }

  // Nature
  if (dest.categories.includes('Nature') || lowerDesc.includes('garden') || lowerDesc.includes('valley') || lowerDesc.includes('peak') || lowerDesc.includes('forest')) {
    cats.push('Nature');
  }

  // Wildlife
  if (lowerName.includes('elephant') || lowerName.includes('sanctuary') || lowerName.includes('safari') || lowerName.includes('zoo') || lowerDesc.includes('wildlife') || lowerDesc.includes('flora')) {
    cats.push('Wildlife');
  }

  // Adventure
  if (dest.categories.includes('Adventure') || lowerName.includes('trek') || lowerName.includes('rafting') || lowerName.includes('hill') || lowerDesc.includes('coracle') || lowerDesc.includes('rock')) {
    cats.push('Adventure');
  }

  // Food - strictly verified food experiences or food businesses
  if (
    dest.destinationType === 'food_experience' ||
    dest.destinationType === 'restaurant' ||
    dest.destinationType === 'cafe' ||
    dest.destinationType === 'street_food' ||
    dest.destinationType === 'bakery'
  ) {
    cats.push('Food');
  }

  // Family
  if (
    lowerName.includes('palace') ||
    lowerName.includes('garden') ||
    lowerName.includes('park') ||
    lowerName.includes('zoo') ||
    lowerName.includes('falls') ||
    (lowerName.includes('beach') && !lowerName.includes('trek'))
  ) {
    cats.push('Family');
  }

  // Default fallback
  if (cats.length === 0) {
    cats.push('Heritage');
  }

  return cats;
}

/**
 * In-memory cache for Overpass API responses (1 hour TTL)
 */
interface CacheEntry {
  timestamp: number;
  data: NearbyAttraction[];
}
const overpassCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Fetches nearby attractions or food amenities from OpenStreetMap Overpass with timeout, caching, and fallback
 */
async function fetchOverpassNearby(lat: number, lng: number, radiusMeters: number, categoryFilter?: string): Promise<NearbyAttraction[]> {
  const isFoodQuery = categoryFilter?.toLowerCase() === 'food';
  const cacheKey = `${lat.toFixed(2)}_${lng.toFixed(2)}_${Math.round(radiusMeters / 1000)}_${isFoodQuery ? 'food' : 'attractions'}`;
  const cached = overpassCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  // Explicit Overpass query: query food businesses when category is Food, otherwise landmarks & attractions
  const query = isFoodQuery
    ? `[out:json][timeout:4];(
        node["amenity"~"restaurant|cafe|fast_food|food_court|ice_cream"](around:${radiusMeters},${lat},${lng});
        node["shop"~"bakery|confectionery"](around:${radiusMeters},${lat},${lng});
      );out 30;`
    : `[out:json][timeout:4];(
        node["tourism"~"attraction|viewpoint|museum|zoo"](around:${radiusMeters},${lat},${lng});
        node["historic"~"monument|castle|ruins|fort|archaeological_site|heritage"](around:${radiusMeters},${lat},${lng});
        node["natural"~"waterfall|beach|peak"](around:${radiusMeters},${lat},${lng});
        node["amenity"="place_of_worship"](around:${radiusMeters},${lat},${lng});
        ${categoryFilter?.toLowerCase() === 'all' ? 'node["amenity"~"restaurant|cafe"](around:' + Math.min(radiusMeters, 15000) + ',' + lat + ',' + lng + ');' : ''}
      );out 25;`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4500);

  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'User-Agent': 'NammaYatraKarnataka/1.0',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'data=' + encodeURIComponent(query),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`[Overpass] HTTP ${res.status} returned`);
      return [];
    }

    const data = await res.json();
    if (!data.elements || !Array.isArray(data.elements)) {
      return [];
    }

    const results: NearbyAttraction[] = [];
    const seenNames = new Set<string>();

    for (const el of data.elements) {
      const tags = el.tags || {};
      const name = tags.name || tags['name:en'] || tags['name:kn'];
      if (!name || typeof name !== 'string' || name.length < 3) continue;

      const normName = name.trim().toLowerCase();
      if (seenNames.has(normName)) continue;
      seenNames.add(normName);

      const elLat = el.lat || el.center?.lat;
      const elLng = el.lon || el.center?.lon;
      if (typeof elLat !== 'number' || typeof elLng !== 'number') continue;

      const dist = calculateHaversineDistance(lat, lng, elLat, elLng);

      const amenity = tags.amenity || '';
      const shop = tags.shop || '';
      const tourism = tags.tourism || '';
      const historic = tags.historic || '';
      const natural = tags.natural || '';

      const isFoodAmenity =
        ['restaurant', 'cafe', 'fast_food', 'food_court', 'ice_cream'].includes(amenity) ||
        ['bakery', 'confectionery'].includes(shop);

      // When querying Food category, reject non-food locations (hills, waterfalls, temples, monuments)
      if (isFoodQuery && !isFoodAmenity) {
        continue;
      }

      let destinationType: NearbyAttraction['destinationType'] = 'attraction';
      if (amenity === 'cafe') destinationType = 'cafe';
      else if (amenity === 'restaurant') destinationType = 'restaurant';
      else if (amenity === 'fast_food') destinationType = 'street_food';
      else if (shop === 'bakery' || shop === 'confectionery') destinationType = 'bakery';
      else if (isFoodAmenity) destinationType = 'restaurant';

      // Determine category
      let category: AttractionCategory = 'Heritage';
      if (isFoodAmenity) {
        category = 'Food';
      } else if (natural === 'waterfall' || normName.includes('fall') || normName.includes('abbi') || normName.includes('joga')) {
        category = 'Waterfalls';
      } else if (natural === 'beach' || normName.includes('beach')) {
        category = 'Beaches';
      } else if (amenity === 'place_of_worship' || normName.includes('temple') || normName.includes('gudi') || normName.includes('matha')) {
        category = 'Temples';
      } else if (tourism === 'zoo' || normName.includes('sanctuary') || normName.includes('safari') || normName.includes('bird')) {
        category = 'Wildlife';
      } else if (historic || tourism === 'museum' || normName.includes('palace') || normName.includes('fort') || normName.includes('monument')) {
        category = 'Heritage';
      } else if (natural || tourism === 'viewpoint' || normName.includes('hill') || normName.includes('peak')) {
        category = 'Nature';
      } else if (tourism === 'attraction') {
        category = 'Family';
      }

      const cuisine = tags.cuisine ? tags.cuisine.replace(/;/g, ', ') : undefined;
      let imageUrl: string | undefined = undefined;
      if (category === 'Food') {
        const lowerName = normName;
        if (lowerName.includes('dosa') || lowerName.includes('dose') || lowerName.includes('ctr') || lowerName.includes('vidyarthi') || lowerName.includes('mylari')) {
          imageUrl = '/images/food_mysore_dosa.jpg';
        } else if (lowerName.includes('sweet') || lowerName.includes('peda') || lowerName.includes('bakery') || lowerName.includes('mithai')) {
          imageUrl = '/images/food_dharwad_peda.jpg';
        } else if (lowerName.includes('fish') || lowerName.includes('seafood') || lowerName.includes('mangalor') || lowerName.includes('coastal') || lowerName.includes('machali')) {
          imageUrl = '/images/food_mangaluru_neer_dosa.jpg';
        } else if (lowerName.includes('rotti') || lowerName.includes('roti') || lowerName.includes('jolada')) {
          imageUrl = '/images/food_jolada_rotti.jpg';
        } else if (lowerName.includes('coorg') || lowerName.includes('kodava') || lowerName.includes('pandi')) {
          imageUrl = '/images/food_coorg_akki_rotti.jpg';
        } else if (lowerName.includes('thali') || lowerName.includes('bhojana') || lowerName.includes('oota') || lowerName.includes('udupi')) {
          imageUrl = '/images/food_udupi_meal.jpg';
        } else {
          imageUrl = '/images/food_bengaluru_darshini.jpg';
        }
      }

      results.push({
        id: `osm-${el.id}`,
        name: name.trim(),
        kannadaName: tags['name:kn'] || undefined,
        lat: elLat,
        lng: elLng,
        distanceKm: dist,
        category,
        destinationType,
        cuisine,
        openingHours: tags.opening_hours || undefined,
        imageUrl,
        shortDescription: tags.description || (isFoodAmenity ? `${cuisine ? cuisine + ' ' : ''}${destinationType} in Karnataka.` : `Historic point of interest in Karnataka (${tags.historic || tags.tourism || 'attraction'}).`),
        isVerified: false,
        verifiedBadge: isFoodAmenity ? 'OpenStreetMap Food Venue' : 'OpenStreetMap Landmark',
        source: 'OpenStreetMap'
      });
    }

    overpassCache.set(cacheKey, { timestamp: Date.now(), data: results });
    return results;
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.warn('[Overpass] Error fetching nearby:', err.message);
    return [];
  }
}

/**
 * GET /api/nearby
 * Discovers tourist attractions and verified food experiences around selected coordinates or across All Karnataka
 */
nearbyRouter.get('/nearby', async (req: Request, res: Response) => {
  try {
    const isAllKarnataka = req.query.allKarnataka === 'true' || req.query.scope === 'all';
    let lat = parseFloat(req.query.lat as string);
    let lng = parseFloat(req.query.lng as string);
    const radiusKm = Math.min(500, Math.max(1, parseFloat((req.query.radiusKm as string) || (req.query.radius as string) || '50')));
    const category = (req.query.category as string) || 'all';
    const query = ((req.query.query as string) || '').trim().toLowerCase();
    const sortBy = (req.query.sortBy as string) || 'distance'; // 'distance' | 'name' | 'verified'

    const hasValidCoords = !isNaN(lat) && !isNaN(lng) && lat >= 11.5 && lat <= 18.5 && lng >= 74.0 && lng <= 78.8;

    if (!isAllKarnataka && !hasValidCoords) {
      return res.status(400).json({
        success: false,
        error: 'Invalid coordinates. Coordinates must be located within Karnataka bounds (Lat 11.5°N - 18.5°N, Lng 74.0°E - 78.8°E).'
      });
    }

    // When All Karnataka is selected without explicit coordinates, use geographic center of Karnataka for reference
    if (isAllKarnataka && !hasValidCoords) {
      lat = 14.5204;
      lng = 75.7224;
    }

    const allAttractions: NearbyAttraction[] = [];
    const seenNames = new Set<string>();

    // 1. First Pass: Search Curated Karnataka 32-Destination & Verified Food Experiences Catalogue
    for (const dest of ALL_CURATED_DESTINATIONS) {
      const dist = hasValidCoords ? calculateHaversineDistance(lat, lng, dest.lat, dest.lng) : 0;
      if (isAllKarnataka || dist <= radiusKm) {
        const categories = mapCuratedToCategories(dest);
        
        // Category check
        const matchesCategory =
          category === 'all' ||
          categories.some(c => c.toLowerCase() === category.toLowerCase());

        // Text query check
        const matchesQuery =
          !query ||
          dest.name.toLowerCase().includes(query) ||
          dest.district.toLowerCase().includes(query) ||
          dest.shortDescription.toLowerCase().includes(query) ||
          (dest.cuisine && dest.cuisine.toLowerCase().includes(query)) ||
          (dest.speciality && dest.speciality.toLowerCase().includes(query));

        if (matchesCategory && matchesQuery) {
          seenNames.add(dest.name.toLowerCase());
          allAttractions.push({
            id: dest.id,
            name: dest.name,
            kannadaName: dest.kannadaName,
            district: dest.district,
            lat: dest.lat,
            lng: dest.lng,
            distanceKm: dist,
            category: categories[0],
            destinationType: dest.destinationType,
            cuisine: dest.cuisine,
            speciality: dest.speciality,
            shortDescription: dest.shortDescription,
            imageUrl: dest.imageUrl,
            objectPosition: dest.objectPosition,
            isVerified: true,
            verifiedBadge: dest.destinationType === 'food_experience' ? 'Verified Karnataka Culinary Experience' : 'Verified ASI / KSTDC',
            avgEntryFeeINR: dest.avgEntryFeeINR,
            recommendedDurationMinutes: dest.recommendedDurationMinutes,
            source: 'Curated Catalogue',
            bestTimeToVisit: dest.bestTimeToVisit,
            knownConstraints: dest.knownConstraints,
            localSpecialties: dest.localSpecialties
          });
        }
      }
    }

    // 2. Second Pass: Enrich with OpenStreetMap Overpass (within radius, up to 100km, when coordinates provided)
    if (!isAllKarnataka && hasValidCoords && radiusKm <= 100) {
      const osmAttractions = await fetchOverpassNearby(lat, lng, radiusKm * 1000, category);
      for (const osm of osmAttractions) {
        if (osm.distanceKm <= radiusKm) {
          const normName = osm.name.toLowerCase();
          // Skip if already in curated list
          if (seenNames.has(normName)) continue;

          // Check if within 250m of an existing curated destination
          const nearCurated = allAttractions.some(
            a => a.isVerified && calculateHaversineDistance(a.lat, a.lng, osm.lat, osm.lng) < 0.25
          );
          if (nearCurated) continue;

          const matchesCategory = category === 'all' || osm.category.toLowerCase() === category.toLowerCase();
          const matchesQuery = !query || normName.includes(query) || osm.shortDescription.toLowerCase().includes(query);

          if (matchesCategory && matchesQuery) {
            seenNames.add(normName);
            allAttractions.push(osm);
          }
        }
      }
    }

    // 3. Sorting
    if (sortBy === 'distance' && hasValidCoords) {
      allAttractions.sort((a, b) => a.distanceKm - b.distanceKm);
    } else if (sortBy === 'verified') {
      allAttractions.sort((a, b) => (b.isVerified ? 1 : 0) - (a.isVerified ? 1 : 0) || a.distanceKm - b.distanceKm);
    } else if (sortBy === 'name') {
      allAttractions.sort((a, b) => a.name.localeCompare(b.name));
    }

    res.json({
      success: true,
      origin: { lat, lng, isKarnatakaWide: isAllKarnataka },
      radiusKm,
      count: allAttractions.length,
      totalFound: allAttractions.length,
      category,
      attractions: allAttractions.slice(0, 100) // Return up to 100
    });
  } catch (err: any) {
    console.error('[Nearby API] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to retrieve nearby destinations.' });
  }
});

/**
 * GET /api/geocode
 * Autocompletes and searches for Karnataka cities, towns, and landmarks
 */
nearbyRouter.get('/geocode', async (req: Request, res: Response) => {
  try {
    const q = ((req.query.q as string) || '').trim().toLowerCase();
    if (!q || q.length < 2) {
      return res.json({
        success: true,
        suggestions: KARNATAKA_HUBS.slice(0, 10).map(h => ({
          name: h.name,
          displayName: `${h.name}, ${h.district}`,
          kannadaName: h.kannadaName,
          district: h.district,
          lat: h.lat,
          lng: h.lng
        }))
      });
    }

    // 1. Match against Curated Karnataka Hubs
    const hubMatches = KARNATAKA_HUBS.filter(
      h => h.name.toLowerCase().includes(q) || h.district.toLowerCase().includes(q) || (h.kannadaName && h.kannadaName.includes(q))
    ).map(h => ({
      name: h.name,
      displayName: `${h.name}, ${h.district}`,
      kannadaName: h.kannadaName,
      district: h.district,
      lat: h.lat,
      lng: h.lng,
      isHub: true
    }));

    // 2. Match against Curated Destinations
    const destMatches = ALL_CURATED_DESTINATIONS.filter(
      d => d.name.toLowerCase().includes(q) || d.district.toLowerCase().includes(q)
    ).map(d => ({
      name: d.name,
      displayName: `${d.name}, ${d.district}`,
      kannadaName: d.kannadaName,
      district: d.district,
      lat: d.lat,
      lng: d.lng,
      isDestination: true
    }));

    // Combine and deduplicate
    const combined = [...hubMatches, ...destMatches];
    const uniqueMap = new Map<string, any>();
    for (const item of combined) {
      const key = `${item.name.toLowerCase()}_${item.district.toLowerCase()}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, item);
      }
    }

    const suggestions = Array.from(uniqueMap.values()).slice(0, 10);
    res.json({ success: true, suggestions });
  } catch (err: any) {
    console.error('[Geocode API] Error:', err.message);
    res.status(500).json({ success: false, error: 'Geocoding search failed.' });
  }
});

/**
 * GET /api/reverse-geocode
 * Reverse geocodes coordinates to the nearest identifiable place or address in Karnataka
 */
nearbyRouter.get('/reverse-geocode', async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ success: false, error: 'Invalid coordinates provided.' });
    }

    // 1. Find nearest curated hub or destination for reference
    let nearestPlace = '';
    let nearestDistrict = 'Karnataka';
    let minDistance = Infinity;

    for (const dest of ALL_CURATED_DESTINATIONS) {
      const d = calculateHaversineDistance(lat, lng, dest.lat, dest.lng);
      if (d < minDistance) {
        minDistance = d;
        nearestPlace = dest.name;
        nearestDistrict = dest.district;
      }
    }

    for (const hub of KARNATAKA_HUBS) {
      const d = calculateHaversineDistance(lat, lng, hub.lat, hub.lng);
      if (d < minDistance) {
        minDistance = d;
        nearestPlace = hub.name;
        nearestDistrict = hub.district;
      }
    }

    // 2. Attempt Nominatim reverse geocode with a tight timeout
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 1800);
      const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
      const osmRes = await fetch(nominatimUrl, {
        headers: {
          'User-Agent': 'NammaYatra/2.0 (Karnataka Travel Planner; contact@nammayatra.karnataka)'
        },
        signal: controller.signal
      });
      clearTimeout(timer);

      if (osmRes.ok) {
        const geoData = await osmRes.json();
        const addr = geoData.address || {};
        const town =
          addr.city ||
          addr.town ||
          addr.village ||
          addr.suburb ||
          addr.neighbourhood ||
          addr.hamlet ||
          addr.county ||
          addr.state_district;
        const district = addr.state_district || addr.county || nearestDistrict;
        const parts = [town, district, 'Karnataka'].filter(Boolean);
        const displayName = parts.join(', ');

        return res.json({
          success: true,
          name: town || (minDistance < 25 ? `Near ${nearestPlace}` : 'Pinned Location'),
          displayName: displayName || `Point (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
          district: district || nearestDistrict,
          lat,
          lng,
          source: 'Nominatim'
        });
      }
    } catch {
      // Nominatim failed or timed out — fall back to curated landmarks
    }

    // 3. Fallback based on nearest curated Karnataka landmark
    if (minDistance <= 25) {
      return res.json({
        success: true,
        name: `Near ${nearestPlace}`,
        displayName: `Near ${nearestPlace}, ${nearestDistrict} (${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E)`,
        district: nearestDistrict,
        lat,
        lng,
        source: 'CuratedProximity'
      });
    }

    return res.json({
      success: true,
      name: 'Pinned Location',
      displayName: `Pinned Location (${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E)`,
      district: nearestDistrict,
      lat,
      lng,
      source: 'Coordinates'
    });
  } catch (err: any) {
    console.error('[Reverse Geocode API] Error:', err.message);
    res.status(500).json({
      success: false,
      error: 'Reverse geocoding failed.',
      name: 'Pinned Location',
      displayName: `Point (${req.query.lat}, ${req.query.lng})`
    });
  }
});
