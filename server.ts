import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { KARNATAKA_DESTINATIONS, ALL_CURATED_DESTINATIONS, getDestinationById } from './src/data/destinations';
import cookieParser from 'cookie-parser';
import { connectToDatabase, getDatabase } from './src/server/db';
import { tripRouter } from './src/server/tripRoutes';
import { authRouter } from './src/server/authRoutes';
import { nearbyRouter } from './src/server/nearbyRoutes';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRouter);
app.use('/api', tripRouter);
app.use('/api', nearbyRouter);

// Initialize GoogleGenAI server client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * Helper to generate content with primary model (gemini-3.8-flash)
 * and graceful fallback to gemini-3.5-flash when spikes or 503 high demand occur.
 */
async function generateGeminiContentWithFallback(params: {
  contents: any;
  config?: any;
  preferredModel?: string;
  timeoutMs?: number;
}) {
  if (!ai) throw new Error('Gemini AI client not initialized');
  const models = [params.preferredModel || 'gemini-3.8-flash', 'gemini-3.5-flash'];
  let lastError: any = null;

  for (const model of models) {
    try {
      const generatePromise = ai.models.generateContent({
        model,
        contents: params.contents,
        config: params.config,
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`AI generation timed out for ${model}`)), params.timeoutMs || 25000)
      );

      const response = await Promise.race([generatePromise, timeoutPromise]);
      return { response, modelUsed: model };
    } catch (err: any) {
      console.warn(`Gemini generation on ${model} failed/unavailable:`, err.message || err);
      lastError = err;
    }
  }

  throw lastError;
}

/**
 * Fallback generator when Gemini API is unavailable or offline
 * Synthesizes geographically clustered, realistic Karnataka itineraries from curated data.
 */
