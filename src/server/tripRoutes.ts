import { Router, Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import {
  getTripsCollection,
  getDestinationsCollection,
  isDatabaseConnected,
  isDatabaseConnecting,
  waitForConnection,
  getDatabaseState,
  getDatabaseError,
  isValidObjectId,
  DATABASE_NAME,
  canAttemptReconnect,
  connectToDatabase,
  pingDatabase
} from './db';
import { KARNATAKA_DESTINATIONS } from '../data/destinations';
import { requireAuth } from './authRoutes';

export const tripRouter = Router();

/**
 * Middleware: Verify database connectivity before attempting operations with on-demand bounded reconnect
 */
async function requireDatabase(req: Request, res: Response, next: () => void) {
  if (!isDatabaseConnected()) {
    if (isDatabaseConnecting()) {
      await waitForConnection();
    } else if (canAttemptReconnect(5000)) {
      console.log('[requireDatabase] Database not connected, attempting bounded reconnect...');
      await connectToDatabase({ maxRetries: 1 });
    }
    if (!isDatabaseConnected()) {
      return res.status(503).json({
        success: false,
        error: getDatabaseError() || 'Database not connected. Please ensure MONGODB_URI is configured in your server .env file.'
      });
    }
  }
  next();
}

/**
 * Helper to transform MongoDB document to API response (mapping _id to string id)
 */
function formatTripDoc(doc: any) {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return {
    id: _id ? _id.toString() : doc.id,
    _id: _id ? _id.toString() : undefined,
    ...rest,
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt,
    updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : doc.updatedAt,
  };
}

/**
 * GET /api/db/status
 * Returns database connection health without exposing credentials
 */
tripRouter.get('/db/status', async (req: Request, res: Response) => {
  if (isDatabaseConnecting()) {
    await waitForConnection(3000);
  }

  // Allow bounded retry on demand via ?retry=true, ?probe=true, or if disconnected and cooldown passed
  const isExplicitRetry = req.query.retry === 'true';
  const shouldRetry = isExplicitRetry || req.query.probe === 'true' || !isDatabaseConnected();
  if (!isDatabaseConnected() && shouldRetry && canAttemptReconnect(isExplicitRetry ? 0 : 5000)) {
    console.log('[GET /api/db/status] Triggering on-demand connection attempt...');
    await connectToDatabase({ maxRetries: 1 });
  }

  // Active ping check if connected to ensure socket is live
  if (isDatabaseConnected()) {
    await pingDatabase();
  }

  const dbState = getDatabaseState();
  const connected = isDatabaseConnected();

  if (!connected) {
    return res.json({
      success: true,
      connected: false,
      connecting: dbState.connecting,
      hasMongoUri: dbState.hasMongoUri,
      database: dbState.database,
      reason: dbState.reason,
      clusterHost: dbState.clusterHost,
      tripCount: 0,
      destinationCount: 0,
      error: dbState.error,
      message: dbState.error || 'MongoDB Atlas is in standby mode. Configure MONGODB_URI to enable persistent trip storage.',
      diagnostics: dbState.diagnosticsSummary
    });
  }

  try {
    const tripsCol = getTripsCollection();
    const destCol = getDestinationsCollection();
    const [tripCount, destinationCount] = await Promise.all([
      tripsCol.countDocuments(),
      destCol.countDocuments()
    ]);

    res.json({
      success: true,
      connected: true,
      connecting: false,
      hasMongoUri: true,
      database: DATABASE_NAME,
      clusterHost: dbState.clusterHost,
      tripCount,
      destinationCount,
      message: `Connected to MongoDB Atlas (${DATABASE_NAME})`,
      diagnostics: dbState.diagnosticsSummary
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      connected: false,
      error: 'Failed to inspect database status'
    });
  }
});

/**
 * POST /api/trips
 * Saves a new generated trip itinerary into MongoDB Atlas
 */
tripRouter.post('/trips', requireDatabase, requireAuth, async (req: Request, res: Response) => {
  try {
    const body = req.body;

    // Validate required fields
    if (!body || typeof body !== 'object') {
      return res.status(400).json({ success: false, error: 'Request body must be a valid JSON object' });
    }

    const {
      tripTitle,
      overview,
      origin,
      startDate,
      durationDays,
      travellersCount,
      days,
      budget,
      calculatedBudget,
      budgetStyle,
      interests,
      travelPace,
      travelMode,
      dietaryPreferences,
      accessibilityNotes,
      cautions,
      assumptions,
      userNotes
    } = body;

    if (!tripTitle || typeof tripTitle !== 'string' || !tripTitle.trim()) {
      return res.status(400).json({ success: false, error: 'Field "tripTitle" is required' });
    }
    if (!origin || typeof origin !== 'string' || !origin.trim()) {
      return res.status(400).json({ success: false, error: 'Field "origin" is required' });
    }
    if (!days || !Array.isArray(days) || days.length === 0) {
      return res.status(400).json({ success: false, error: 'Field "days" must be a non-empty array of itinerary days' });
    }

    // Extract all unique destination IDs referenced across the itinerary
    const destinationIds = new Set<string>();
    days.forEach((day: any) => {
      if (Array.isArray(day.stops)) {
        day.stops.forEach((stop: any) => {
          if (stop.destinationId && typeof stop.destinationId === 'string') {
            destinationIds.add(stop.destinationId);
          }
        });
      }
    });

    const now = new Date();
    const tripDocument = {
      userId: new ObjectId(req.user!.id),
      tripTitle: tripTitle.trim(),
      overview: overview || `A personalized ${durationDays || days.length}-day journey through Karnataka.`,
      origin: origin.trim(),
      destinations: Array.from(destinationIds),
      startDate: startDate || now.toISOString().split('T')[0],
      durationDays: Number(durationDays) || days.length,
      travellersCount: Math.max(1, Number(travellersCount) || 1),
      totalBudgetINR: Number(body.totalBudgetINR) || calculatedBudget?.totalEstimatedINR || 0,
      budgetStyle: budgetStyle || 'comfortable',
      interests: Array.isArray(interests) ? interests : [],
      travelPace: travelPace || 'balanced',
      travelMode: travelMode || 'private-cab',
      dietaryPreferences: dietaryPreferences || 'No restrictions',
      accessibilityNotes: accessibilityNotes || '',
      days: days.map((day: any, dIdx: number) => ({
        dayNumber: Number(day.dayNumber) || dIdx + 1,
        title: day.title || `Day ${dIdx + 1}`,
        dateStr: day.dateStr,
        stops: Array.isArray(day.stops)
          ? day.stops.map((s: any, sIdx: number) => ({
              id: s.id || `stop-${dIdx + 1}-${sIdx + 1}-${s.destinationId}`,
              destinationId: s.destinationId,
              arrivalTime: s.arrivalTime || '09:30 AM',
              durationMinutes: Number(s.durationMinutes) || 90,
              reason: s.reason || 'Explore key highlight.',
              estimatedCostINR: Number(s.estimatedCostINR) || 0
            }))
          : [],
        travelNotes: Array.isArray(day.travelNotes) ? day.travelNotes : []
      })),
      budget: budget || {},
      calculatedBudget: calculatedBudget || {},
      cautions: Array.isArray(cautions) ? cautions : [],
      assumptions: Array.isArray(assumptions) ? assumptions : [],
      userNotes: userNotes ? String(userNotes).trim() : '',
      createdAt: now,
      updatedAt: now
    };

    const tripsCol = getTripsCollection();
    const result = await tripsCol.insertOne(tripDocument as any);

    const savedTrip = formatTripDoc({
      _id: result.insertedId,
      ...tripDocument
    });

    res.status(201).json({
      success: true,
      message: 'Trip successfully saved to MongoDB Atlas',
      trip: savedTrip
    });
  } catch (err: any) {
    console.error('[API] Error saving trip:', err.message);
    res.status(500).json({ success: false, error: 'Failed to save trip to database' });
  }
});

/**
 * GET /api/trips
 * Retrieves all saved trips, optionally filtered by keyword query
 */
tripRouter.get('/trips', requireDatabase, requireAuth, async (req: Request, res: Response) => {
  try {
    const { search, limit } = req.query;
    const tripsCol = getTripsCollection();

    let query: any = {
      userId: new ObjectId(req.user!.id)
    };
    if (search && typeof search === 'string' && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query = {
        $or: [
          { tripTitle: regex },
          { origin: regex },
          { destinations: regex },
          { overview: regex }
        ]
      };
    }

    const maxLimit = Math.min(Math.max(1, Number(limit) || 50), 100);
    const cursor = tripsCol.find(query).sort({ updatedAt: -1 }).limit(maxLimit);
    const docs = await cursor.toArray();

    const formattedTrips = docs.map(formatTripDoc);

    res.json({
      success: true,
      count: formattedTrips.length,
      trips: formattedTrips
    });
  } catch (err: any) {
    console.error('[API] Error fetching trips:', err.message);
    res.status(500).json({ success: false, error: 'Failed to retrieve trips from database' });
  }
});

/**
 * GET /api/trips/:id
 * Retrieves a single trip by its MongoDB ObjectId
 */
tripRouter.get('/trips/:id', requireDatabase, requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid trip ID format. Must be a 24-character hexadecimal ObjectId.'
      });
    }

    const tripsCol = getTripsCollection();
    const doc = await tripsCol.findOne({
      _id: new ObjectId(id),
      userId: new ObjectId(req.user!.id)
    });

    if (!doc) {
      return res.status(404).json({
        success: false,
        error: `Trip not found with ID: ${id}`
      });
    }

    res.json({
      success: true,
      trip: formatTripDoc(doc)
    });
  } catch (err: any) {
    console.error('[API] Error retrieving trip by id:', err.message);
    res.status(500).json({ success: false, error: 'Failed to retrieve trip' });
  }
});

