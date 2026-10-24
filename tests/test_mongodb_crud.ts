import dotenv from 'dotenv';
dotenv.config();
import { MongoMemoryServer } from 'mongodb-memory-server';
import express from 'express';
import cookieParser from 'cookie-parser';
import {
  connectToDatabase,
  getDatabase,
  getTripsCollection,
  getUsersCollection,
  getDestinationsCollection,
  closeDatabase,
  DATABASE_NAME
} from '../src/server/db';
import { tripRouter } from '../src/server/tripRoutes';
import { authRouter } from '../src/server/authRoutes';
import { KARNATAKA_DESTINATIONS, ALL_CURATED_DESTINATIONS } from '../src/data/destinations';

async function runTests() {
  console.log('================================================================');
  console.log('   Namma Yatra — MongoDB Atlas & Auth Integration Test Suite   ');
  console.log('================================================================\n');

  // 1. Setup in-memory MongoDB server to simulate MongoDB Atlas
  console.log('[Test 1] Starting In-Memory MongoDB Server...');
  const mongod = await MongoMemoryServer.create({
    instance: { dbName: DATABASE_NAME }
  });
  const mongoUri = mongod.getUri();
  process.env.MONGODB_URI = mongoUri;
  process.env.JWT_SECRET = 'namma_yatra_super_secret_test_jwt_key_2026';
  console.log(`[Test 1 PASSED] Simulated MongoDB Atlas running at: ${mongoUri}`);

  // 2. Connect to database
  console.log('\n[Test 2] Connecting via src/server/db module...');
  const connResult = await connectToDatabase();
  if (!connResult.connected) {
    throw new Error(`Failed to connect to database: ${connResult.error}`);
  }
  const db = getDatabase();
  if (!db || db.databaseName !== 'YatraAI') {
    throw new Error(`Expected database name "YatraAI", got "${db?.databaseName}"`);
  }
  console.log(`[Test 2 PASSED] Connected to database: ${db.databaseName}`);

  // 3. Verify Destination Seeding
  console.log('\n[Test 3] Verifying destinations collection seeding...');
  const destCol = getDestinationsCollection();
  const destCount = await destCol.countDocuments();
  console.log(`Destinations count in database: ${destCount}`);
  if (destCount !== ALL_CURATED_DESTINATIONS.length) {
    throw new Error(`Expected ${ALL_CURATED_DESTINATIONS.length} destinations, got ${destCount}`);
  }
  console.log(`[Test 3 PASSED] ${destCount} verified Karnataka destinations & culinary experiences confirmed in database`);

  // 4. Create an Express test app with cookieParser, authRouter, and tripRouter
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/auth', authRouter);
  app.use('/api', tripRouter);

  const server = app.listen(0);
  const address = server.address() as any;
  const baseUrl = `http://localhost:${address.port}`;
  console.log(`\nTest HTTP server mounted at ${baseUrl}`);

  let user1Cookie = '';
  let user2Cookie = '';
  let createdTripId = '';

  try {
    // 5. Test POST /api/auth/register (User 1: Arjun Gowda)
    console.log('\n[Test 4] Testing User 1 Registration (POST /api/auth/register)...');
    const user1Payload = {
      fullName: 'Arjun Gowda',
      email: 'arjun.gowda@nammayatra.karnataka',
      password: 'Karnataka#Password2026',
      confirmPassword: 'Karnataka#Password2026'
    };

    const reg1Res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user1Payload)
    });

    if (reg1Res.status !== 201) {
      const err = await reg1Res.text();
      throw new Error(`Expected HTTP 201 Created, got ${reg1Res.status}: ${err}`);
    }

    const reg1Data = await reg1Res.json();
    if (!reg1Data.success || !reg1Data.user?.id || reg1Data.user.email !== user1Payload.email.toLowerCase()) {
      throw new Error(`Invalid register response: ${JSON.stringify(reg1Data)}`);
    }

    const rawCookie1 = reg1Res.headers.get('set-cookie');
    if (!rawCookie1 || !rawCookie1.includes('namma_yatra_token=')) {
      throw new Error('Registration did not set namma_yatra_token session cookie');
    }
    user1Cookie = rawCookie1.split(';')[0];
    console.log(`[Test 4 PASSED] User 1 registered with ID ${reg1Data.user.id} and received HTTP-only JWT cookie`);

    // 6. Test duplicate registration prevention
    console.log('\n[Test 5] Testing Duplicate Registration Prevention (Unique Email Index)...');
    const dupRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user1Payload)
    });
    if (dupRes.status !== 409) {
      throw new Error(`Expected HTTP 409 Conflict for duplicate email, got ${dupRes.status}`);
    }
    console.log('[Test 5 PASSED] Duplicate registration correctly rejected with 409 Conflict');

    // 7. Test User 2 Registration (Priya Rao)
    console.log('\n[Test 6] Testing User 2 Registration (Priya Rao)...');
    const user2Payload = {
      fullName: 'Priya Rao',
      email: 'priya.rao@nammayatra.karnataka',
      password: 'Karnataka#Password2026',
      confirmPassword: 'Karnataka#Password2026'
    };

    const reg2Res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user2Payload)
    });

    if (reg2Res.status !== 201) {
      throw new Error(`Expected HTTP 201 for User 2, got ${reg2Res.status}`);
    }
    const rawCookie2 = reg2Res.headers.get('set-cookie');
    if (!rawCookie2) throw new Error('User 2 did not receive session cookie');
    user2Cookie = rawCookie2.split(';')[0];
    console.log('[Test 6 PASSED] User 2 registered successfully with independent session cookie');

    // 8. Test GET /api/auth/me (User session inspection)
    console.log('\n[Test 7] Testing GET /api/auth/me session verification...');
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Cookie: user1Cookie }
    });
    if (meRes.status !== 200) {
      throw new Error(`Expected HTTP 200 from /api/auth/me, got ${meRes.status}`);
    }
    const meData = await meRes.json();
    if (!meData.success || meData.user.fullName !== 'Arjun Gowda') {
      throw new Error(`Expected session for Arjun Gowda, got: ${JSON.stringify(meData)}`);
    }
    console.log(`[Test 7 PASSED] Session verified for "${meData.user.fullName}" (${meData.user.email})`);

    // 9. Test unauthenticated trip access rejection
    console.log('\n[Test 8] Testing Unauthenticated Trip API Rejection...');
    const unauthPost = await fetch(`${baseUrl}/api/trips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tripTitle: 'Unauthenticated Trip' })
    });
    if (unauthPost.status !== 401) {
      throw new Error(`Expected HTTP 401 for unauthenticated POST, got ${unauthPost.status}`);
    }

    const unauthGet = await fetch(`${baseUrl}/api/trips`);
    if (unauthGet.status !== 401) {
      throw new Error(`Expected HTTP 401 for unauthenticated GET, got ${unauthGet.status}`);
    }
    console.log('[Test 8 PASSED] Unauthenticated access properly rejected with 401 Unauthorized');

    // 10. User 1 saves a trip (POST /api/trips)
    console.log('\n[Test 9] Testing User 1 Trip Creation (POST /api/trips)...');
    const newTripPayload = {
      tripTitle: 'Hampi & Heritage Architectural Wonder',
      overview: 'A majestic 3-day exploration of Vijayanagara ruins and Tungabhadra riverbanks.',
      origin: 'Bengaluru',
      startDate: '2026-11-15',
      durationDays: 3,
      travellersCount: 2,
      totalBudgetINR: 28000,
      budgetStyle: 'comfortable',
      interests: ['Heritage', 'Architecture'],
      travelPace: 'balanced',
      days: [
        {
          dayNumber: 1,
          title: 'Arrival in Hospet & Virupaksha Temple',
          stops: [
            {
              id: 'stop-1-1-virupaksha-temple-hampi',
              destinationId: 'virupaksha-temple-hampi',
              arrivalTime: '10:00 AM',
              durationMinutes: 90,
              reason: 'Historic sanctum exploration',
              estimatedCostINR: 50
            }
          ],
          travelNotes: ['Start early to beat the midday sun on granite terrain.']
        },
        {
          dayNumber: 2,
          title: 'Royal Enclosure & Stone Chariot',
          stops: [
            {
              id: 'stop-2-1-vijaya-vittala-temple-hampi',
              destinationId: 'vijaya-vittala-temple-hampi',
              arrivalTime: '09:00 AM',
              durationMinutes: 120,
              reason: 'Musical pillars and stone chariot iconography',
              estimatedCostINR: 80
            }
          ],
          travelNotes: ['Golf buggies available from parking to main temple complex.']
        }
      ],
      budget: {
        transportINR: 8000,
        accommodationINR: 10000,
        foodINR: 5000,
        activitiesINR: 1000,
        miscellaneousINR: 2000
      },
      calculatedBudget: {
        totalEstimatedINR: 26000,
        costPerPersonINR: 13000,
        targetBudgetINR: 28000,
        differenceINR: 2000,
        isOverrun: false
      },
      userNotes: 'Remember to pack breathable cotton clothes and socks for temple stone walks.'
    };

    const postRes = await fetch(`${baseUrl}/api/trips`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: user1Cookie
      },
      body: JSON.stringify(newTripPayload)
    });

    if (postRes.status !== 201) {
      const errText = await postRes.text();
      throw new Error(`Expected HTTP 201 Created, got ${postRes.status}: ${errText}`);
    }

    const postData = await postRes.json();
    if (!postData.success || !postData.trip?.id) {
      throw new Error(`Invalid response body: ${JSON.stringify(postData)}`);
    }
    createdTripId = postData.trip.id;
    console.log(`[Test 9 PASSED] User 1 Trip created with MongoDB ObjectId: ${createdTripId}`);

    // 11. User 1 retrieves trips (GET /api/trips)
    console.log('\n[Test 10] Testing User 1 List Trips (GET /api/trips)...');
    const getRes = await fetch(`${baseUrl}/api/trips`, {
      headers: { Cookie: user1Cookie }
    });
    const getData = await getRes.json();
    if (!getData.success || getData.count !== 1 || getData.trips[0].id !== createdTripId) {
      throw new Error(`User 1 expected 1 trip, got ${getData.count}`);
    }
    console.log(`[Test 10 PASSED] User 1 successfully retrieved their saved trip: "${getData.trips[0].tripTitle}"`);

    // 12. Cross-User Isolation: User 2 cannot see or access User 1's trips
    console.log('\n[Test 11] Testing Strict Per-User Trip Isolation (User 2 attempting User 1 access)...');
    // User 2 lists trips -> should be empty
    const user2ListRes = await fetch(`${baseUrl}/api/trips`, {
      headers: { Cookie: user2Cookie }
    });
    const user2ListData = await user2ListRes.json();
    if (!user2ListData.success || user2ListData.trips.length !== 0 || user2ListData.count !== 0) {
      throw new Error(`User 2 saw User 1 trips! Count was ${user2ListData.count}`);
    }
    console.log('- User 2 trip list is strictly isolated (0 trips visible)');

    // User 2 tries to GET User 1's trip by ID -> must return 404
    const user2GetRes = await fetch(`${baseUrl}/api/trips/${createdTripId}`, {
      headers: { Cookie: user2Cookie }
    });
    if (user2GetRes.status !== 404) {
      throw new Error(`User 2 was able to retrieve User 1 trip! HTTP status: ${user2GetRes.status}`);
    }
    console.log('- User 2 cannot access User 1 trip by ID (HTTP 404 Not Found returned)');

    // User 2 tries to UPDATE User 1's trip -> must return 404
    const user2PutRes = await fetch(`${baseUrl}/api/trips/${createdTripId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: user2Cookie },
      body: JSON.stringify({ tripTitle: 'Hacked Title' })
    });
    if (user2PutRes.status !== 404) {
      throw new Error(`User 2 was able to modify User 1 trip! HTTP status: ${user2PutRes.status}`);
    }
    console.log('- User 2 cannot update User 1 trip (HTTP 404 Not Found returned)');

    // User 2 tries to DELETE User 1's trip -> must return 404
    const user2DelRes = await fetch(`${baseUrl}/api/trips/${createdTripId}`, {
      method: 'DELETE',
      headers: { Cookie: user2Cookie }
    });
    if (user2DelRes.status !== 404) {
      throw new Error(`User 2 was able to delete User 1 trip! HTTP status: ${user2DelRes.status}`);
    }
    console.log('- User 2 cannot delete User 1 trip (HTTP 404 Not Found returned)');
    console.log('[Test 11 PASSED] Cross-user trip isolation verified across GET, LIST, PUT, and DELETE operations!');

    // 13. User 1 updates their trip (PUT /api/trips/:id)
    console.log('\n[Test 12] Testing User 1 Updating Their Own Trip (PUT /api/trips/:id)...');
    const updatePayload = {
      tripTitle: 'Hampi & Tungabhadra Heritage Explorer (Updated)',
      userNotes: 'Added evening coracle ride recommendation.'
    };
    const putRes = await fetch(`${baseUrl}/api/trips/${createdTripId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: user1Cookie
      },
      body: JSON.stringify(updatePayload)
    });
    if (putRes.status !== 200) {
      throw new Error(`Expected HTTP 200 OK, got ${putRes.status}`);
    }
    const putData = await putRes.json();
    if (!putData.success || putData.trip.tripTitle !== updatePayload.tripTitle) {
      throw new Error(`Title was not updated: ${putData.trip?.tripTitle}`);
    }
    console.log(`[Test 12 PASSED] Trip title updated to: "${putData.trip.tripTitle}"`);

    // 14. Password Recovery Flow
    console.log('\n[Test 13] Testing Password Recovery Flow (Forgot & Reset)...');
    const forgotRes = await fetch(`${baseUrl}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'arjun.gowda@nammayatra.karnataka' })
    });
    if (forgotRes.status !== 200) {
      throw new Error(`Expected HTTP 200 from forgot-password, got ${forgotRes.status}`);
    }
    const forgotData = await forgotRes.json();
    if (!forgotData.success || !forgotData.resetToken) {
      throw new Error(`forgot-password response did not include resetToken: ${JSON.stringify(forgotData)}`);
    }
    const resetToken = forgotData.resetToken;

    // Reset password with token
    const resetRes = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: resetToken,
        newPassword: 'BrandNewKarnatakaPassword#2026',
        confirmPassword: 'BrandNewKarnatakaPassword#2026'
      })
    });
    if (resetRes.status !== 200) {
      const err = await resetRes.text();
      throw new Error(`Expected HTTP 200 from reset-password, got ${resetRes.status}: ${err}`);
    }

    // Verify old password no longer works
    const oldLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'arjun.gowda@nammayatra.karnataka',
        password: 'Karnataka#Password2026'
      })
    });
    if (oldLoginRes.status !== 401) {
      throw new Error('Old password still worked after reset!');
    }

    // Verify new password logs in successfully
    const newLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'arjun.gowda@nammayatra.karnataka',
        password: 'BrandNewKarnatakaPassword#2026'
      })
    });
    if (newLoginRes.status !== 200) {
      throw new Error('New password failed to log in');
    }
    const rawUpdatedCookie = newLoginRes.headers.get('set-cookie');
    if (rawUpdatedCookie) {
      user1Cookie = rawUpdatedCookie.split(';')[0];
    }
    console.log('[Test 13 PASSED] Password reset completed and validated with updated credentials');

    // 15. User 1 deletes their trip
    console.log('\n[Test 14] Testing User 1 Deleting Their Trip (DELETE /api/trips/:id)...');
    const delRes = await fetch(`${baseUrl}/api/trips/${createdTripId}`, {
      method: 'DELETE',
      headers: { Cookie: user1Cookie }
    });
    if (delRes.status !== 200) {
      throw new Error(`Expected HTTP 200, got ${delRes.status}`);
    }
    const verifyGet = await fetch(`${baseUrl}/api/trips/${createdTripId}`, {
      headers: { Cookie: user1Cookie }
    });
    if (verifyGet.status !== 404) {
      throw new Error(`Trip still exists after deletion! HTTP ${verifyGet.status}`);
    }
    console.log('[Test 14 PASSED] Trip deleted successfully and verified removed');

    // 16. Logout test (POST /api/auth/logout)
    console.log('\n[Test 15] Testing User Logout (POST /api/auth/logout)...');
    const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: { Cookie: user1Cookie }
    });
    if (logoutRes.status !== 200) {
      throw new Error(`Expected HTTP 200 from logout, got ${logoutRes.status}`);
    }
    const logoutCookie = logoutRes.headers.get('set-cookie');
    if (!logoutCookie || !logoutCookie.includes('namma_yatra_token=;')) {
      throw new Error('Logout did not clear namma_yatra_token cookie');
    }
    console.log('[Test 15 PASSED] Logout cleared session cookie properly');

    // 17. Database status endpoint test
    console.log('\n[Test 16] Testing GET /api/db/status...');
    const statusRes = await fetch(`${baseUrl}/api/db/status`);
    const statusData = await statusRes.json();
    if (!statusData.success || !statusData.connected || statusData.database !== 'YatraAI') {
      throw new Error(`Invalid status response: ${JSON.stringify(statusData)}`);
    }
    console.log(`[Test 16 PASSED] Database reports connected: ${statusData.connected}, database: ${statusData.database}`);

    console.log('\n================================================================');
    console.log('   ALL 16 NAMMA YATRA MONGODB & AUTH INTEGRATION TESTS PASSED! ');
    console.log('================================================================\n');
  } finally {
    server.close();
    await closeDatabase();
    await mongod.stop();
  }
}

runTests().catch((err) => {
  console.error('\nTEST SUITE FAILED:', err);
  process.exit(1);
});