function generateDeterministicFallback(input: any) {
  const {
    origin = 'Bengaluru',
    durationDays = 3,
    interests = ['Heritage', 'Nature'],
    budgetStyle = 'comfortable',
    travelPace = 'balanced',
    totalBudgetINR = 30000,
    travellersCount = 2,
    selectedPlaces = [],
    startingLocation = null,
  } = input;

  const daysCount = Math.min(Math.max(1, Number(durationDays)), 10);
  const stopsPerDay = travelPace === 'relaxed' ? 2 : travelPace === 'packed' ? 4 : 3;
  const totalCapacity = daysCount * stopsPerDay;

  const matchedDestinations = KARNATAKA_DESTINATIONS.filter(d => 
    interests.length === 0 || d.categories.some(c => interests.includes(c))
  );
  const fallbackPool = matchedDestinations.length >= daysCount * 2 ? matchedDestinations : KARNATAKA_DESTINATIONS;

  const hasSelections = Array.isArray(selectedPlaces) && selectedPlaces.length > 0;
  const orderedSelections = hasSelections ? [...selectedPlaces].sort((a, b) => (a.order || 0) - (b.order || 0)) : [];
  
  const scheduledSelections = orderedSelections.slice(0, totalCapacity);
  const unscheduledSelections = orderedSelections.slice(totalCapacity);

  const unscheduledDestinations = unscheduledSelections.map((p: any) => ({
    id: p.id,
    name: p.name,
    reason: `Could not fit into the ${daysCount}-day (${travelPace} pace) schedule without excessive transit time. Consider increasing trip duration to include it.`
  }));

  // Build scheduled stops queue
  const scheduledStopsQueue: any[] = [];
  scheduledSelections.forEach((p: any) => {
    const curated = getDestinationById(p.id);
    scheduledStopsQueue.push({
      destinationId: p.id,
      name: p.name,
      durationMinutes: p.recommendedDurationMinutes || curated?.recommendedDurationMinutes || 90,
      reason: p.shortDescription || (curated ? `Explore ${curated.name} for ${curated.categories.join(', ')}.` : `Explore ${p.name} from your nearby discovery.`),
      avgEntryFeeINR: p.avgEntryFeeINR !== undefined ? p.avgEntryFeeINR : (curated?.avgEntryFeeINR || 30),
      customAttraction: p
    });
  });

  // Fill remaining slots from fallback pool
  let fallbackIdx = 0;
  while (scheduledStopsQueue.length < totalCapacity) {
    const dest = fallbackPool[fallbackIdx % fallbackPool.length];
    fallbackIdx++;
    // Avoid immediate duplicate
    if (!scheduledStopsQueue.some(s => s.destinationId === dest.id)) {
      scheduledStopsQueue.push({
        destinationId: dest.id,
        name: dest.name,
        durationMinutes: dest.recommendedDurationMinutes || 90,
        reason: `Explore ${dest.name} for its ${dest.categories.join(', ')} experience.`,
        avgEntryFeeINR: dest.avgEntryFeeINR || 30,
        customAttraction: undefined
      });
    } else if (fallbackIdx > fallbackPool.length * 2) {
      // Break cycle if all pool used
      break;
    }
  }

  const days = [];
  let queueIdx = 0;
  const stopTimes = ['09:30 AM', '01:30 PM', '04:45 PM', '07:15 PM'];

  for (let dayNum = 1; dayNum <= daysCount; dayNum++) {
    const dayStops = [];
    for (let s = 0; s < stopsPerDay; s++) {
      if (queueIdx < scheduledStopsQueue.length) {
        const item = scheduledStopsQueue[queueIdx];
        queueIdx++;
        dayStops.push({
          id: `stop-${dayNum}-${s + 1}-${item.destinationId}`,
          destinationId: item.destinationId,
          arrivalTime: stopTimes[s] || '02:00 PM',
          durationMinutes: item.durationMinutes,
          reason: item.reason,
          estimatedCostINR: item.avgEntryFeeINR * Math.max(1, Number(travellersCount)),
          customAttraction: item.customAttraction
        });
      }
    }

    const startLocName = startingLocation?.displayName || origin;
    days.push({
      dayNumber: dayNum,
      title: dayNum === 1 ? `Departure from ${startLocName} & Highlights` : `Regional Exploration - Day ${dayNum}`,
      stops: dayStops,
      travelNotes: [
        `Commute between points planned with ${travelPace} buffer time.`,
        `Carry adequate hydration and note local sanctuary dress codes.`
      ]
    });
  }

  // Budget calculations based on style
  const multiplier = budgetStyle === 'economical' ? 0.7 : budgetStyle === 'premium' ? 1.6 : 1.0;
  const transportEst = Math.round(durationDays * 2200 * multiplier);
  const roomCount = Math.ceil(Number(travellersCount) / 2);
  const hotelPerNight = budgetStyle === 'economical' ? 1800 : budgetStyle === 'premium' ? 6500 : 3200;
  const accommodationEst = Math.round(Math.max(1, durationDays - 1) * roomCount * hotelPerNight);
  const foodPerDay = budgetStyle === 'economical' ? 450 : budgetStyle === 'premium' ? 1400 : 750;
  const foodEst = Math.round(durationDays * Number(travellersCount) * foodPerDay);
  const activitiesEst = days.flatMap(d => d.stops).reduce((sum, s) => sum + (s.estimatedCostINR || 0), 0);
  const miscEst = Math.round(durationDays * 500 * multiplier);

  const startName = startingLocation?.displayName || origin;

  return {
    tripTitle: `${durationDays}-Day Karnataka Journey from ${startName}`,
    overview: hasSelections
      ? `A tailored ${durationDays}-day Karnataka itinerary customized with ${scheduledSelections.length} of your discovered nearby attractions, starting from ${startName}.`
      : `A tailored ${durationDays}-day journey across Karnataka focusing on ${interests.join(', ') || 'heritage and nature'}, starting from ${startName}.`,
    assumptions: [
      `Transport calculated for group travel from ${startName}.`,
      `Accommodation assumes ${roomCount} room(s) per night.`,
      `Dining allows for authentic regional Karnataka fare (Dosa, Jolada Rotti, Thalis).`
    ],
    days,
    budget: {
      transportINR: transportEst,
      accommodationINR: accommodationEst,
      foodINR: foodEst,
      activitiesINR: activitiesEst,
      miscellaneousINR: miscEst
    },
    cautions: [
      'Early morning departures recommended to avoid regional highway traffic.',
      'Check temple sanctum attire requirements (traditional clothing required at select shrines).',
      'High-altitude Western Ghats viewpoints may experience morning mist.'
    ],
    selectedPlaces: orderedSelections,
    startingLocation,
    unscheduledDestinations,
    isAiGenerated: false
  };
}

