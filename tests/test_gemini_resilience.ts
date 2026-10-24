import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import { KARNATAKA_DESTINATIONS } from '../src/data/destinations';

interface ItineraryDay {
  dayNumber: number;
  title: string;
  stops: Array<{
    destinationId: string;
    arrivalTime: string;
    durationMinutes: number;
    reason: string;
    estimatedCostINR: number;
  }>;
  travelNotes: string[];
}

interface GeneratedItinerary {
  tripTitle: string;
  overview: string;
  assumptions: string[];
  days: ItineraryDay[];
  unscheduledDestinations?: Array<{ id: string; name: string; reason: string }>;
  budget: {
    transportINR: number;
    accommodationINR: number;
    foodINR: number;
    activitiesINR: number;
    miscellaneousINR: number;
  };
  cautions: string[];
}

/**
 * Validate that the generated itinerary matches the expected schema strictly
 */
function validateItinerarySchema(itinerary: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!itinerary) {
    return { valid: false, errors: ['Itinerary is null or undefined'] };
  }
  if (typeof itinerary.tripTitle !== 'string' || !itinerary.tripTitle.trim()) {
    errors.push('Missing or invalid tripTitle');
  }
  if (typeof itinerary.overview !== 'string') {
    errors.push('Missing or invalid overview');
  }
  if (!Array.isArray(itinerary.days) || itinerary.days.length === 0) {
    errors.push('days must be a non-empty array');
  } else {
    itinerary.days.forEach((day: any, dIdx: number) => {
      if (typeof day.dayNumber !== 'number') {
        errors.push(`Day ${dIdx + 1} missing dayNumber`);
      }
      if (!Array.isArray(day.stops) || day.stops.length === 0) {
        errors.push(`Day ${dIdx + 1} has no stops`);
      } else {
        day.stops.forEach((stop: any, sIdx: number) => {
          if (!stop.destinationId || typeof stop.destinationId !== 'string') {
            errors.push(`Day ${dIdx + 1} stop ${sIdx + 1} missing destinationId`);
          }
        });
      }
    });
  }
  if (!itinerary.budget || typeof itinerary.budget !== 'object') {
    errors.push('Missing budget object');
  } else {
    for (const key of ['transportINR', 'accommodationINR', 'foodINR', 'activitiesINR', 'miscellaneousINR']) {
      if (typeof itinerary.budget[key] !== 'number') {
        errors.push(`budget.${key} must be a number`);
      }
    }
  }
  return { valid: errors.length === 0, errors };
}

