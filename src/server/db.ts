import { MongoClient, Db, Collection, ObjectId } from 'mongodb';
import dns from 'dns';
import net from 'net';
import tls from 'tls';
import fs from 'fs';
import path from 'path';
import { KARNATAKA_DESTINATIONS, ALL_CURATED_DESTINATIONS, Destination } from '../data/destinations';

// Ensure Windows environments can reliably resolve MongoDB Atlas SRV records
if (process.platform === 'win32') {
  try {
    dns.setDefaultResultOrder?.('ipv4first');
    const servers = dns.getServers?.() || [];
    if (servers.length === 0 || servers.every(s => s.startsWith('127.'))) {
      dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
    }
  } catch {
    // Ignore DNS config errors
  }
}

// Ensure Bun compatibility with bson startupSnapshot if running under Bun
try {
  const v8 = (process as any).getBuiltinModule?.('v8');
  if (v8?.startupSnapshot?.isBuildingSnapshot) {
    v8.startupSnapshot.isBuildingSnapshot = () => false;
  }
} catch {
  // Ignore in standard Node.js
}

export interface UserDocument {
  _id?: ObjectId;
  fullName: string;
  email: string;
  passwordHash: string;
  resetPasswordToken?: string | null;
  resetPasswordExpires?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TripDocument {
  _id?: ObjectId;
  userId?: ObjectId; // Owner user ID for access isolation
  tripTitle: string;
  overview: string;
  origin: string;
  destinations: string[]; // List of destination IDs included in itinerary
  startDate: string;
  durationDays: number;
  travellersCount: number;
  totalBudgetINR: number;
  budgetStyle: string;
  interests: string[];
  travelPace: string;
  travelMode?: string;
  dietaryPreferences?: string;
  accessibilityNotes?: string;
  days: any[]; // Full itinerary days with stops
  budget: any; // Group budget estimates
  calculatedBudget: any; // Recalculated breakdown
  cautions: string[];
  assumptions: string[];
  userNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DestinationDocument extends Destination {
  _id?: ObjectId;
  syncedAt?: Date;
}

export const DATABASE_NAME = process.env.MONGODB_DB_NAME || 'YatraAI';

let client: MongoClient | null = null;
let db: Db | null = null;
let isConnected = false;
let isConnecting = false;
let lastAttemptTimestamp = 0;
let lastDiagnostics: AtlasDiagnosticsReport | null = null;

export type DbErrorReason =
  | 'missing_env'
  | 'invalid_scheme'
  | 'auth_failed'
  | 'tls_failed'
  | 'dns_failed'
  | 'network_timeout'
  | 'unknown';

export interface DbDiagnosticsSummary {
  driverVersion: string;
  nodeVersion: string;
  dnsSrvSuccess: boolean;
  tcpSuccess: boolean;
  tlsProbeSuccess: boolean;
  outboundIp?: string;
}

export interface DbConnectionState {
  connected: boolean;
  connecting: boolean;
  database: string;
  hasMongoUri: boolean;
  error?: string;
  reason?: DbErrorReason;
  clusterHost?: string;
  lastAttemptAt?: string;
  diagnosticsSummary?: DbDiagnosticsSummary;
}

let lastConnectionState: DbConnectionState = {
  connected: false,
  connecting: false,
  database: DATABASE_NAME,
  hasMongoUri: false,
};

/**
 * Sanitizes a MongoDB connection string to safely log without revealing credentials
 */
export function sanitizeMongoUri(uri?: string): string {
  if (!uri) return '';
  return uri.replace(
    /(mongodb(?:\+srv)?:\/\/[^:]+:)([^@]+)(@.+)/i,
    '$1****$3'
  );
}

/**
 * Reads the installed mongodb package version reliably without throwing
 */
export function getMongoDriverVersion(): string {
  try {
    const pkgPath = path.resolve(process.cwd(), 'node_modules', 'mongodb', 'package.json');
    if (fs.existsSync(pkgPath)) {
      const data = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      return data.version || '7.7.0';
    }
  } catch {
    // fallback
  }
  return '7.7.0';
}

/**
 * Inspects MongoDB URI configuration without exposing passwords or sensitive tokens.
 * Useful for validating user, password encoding, cluster hostname, and scheme.
 */
export function inspectMongoUriConfig(uri?: string): {
  hasUri: boolean;
  scheme?: string;
  hasUser?: boolean;
  username?: string;
  hasPassword?: boolean;
  clusterHost?: string;
  database?: string;
  isPasswordEncoded?: boolean;
} {
  if (!uri) return { hasUri: false };
  try {
    const match = uri.match(/^(mongodb(?:\+srv)?):\/\/([^:]+):([^@]+)@([^/?#]+)(?:\/([^?#]*))?/i);
    if (match) {
      const scheme = match[1];
      const username = match[2];
      const rawPassword = match[3];
      const clusterHost = match[4];
      const database = match[5] || '';
      const hasUnencodedSpecials = /[@:/?#]/.test(decodeURIComponent(rawPassword)) && rawPassword === decodeURIComponent(rawPassword);
      return {
        hasUri: true,
        scheme,
        hasUser: Boolean(username),
        username,
        hasPassword: Boolean(rawPassword),
        clusterHost,
        database: database || undefined,
        isPasswordEncoded: !hasUnencodedSpecials
      };
    }
    return { hasUri: true };
  } catch {
    return { hasUri: true };
  }
}

/**
 * Diagnoses MongoDB connection errors into clear, evidence-based categories.
 * Replaces speculative IP access claims with accurate network/TLS classification.
 */
export function diagnoseMongoError(err: any): { reason: DbErrorReason; message: string; rawError: string; code?: string | number } {
  const msg = err?.message || String(err || '');
  const code = err?.code;

  if (
    msg.includes('bad auth') ||
    msg.includes('AuthenticationFailed') ||
    code === 8000 ||
    msg.toLowerCase().includes('authentication failed')
  ) {
    return {
      reason: 'auth_failed',
      message: 'MongoDB Atlas authentication failed. Please verify your database username and password in MONGODB_URI. Ensure special characters in password are percent-encoded (e.g. %40 for @).',
      rawError: sanitizeMongoUri(msg),
      code
    };
  }

  if (
    msg.includes('SSL routines') ||
    msg.includes('ssl3_read_bytes') ||
    msg.includes('tlsv1 alert') ||
    msg.includes('TLSWrap') ||
    msg.includes('ERR_SSL') ||
    msg.includes('HANDSHAKE_FAILURE') ||
    msg.toLowerCase().includes('certificate') ||
    msg.toLowerCase().includes('tls')
  ) {
    if (msg.includes('tlsv1 alert internal error') || msg.includes('ssl3_read_bytes')) {
      return {
        reason: 'tls_failed',
        message: 'MongoDB Atlas TLS handshake failed (tlsv1 alert internal error: remote peer terminated handshake with alert 80). Possible causes include remote peer access denial for outbound IP or TLS SNI negotiation failure.',
        rawError: sanitizeMongoUri(msg),
        code
      };
    }
    return {
      reason: 'tls_failed',
      message: 'MongoDB Atlas TLS/SSL connection error: ' + sanitizeMongoUri(msg) + '. Standard certificate verification was enforced.',
      rawError: sanitizeMongoUri(msg),
      code
    };
  }

  if (
    msg.includes('ENOTFOUND') ||
    msg.includes('querySrv ENOTFOUND') ||
    msg.includes('queryTxt ENOTFOUND') ||
    msg.includes('EAI_AGAIN')
  ) {
    return {
      reason: 'dns_failed',
      message: 'MongoDB Atlas cluster DNS resolution failed. Check your cluster hostname in MONGODB_URI.',
      rawError: sanitizeMongoUri(msg),
      code
    };
  }

  if (
    msg.includes('Server selection timed out') ||
    msg.includes('MongoServerSelectionError') ||
    msg.includes('timed out') ||
    msg.includes('ETIMEDOUT') ||
    msg.includes('ECONNREFUSED')
  ) {
    return {
      reason: 'network_timeout',
      message: 'MongoDB Atlas connection or server selection timed out. Network route or port 27017 may be unreachable from deployment host.',
      rawError: sanitizeMongoUri(msg),
      code
    };
  }

  if (msg.includes('Invalid scheme') || msg.includes('Scheme must be')) {
    return {
      reason: 'invalid_scheme',
      message: 'Invalid MONGODB_URI scheme. URI must start with mongodb:// or mongodb+srv://.',
      rawError: sanitizeMongoUri(msg),
      code
    };
  }

  return {
    reason: 'unknown',
    message: 'MongoDB connection failed: ' + sanitizeMongoUri(msg),
    rawError: sanitizeMongoUri(msg),
    code
  };
}

export interface AtlasDiagnosticsReport {
  timestamp: string;
  nodeVersion: string;
  driverVersion: string;
  opensslVersion: string;
  platform: string;
  clusterHost: string;
  targetDatabase: string;
  outboundIp?: string;
  dnsSrvSuccess: boolean;
  dnsSrvRecordCount: number;
  dnsSrvNodes: string[];
  dnsSrvError?: string;
  dnsTxtSuccess: boolean;
  dnsTxtRecords?: string[];
  tcpSuccess: boolean;
  tcpLatencyMs?: number;
  tcpTarget?: string;
  tcpError?: string;
  tlsProbeSuccess: boolean;
  tlsProtocol?: string;
  tlsCipher?: string;
  tlsAuthorized?: boolean;
  tlsError?: string;
  mongoErrorCode?: string | number;
  mongoErrorMessage?: string;
  retryAttempt?: number;
}

/**
 * Runs safe, structured network diagnostics for Atlas connectivity.
 * Redacts all credentials and prints formatted diagnostic telemetry to Render server logs.
 */
export async function runAtlasDiagnostics(
  clusterHost: string,
  lastError?: any,
  retryAttempt: number = 0
): Promise<AtlasDiagnosticsReport> {
  const timestamp = new Date().toISOString();
  const nodeVersion = process.version;
  const driverVersion = getMongoDriverVersion();
  const opensslVersion = process.versions.openssl || 'unknown';
  const platform = `${process.platform} (${process.arch})`;

  // 1. Detect active outbound public IP via lightweight echo service (non-blocking)
  let outboundIp: string | undefined;
  try {
    const ipRes = await fetch('https://api.ipify.org?format=json', {
      signal: AbortSignal.timeout(2500)
    });
    if (ipRes.ok) {
      const data = await ipRes.json() as any;
      outboundIp = data?.ip;
    }
  } catch {
    // Non-fatal if offline or blocked
  }

  // 2. DNS SRV and TXT Resolution
  let dnsSrvSuccess = false;
  let dnsSrvNodes: string[] = [];
  let dnsSrvError: string | undefined;
  let dnsTxtSuccess = false;
  let dnsTxtRecords: string[] = [];

  const resolver = new dns.promises.Resolver();
  try {
    const srvRecords = await resolver.resolveSrv(`_mongodb._tcp.${clusterHost}`);
    dnsSrvSuccess = true;
    dnsSrvNodes = srvRecords.map(r => `${r.name}:${r.port}`);
  } catch (srvErr: any) {
    if (process.platform === 'win32') {
      try {
        resolver.setServers(['8.8.8.8', '1.1.1.1']);
        const srvRecords = await resolver.resolveSrv(`_mongodb._tcp.${clusterHost}`);
        dnsSrvSuccess = true;
        dnsSrvNodes = srvRecords.map(r => `${r.name}:${r.port}`);
      } catch (fallbackErr: any) {
        dnsSrvError = fallbackErr.message || String(fallbackErr);
      }
    } else {
      dnsSrvError = srvErr.message || String(srvErr);
    }
  }

  try {
    const txtRecords = await resolver.resolveTxt(clusterHost);
    dnsTxtSuccess = true;
    dnsTxtRecords = txtRecords.map(t => t.join(''));
  } catch {
    // TXT record optional or unavailable
  }

  // 3. TCP Connectivity on port 27017 and TLS Handshake Probe with Standard Verification
  let tcpSuccess = false;
  let tcpLatencyMs: number | undefined;
  let tcpTarget: string | undefined;
  let tcpError: string | undefined;
  let tlsProbeSuccess = false;
  let tlsProtocol: string | undefined;
  let tlsCipher: string | undefined;
  let tlsAuthorized: boolean | undefined;
  let tlsError: string | undefined;

  if (dnsSrvNodes.length > 0) {
    const [firstHost, firstPortStr] = dnsSrvNodes[0].split(':');
    const port = parseInt(firstPortStr, 10) || 27017;
    tcpTarget = `${firstHost}:${port}`;

    const tcpStart = Date.now();
    await new Promise<void>((resolve) => {
      const socket = net.createConnection({ host: firstHost, port, timeout: 3500 });

      socket.on('connect', () => {
        tcpSuccess = true;
        tcpLatencyMs = Date.now() - tcpStart;

        // Perform standard TLS handshake: rejectUnauthorized strictly true
        const tlsSocket = tls.connect({
          socket,
          servername: firstHost,
          rejectUnauthorized: true,
        }, () => {
          tlsProbeSuccess = true;
          tlsProtocol = tlsSocket.getProtocol() || 'unknown';
          const cipher = tlsSocket.getCipher();
          tlsCipher = cipher ? `${cipher.name} (${cipher.version})` : undefined;
          tlsAuthorized = tlsSocket.authorized;
          tlsSocket.end();
          resolve();
        });

        tlsSocket.on('error', (err: any) => {
          tlsError = err.message || String(err);
          socket.destroy();
          resolve();
        });
      });

      socket.on('error', (err: any) => {
        tcpError = err.message || String(err);
        resolve();
      });

      socket.on('timeout', () => {
        tcpError = 'Connection timed out after 3500ms';
        socket.destroy();
        resolve();
      });
    });
  }

  const report: AtlasDiagnosticsReport = {
    timestamp,
    nodeVersion,
    driverVersion,
    opensslVersion,
    platform,
    clusterHost,
    targetDatabase: DATABASE_NAME,
    outboundIp,
    dnsSrvSuccess,
    dnsSrvRecordCount: dnsSrvNodes.length,
    dnsSrvNodes,
    dnsSrvError,
    dnsTxtSuccess,
    dnsTxtRecords,
    tcpSuccess,
    tcpLatencyMs,
    tcpTarget,
    tcpError,
    tlsProbeSuccess,
    tlsProtocol,
    tlsCipher,
    tlsAuthorized,
    tlsError,
    mongoErrorCode: lastError?.code,
    mongoErrorMessage: lastError?.message ? sanitizeMongoUri(lastError.message) : undefined,
    retryAttempt
  };

  // Structured diagnostic output to server logs (zero secrets exposed)
  console.error('========================================================================');
  console.error('[MongoDB Atlas Network Diagnostics - Render Server Report]');
  console.error(`Timestamp:              ${report.timestamp}`);
  console.error(`Node.js Runtime:        ${report.nodeVersion} (OpenSSL: ${report.opensslVersion})`);
  console.error(`MongoDB Driver:         v${report.driverVersion}`);
  console.error(`Target Host:            ${report.clusterHost}`);
  console.error(`Target Database:        ${report.targetDatabase}`);
  console.error(`Detected Outbound IP:   ${report.outboundIp || 'Unavailable / timed out'}`);
  console.error(`DNS SRV Resolution:     ${report.dnsSrvSuccess ? `SUCCESS (${report.dnsSrvRecordCount} nodes resolved)` : `FAILED (${report.dnsSrvError})`}`);
  if (report.dnsSrvNodes.length > 0) {
    report.dnsSrvNodes.forEach((node, idx) => console.error(`  Shard Node [${idx}]:    ${node}`));
  }
  console.error(`DNS TXT Resolution:     ${report.dnsTxtSuccess ? `SUCCESS (${report.dnsTxtRecords?.join(';')})` : 'FAILED / NONE'}`);
  console.error(`TCP Port 27017:         ${report.tcpSuccess ? `SUCCESS (Connected to ${report.tcpTarget} in ${report.tcpLatencyMs}ms)` : `FAILED (${report.tcpError})`}`);
  console.error(`TLS Handshake Probe:    ${report.tlsProbeSuccess ? `SUCCESS (Protocol: ${report.tlsProtocol}, Cipher: ${report.tlsCipher})` : `FAILED (${report.tlsError || 'Not reached'})`}`);
  if (report.mongoErrorMessage) {
    console.error(`Driver Error Message:   ${report.mongoErrorMessage}`);
    if (report.mongoErrorCode !== undefined) {
      console.error(`Driver Error Code:      ${report.mongoErrorCode}`);
    }
  }
  console.error('TLS Verification Mode:  Standard certificate verification strictly enforced.');
  console.error('Security Scrubbing:     Credentials and tokens scrubbed from diagnostic logs.');
  console.error('========================================================================');

  return report;
}

/**
 * Checks whether a background reconnect can be attempted (respecting 30s cooldown)
 */
export function canAttemptReconnect(): boolean {
  if (isConnected || isConnecting) return false;
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri || uri.includes('paste_your_copied_connection_string_here')) return false;
  return Date.now() - lastAttemptTimestamp >= 30000;
}

/**
 * Connects to MongoDB Atlas using a bounded retry strategy without duplicate pool leaks.
 * Enforces standard TLS certificate verification and safe structured diagnostics.
 */
export async function connectToDatabase(options?: {
  maxRetries?: number;
  initialDelayMs?: number;
}): Promise<{ connected: boolean; error?: string }> {
  if (isConnected && db) {
    return { connected: true };
  }

  if (isConnecting) {
    let attempts = 0;
    while (isConnecting && attempts < 40) {
      await new Promise(resolve => setTimeout(resolve, 200));
      attempts++;
    }
    if (isConnected && db) return { connected: true };
  }

  const uri = process.env.MONGODB_URI?.trim();
  const uriConfig = inspectMongoUriConfig(uri);
  const isPlaceholder = !uri ||
    uri === '""' ||
    uri.includes('paste_your_copied_connection_string_here') ||
    uri.includes('YOUR_MONGODB_URI_HERE');

  if (!uri || isPlaceholder) {
    const errorMsg = 'Database not connected. Please ensure MONGODB_URI is configured in the server environment (.env).';
    lastConnectionState = {
      connected: false,
      connecting: false,
      database: DATABASE_NAME,
      hasMongoUri: Boolean(uri && !isPlaceholder),
      reason: 'missing_env',
      error: errorMsg,
      lastAttemptAt: new Date().toISOString()
    };
    console.warn('[MongoDB] MONGODB_URI is not configured in environment. Database routes will operate in standby mode.');
    isConnected = false;
    return { connected: false, error: errorMsg };
  }

  isConnecting = true;
  lastAttemptTimestamp = Date.now();

  const maxRetries = options?.maxRetries ?? 3;
  const initialDelayMs = options?.initialDelayMs ?? 1500;
  let lastErr: any = null;

  // Standard TLS options with standard CA certificate validation for Atlas clusters
  const isSrv = uri.startsWith('mongodb+srv://') || uri.includes('tls=true') || uri.includes('ssl=true');
  const clientOptions: any = {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
    maxPoolSize: 10,
    minPoolSize: 0,
    retryWrites: true,
  };
  if (isSrv) {
    clientOptions.tls = true;
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    // 1. Safely dispose of any prior client instance to prevent duplicate clients/pools
    if (client) {
      try {
        await client.close(true);
      } catch {
        // ignore
      }
      client = null;
      db = null;
    }

    try {
      console.log(`[MongoDB] Connection attempt ${attempt}/${maxRetries} to database: ${DATABASE_NAME} (${sanitizeMongoUri(uri)})...`);
      
      client = new MongoClient(uri, clientOptions);

      try {
        await client.connect();
      } catch (firstErr: any) {
        const errMsg = String(firstErr?.message || '');
        if ((errMsg.includes('querySrv') || errMsg.includes('ENOTFOUND')) && process.platform === 'win32') {
          console.warn('[MongoDB] Windows DNS lookup issue, retrying with public DNS resolvers (8.8.8.8, 1.1.1.1)...');
          try {
            dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
            if (client) {
              await client.close(true).catch(() => {});
            }
            client = new MongoClient(uri, clientOptions);
            await client.connect();
          } catch (dnsErr) {
            throw firstErr;
          }
        } else {
          throw firstErr;
        }
      }

      db = client.db(DATABASE_NAME);

      // Verify real connection with an actual ping command before declaring success
      await db.command({ ping: 1 });

      isConnected = true;
      isConnecting = false;

      lastConnectionState = {
        connected: true,
        connecting: false,
        hasMongoUri: true,
        database: DATABASE_NAME,
        clusterHost: uriConfig.clusterHost,
        lastAttemptAt: new Date().toISOString()
      };

      console.log(`[MongoDB] Successfully connected to database: ${DATABASE_NAME}`);

      // Create indexes for performance and uniqueness
      try {
        const usersCol = db.collection<UserDocument>('users');
        await usersCol.createIndex({ email: 1 }, { unique: true });
        const tripsCol = db.collection<TripDocument>('trips');
        await tripsCol.createIndex({ userId: 1, updatedAt: -1 });
      } catch (err: any) {
        console.warn('[MongoDB] Index creation notice:', err.message);
      }

      // Seed destinations collection if empty
      try {
        await seedDestinationsIfEmpty();
      } catch (err: any) {
        console.warn('[MongoDB] Destination seeding notice:', err.message);
      }

      return { connected: true };
    } catch (err: any) {
      lastErr = err;
      console.warn(`[MongoDB] Connection attempt ${attempt}/${maxRetries} failed: ${err.message || err}`);

      if (client) {
        try {
          await client.close(true);
        } catch {
          // ignore
        }
        client = null;
        db = null;
      }

      if (attempt < maxRetries) {
        const delay = initialDelayMs * attempt;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // All retries failed
  isConnecting = false;
  isConnected = false;
  db = null;
  if (client) {
    try {
      await client.close(true);
    } catch {
      // ignore
    }
    client = null;
  }

  const diagnosis = diagnoseMongoError(lastErr);

  // Run comprehensive network diagnostics and print structured report to Render logs
  if (isSrv || (uriConfig.clusterHost && uriConfig.clusterHost.includes('mongodb.net'))) {
    try {
      lastDiagnostics = await runAtlasDiagnostics(uriConfig.clusterHost || 'nammayatra.ohoklph.mongodb.net', lastErr, maxRetries);
    } catch (diagErr: any) {
      console.error('[MongoDB Diagnostics] Error running probe:', diagErr.message);
    }
  }

  lastConnectionState = {
    connected: false,
    connecting: false,
    hasMongoUri: true,
    database: DATABASE_NAME,
    reason: diagnosis.reason,
    error: diagnosis.message,
    clusterHost: uriConfig.clusterHost,
    lastAttemptAt: new Date().toISOString(),
    diagnosticsSummary: lastDiagnostics ? {
      driverVersion: lastDiagnostics.driverVersion,
      nodeVersion: lastDiagnostics.nodeVersion,
      dnsSrvSuccess: lastDiagnostics.dnsSrvSuccess,
      tcpSuccess: lastDiagnostics.tcpSuccess,
      tlsProbeSuccess: lastDiagnostics.tlsProbeSuccess,
      outboundIp: lastDiagnostics.outboundIp
    } : undefined
  };

  return { connected: false, error: diagnosis.message };
}

/**
 * Returns the connected database instance or null
 */
export function getDatabase(): Db | null {
  return db;
}

/**
 * Checks if the database is currently connected
 */
export function isDatabaseConnected(): boolean {
  return isConnected && db !== null;
}

/**
 * Checks if a connection attempt is currently in progress
 */
export function isDatabaseConnecting(): boolean {
  return isConnecting;
}

/**
 * Waits for an in-progress connection attempt to finish
 */
export async function waitForConnection(timeoutMs: number = 6000): Promise<boolean> {
  if (isConnected && db) return true;
  if (!isConnecting) return isConnected && db !== null;
  const start = Date.now();
  while (isConnecting && Date.now() - start < timeoutMs) {
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  return isConnected && db !== null;
}

/**
 * Retrieves the current connection state for diagnostics
 */
export function getDatabaseState(): DbConnectionState {
  const uri = process.env.MONGODB_URI?.trim();
  const isPlaceholder = !uri ||
    uri === '""' ||
    uri.includes('paste_your_copied_connection_string_here') ||
    uri.includes('YOUR_MONGODB_URI_HERE');

  return {
    ...lastConnectionState,
    connected: isConnected,
    connecting: isConnecting,
    hasMongoUri: Boolean(uri && !isPlaceholder)
  };
}

/**
 * Retrieves the last diagnosed database error message if any
 */
export function getDatabaseError(): string | undefined {
  return lastConnectionState.error;
}

/**
 * Returns the users collection from the database
 */
export function getUsersCollection(): Collection<UserDocument> {
  if (!db) {
    throw new Error('Database not connected. Please ensure MONGODB_URI is configured and the database has started.');
  }
  return db.collection<UserDocument>('users');
}

/**
 * Returns the trips collection from the database
 */
export function getTripsCollection(): Collection<TripDocument> {
  if (!db) {
    throw new Error('Database not connected. Please ensure MONGODB_URI is configured and the database has started.');
  }
  return db.collection<TripDocument>('trips');
}

/**
 * Returns the destinations collection from the database
 */
export function getDestinationsCollection(): Collection<DestinationDocument> {
  if (!db) {
    throw new Error('Database not connected. Please ensure MONGODB_URI is configured and the database has started.');
  }
  return db.collection<DestinationDocument>('destinations');
}

/**
 * Synchronizes and seeds verified Karnataka destinations into Atlas
 */
export async function seedDestinationsIfEmpty(): Promise<{ matched: number; modified: number; inserted: number; total: number }> {
  if (!db) return { matched: 0, modified: 0, inserted: 0, total: 0 };
  try {
    const col = db.collection<DestinationDocument>('destinations');
    await col.createIndex({ id: 1 }, { unique: true });

    const bulkOps = ALL_CURATED_DESTINATIONS.map(d => ({
      updateOne: {
        filter: { id: d.id },
        update: {
          $set: {
            id: d.id,
            name: d.name,
            kannadaName: d.kannadaName,
            district: d.district,
            region: d.region,
            lat: d.lat,
            lng: d.lng,
            categories: d.categories,
            destinationType: d.destinationType || 'attraction',
            cuisine: d.cuisine,
            speciality: d.speciality,
            shortDescription: d.shortDescription,
            historicalSignificance: d.historicalSignificance,
            recommendedDurationMinutes: d.recommendedDurationMinutes,
            avgEntryFeeINR: d.avgEntryFeeINR,
            bestTimeToVisit: d.bestTimeToVisit,
            knownConstraints: d.knownConstraints,
            localSpecialties: d.localSpecialties,
            accentColor: d.accentColor,
            imageUrl: d.imageUrl,
            syncedAt: new Date()
          }
        },
        upsert: true
      }
    }));

    const result = await col.bulkWrite(bulkOps);
    const matched = result.matchedCount || 0;
    const modified = result.modifiedCount || 0;
    const inserted = result.upsertedCount || 0;
    const total = await col.countDocuments();

    console.log(`[MongoDB] Synchronized destinations in Atlas: ${matched} matched, ${modified} updated, ${inserted} inserted (${total} total records in collection).`);
    return { matched, modified, inserted, total };
  } catch (err: any) {
    console.warn('[MongoDB] Error synchronizing destinations in Atlas:', err.message);
    return { matched: 0, modified: 0, inserted: 0, total: 0 };
  }
}

/**
 * Closes the active database connection (useful during graceful shutdown or tests)
 */
export async function closeDatabase(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
    isConnected = false;
    isConnecting = false;
    console.log('[MongoDB] Connection closed.');
  }
}

/**
 * Helper to validate 24-character hexadecimal MongoDB ObjectId
 */
export function isValidObjectId(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  return /^[0-9a-fA-F]{24}$/.test(id) && ObjectId.isValid(id);
}