// POST: Generate Full Trip Itinerary
app.post('/api/plan-trip', async (req, res) => {
  try {
    const input = req.body;
    const {
      origin = 'Bengaluru',
      destinationPreference = 'All Karnataka',
      durationDays = 3,
      startDate = new Date().toISOString().split('T')[0],
      travellersCount = 2,
      totalBudgetINR = 35000,
      budgetStyle = 'comfortable',
      interests = ['Heritage', 'Nature'],
      travelPace = 'balanced',
      travelMode = 'private-cab',
      dietaryPreferences = 'Vegetarian',
      accessibilityNotes = ''
    } = input;

    // Selected places and starting location
    const selectedPlaces: any[] = Array.isArray(input.selectedPlaces) ? input.selectedPlaces : [];
    const startingLocation = input.startingLocation || null;
    const selectedPlacesMap = new Map<string, any>(selectedPlaces.map(p => [p.id, p]));

    // Catalogue of valid destination IDs
    const validIds = KARNATAKA_DESTINATIONS.map(d => ({
      id: d.id,
      name: d.name,
      district: d.district,
      region: d.region,
      categories: d.categories,
      avgEntryFeeINR: d.avgEntryFeeINR,
      durationMinutes: d.recommendedDurationMinutes
    }));

    if (!ai || !apiKey) {
      console.log('Gemini API key not configured. Using deterministic Karnataka knowledge engine.');
      const fallback = generateDeterministicFallback(input);
      return res.json({ success: true, itinerary: fallback, note: 'Engine generated via curated Karnataka dataset.' });
    }

    const selectedPromptSection = selectedPlaces.length > 0
      ? `\nUSER EXPLICITLY SELECTED AND PRIORITIZED DESTINATIONS:
The user has specifically explored and added the following places to their journey (ordered by priority):
${JSON.stringify(selectedPlaces.map((p, idx) => ({
  priority: idx + 1,
  id: p.id,
  name: p.name,
  district: p.district,
  category: p.category,
  distanceFromStartKm: p.distanceKm,
  source: p.source
})))}

PRIORITIZATION INSTRUCTIONS:
1. You MUST prioritize and schedule as many of these user-selected destinations as realistically fit within the ${durationDays}-day schedule (${travelPace} pace).
2. Schedule them in accordance with their order and geographical logic.
3. For these selected places, use their exact "id" from the selected list above.
4. If time or distance limits prevent all selected destinations from fitting realistically into ${durationDays} days, place the remaining ones in "unscheduledDestinations" with a helpful, friendly explanation why they could not fit.
5. If there are extra available stop slots after scheduling the user's selected places, fill them with compatible curated destinations from Karnataka.`
      : '';

    const systemPrompt = `You are Namma Yatra, an expert Karnataka travel planning engine.
Plan a realistic, geographically cohesive, and culturally rich ${durationDays}-day trip in Karnataka.

USER SPECIFICATIONS:
- Origin: ${startingLocation?.displayName || origin}
- Preference: ${destinationPreference}
- Duration: ${durationDays} days (Start Date: ${startDate})
- Number of Travellers: ${travellersCount}
- Total Target Budget: INR ${totalBudgetINR}
- Budget Style: ${budgetStyle}
- Interests: ${interests.join(', ') || 'General sightseeing'}
- Travel Pace: ${travelPace} (${travelPace === 'relaxed' ? '2 stops/day' : travelPace === 'packed' ? '4 stops/day' : '3 stops/day'})
- Preferred Travel Mode: ${travelMode}
- Dietary Preference: ${dietaryPreferences}
${accessibilityNotes ? `- Accessibility / Special Notes: ${accessibilityNotes}` : ''}
${selectedPromptSection}

CRITICAL RULES:
1. Every single stop MUST use a "destinationId" chosen strictly from either the user's selected places list or the verified curated catalogue:
${JSON.stringify(validIds.map(v => ({ id: v.id, name: v.name, district: v.district, region: v.region, categories: v.categories })))}
2. DO NOT hallucinate unknown IDs.
3. Keep daily stops geographically logical (e.g. do not jump across Karnataka on the same day).
4. Realistic daily schedule with arrival times, reasonable visit durations, and concise rationale.
5. Provide budget estimates (group transport, accommodation, food, activities, misc) that align with ${budgetStyle} style.

Output MUST be valid JSON adhering strictly to this schema:
{
  "tripTitle": "string",
  "overview": "string",
  "assumptions": ["string"],
  "days": [
    {
      "dayNumber": 1,
      "title": "string",
      "stops": [
        {
          "destinationId": "exact_id_from_list",
          "arrivalTime": "string (e.g. 09:30 AM)",
          "durationMinutes": 90,
          "reason": "string",
          "estimatedCostINR": 100
        }
      ],
      "travelNotes": ["string"]
    }
  ],
  "unscheduledDestinations": [
    {
      "id": "string",
      "name": "string",
      "reason": "string"
    }
  ],
  "budget": {
    "transportINR": 5000,
    "accommodationINR": 8000,
    "foodINR": 4000,
    "activitiesINR": 1000,
    "miscellaneousINR": 1500
  },
  "cautions": ["string"]
}`;

    const { response, modelUsed } = await generateGeminiContentWithFallback({
      contents: 'Generate the complete personalized Karnataka itinerary according to instructions.',
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        temperature: 0.3
      },
      preferredModel: 'gemini-3.8-flash',
      timeoutMs: 25000
    });
    console.log(`Itinerary successfully generated with Gemini model: ${modelUsed}`);

    const rawText = response.text?.trim() || '';
    let parsed: any;
    try {
      parsed = JSON.parse(rawText);
    } catch (parseErr) {
      console.warn('Failed to parse Gemini output as JSON, attempting cleanup:', rawText.slice(0, 200));
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Invalid JSON format from AI');
      }
    }

    // Validate stops
    let sanitizedDays = parsed.days || [];
    sanitizedDays = sanitizedDays.map((day: any, dIdx: number) => {
      const validStops = (day.stops || [])
        .filter((s: any) => getDestinationById(s.destinationId) || selectedPlacesMap.has(s.destinationId))
        .map((s: any, sIdx: number) => {
          const dest = getDestinationById(s.destinationId);
          const sel = selectedPlacesMap.get(s.destinationId);
          const fee = (dest?.avgEntryFeeINR !== undefined ? dest.avgEntryFeeINR : (sel?.avgEntryFeeINR || 0));
          return {
            id: `stop-${day.dayNumber || dIdx + 1}-${sIdx + 1}-${s.destinationId}`,
            destinationId: s.destinationId,
            arrivalTime: s.arrivalTime || '10:00 AM',
            durationMinutes: s.durationMinutes || dest?.recommendedDurationMinutes || sel?.recommendedDurationMinutes || 90,
            reason: s.reason || `Explore ${dest?.name || sel?.name}`,
            estimatedCostINR: Number(s.estimatedCostINR) > 0 ? Number(s.estimatedCostINR) : (fee * Math.max(1, Number(travellersCount))),
            customAttraction: sel ? sel : undefined
          };
        });

      // If all stops were filtered out due to bad IDs, populate with fallback stop
      if (validStops.length === 0) {
        const fallbackDest = KARNATAKA_DESTINATIONS[dIdx % KARNATAKA_DESTINATIONS.length];
        validStops.push({
          id: `stop-${day.dayNumber || dIdx + 1}-1-${fallbackDest.id}`,
          destinationId: fallbackDest.id,
          arrivalTime: '10:00 AM',
          durationMinutes: fallbackDest.recommendedDurationMinutes,
          reason: `Explore ${fallbackDest.name}`,
          estimatedCostINR: fallbackDest.avgEntryFeeINR * Math.max(1, Number(travellersCount))
        });
      }

      return {
        dayNumber: day.dayNumber || dIdx + 1,
        title: day.title || `Day ${day.dayNumber || dIdx + 1}`,
        stops: validStops,
        travelNotes: Array.isArray(day.travelNotes) ? day.travelNotes : ['Check local road conditions.']
      };
    });

    // Check which selected destinations were scheduled vs unscheduled
    const scheduledIds = new Set(sanitizedDays.flatMap((d: any) => d.stops.map((s: any) => s.destinationId)));
    const calculatedUnscheduled: any[] = [];
    selectedPlaces.forEach(p => {
      if (!scheduledIds.has(p.id)) {
        const aiReason = (parsed.unscheduledDestinations || []).find((u: any) => u.id === p.id)?.reason;
        calculatedUnscheduled.push({
          id: p.id,
          name: p.name,
          reason: aiReason || `Could not be scheduled within the ${durationDays}-day (${travelPace} pace) timeframe without exceeding daily travel limits.`
        });
      }
    });

    const activitiesCost = sanitizedDays.flatMap((d: any) => d.stops).reduce((sum: number, s: any) => sum + (s.estimatedCostINR || 0), 0);
    const finalBudget = parsed.budget || {
      transportINR: durationDays * 2000,
      accommodationINR: (durationDays - 1) * 3000,
      foodINR: durationDays * 800 * Number(travellersCount),
      activitiesINR: activitiesCost,
      miscellaneousINR: 1500
    };
    finalBudget.activitiesINR = activitiesCost;

    const startDisplayName = startingLocation?.displayName || origin;

    const finalResult = {
      tripTitle: parsed.tripTitle || `${durationDays}-Day Karnataka Journey from ${startDisplayName}`,
      overview: parsed.overview || `A curated ${durationDays}-day exploration of Karnataka starting from ${startDisplayName}.`,
      assumptions: Array.isArray(parsed.assumptions) ? parsed.assumptions : [],
      days: sanitizedDays,
      budget: finalBudget,
      cautions: Array.isArray(parsed.cautions) ? parsed.cautions : [],
      selectedPlaces,
      startingLocation,
      unscheduledDestinations: calculatedUnscheduled,
      isAiGenerated: true
    };

    res.json({ success: true, itinerary: finalResult });
  } catch (err: any) {
    console.error('Error in /api/plan-trip:', err);
    // Graceful fallback so user never gets stuck
    const fallback = generateDeterministicFallback(req.body);
    res.json({
      success: true,
      itinerary: fallback,
      warning: 'Live AI connection experienced a delay; generated via verified Karnataka travel engine.'
    });
  }
});