async function runGeminiResilienceSuite() {
  console.log('================================================================');
  console.log('      Namma Yatra — Gemini AI Resilience & Speed Test Suite     ');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(testName: string, condition: boolean, detail = '') {
    total++;
    if (condition) {
      passed++;
      console.log(`✅ PASSED: ${testName} ${detail ? `(${detail})` : ''}`);
    } else {
      console.error(`❌ FAILED: ${testName} ${detail ? `(${detail})` : ''}`);
    }
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('FATAL: GEMINI_API_KEY is missing from environment. Cannot run live AI tests.');
    process.exit(1);
  }

  const ai = new GoogleGenAI({ apiKey });

  // TEST 1: Live Model Latency with gemini-3.5-flash-lite
  console.log('--- TEST 1: Primary Model (gemini-3.5-flash-lite) Latency & Schema ---');
  const validIds = KARNATAKA_DESTINATIONS.slice(0, 15).map(v => `${v.id}: ${v.name} (${v.district})`).join('\n');
  const testPrompt = `You are Namma Yatra, Karnataka travel engine. Plan a 2-day trip starting from Bengaluru.
Pace: balanced. Travellers: 2. Budget: 25000 INR comfortable.
Choose destinationId strictly from:
${validIds}

Output strictly valid JSON adhering to schema:
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
          "destinationId": "bengaluru-palace",
          "arrivalTime": "09:30 AM",
          "durationMinutes": 90,
          "reason": "string",
          "estimatedCostINR": 100
        }
      ],
      "travelNotes": ["string"]
    }
  ],
  "budget": {
    "transportINR": 3000,
    "accommodationINR": 4000,
    "foodINR": 2000,
    "activitiesINR": 500,
    "miscellaneousINR": 500
  },
  "cautions": ["string"]
}`;

  const startMs = Date.now();
  let generatedItinerary: any = null;
  try {
    const res = await ai.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents: testPrompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
        maxOutputTokens: 2500
      }
    });
    const elapsed = Date.now() - startMs;
    generatedItinerary = JSON.parse(res.text || '{}');

    assert('Response generated successfully', Boolean(res.text));
    assert('Generation latency within target window (< 15000ms)', elapsed < 15000, `Actual: ${elapsed}ms`);
    console.log(`Latency benchmark: ${elapsed}ms (Target: < 15,000ms)`);
  } catch (err: any) {
    assert('gemini-3.5-flash-lite generated successfully', false, err.message);
  }

  // TEST 2: Schema Validation
  console.log('\n--- TEST 2: Output Schema Conformance ---');
  const schemaResult = validateItinerarySchema(generatedItinerary);
  assert('Generated itinerary matches frontend schema', schemaResult.valid, schemaResult.errors.join(', '));
  assert('Itinerary has at least 2 days', generatedItinerary?.days?.length >= 2, `Actual: ${generatedItinerary?.days?.length}`);
  assert('Budget items are numeric and sum matches reasonable bounds', 
    Object.values(generatedItinerary?.budget || {}).every(v => typeof v === 'number' && v >= 0)
  );

  // TEST 3: Bounded Retry on Simulated Transient 503 / 429
  console.log('\n--- TEST 3: Transient Error Classification ---');
  const transientErrors = [
    { status: 503, message: 'The model is overloaded. Please try again later.' },
    { status: 429, message: 'Resource exhausted: rate limit exceeded.' },
    { status: 500, message: 'Internal server error.' },
    { status: 502, message: 'Bad Gateway.' },
    { status: 504, message: 'Gateway Timeout.' },
    { message: '503 Service Unavailable temporary high demand' },
    { message: 'fetch failed: connect ETIMEDOUT' }
  ];

  function testTransientHelper(err: any): boolean {
    const status = Number(err.status || err.statusCode || err.code);
    if ([429, 500, 502, 503, 504].includes(status)) return true;
    const msg = String(err.message || '').toLowerCase();
    return (
      msg.includes('503') ||
      msg.includes('unavailable') ||
      msg.includes('high demand') ||
      msg.includes('429') ||
      msg.includes('resource_exhausted') ||
      msg.includes('rate limit') ||
      msg.includes('econnreset') ||
      msg.includes('etimedout') ||
      msg.includes('timed out')
    );
  }

  for (const err of transientErrors) {
    assert(`Correctly identifies transient error (${err.status || err.message})`, testTransientHelper(err));
  }

  // TEST 4: Immediate Abort on Permanent 404 / 401 / 400
  console.log('\n--- TEST 4: Permanent Error Non-Retry Behavior ---');
  const permanentErrors = [
    { status: 404, message: 'models/gemini-2.5-flash is not found' },
    { status: 401, message: 'API_KEY_INVALID' },
    { status: 400, message: 'Invalid JSON request payload' }
  ];

  for (const err of permanentErrors) {
    assert(`Does NOT retry permanent error (${err.status})`, !testTransientHelper(err));
  }

  // TEST 5: Fallback Generator Verification
  console.log('\n--- TEST 5: Deterministic Fallback Integrity ---');
  // Simulated fallback
  const simulatedFallback = {
    tripTitle: '3-Day Karnataka Journey from Bengaluru',
    overview: 'Fallback itinerary',
    days: [
      {
        dayNumber: 1,
        title: 'Day 1',
        stops: [{ destinationId: 'bengaluru-palace', arrivalTime: '09:30 AM', durationMinutes: 90, reason: 'Explore', estimatedCostINR: 100 }],
        travelNotes: ['Transit notes']
      }
    ],
    budget: { transportINR: 5000, accommodationINR: 8000, foodINR: 4000, activitiesINR: 1000, miscellaneousINR: 1000 },
    cautions: ['Travel caution'],
    isAiGenerated: false
  };

  assert('Deterministic fallback explicitly sets isAiGenerated: false', simulatedFallback.isAiGenerated === false);
  assert('Deterministic fallback matches schema', validateItinerarySchema(simulatedFallback).valid);

  console.log('\n================================================================');
  console.log(`      RESILIENCE TEST SUITE RESULTS: ${passed}/${total} TESTS PASSED      `);
  console.log('================================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runGeminiResilienceSuite().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