/**
 * PUT /api/trips/:id
 * Updates an existing trip in MongoDB Atlas
 */
tripRouter.put('/trips/:id', requireDatabase, requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid trip ID format. Must be a 24-character hexadecimal ObjectId.'
      });
    }

    const updates = req.body;
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ success: false, error: 'Update payload must be a JSON object' });
    }

    // Exclude protected fields
    delete updates._id;
    delete updates.id;
    delete updates.userId;
    delete updates.createdAt;

    // If days are updated, re-extract destinations
    if (Array.isArray(updates.days)) {
      const destinationIds = new Set<string>();
      updates.days.forEach((day: any) => {
        if (Array.isArray(day.stops)) {
          day.stops.forEach((stop: any) => {
            if (stop.destinationId && typeof stop.destinationId === 'string') {
              destinationIds.add(stop.destinationId);
            }
          });
        }
      });
      updates.destinations = Array.from(destinationIds);
    }

    updates.updatedAt = new Date();

    const tripsCol = getTripsCollection();
    const result = await tripsCol.findOneAndUpdate(
      {
        _id: new ObjectId(id),
        userId: new ObjectId(req.user!.id)
      },
      { $set: updates },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        error: `Trip not found with ID: ${id}`
      });
    }

    res.json({
      success: true,
      message: 'Trip updated successfully in MongoDB Atlas',
      trip: formatTripDoc(result)
    });
  } catch (err: any) {
    console.error('[API] Error updating trip:', err.message);
    res.status(500).json({ success: false, error: 'Failed to update trip' });
  }
});