// POST: Regenerate a single day
app.post('/api/regenerate-day', async (req, res) => {
  try {
    const { tripInput, currentTrip, dayNumber, customPrompt } = req.body;
    const targetDay = Number(dayNumber);

    if (!ai || !apiKey) {
      // Deterministic day swap
      const unusedDestinations = KARNATAKA_DESTINATIONS.filter(
        d => !currentTrip?.days?.some((day: any) => day.stops?.some((s: any) => s.destinationId === d.id))
      );
      const candidates = unusedDestinations.length > 0 ? unusedDestinations : KARNATAKA_DESTINATIONS;
      const stopsPerDay = tripInput?.travelPace === 'relaxed' ? 2 : 3;
      const newStops = candidates.slice(0, stopsPerDay).map((dest, idx) => ({
        id: `stop-${targetDay}-${idx + 1}-${dest.id}`,
        destinationId: dest.id,
        arrivalTime: idx === 0 ? '09:30 AM' : '02:30 PM',
        durationMinutes: dest.recommendedDurationMinutes,
        reason: `Alternate exploration: ${dest.shortDescription}`,
        estimatedCostINR: (dest.avgEntryFeeINR || 30) * Math.max(1, Number(tripInput?.travellersCount || 1))
      }));

      return res.json({
        success: true,
        day: {
          dayNumber: targetDay,
          title: `Refreshed Day ${targetDay}: Alternative Circuit`,
          stops: newStops,
          travelNotes: ['Refreshed itinerary day focusing on alternative regional attractions.']
        }
      });
    }

    const validIds = KARNATAKA_DESTINATIONS.map(d => ({
      id: d.id,
      name: d.name,
      district: d.district,
      region: d.region
    }));

    const prompt = `Regenerate ONLY Day ${targetDay} of this Karnataka itinerary.
Overall Trip: "${currentTrip?.tripTitle}"
Pace: ${tripInput?.travelPace || 'balanced'}
Travellers: ${tripInput?.travellersCount || 2}
Custom instruction from user: "${customPrompt || 'Suggest alternative memorable spots in Karnataka'}"

Valid IDs allowed for destinationId:
${JSON.stringify(validIds)}

Output strictly JSON for Day ${targetDay}:
{
  "dayNumber": ${targetDay},
  "title": "New Day Title",
  "stops": [
    {
      "destinationId": "exact_id_from_list",
      "arrivalTime": "10:00 AM",
      "durationMinutes": 90,
      "reason": "Rationale for stop",
      "estimatedCostINR": 100
    }
  ],
  "travelNotes": ["Helpful transit notes"]
}`;
    const { response, modelUsed } = await generateGeminiContentWithFallback({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.5
      },
      preferredModel: 'gemini-3.8-flash',
      timeoutMs: 20000
    });
    console.log(`Day successfully regenerated with Gemini model: ${modelUsed}`);

    const parsed = JSON.parse(response.text?.trim() || '{}');
    const validStops = (parsed.stops || [])
      .filter((s: any) => getDestinationById(s.destinationId))
      .map((s: any, idx: number) => ({
        id: `stop-${targetDay}-${idx + 1}-${s.destinationId}`,
        destinationId: s.destinationId,
        arrivalTime: s.arrivalTime || '10:00 AM',
        durationMinutes: s.durationMinutes || 90,
        reason: s.reason || 'Explore landmark',
        estimatedCostINR: Number(s.estimatedCostINR) || 0
      }));

    if (validStops.length === 0) {
      throw new Error('No valid stops generated');
    }

    res.json({
      success: true,
      day: {
        dayNumber: targetDay,
        title: parsed.title || `Day ${targetDay} (Alternative)`,
        stops: validStops,
        travelNotes: parsed.travelNotes || ['Transit between points scheduled smoothly.']
      }
    });
  } catch (err: any) {
    console.warn('Gemini regenerate-day temporary error, using verified Karnataka fallback circuit:', err.message);
    const { tripInput, currentTrip, dayNumber } = req.body;
    const targetDay = Number(dayNumber) || 1;
    const currentStopIds = new Set<string>();
    currentTrip?.days?.forEach((d: any) => {
      d.stops?.forEach((s: any) => currentStopIds.add(s.destinationId));
    });

    const candidates = KARNATAKA_DESTINATIONS.filter(d => !currentStopIds.has(d.id));
    const pool = candidates.length >= 3 ? candidates : KARNATAKA_DESTINATIONS;
    const stopsPerDay = tripInput?.travelPace === 'relaxed' ? 2 : tripInput?.travelPace === 'packed' ? 4 : 3;

    const fallbackStops = pool.slice(0, stopsPerDay).map((dest, idx) => ({
      id: `stop-${targetDay}-${idx + 1}-${dest.id}`,
      destinationId: dest.id,
      arrivalTime: idx === 0 ? '09:30 AM' : idx === 1 ? '01:30 PM' : '04:30 PM',
      durationMinutes: dest.recommendedDurationMinutes || 90,
      reason: `Alternative stop: Explore ${dest.name} for its ${dest.categories.join(', ')} experience.`,
      estimatedCostINR: (dest.avgEntryFeeINR || 30) * Math.max(1, Number(tripInput?.travellersCount || 1))
    }));

    res.json({
      success: true,
      day: {
        dayNumber: targetDay,
        title: `Refreshed Day ${targetDay}: Alternative Heritage Circuit`,
        stops: fallbackStops,
        travelNotes: [
          'Alternative route populated with verified Karnataka landmarks.',
          'Check local temple timings and preserve buffer time for road transit.'
        ]
      },
      warning: 'Live AI encountered a temporary demand spike; refreshed using verified Karnataka travel catalog.'
    });
  }
});

