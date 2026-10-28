# Namma Yatra — Your Karnataka. Your Journey.
### Editorial AI Travel Planner & Circuit Intelligence for Karnataka

🌐 **Live Production Application:** [https://namma-yathra-platform.onrender.com/](https://namma-yathra-platform.onrender.com/)   

---

## 1. Executive Summary & Problem Statement

Karnataka is one of India's most geographically and culturally diverse states—boasting UNESCO World Heritage monuments (Hampi, Pattadakal, Hoysala temples of Belur & Halebidu), Western Ghats biodiversity hotspots (Coorg, Chikkamagaluru, Kudremukh, Agumbe), 320km of Arabian Sea coastline (Gokarna, Udupi, Murudeshwar), royal heritage capitals (Mysuru, Srirangapatna), and world-famous culinary traditions (Mysore Masala Dosa, Udupi Brahmin meals, Mangalurean Neer Dosa, Dharwad Peda, and North Karnataka Jolada Rotti).

However, planning a trip across Karnataka presents major challenges:
- **Hallucinated or impossible itineraries:** Generic LLMs often suggest driving 600km between Hampi and Coorg in a single afternoon.
- **Invented pricing & live quotes:** Generic travel tools invent fake hotel rates and non-existent entry fees.
- **Monolithic re-generation:** Changing one stop or one day usually requires re-generating the entire trip from scratch.
- **Fixed origins:** Most tools rigidly assume trips begin in Bengaluru.
- **No private, synchronized storage:** Travellers lose their custom itineraries when switching devices or clearing browser cache.

**Namma Yatra** solves this with an intelligent full-stack architecture combining **Google Gemini Flash** with a **curated 39-node Karnataka destination knowledge base** (32 heritage/scenic landmarks + 7 regional culinary heritage circuits), interactive OpenStreetMap maps, **deterministic client-side budget arithmetic**, and **secure MongoDB Atlas cloud persistence** with per-user authentication.

---

## 2. Key Features

- **Brand Identity & Kannada Heritage:** Refined editorial design grounded in warm ivory (`#F7F4EC`), deep forest-green (`#173D2E`), terracotta accents (`#B9684B`), gold highlights (`#D8A735`), and authentic typography.
- **Nearby Places & Geolocation Discovery Engine:** Instant browser GPS geolocation detection, radius slider (10–150 km), category filters (Heritage, Nature, Food, Temples, Beaches, Wildlife), and a "Selected Places" journey builder tray to handpick destinations before generating an itinerary.
- **Secure Authentication & Cloud Synchronization:** User registration, password hashing (`bcryptjs`), and HTTP-only session cookies (`jsonwebtoken`) guaranteeing per-user trip privacy.
- **Public Exploration & Gated Saving:** Guests can freely explore the Karnataka Atlas and generate AI itineraries; saving to cloud or managing saved journeys is gated by authentication with seamless auto-save after sign in.
- **Multi-Origin Flexibility:** Support for travellers originating from Bengaluru, Mysuru, Hubballi-Dharwad, Mangaluru, Belagavi, Kalaburagi, Shivamogga, or custom border hubs.
- **Verified Destination Knowledge Base:** 39 verified destinations (32 scenic & cultural monuments + 7 regional culinary heritage circuits) with exact GPS coordinates (ASI and Karnataka Tourism certified), visit durations, ticket fees, local specialties, and planning constraints.
- **Interactive OpenStreetMap Integration:** Visual Leaflet map centered on active daily itinerary stops, custom numbered pins, coordinate centering, radius filtering, and full-screen view.
- **Single-Day Regeneration:** Refresh or alter Day 2 or Day 3 without discarding the rest of your trip.
- **Deterministic Budget Arithmetic:** Separation of AI generation from financial arithmetic; automatic re-calculation upon changing group sizes, room counts, or stop adjustments.
- **Interactive Stop Reordering & Deletion:** Move stops earlier/later or remove them with real-time budget updates.
- **Live Weather & Karnataka Climate Intelligence:** Integrated destination-level weather forecasts using Open-Meteo for exact GPS coordinates, complete with seasonal climate advisories, temperature ranges, humidity, and practical regional packing recommendations.
- **Export & Print Suite:** One-click print-ready PDF styling, Markdown export, and local offline browser persistence.

---

## 3. Technology Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Motion, Lucide React
- **Mapping:** Leaflet & OpenStreetMap (with zero paid API dependencies)
- **Database & Persistence:** MongoDB Atlas (official Node.js driver), In-Memory Mongo for testing
- **Authentication:** `bcryptjs` for salted password hashing (rounds: 10), `jsonwebtoken` for signed 7-day HTTP-only cookies, `cookie-parser`
- **AI & Server:** Node.js, Express, `@google/genai` SDK (`gemini-3.5-flash-lite` primary with resilient fallback chain and exponential backoff retry)
- **Full-Stack Runtime:** tsx server with embedded Vite middlewares
- **Data Validation:** Strict JSON response schemas, destination coordinate verification, rate limiting, and cross-user isolation

---

## 4. Architecture Diagram

```
+---------------------------------------------------------------------------------+
|                         CLIENT (React 19 / TypeScript)                          |
|                                                                                 |
|   +--------------------+     +----------------------+     +------------------+  |
|   | NearbyExplorer     | --> | SelectedPlacesPanel  | --> | TripPlannerForm  |  |
|   | (GPS/Radius Search)|     | (Custom Staging Tray)|     | (Pace/Origin)    |  |
|   +--------------------+     +----------------------+     +------------------+  |
|             |                                                       |           |
|             v                                                       v           |
|   +--------------------+     +----------------------+     +------------------+  |
|   | InteractiveMap     | <-- | ItineraryWorkspace   | <-- | (POST /api/plan) |  |
|   | (OpenStreetMap)    |     | (Stops, Days, Weather|     +------------------+  |
|   +--------------------+     +----------------------+                           |
|             ^                          |                     +---------------+  |
|             |                          v                     | AuthModal     |  |
|   +--------------------+     +----------------------+        | (Bcrypt/JWT)  |  |
|   | BudgetBreakdown    |     | ExportModal          |        +---------------+  |
|   | (Deterministic)    |     | (Print / Markdown)   |        | SavedTrips    |  |
|   +--------------------+     +----------------------+        +---------------+  |
+-------------|--------------------------|-----------------------------|----------+
              | (POST /api/plan-trip)    | (Cookie Auth)               |
              v                          v                             |
+----------------------------------------------------------------------|----------+
|                     EXPRESS SERVER (server.ts / Node.js)             |          |
|                                                                      |          |
|   +-----------------------+      +------------------------+          |          |
|   | /api/auth             |      | /api/trips             |          |          |
|   | Register, Login, Me,  |      | requireAuth Middleware |          |          |
|   | Forgot/Reset Password |      | Isolated by req.user.id|          |          |
|   +-----------------------+      +------------------------+          |          |
|               |                               |                      |          |
|               v                               v                      |          |
|   +-------------------------------------------------------+          |          |
|   | MongoDB Atlas (Database: YatraAI)                     |          |          |
|   | Collections: `users`, `trips`, `destinations`         |          |          |
|   +-------------------------------------------------------+          |          |
|                                |                                                |
|                                v                                                |
|   +-------------------------------------------------------+                     |
|   | Gemini Flash AI Proxy & Curated Karnataka Database    |---------------------+
|   | (39 ASI, KSTDC & GI-Tagged Certified Destinations)    |                     |
|   +-------------------------------------------------------+                     |
+---------------------------------------------------------------------------------+
```

---

## 5. Curated Karnataka Regions & Culinary Circuits

### Scenic, Cultural & Heritage Landmarks (32 Sites)
1. **Bengaluru & South:** Bengaluru Palace, Lalbagh Glass House, Tipu Sultan's Summer Palace
2. **Mysuru & Cauvery Belt:** Mysuru Palace (Amba Vilas), Srirangapatna Fortress, Chamundi Hill, Somanathapura Keshava Temple
3. **Central & Hoysala Heritage:** Belur Chennakeshava Temple, Halebidu Hoysaleswara Temple, Shravanabelagola Gommateshwara
4. **Northern UNESCO Heritage:** Hampi Vijaya Vittala & Stone Chariot, Virupaksha Temple, Matanga Hill, Badami Cave Temples, Pattadakal, Aihole, Gol Gumbaz Vijayapura, Bidar Fort
5. **Western Ghats & Coffee Country:** Raja's Seat & Madikeri Fort, Abbey Falls, Talacauvery, Dubare Elephant Camp, Mullayanagiri Peak, Baba Budangiri, Kudremukh National Park, Agumbe Rainforest
6. **Coastal Karavali:** Gokarna Om Beach, Murudeshwar Shiva Temple, Udupi Sri Krishna Matha, St. Mary's Basalt Island, Dandeli Wildlife & River Kali Rafting

### Iconic Regional Culinary Heritage Circuits (7 Experiences)
1. **Mysuru Masala Dosa & Mysore Pak Heritage:** Iconic wood-fired red garlic chutney crispy dosas and melt-in-mouth ghee Mysore Pak from royal heritage sweetmakers.
2. **Udupi Satvik Vegetarian Culinary Experience:** Authentic temple cuisine served on plantain leaves with rasam, sambar, and jackfruit payasa.
3. **Mangaluru Coastal Seafood & Tuluva Heritage:** Neer dosa paired with Kundapura chicken curry and freshest coastal seafood.
4. **Dharwad Peda & Mishrikoti Heritage Sweets:** GI-tagged caramelized Dharwad peda made from condensed Dharwadi buffalo milk.
5. **North Karnataka Jolada Rotti Oota:** Warm sorghum flatbreads served with stuffed brinjal (enne gai), shenga chutney, and fresh curd.
6. **Kodava (Coorg) Highland Cuisine:** Akki rotti, steamed kadambuttu rice dumplings, and wild hill spices from the Western Ghats.
7. **Bengaluru Darshini & Filter Coffee Culture:** Fluffy thatte idlis, golden vadas, and frothed chicory filter kaapi in brass davarahs.

---

## 6. Installation & Local Development

### Prerequisites
- Node.js 20+ (Node 22 recommended)
- npm 10+

### Setup
```bash
# 1. Clone repository
git clone https://github.com/your-username/namma-yatra-karnataka.git
cd namma-yatra-karnataka

# 2. Install dependencies
npm install

# 3. Configure Environment Variables
cp .env.example .env
# Edit .env and supply your configuration:
# GEMINI_API_KEY="your-google-ai-studio-gemini-key"
# MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority"
# JWT_SECRET="your_strong_jwt_secret"
# PORT=3000

# 4. Run Automated QA & Test Suites
npm run test:qa    # 386 frontend, mapping & data tests
npm run test:db    # 16 MongoDB Atlas & Auth integration tests
npm run test:ai    # 17 Gemini AI resilience and latency benchmark tests

# 5. Type Check
npm run lint

# 6. Start Development Server
npm run dev
# Server starts on http://localhost:3000 with Vite HMR
```

### Production Build
```bash
npm run build
npm start
```

---

## 7. MongoDB Atlas & Authentication Architecture

Namma Yatra connects to **MongoDB Atlas** using the official MongoDB Node.js driver to persist per-user itineraries, secure user accounts, and destination records.

### Database Architecture
- **Database Name:** `YatraAI` (configurable via `MONGODB_DB_NAME`)
- **Connection Module:** Located at `src/server/db.ts`. Connects once during server startup and features graceful standby mode if `MONGODB_URI` is not yet configured.
- **Security & Privacy:** Passwords hashed with `bcryptjs` (salt rounds: 10). Authentication sessions managed via HTTP-only, secure, `SameSite=Lax` cookies (`namma_yatra_token`). User IDs are extracted strictly from verified server-side JWT session cookies—client cannot forge `userId`.

### Collections & Schemas
1. **`users` Collection**:
   - `_id`: MongoDB ObjectId
   - `email`: Normalized unique lowercase email (indexed uniquely)
   - `passwordHash`: Bcrypt salted password hash
   - `fullName`: Display name
   - `createdAt` / `updatedAt`: ISO Timestamps
   - `resetPasswordToken`: SHA-256 hashed single-use recovery token
   - `resetPasswordExpires`: Expiration date for password reset token

2. **`trips` Collection**:
   - `_id`: MongoDB ObjectId
   - `userId`: ObjectId linking the itinerary to the authenticated user (indexed with `updatedAt`)
   - `tripTitle`: Title of the journey (e.g. "Hampi & Tungabhadra Heritage Explorer")
   - `overview`: Curator's narrative summary
   - `origin`: Starting city (e.g. Bengaluru, Mangaluru, Hubballi)
   - `destinations`: Array of destination IDs included in the itinerary
   - `startDate`: Departure date
   - `durationDays`: Total trip days
   - `travellersCount`: Group size
   - `totalBudgetINR`: Target budget in INR
   - `budgetStyle`: `'economical'` | `'comfortable'` | `'premium'`
   - `interests`: Tagged travel interests
   - `travelPace`: `'relaxed'` | `'balanced'` | `'packed'`
   - `days`: Array of daily itineraries, arrival times, durations, and verified stops
   - `budget`: Group expense breakdown (transport, lodging, food, misc)
   - `calculatedBudget`: Deterministic budget analysis and room calculations
   - `userNotes`: Editable personal travel notes
   - `createdAt` / `updatedAt`: ISO Timestamps

3. **`destinations` Collection**:
   - 39 verified Karnataka destinations & culinary circuits with exact GPS coordinates, entry fees, and descriptions.
   - Automatically seeded and updated on startup.

### REST API Endpoints

#### Authentication Routes (`/api/auth`)
| Method | Route | Description | Auth Required | Status Codes |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | Creates a new user account & sets HTTP-only cookie | No | `201 Created`, `400 Bad Request`, `409 Conflict`, `429 Rate Limit` |
| `POST` | `/api/auth/login` | Authenticates user & issues session cookie | No | `200 OK`, `400 Bad Request`, `401 Unauthorized`, `429 Rate Limit` |
| `POST` | `/api/auth/logout` | Clears `namma_yatra_token` session cookie | Yes | `200 OK` |
| `GET` | `/api/auth/me` | Returns current user profile (or null) | No | `200 OK` |
| `POST` | `/api/auth/forgot-password` | Generates expiring password recovery token | No | `200 OK`, `400 Bad Request`, `429 Rate Limit` |
| `POST` | `/api/auth/reset-password` | Resets password using single-use token | No | `200 OK`, `400 Bad Request` |

#### Trip Management Routes (`/api/trips`)
| Method | Route | Description | Auth Required | Status Codes |
|---|---|---|---|---|
| `POST` | `/api/trips` | Saves new trip under authenticated user | Yes | `201 Created`, `400 Bad Request`, `401 Unauthorized`, `503 Standby` |
| `GET` | `/api/trips` | Retrieves current user's trips (`?search=...`) | Yes | `200 OK`, `401 Unauthorized`, `503 Standby` |
| `GET` | `/api/trips/:id` | Retrieves user's specific trip by ObjectId | Yes | `200 OK`, `401 Unauthorized`, `404 Not Found` |
| `PUT` | `/api/trips/:id` | Updates user's trip title, notes, or stops | Yes | `200 OK`, `401 Unauthorized`, `404 Not Found` |
| `DELETE` | `/api/trips/:id` | Deletes user's trip from Atlas | Yes | `200 OK`, `401 Unauthorized`, `404 Not Found` |

#### System & Catalog Routes
| Method | Route | Description | Auth Required | Status Codes |
|---|---|---|---|---|
| `GET` | `/api/db/status` | Connection health, database name, and stats | No | `200 OK` (credential-free) |
| `GET` | `/api/destinations` | Synced Karnataka destination records (39 records) | No | `200 OK` |
| `POST` | `/api/plan-trip` | Generates full AI itinerary using Gemini Flash | No (Guest allowed) | `200 OK`, `400 Bad Request` |
| `POST` | `/api/regenerate-day` | Refreshes single day itinerary | No (Guest allowed) | `200 OK`, `400 Bad Request` |

---

## 8. Verification & Testing

The application, authentication layer, AI engine, and database integration are thoroughly tested with three dedicated automated suites:

1. **QA Verification Suite (`npm run test:qa`)**:
   - **386 Automated Tests** validating all 39 destination schemas, authentic image links, CC/Wikimedia attribution metadata, category filtering, live GPS reverse-geocoding, stop hydration, and interactive map behaviors.
2. **MongoDB Atlas & Auth Suite (`npm run test:db`)**:
   - **16 Integration Tests** running against an isolated in-memory MongoDB Atlas environment:
     - Reusable connection lifecycle and database verification (`YatraAI`).
     - Automatic destination synchronization (39 records).
     - User registration, duplicate email rejection (`409 Conflict`), and HTTP-only JWT cookies.
     - Strict per-user data isolation across `GET`, `LIST`, `PUT`, and `DELETE`.
     - Password recovery and token invalidation lifecycle.
     - Credential sanitization (zero secrets or password hashes in API responses).
3. **Gemini AI Resilience Suite (`npm run test:ai`)**:
   - **17 Resilience Tests** benchmarking:
     - `gemini-3.5-flash-lite` latency and structured JSON output.
     - Strict JSON itinerary schema compliance.
     - Transient HTTP error classification (429, 500, 502, 503, 504, connection timeouts) with retry capability.
     - Permanent client error non-retry compliance (400, 401, 404).
     - Deterministic offline fallback engine integrity.
4. **Type Check (`npm run lint`)**:
   - Strict TypeScript compilation (`tsc --noEmit`).

---

## 9. Render Production Deployment Guide

**Live Deployment URL:** [https://namma-yathra-platform.onrender.com/](https://namma-yathra-platform.onrender.com/)

### Deploying to Render Web Services

Namma Yatra is pre-configured with a Render Blueprint [`render.yaml`](render.yaml) for automated zero-downtime deployment.

#### Manual Service Configuration in Render Dashboard:
If configuring the Web Service manually via dashboard instead of the Blueprint:
1. **Environment:** Node
2. **Node Version:** `22.x` (or `20.x` minimum)
3. **Build Command:** `npm install && npm run build` (or `npm run render-build`)
4. **Start Command:** `npm start`
5. **Environment Variables:**
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority`
   - `MONGODB_DB_NAME`: `YatraAI`
   - `JWT_SECRET`: A secure random secret string for session cookies
   - `GEMINI_API_KEY`: Your Google Gemini API key

### Troubleshooting Common Deployment Errors

#### 1. Missing Frontend Build (`ENOENT: stat '.../dist/index.html'`)
- **Root Cause:** Render's default build command is `npm install`, which does not compile the Vite frontend bundle.
- **Permanent Fix:** Set Render's **Build Command** to `npm install && npm run build`. The server includes a fail-fast startup check that immediately logs clear instructions if the production build is missing.

#### 2. MongoDB Atlas TLS Error (`SSL routines:ssl3_read_bytes:tlsv1 alert internal error`)
- **Root Cause:** MongoDB Atlas rejects incoming TLS handshakes if the client IP is not on the Atlas IP Access List. Because Render's cloud servers use dynamic outbound IPs, connections will fail unless Atlas permits them.
- **Permanent Fix:**
  1. Open [MongoDB Atlas Dashboard](https://cloud.mongodb.com).
  2. In the left navigation, click **Network Access** (under **Security**).
  3. Click **Add IP Address**.
  4. Click **Allow Access from Anywhere** (`0.0.0.0/0`) and click **Confirm**.
  5. Wait 1–2 minutes for the rule to apply.
  6. When connected, `/api/db/status` will report `connected: true`.

---

## 10. License

Apache-2.0 License. Monument data and coordinates verified against ASI & KSTDC archives.
