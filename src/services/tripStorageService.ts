import { SavedTrip, TripItinerary } from '../types/itinerary';

export interface DatabaseStatus {
  connected: boolean;
  connecting?: boolean;
  hasMongoUri?: boolean;
  database?: string;
  clusterHost?: string;
  reason?: string;
  error?: string;
  tripCount?: number;
  destinationCount?: number;
  message?: string;
}

/**
 * Checks MongoDB Atlas connection status
 */
export async function fetchDatabaseStatus(retry?: boolean): Promise<DatabaseStatus> {
  try {
    const url = retry ? '/api/db/status?retry=true' : '/api/db/status';
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) {
      return { connected: false, message: `HTTP ${res.status}` };
    }
    const data = await res.json();
    return {
      connected: Boolean(data.connected),
      connecting: Boolean(data.connecting),
      hasMongoUri: Boolean(data.hasMongoUri),
      database: data.database,
      clusterHost: data.clusterHost,
      reason: data.reason,
      error: data.error,
      tripCount: data.tripCount,
      destinationCount: data.destinationCount,
      message: data.message
    };
  } catch (err: any) {
    return { connected: false, message: err.message };
  }
}

/**
 * Retrieves all saved trips for the authenticated user from MongoDB Atlas
 */
export async function getSavedTrips(search?: string): Promise<{ success: boolean; trips: SavedTrip[]; count: number; error?: string; unauthenticated?: boolean }> {
  try {
    const url = search ? `/api/trips?search=${encodeURIComponent(search)}` : '/api/trips';
    const res = await fetch(url, { credentials: 'include' });
    const data = await res.json();

    if (res.status === 401) {
      return {
        success: false,
        trips: [],
        count: 0,
        unauthenticated: true,
        error: data.error || 'Please sign in to view your saved trips'
      };
    }

    if (!res.ok || !data.success) {
      return {
        success: false,
        trips: [],
        count: 0,
        error: data.error || `HTTP ${res.status}: Failed to fetch trips`
      };
    }

    return {
      success: true,
      trips: data.trips || [],
      count: data.count || (data.trips ? data.trips.length : 0)
    };
  } catch (err: any) {
    return {
      success: false,
      trips: [],
      count: 0,
      error: err.message || 'Network error connecting to database service'
    };
  }
}

/**
 * Retrieves a single trip by ID from MongoDB Atlas
 */
export async function getSavedTripById(id: string): Promise<{ success: boolean; trip?: SavedTrip; error?: string }> {
  try {
    const res = await fetch(`/api/trips/${encodeURIComponent(id)}`, { credentials: 'include' });
    const data = await res.json();

    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || `HTTP ${res.status}: Failed to load trip`
      };
    }

    return {
      success: true,
      trip: data.trip
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network error loading trip'
    };
  }
}

/**
 * Saves a new trip to MongoDB Atlas for the authenticated user
 */
export async function saveTripToDatabase(trip: Partial<SavedTrip> | TripItinerary): Promise<{ success: boolean; trip?: SavedTrip; error?: string; unauthenticated?: boolean }> {
  try {
    const res = await fetch('/api/trips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(trip)
    });

    const data = await res.json();
    if (res.status === 401) {
      return {
        success: false,
        unauthenticated: true,
        error: data.error || 'Please sign in to save your trip to MongoDB Atlas'
      };
    }

    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || `HTTP ${res.status}: Failed to save trip`
      };
    }

    return {
      success: true,
      trip: data.trip
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network error saving trip to database'
    };
  }
}

/**
 * Updates an existing trip in MongoDB Atlas
 */
export async function updateTripInDatabase(id: string, updates: Partial<SavedTrip>): Promise<{ success: boolean; trip?: SavedTrip; error?: string }> {
  try {
    const res = await fetch(`/api/trips/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updates)
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || `HTTP ${res.status}: Failed to update trip`
      };
    }

    return {
      success: true,
      trip: data.trip
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network error updating trip'
    };
  }
}

/**
 * Deletes a trip from MongoDB Atlas
 */
export async function deleteTripFromDatabase(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/trips/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || `HTTP ${res.status}: Failed to delete trip`
      };
    }

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network error deleting trip'
    };
  }
}
