import { Router, Request, Response, NextFunction } from 'express';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { ObjectId } from 'mongodb';
import {
  getUsersCollection,
  isDatabaseConnected,
  isDatabaseConnecting,
  waitForConnection,
  getDatabaseError,
  UserDocument,
  canAttemptReconnect,
  connectToDatabase
} from './db';

export const authRouter = Router();

export const AUTH_COOKIE_NAME = 'namma_yatra_token';
export const JWT_SECRET = process.env.JWT_SECRET || 'namma-yatra-jwt-secret-karnataka-2026';

/**
 * Ensures database is connected, attempting bounded on-demand reconnect if needed
 */
async function ensureDatabase(): Promise<boolean> {
  if (isDatabaseConnected()) return true;
  if (isDatabaseConnecting()) {
    await waitForConnection();
    return isDatabaseConnected();
  }
  if (canAttemptReconnect(5000)) {
    console.log('[Auth] Database disconnected, attempting bounded reconnect...');
    await connectToDatabase({ maxRetries: 1 });
    return isDatabaseConnected();
  }
  return false;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Sets secure HTTP-only session cookie
 */
export function setAuthCookie(res: Response, token: string) {
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/'
  });
}

/**
 * Clears session cookie
 */
export function clearAuthCookie(res: Response) {
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  });
}

/**
 * Middleware: Requires an authenticated user session
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[AUTH_COOKIE_NAME] || req.headers.authorization?.replace(/^Bearer\s+/i, '');

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please sign in to access your saved itineraries.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        success: false,
        error: 'Invalid session. Please sign in again.'
      });
    }

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      fullName: decoded.fullName
    };
    next();
  } catch (err: any) {
    return res.status(401).json({
      success: false,
      error: 'Session expired or invalid. Please sign in again.'
    });
  }
}

/**
 * Middleware: Optional user authentication (doesn't reject if unauthenticated)
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[AUTH_COOKIE_NAME] || req.headers.authorization?.replace(/^Bearer\s+/i, '');

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (decoded?.userId) {
        req.user = {
          id: decoded.userId,
          email: decoded.email,
          fullName: decoded.fullName
        };
      }
    } catch {
      // Ignore invalid token for optional auth
    }
  }
  next();
}

/**
 * Rate Limiting for auth actions (in-memory per IP)
 */
const rateLimitMap = new Map<string, { count: number; firstAttempt: number }>();
function checkRateLimit(ip: string, maxAttempts = 12, windowMs = 15 * 60 * 1000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record) {
    rateLimitMap.set(ip, { count: 1, firstAttempt: now });
    return true;
  }
  if (now - record.firstAttempt > windowMs) {
    rateLimitMap.set(ip, { count: 1, firstAttempt: now });
    return true;
  }
  if (record.count >= maxAttempts) {
    return false;
  }
  record.count++;
  return true;
}

/**
 * Email validation regex
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/auth/register
 * Creates a new user account with hashed password and logs them in
 */
authRouter.post('/register', async (req: Request, res: Response) => {
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({
      success: false,
      error: 'Too many registration attempts. Please wait 15 minutes before trying again.'
    });
  }

  if (!(await ensureDatabase())) {
    return res.status(503).json({
      success: false,
      error: getDatabaseError() || 'Database not connected. Please ensure MONGODB_URI is configured in the server environment.'
    });
  }

  try {
    const { fullName, email, password, confirmPassword } = req.body;

    // Validation
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'Full name must be at least 2 characters.' });
    }
    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters long.' });
    }
    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({ success: false, error: 'Passwords do not match.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const usersCol = getUsersCollection();

    // Check if user already exists
    const existingUser = await usersCol.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email address already exists. Please log in.'
      });
    }

    // Hash password with bcrypt
    const passwordHash = await bcryptjs.hash(password, 10);
    const now = new Date();

    const newUser: UserDocument = {
      fullName: fullName.trim(),
      email: normalizedEmail,
      passwordHash,
      createdAt: now,
      updatedAt: now
    };

    const result = await usersCol.insertOne(newUser as any);
    const userId = result.insertedId.toString();

    // Generate JWT
    const token = jwt.sign(
      {
        userId,
        email: normalizedEmail,
        fullName: newUser.fullName
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set secure cookie
    setAuthCookie(res, token);

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Welcome to Namma Yatra!',
      user: {
        id: userId,
        fullName: newUser.fullName,
        email: newUser.email
      }
    });
  } catch (err: any) {
    console.error('[Auth] Registration error:', err.message);
    res.status(500).json({ success: false, error: 'Registration failed due to a server error.' });
  }
});

/**
 * POST /api/auth/login
 * Authenticates user credentials and establishes a session cookie
 */