// GET: Curated Destinations Catalogue (reads from MongoDB Atlas or in-memory fallback)
app.get('/api/destinations', async (_req, res) => {
  try {
    const db = getDatabase();
    if (db) {
      const docs = await db.collection('destinations').find({}).toArray();
      if (docs && docs.length > 0) {
        return res.json({
          success: true,
          count: docs.length,
          source: 'MongoDB Atlas',
          destinations: docs
        });
      }
    }
    return res.json({
      success: true,
      count: ALL_CURATED_DESTINATIONS.length,
      source: 'Curated Catalogue (In-Memory)',
      destinations: ALL_CURATED_DESTINATIONS
    });
  } catch (err: any) {
    console.warn('[Destinations API] Fallback to in-memory catalogue:', err.message);
    res.json({
      success: true,
      count: ALL_CURATED_DESTINATIONS.length,
      source: 'Curated Catalogue (Fallback)',
      destinations: ALL_CURATED_DESTINATIONS
    });
  }
});

// Serve public static assets (images, icons)
app.use('/images', express.static(path.resolve(__dirname, 'public', 'images')));
app.use(express.static(path.resolve(__dirname, 'public')));

// Serve frontend in development or production
if (process.env.NODE_ENV !== 'production') {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

// Await MongoDB connection attempt during startup before opening HTTP port
await connectToDatabase();

app.listen(PORT, () => {
  console.log(`Namma Yatra server running on http://localhost:${PORT}`);
});
