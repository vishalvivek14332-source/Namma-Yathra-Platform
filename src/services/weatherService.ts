/**
 * Weather & Karnataka Seasonal Climate Service
 * 
 * Provides live weather forecasts using Open-Meteo for accurate geographic coordinates,
 * augmented with Karnataka regional climate intelligence and seasonal packing recommendations.
 */

export interface WeatherData {
  temperature: number; // in Celsius
  tempMax: number;
  tempMin: number;
  condition: string;
  conditionCode: number;
  precipitationProbability: number;
  humidity: number;
  windSpeed: number;
  advisoryTip: string;
  packingRecommendation: string;
  isLive: boolean;
}

// In-memory cache to prevent redundant API fetches
const weatherCache = new Map<string, { data: WeatherData; timestamp: number }>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * WMO Weather interpretation code mapper
 */
function interpretWmoCode(code: number): { condition: string; defaultTempRange: [number, number] } {
  if (code === 0) return { condition: 'Clear Sky & Sunny', defaultTempRange: [22, 32] };
  if (code === 1 || code === 2) return { condition: 'Partly Sunny', defaultTempRange: [21, 30] };
  if (code === 3) return { condition: 'Overcast & Shaded', defaultTempRange: [20, 28] };
  if (code === 45 || code === 48) return { condition: 'Misty / Foggy', defaultTempRange: [16, 24] };
  if (code >= 51 && code <= 55) return { condition: 'Light Drizzle', defaultTempRange: [19, 25] };
  if (code >= 61 && code <= 65) return { condition: 'Moderate Showers', defaultTempRange: [18, 24] };
  if (code >= 80 && code <= 82) return { condition: 'Passing Showers', defaultTempRange: [19, 26] };
  if (code >= 95) return { condition: 'Thunderstorm', defaultTempRange: [18, 23] };
  return { condition: 'Pleasant & Mild', defaultTempRange: [20, 29] };
}

/**
 * Region-specific climate intelligence for Karnataka
 */
function getRegionalClimateAdvisory(region: string, district: string, condition: string): { advisory: string; packing: string } {
  if (district.includes('Kodagu') || district.includes('Chikkamagaluru') || region === 'Western Ghats & Hills') {
    return {
      advisory: 'High-altitude Western Ghats microclimate. Morning valley mist and cool mountain breezes prevail.',
      packing: 'Pack light woollen pullover or fleece jacket, umbrella/rain jacket, and sturdy anti-slip shoes.'
    };
  }
  if (region === 'Coastal Karnataka' || district.includes('Uttara Kannada') || district.includes('Udupi')) {
    return {
      advisory: 'Tropical coastal warmth with humid Arabian sea breezes. Ideal for early morning and golden-hour sunset beach walks.',
      packing: 'Breathable cotton attire, UV sunglasses, sunscreen SPF 50, and water-friendly sandals.'
    };
  }
  if (region === 'Northern Heritage' || district.includes('Vijayanagara') || district.includes('Bagalkot') || district.includes('Vijayapura')) {
    return {
      advisory: 'Dry Deccan plateau climate. Granite boulders absorb heat by midday; early morning exploration is optimal.',
      packing: 'Wide-brim hat, breathable linen clothing, electrolyte hydration bottle, and comfortable walking shoes for rock ruins.'
    };
  }
  if (region === 'Mysuru & Cauvery' || region === 'Bengaluru & South') {
    return {
      advisory: 'Moderate and salubrious South Karnataka plateau climate with mild daytime warmth and cool evenings.',
      packing: 'Comfortable casual walking wear, comfortable walking shoes for heritage palaces, and light evening layer.'
    };
  }
  return {
    advisory: 'Favourable sightseeing conditions across central Karnataka historical corridors.',
    packing: 'Light comfortable cottons, sunglasses, and walking shoes.'
  };
}

/**
 * Fetch forecast for a destination using Open-Meteo with seasonal Karnataka fallback
 */
export async function getDestinationWeather(
  lat: number,
  lng: number,
  region: string = '',
  district: string = ''
): Promise<WeatherData> {
  const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  const cached = weatherCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`;
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`Open-Meteo HTTP ${res.status}`);
    }

    const data = await res.json();
    const current = data.current;
    const daily = data.daily;

    const weatherCode = current?.weather_code ?? daily?.weather_code?.[0] ?? 1;
    const { condition } = interpretWmoCode(weatherCode);
    const regional = getRegionalClimateAdvisory(region, district, condition);

    const weatherObj: WeatherData = {
      temperature: Math.round(current?.temperature_2m ?? daily?.temperature_2m_max?.[0] ?? 26),
      tempMax: Math.round(daily?.temperature_2m_max?.[0] ?? 29),
      tempMin: Math.round(daily?.temperature_2m_min?.[0] ?? 19),
      condition: condition,
      conditionCode: weatherCode,
      precipitationProbability: Math.round(daily?.precipitation_probability_max?.[0] ?? 10),
      humidity: Math.round(current?.relative_humidity_2m ?? 65),
      windSpeed: Math.round(current?.wind_speed_10m ?? 8),
      advisoryTip: regional.advisory,
      packingRecommendation: regional.packing,
      isLive: true
    };

    weatherCache.set(cacheKey, { data: weatherObj, timestamp: Date.now() });
    return weatherObj;
  } catch (err) {
    console.warn(`Weather fetch failed for [${lat}, ${lng}], using seasonal Karnataka climate model:`, err);
    
    // Seasonal fallback based on region
    const isHill = region === 'Western Ghats & Hills' || district.includes('Kodagu') || district.includes('Chikkamagaluru');
    const isCoast = region === 'Coastal Karnataka';
    const isNorth = region === 'Northern Heritage';

    const fallbackTemp = isHill ? 22 : isCoast ? 29 : isNorth ? 30 : 26;
    const fallbackCondition = isHill ? 'Pleasant & Misty' : isCoast ? 'Warm & Breezy' : 'Sunny & Warm';
    const regional = getRegionalClimateAdvisory(region, district, fallbackCondition);

    const fallbackObj: WeatherData = {
      temperature: fallbackTemp,
      tempMax: fallbackTemp + 3,
      tempMin: fallbackTemp - 6,
      condition: fallbackCondition,
      conditionCode: isHill ? 45 : 1,
      precipitationProbability: isHill ? 25 : 10,
      humidity: isCoast ? 75 : isHill ? 80 : 50,
      windSpeed: isCoast ? 14 : 9,
      advisoryTip: regional.advisory,
      packingRecommendation: regional.packing,
      isLive: false
    };

    weatherCache.set(cacheKey, { data: fallbackObj, timestamp: Date.now() });
    return fallbackObj;
  }
}