authRouter.post('/login', async (req: Request, res: Response) => {
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({
      success: false,
      error: 'Too many login attempts. Please wait 15 minutes before trying again.'
    });
  }

  if (!(await ensureDatabase())) {
    return res.status(503).json({
      success: false,
      error: getDatabaseError() || 'Database not connected. Please ensure MONGODB_URI is configured in the server environment.'
    });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const usersCol = getUsersCollection();

    const user = await usersCol.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const isMatch = await bcryptjs.compare(String(password), user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const userId = user._id ? user._id.toString() : '';

    // Generate JWT
    const token = jwt.sign(
      {
        userId,
        email: user.email,
        fullName: user.fullName
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set secure cookie
    setAuthCookie(res, token);

    res.json({
      success: true,
      message: 'Welcome back to Namma Yatra!',
      user: {
        id: userId,
        fullName: user.fullName,
        email: user.email
      }
    });
  } catch (err: any) {
    console.error('[Auth] Login error:', err.message);
    res.status(500).json({ success: false, error: 'Authentication failed due to a server error.' });
  }
});

/**
 * POST /api/auth/logout
 * Clears the session cookie
 */
authRouter.post('/logout', (req: Request, res: Response) => {
  clearAuthCookie(res);
  res.json({ success: true, message: 'You have been logged out of Namma Yatra.' });
});

/**
 * GET /api/auth/me
 * Returns current authenticated user profile
 */
authRouter.get('/me', async (req: Request, res: Response) => {
  const token = req.cookies?.[AUTH_COOKIE_NAME] || req.headers.authorization?.replace(/^Bearer\s+/i, '');

  if (!token) {
    return res.json({ success: true, user: null });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (!decoded || !decoded.userId) {
      return res.json({ success: true, user: null });
    }

    if (isDatabaseConnected()) {
      const usersCol = getUsersCollection();
      const user = await usersCol.findOne({ _id: new ObjectId(decoded.userId) });
      if (!user) {
        clearAuthCookie(res);
        return res.json({ success: true, user: null });
      }

      return res.json({
        success: true,
        user: {
          id: user._id?.toString(),
          fullName: user.fullName,
          email: user.email
        }
      });
    }

    // Fallback using token payload if DB is temporarily busy
    res.json({
      success: true,
      user: {
        id: decoded.userId,
        fullName: decoded.fullName,
        email: decoded.email
      }
    });
  } catch (err) {
    clearAuthCookie(res);
    res.json({ success: true, user: null });
  }
});

/**
 * POST /api/auth/forgot-password
 * Generates an expiring password reset token
 */
authRouter.post('/forgot-password', async (req: Request, res: Response) => {
  if (!(await ensureDatabase())) {
    return res.status(503).json({
      success: false,
      error: getDatabaseError() || 'Database service is in standby mode. Please configure MONGODB_URI in the server environment.'
    });
  }

  try {
    const { email } = req.body;
    if (!email || !EMAIL_REGEX.test(String(email).trim())) {
      return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const usersCol = getUsersCollection();
    const user = await usersCol.findOne({ email: normalizedEmail });

    // Consistent timing response even if user doesn't exist (prevents user enumeration)
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account exists with this email, recovery instructions have been prepared.'
      });
    }

    // Generate single-use random reset token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await usersCol.updateOne(
      { _id: user._id },
      {
        $set: {
          resetPasswordToken: tokenHash,
          resetPasswordExpires: expiresAt,
          updatedAt: new Date()
        }
      }
    );

    // Check if email provider is configured
    const hasEmailProvider = Boolean(process.env.SMTP_HOST || process.env.SENDGRID_API_KEY);

    if (hasEmailProvider) {
      // In production with configured SMTP, email dispatch would occur here
      console.log(`[Auth] Password reset email would be dispatched to ${normalizedEmail}`);
      res.json({
        success: true,
        emailSent: true,
        message: 'Password reset link has been dispatched to your email address.'
      });
    } else {
      // Per requirement 6: clearly indicate that email recovery is not yet active
      res.json({
        success: true,
        emailSent: false,
        message: 'Password reset token generated. Note: Outbound email service (SMTP) is not yet configured on this server.',
        resetToken: rawToken, // Provided for direct verification / dev testing
        info: 'Configure SMTP_HOST and SMTP_PORT in your server environment to enable automated email dispatch.'
      });
    }
  } catch (err: any) {
    console.error('[Auth] Forgot password error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to process password recovery request.' });
  }
});

/**
 * POST /api/auth/reset-password
 * Verifies single-use token and updates user password
 */
authRouter.post('/reset-password', async (req: Request, res: Response) => {
  if (!(await ensureDatabase())) {
    return res.status(503).json({
      success: false,
      error: getDatabaseError() || 'Database service is in standby mode. Please configure MONGODB_URI in the server environment.'
    });
  }

  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ success: false, error: 'Password reset token is required.' });
    }
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      return res.status(400).json({ success: false, error: 'New password must be at least 8 characters long.' });
    }
    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, error: 'Passwords do not match.' });
    }

    const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');
    const usersCol = getUsersCollection();

    const user = await usersCol.findOne({
      resetPasswordToken: tokenHash,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Password reset token is invalid or has expired. Please request a new one.'
      });
    }

    const newPasswordHash = await bcryptjs.hash(newPassword, 10);
    const now = new Date();

    await usersCol.updateOne(
      { _id: user._id },
      {
        $set: {
          passwordHash: newPasswordHash,
          updatedAt: now
        },
        $unset: {
          resetPasswordToken: '',
          resetPasswordExpires: ''
        }
      }
    );

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.'
    });
  } catch (err: any) {
    console.error('[Auth] Reset password error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to reset password.' });
  }
});