/**
 * DELETE /api/trips/:id
 * Deletes a trip from MongoDB Atlas
 */
tripRouter.delete('/trips/:id', requireDatabase, requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid trip ID format. Must be a 24-character hexadecimal ObjectId.'
      });
    }

    const tripsCol = getTripsCollection();
    const result = await tripsCol.deleteOne({
      _id: new ObjectId(id),
      userId: new ObjectId(req.user!.id)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: `Trip not found with ID: ${id}`
      });
    }

    res.json({
      success: true,
      message: 'Trip successfully deleted from MongoDB Atlas',
      id
    });
  } catch (err: any) {
    console.error('[API] Error deleting trip:', err.message);
    res.status(500).json({ success: false, error: 'Failed to delete trip' });
  }
});

/**
 * GET /api/destinations
 * Retrieves all destinations (from Atlas collection if connected, else curated dataset)
 */
tripRouter.get('/destinations', async (_req: Request, res: Response) => {
  try {
    if (isDatabaseConnected()) {
      const destCol = getDestinationsCollection();
      const docs = await destCol.find({}).toArray();
      if (docs.length > 0) {
        return res.json({
          success: true,
          source: 'mongodb',
          count: docs.length,
          destinations: docs.map(({ _id, syncedAt, ...rest }) => rest)
        });
      }
    }

    res.json({
      success: true,
      source: 'static',
      count: KARNATAKA_DESTINATIONS.length,
      destinations: KARNATAKA_DESTINATIONS
    });
  } catch (err: any) {
    res.json({
      success: true,
      source: 'static-fallback',
      count: KARNATAKA_DESTINATIONS.length,
      destinations: KARNATAKA_DESTINATIONS
    });
  }
});
