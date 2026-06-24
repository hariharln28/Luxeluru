import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { db } from './db.js';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

// Initialize Supabase Client on Backend for JWT validation
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabaseConfigured = supabaseUrl && supabaseAnonKey &&
  !supabaseUrl.includes('placeholder') && !supabaseUrl.includes('your-project');

if (!supabaseConfigured) {
  console.warn('[Luxeluru Backend] SUPABASE_URL / SUPABASE_ANON_KEY are not set.');
  console.warn('Copy server/.env.example to server/.env and fill in your Supabase credentials.');
  console.warn('JWT authentication will be bypassed until configured.');
}

const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder'
);

// ─── Salon Login Security ─────────────────────────
const RATE_LIMIT_MAX = 5;           // max attempts per window
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const LOCKOUT_MAX = 5;              // max failed per account
const LOCKOUT_DURATION = 30 * 60 * 1000;  // 30 minutes

// Maps: IP → { count, firstAttempt }
const ipAttempts = new Map();
// Maps: email → { count, lockedUntil }
const accountAttempts = new Map();

// Cleanup stale entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of ipAttempts) {
    if (now - data.firstAttempt > RATE_LIMIT_WINDOW) ipAttempts.delete(ip);
  }
  for (const [email, data] of accountAttempts) {
    if (data.lockedUntil && now > data.lockedUntil) accountAttempts.delete(email);
    else if (!data.lockedUntil && now - data.firstAttempt > RATE_LIMIT_WINDOW) accountAttempts.delete(email);
  }
}, 10 * 60 * 1000);

const authenticateJWT = async (req, res, next) => {
  // If Supabase is not configured, allow all requests in development mode only
  if (!supabaseConfigured) {
    if (process.env.NODE_ENV !== 'production') {
      req.user = { id: req.headers['x-user-id'] || 'dev-user', email: 'dev@localhost' };
      return next();
    }
    return res.status(503).json({ success: false, message: 'Authentication service not configured' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Missing authentication token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ success: false, message: 'Invalid or expired auth session' });
    }

    // Auto-sync Supabase user into database
    const localUser = await db.getUser(user.id);
    if (!localUser) {
      console.log(`Auto-syncing authenticated user to database: ${user.email}`);
      await db.createUser({
        id: user.id,
        name: user.user_metadata.name || user.email.split('@')[0],
        email: user.email,
        phone: user.user_metadata.phone || '',
        createdAt: new Date().toISOString(),
        preferredLanguage: 'en'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('JWT Verification Error:', err);
    return res.status(401).json({ success: false, message: 'JWT verification failed' });
  }
};

// CORS: open for all origins in production (frontend served from same Render domain),
// restricted to localhost in development
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (same-origin, curl, Postman, mobile apps)
    if (!origin) return callback(null, true);
    // In production on Render: frontend and backend share the same domain,
    // so all same-origin API calls have no Origin header — always allow them.
    // Explicitly allow any origin in production to support all networks/WiFis.
    if (process.env.NODE_ENV === 'production') return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS policy: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id'],
}));

// Handle pre-flight OPTIONS requests quickly across all routes
app.options('*', cors());

// Increase JSON body size limit to handle base64 image uploads (up to 25MB)
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Add keep-alive and connection resilience headers to every response
app.use((_req, res, next) => {
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Keep-Alive', 'timeout=30, max=100');
  next();
});

// Global 30-second request timeout — prevent hanging connections on slow networks
app.use((req, res, next) => {
  res.setTimeout(30000, () => {
    if (!res.headersSent) {
      res.status(503).json({ success: false, message: 'Request timed out. Please try again.' });
    }
  });
  next();
});

// Log incoming API requests to the console in real-time
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`[${req.method}] ${req.originalUrl} - ${res.statusCode} (${Date.now() - start}ms)`);
  });
  next();
});

// SHA-256 Password Hashing Helper
function hashPassword(password) {
  if (!password) return '';
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Seed endpoint
app.post('/api/seed', async (req, res) => {
  try {
    const { salons, users, bookings, reviews } = req.body;
    await db.seed({ salons, users, bookings, reviews });
    res.json({ success: true, message: 'Seeding completed successfully' });
  } catch (err) {
    console.error('Seeding error:', err);
    res.status(500).json({ success: false, message: 'Seeding failed' });
  }
});

// GET endpoints
app.get('/api/users', async (req, res) => {
  try {
    const users = await db.getUsers();
    // Strip passwords from response
    const safeUsers = users.map(({ password, ...u }) => u);
    res.json(safeUsers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/salons', async (req, res) => {
  try {
    const salons = await db.getSalons();
    // Strip password AND tradeLicenseUrl (can be huge base64 data — causes localStorage overflow on mobile)
    const safeSalons = salons.map(({ password, tradeLicenseUrl, ...s }) => s);
    res.json(safeSalons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin-only: get all salons WITH tradeLicenseUrl (admin needs it for KYC review)
app.get('/api/admin/salons', async (req, res) => {
  try {
    const salons = await db.getSalons();
    const safeSalons = salons.map(({ password, ...s }) => s);
    res.json(safeSalons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin-only: fetch a single salon's trade license URL on demand
app.get('/api/admin/salons/:id/trade-license', async (req, res) => {
  try {
    const salon = await db.getSalon(req.params.id);
    if (!salon) return res.status(404).json({ error: 'Salon not found' });
    res.json({ tradeLicenseUrl: salon.tradeLicenseUrl || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public: Check onboarding status by business email — MUST be before /api/salons/:id
app.get('/api/salons/status', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'email query parameter is required' });
    const salon = await db.getSalonByEmail(email);
    if (!salon) return res.status(404).json({ error: 'No salon application found with that email address.' });
    // Only expose safe fields — never expose password or sensitive payout data
    const { password, tradeLicenseUrl, bankDetails, upiDetails, panCardOwner, panCardBusiness, ...safe } = salon;
    res.json(safe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/salons/:id', async (req, res) => {
  try {
    const salon = await db.getSalon(req.params.id);
    if (!salon) return res.status(404).json({ error: 'Salon not found' });
    const { password, ...safeSalon } = salon;
    res.json(safeSalon);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public: fetch rejection-appeal messages for a salon (no auth needed — used on status check page)
app.get('/api/salons/:id/status-messages', async (req, res) => {
  try {
    const msgs = await db.getMessages(req.params.id);
    const appealMsgs = msgs.filter(m => m.context === 'rejection-appeal');
    res.json(appealMsgs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public: rejected salon sends appeal message to admin (no auth — identified by salonId + email)
app.post('/api/salons/:id/rejection-appeal', async (req, res) => {
  try {
    const { email, encryptedContent } = req.body;
    if (!email || !encryptedContent) {
      return res.status(400).json({ error: 'email and encryptedContent are required' });
    }
    // Verify the email matches this salon
    const salon = await db.getSalon(req.params.id);
    if (!salon) return res.status(404).json({ error: 'Salon not found' });
    if (salon.email.toLowerCase().trim() !== email.toLowerCase().trim()) {
      return res.status(403).json({ error: 'Email does not match salon record' });
    }
    const message = {
      id: `appeal-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      salonId: req.params.id,
      sender: 'salon',
      encryptedContent,
      context: 'rejection-appeal',
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    await db.createMessage(message);
    // Notify admin
    await db.createNotification({
      id: `notif-appeal-${message.id}`,
      target: 'admin',
      type: 'appeal',
      message: `📩 ${salon.name} has sent an appeal message regarding their rejected application.`,
      createdAt: new Date().toISOString(),
      read: false,
    });
    res.json({ success: true, message });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/bookings', async (req, res) => {
  try {
    const bookings = await db.getBookings();
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/bookings/:id', async (req, res) => {
  try {
    const booking = await db.getBooking(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/reviews', async (req, res) => {
  try {
    const reviews = await db.getReviews();
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Auth endpoints
app.post('/api/users/register', async (req, res) => {
  try {
  const userData = req.body;
  
  if (!userData.id) return res.status(400).json({ success: false, message: 'User ID is required' });
  if (!userData.email) return res.status(400).json({ success: false, message: 'Email is required' });

  const existing = await db.getUser(userData.id);
  if (existing) return res.json({ success: true, user: existing });

  const newUser = {
    id: userData.id,
    name: userData.name || userData.email.split('@')[0],
    email: userData.email,
    phone: userData.phone || '',
    password: hashPassword(crypto.randomBytes(16).toString('hex')),
    createdAt: new Date().toISOString(),
    preferredLanguage: userData.preferredLanguage || 'en'
  };

  await db.createUser(newUser);
  res.json({ success: true, user: newUser });
  } catch (err) {
    console.error('User register error:', err);
    res.status(500).json({ success: false, message: err.message || 'Registration failed' });
  }
});

// Backend user login — fallback for users without Supabase accounts (e.g. test user)
app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password are required.' });

    const users = await db.getUsers();
    const found = users.find(u =>
      u.email.toLowerCase().trim() === email.toLowerCase().trim() &&
      u.password &&
      (u.password === password || u.password === hashPassword(password))
    );

    if (!found) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const { password: _pw, ...safeUser } = found;
    res.json({ success: true, user: safeUser });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/users/:id/update', authenticateJWT, async (req, res) => {
  try {
  const { id } = req.params;
  const { updates } = req.body;
  
  if (req.user.id !== id) return res.status(403).json({ success: false, message: 'Unauthorized profile update' });
  
  const user = await db.getUser(id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  const updated = await db.updateUser(id, updates);
  res.json({ success: true, user: updated });
  } catch (err) {
    console.error('User update error:', err);
    res.status(500).json({ success: false, message: err.message || 'Profile update failed' });
  }
});

app.post('/api/salons/login', async (req, res) => {
  const { name, id, email, password } = req.body;
  const clientIp = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const emailKey = (email || '').toLowerCase().trim();
  const now = Date.now();

  // ─── 1. IP Rate Limiting ───────────────────────
  const ipData = ipAttempts.get(clientIp);
  if (ipData) {
    if (now - ipData.firstAttempt > RATE_LIMIT_WINDOW) {
      ipAttempts.delete(clientIp); // window expired, reset
    } else if (ipData.count >= RATE_LIMIT_MAX) {
      const retryAfterMs = RATE_LIMIT_WINDOW - (now - ipData.firstAttempt);
      const retryMin = Math.ceil(retryAfterMs / 60000);
      console.warn(`[SECURITY] Rate limit hit for IP: ${clientIp}`);
      return res.status(429).json({
        success: false,
        message: `Too many login attempts. Please try again in ${retryMin} minute${retryMin > 1 ? 's' : ''}.`
      });
    }
  }

  // ─── 2. Account Lockout Check ──────────────────
  const acctData = accountAttempts.get(emailKey);
  if (acctData && acctData.lockedUntil) {
    if (now < acctData.lockedUntil) {
      const retryMin = Math.ceil((acctData.lockedUntil - now) / 60000);
      return res.status(423).json({
        success: false,
        message: `Account locked due to too many failed attempts. Try again in ${retryMin} minute${retryMin > 1 ? 's' : ''}.`
      });
    } else {
      accountAttempts.delete(emailKey); // lockout expired
    }
  }

  // ─── 3. Credential Validation ──────────────────
  // Match by ID + email only (name is NOT required for authentication)
  const salons = await db.getSalons();
  const byIdEmail = salons.find(s =>
    s.id.toLowerCase().trim() === id.toLowerCase().trim() &&
    s.email.toLowerCase().trim() === emailKey
  );

  if (!byIdEmail) {
    const currentIp = ipAttempts.get(clientIp);
    if (currentIp) { currentIp.count++; } else { ipAttempts.set(clientIp, { count: 1, firstAttempt: now }); }
    const currentAcct = accountAttempts.get(emailKey);
    if (currentAcct) { currentAcct.count++; if (currentAcct.count >= LOCKOUT_MAX) { currentAcct.lockedUntil = now + LOCKOUT_DURATION; } } else { accountAttempts.set(emailKey, { count: 1, firstAttempt: now, lockedUntil: null }); }
    const ai = accountAttempts.get(emailKey);
    const rem = Math.max(0, LOCKOUT_MAX - (ai?.count || 0));
    return res.status(401).json({ success: false, message: 'No salon found with this Salon ID and email. Check your credentials or re-register if data was lost.', attemptsRemaining: rem });
  }

  if (byIdEmail.registrationStatus !== 'approved') {
    return res.status(403).json({ success: false, message: 'Your salon is pending admin approval. You will be notified once approved.' });
  }

  if (!byIdEmail.password) {
    return res.status(403).json({ success: false, message: 'Salon approved but no password set. Go to Partner with Us → Check Onboarding Status → Set Your Password.' });
  }

  const passwordMatches = byIdEmail.password === password || byIdEmail.password === hashPassword(password);
  if (!passwordMatches) {
    console.warn(`[SECURITY] Failed salon login | IP: ${clientIp} | Email: ${emailKey}`);
    const currentIp = ipAttempts.get(clientIp);
    if (currentIp) { currentIp.count++; } else { ipAttempts.set(clientIp, { count: 1, firstAttempt: now }); }
    const currentAcct = accountAttempts.get(emailKey);
    if (currentAcct) { currentAcct.count++; if (currentAcct.count >= LOCKOUT_MAX) { currentAcct.lockedUntil = now + LOCKOUT_DURATION; } } else { accountAttempts.set(emailKey, { count: 1, firstAttempt: now, lockedUntil: null }); }
    const ai2 = accountAttempts.get(emailKey);
    const rem2 = Math.max(0, LOCKOUT_MAX - (ai2?.count || 0));
    return res.status(401).json({ success: false, message: 'Incorrect password.', attemptsRemaining: rem2 });
  }

  // SUCCESS
  ipAttempts.delete(clientIp);
  accountAttempts.delete(emailKey);
  const { password: _pw, ...safeSalon } = byIdEmail;
  return res.json({ success: true, salon: safeSalon });
});

// ─── Set Salon Password ───────────────────────
app.post('/api/salons/set-password', async (req, res) => {
  const { email, salonId, newPassword } = req.body;

  if (!email || !salonId || !newPassword) {
    return res.status(400).json({ success: false, message: 'Email, Salon ID, and new password are required.' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
  }

  const salon = await db.getSalon(salonId);
  if (!salon) {
    return res.status(404).json({ success: false, message: 'Salon not found.' });
  }

  if (salon.email.toLowerCase().trim() !== email.toLowerCase().trim()) {
    return res.status(403).json({ success: false, message: 'Email does not match this Salon ID.' });
  }

  if (salon.registrationStatus !== 'approved') {
    return res.status(403).json({ success: false, message: 'Salon is not approved yet.' });
  }

  await db.updateSalon(salonId, { password: hashPassword(newPassword) });
  res.json({ success: true, message: 'Password updated successfully.' });
});

app.post('/api/salons/register', async (req, res) => {
  const data = req.body;
  
  // Input validation
  if (!data.name || !data.address || !data.email || !data.phone || !data.ownerName) {
    return res.status(400).json({ success: false, message: 'All required fields must be provided: name, address, email, phone, ownerName.' });
  }

  if (!data.panCardOwner && !data.panCardBusiness) {
    return res.status(400).json({ success: false, message: 'At least one PAN card is required — Owner PAN or Business PAN.' });
  }

  // Use a temporary pending ID — real ID is generated after admin approval
  const tempId = `PENDING-${Date.now()}`;
  
  const newSalon = {
    id: tempId,
    name: data.name,
    tagline: 'Premium boutique beauty services',
    area: data.address.split(',')[0] || 'Bengaluru',
    address: data.address,
    lat: 12.9716,
    lng: 77.5946,
    rating: 5.0,
    reviewCount: 0,
    categories: ['hair', 'skin', 'wellness'],
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80',
    openHours: '10:00 AM - 8:00 PM',
    phone: data.phone,
    email: data.email,
    services: [
      { id: 's-reg-1', name: 'Signature Haircut', duration: 45, price: 1500, category: 'hair' },
      { id: 's-reg-2', name: 'Glow Facial', duration: 60, price: 2500, category: 'skin' }
    ],
    packages: [
      { id: 'p-reg-1', name: 'Luxe Starter Pack', description: 'Basic styling and skin rejuvenation', services: ['s-reg-1', 's-reg-2'], price: 3400, savings: 600 }
    ],
    staff: [
      { id: 'staff-reg-1', name: 'Senior Expert', role: 'Chief Stylist', rating: 5.0, reviewCount: 0, specialties: ['Coloring', 'Makeup'], avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Expert' }
    ],
    featured: false,
    password: data.password ? hashPassword(data.password) : '',
    isActive: false,
    registrationStatus: 'pending',
    ownerName: data.ownerName,
    phoneOwner: data.phoneOwner,
    tradeLicenseUrl: data.tradeLicenseUrl,
    panCardOwner: data.panCardOwner || '',
    panCardBusiness: data.panCardBusiness || '',
    registeredAt: new Date().toISOString(),
    commissionDue: 0,
    commissionPaidUntil: new Date().toISOString().split('T')[0]
  };

  await db.createSalon(newSalon);
  res.json({ success: true, salonId: tempId });
});

app.post('/api/salons/:id/exit', authenticateJWT, async (req, res) => {
  const { reason } = req.body;
  const salon = await db.getSalon(req.params.id);
  
  if (!salon) {
    return res.status(404).json({ error: 'Salon not found' });
  }

  if ((salon.commissionDue || 0) > 0) {
    return res.status(400).json({ error: 'Cannot exit platform with pending commission dues' });
  }

  await db.updateSalon(req.params.id, {
    exitRequestStatus: 'pending',
    exitReason: reason
  });
  
  res.json({ success: true });
});

app.post('/api/salons/:id/approve-exit', async (req, res) => {
  const salon = await db.getSalon(req.params.id);
  if (!salon) return res.status(404).json({ error: 'Salon not found' });
  
  await db.updateSalon(req.params.id, {
    isActive: false,
    registrationStatus: 'rejected',
    exitRequestStatus: 'approved',
    exitRejectReason: null
  });
  
  res.json({ success: true });
});

app.post('/api/salons/:id/reject-exit', async (req, res) => {
  const { rejectReason } = req.body;
  const salon = await db.getSalon(req.params.id);
  if (!salon) return res.status(404).json({ error: 'Salon not found' });
  
  await db.updateSalon(req.params.id, {
    exitRequestStatus: 'rejected',
    exitRejectReason: rejectReason || 'Your exit request was not approved at this time.'
  });
  
  res.json({ success: true });
});

app.post('/api/salons/:id/approve', async (req, res) => {
  const { id } = req.params;
  const salon = await db.getSalon(id);
  
  if (salon) {
    // Generate real salon ID on approval if currently a temp PENDING ID
    let finalId = id;
    if (id.startsWith('PENDING-')) {
      const cleanedName = salon.name.trim().replace(/[^a-zA-Z]/g, '');
      const prefix = (cleanedName.slice(0, 3) || 'SAL').toUpperCase();
      const randomDigits = Math.floor(100 + Math.random() * 900);
      finalId = `LL${prefix}${randomDigits}`;

      // Create salon with new ID and delete the old pending one
      const approvedSalon = {
        ...salon,
        id: finalId,
        registrationStatus: 'approved',
        isActive: true
      };
      // Remove _id field from mongo if present
      if (approvedSalon._id) delete approvedSalon._id;
      if (approvedSalon.__v !== undefined) delete approvedSalon.__v;

      await db.createSalon(approvedSalon);
      // Remove old pending entry
      await db.deleteSalon(id);
    } else {
      await db.updateSalon(id, {
        registrationStatus: 'approved',
        isActive: true
      });
    }

    res.json({ success: true, newSalonId: finalId });
  } else {
    res.status(404).json({ success: false, message: 'Salon not found' });
  }
});

app.post('/api/salons/:id/reject', async (req, res) => {
  const { id } = req.params;
  const salon = await db.getSalon(id);

  if (salon) {
    await db.updateSalon(id, {
      registrationStatus: 'rejected',
      isActive: false
    });
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, message: 'Salon not found' });
  }
});

app.post('/api/salons/:id/force-deactivate', async (req, res) => {
  const { id } = req.params;

  // Protect test salon from any admin action
  if (id === 'LLLUX456') {
    return res.status(403).json({ success: false, message: 'This is a protected test salon and cannot be removed.' });
  }

  const salon = await db.getSalon(id);

  if (salon) {
    await db.updateSalon(id, { isActive: false });
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, message: 'Salon not found' });
  }
});

// Permanently delete a salon from the database
app.delete('/api/salons/:id', async (req, res) => {
  const { id } = req.params;

  // Protect test salon from permanent deletion
  if (id === 'LLLUX456') {
    return res.status(403).json({ success: false, message: 'This is a protected test salon and cannot be deleted.' });
  }

  const salon = await db.getSalon(id);

  if (!salon) {
    return res.status(404).json({ success: false, message: 'Salon not found' });
  }

  // Safety: only allow deletion of inactive/rejected salons
  if (salon.isActive === true && salon.registrationStatus === 'approved') {
    return res.status(400).json({ success: false, message: 'Cannot delete an active salon. Deactivate it first.' });
  }

  await db.deleteSalon(id);
  res.json({ success: true, message: `Salon "${salon.name}" permanently deleted.` });
});

// Update salon location
app.post('/api/salons/:id/update-location', async (req, res) => {
  try {
    const { address, lat, lng } = req.body;
    if (!address) return res.status(400).json({ success: false, message: 'Address is required' });
    await db.updateSalon(req.params.id, { address, lat: lat || 0, lng: lng || 0 });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update salon staff
app.post('/api/salons/:id/update-staff', async (req, res) => {
  try {
    const { staff } = req.body;
    if (!Array.isArray(staff)) return res.status(400).json({ success: false, message: 'staff must be an array' });
    await db.updateSalon(req.params.id, { staff });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/salons/:id/update-payout-details', async (req, res) => {
  try {
    const { id } = req.params;
    const { bankDetails, upiDetails } = req.body;
    const salon = await db.getSalon(id);
    if (!salon) return res.status(404).json({ success: false, message: 'Salon not found' });

    if (bankDetails !== undefined) {
      if (!Array.isArray(bankDetails) || bankDetails.length > 2)
        return res.status(400).json({ success: false, message: 'Maximum 2 bank accounts allowed.' });
      for (const b of bankDetails) {
        if (!b.accountHolderName || !b.accountNumber || !b.ifscCode || !b.bankName)
          return res.status(400).json({ success: false, message: 'All bank detail fields are required.' });
        if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test((b.ifscCode || '').toUpperCase()))
          return res.status(400).json({ success: false, message: `Invalid IFSC code: ${b.ifscCode}` });
        if (!/^\d{9,18}$/.test((b.accountNumber || '').replace(/\s/g, '')))
          return res.status(400).json({ success: false, message: 'Account number must be 9–18 digits.' });
      }
    }

    if (upiDetails !== undefined) {
      if (!Array.isArray(upiDetails) || upiDetails.length > 2)
        return res.status(400).json({ success: false, message: 'Maximum 2 UPI IDs allowed.' });
      for (const u of upiDetails) {
        if (!u.upiId || !u.holderName)
          return res.status(400).json({ success: false, message: 'UPI ID and holder name are required.' });
        if (!/^[\w.\-]+@[\w.\-]+$/.test(u.upiId))
          return res.status(400).json({ success: false, message: `Invalid UPI ID format: ${u.upiId}` });
      }
    }

    const updates = {};
    if (bankDetails !== undefined) updates.bankDetails = bankDetails;
    if (upiDetails !== undefined) updates.upiDetails = upiDetails;
    await db.updateSalon(id, updates);
    res.json({ success: true, message: 'Payment details updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/salons/:id/pay-commission', async (req, res) => {
  const { id } = req.params;
  const salon = await db.getSalon(id);

  if (salon) {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);
    
    await db.updateSalon(id, {
      commissionDue: 0,
      commissionPaidUntil: nextMonth.toISOString().split('T')[0],
      isActive: true
    });
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, message: 'Salon not found' });
  }
});

// Admin login endpoint
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;
  if (username === 'ADMINLLURU' && password === 'ADMIN@LUXE26') {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: 'Invalid Admin Credentials' });
  }
});

// User blocking endpoints
app.post('/api/admin/block-user', async (req, res) => {
  try {
    const { userId, blockedUntil } = req.body;
    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });
    const user = await db.getUser(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Protect test user from being blocked
    if (userId === 'usr-admin-test') {
      return res.status(403).json({ success: false, message: 'This is a protected test account and cannot be blocked.' });
    }

    // Also protect by email (belt-and-suspenders)
    if (user.email && user.email === 'adminuser1@test.com') {
      return res.status(403).json({ success: false, message: 'This is a protected test account and cannot be blocked.' });
    }
    await db.updateUser(userId, { blockedUntil });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/admin/unblock-user', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });
    const user = await db.getUser(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    await db.updateUser(userId, { blockedUntil: null });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Bookings endpoints
app.post('/api/bookings', authenticateJWT, async (req, res) => {
  try {
  const bookingData = req.body;
  
  // Verify that booking userId matches the authenticated user
  if (bookingData.userId !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Unauthorized booking placement' });
  }

  // ─── Past date validation ─────────────────────────
  const today = new Date().toISOString().split('T')[0];
  if (bookingData.date < today) {
    return res.status(400).json({ success: false, message: 'Cannot book appointments in the past.' });
  }

  // ─── Double-booking prevention ───────────────────────
  const allBookings = await db.getBookings();
  const conflictBooking = allBookings.find(
    b => b.salonId === bookingData.salonId &&
         b.date === bookingData.date &&
         b.time === bookingData.time &&
         b.status === 'confirmed'
  );
  if (conflictBooking) {
    return res.status(409).json({
      success: false,
      message: `This time slot (${bookingData.time} on ${bookingData.date}) is already booked. Please choose a different time.`
    });
  }

  // Check for blocked slots (walk-in customers)
  const blockedSlots = await db.getBlockedSlots(bookingData.salonId);
  const conflictBlock = blockedSlots.find(
    bs => bs.date === bookingData.date && bs.time === bookingData.time
  );
  if (conflictBlock) {
    return res.status(409).json({
      success: false,
      message: `This time slot (${bookingData.time} on ${bookingData.date}) is blocked by the salon. Please choose a different time.`
    });
  }

  // Check for closed day (public holiday / salon closure)
  const closedDays = await db.getClosedDays(bookingData.salonId);
  const isClosed = closedDays.find(cd => cd.date === bookingData.date);
  if (isClosed) {
    return res.status(409).json({
      success: false,
      message: `The salon is closed on ${bookingData.date}: "${isClosed.reason}". Please choose a different date.`
    });
  }

  // Calculate 3% commission at booking time and accumulate on salon
  const commissionAmount = Math.round((bookingData.totalPrice || 0) * 0.03);

  const salon = await db.getSalon(bookingData.salonId);

  const newBooking = {
    ...bookingData,
    id: `bk-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: 'confirmed',
    commissionAmount,
    commissionPaid: false
  };

  await db.createBooking(newBooking);

  // Add commission to salon's running total
  if (salon) {
    await db.updateSalon(bookingData.salonId, {
      commissionDue: (salon.commissionDue || 0) + commissionAmount
    });
  }

  // Notify salon of new online payment booking
  const isOnlinePay = newBooking.paymentStatus === 'paid-online'
    || newBooking.paymentStatus === 'paid'
    || newBooking.paymentMethod === 'card'
    || newBooking.paymentMethod === 'upi'
    || newBooking.paymentMethod === 'online'
    || newBooking.paymentMethod === 'stripe';
  if (isOnlinePay) {
    await db.createNotification({
      id: `notif-payment-${newBooking.id}-${Date.now()}`,
      target: bookingData.salonId,
      type: 'payment_received',
      message: `💳 Online payment of ₹${(bookingData.totalPrice || 0).toLocaleString('en-IN')} received for new Appointment #${newBooking.id} on ${bookingData.date} at ${bookingData.time}.`,
      createdAt: new Date().toISOString(),
      read: false
    });
  }

  res.json({ success: true, booking: newBooking });
  } catch (err) {
    console.error('Booking creation error:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to create booking' });
  }
});

app.post('/api/bookings/:id/cancel', authenticateJWT, async (req, res) => {
  try {
  const { id } = req.params;
  const booking = await db.getBooking(id);

  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

  if (booking.userId !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Unauthorized cancel action' });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const apptDate = new Date(booking.date);
  apptDate.setHours(0, 0, 0, 0);
  const msPerDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.round((apptDate.getTime() - today.getTime()) / msPerDay);

  let refundPercent = 0;
  let refundAmount = 0;
  const isOnlinePayment = booking.paymentStatus === 'paid-online'
    || booking.paymentStatus === 'paid'
    || booking.paymentMethod === 'card'
    || booking.paymentMethod === 'upi'
    || booking.paymentMethod === 'online'
    || booking.paymentMethod === 'stripe';

  if (isOnlinePayment) {
    if (diffDays <= 0) refundPercent = 30;
    else if (diffDays === 1) refundPercent = 50;
    else if (diffDays === 2) refundPercent = 70;
    else refundPercent = 100;
    refundAmount = Math.round(booking.totalPrice * refundPercent / 100);
  }

  await db.updateBooking(id, { status: 'cancelled', refundAmount, payoutStatus: 'pending' });

  // Reverse commission from salon's due since appointment didn't happen
  if (booking.commissionAmount) {
    const salon = await db.getSalon(booking.salonId);
    if (salon) {
      await db.updateSalon(booking.salonId, {
        commissionDue: Math.max(0, (salon.commissionDue || 0) - booking.commissionAmount)
      });
    }
  }

  res.json({ success: true, refundAmount, refundPercent });
  } catch (err) {
    console.error('Booking cancel error:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to cancel booking' });
  }
});

app.post('/api/bookings/:id/reschedule', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const { date, time } = req.body;
    const booking = await db.getBooking(id);

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.userId !== req.user.id) return res.status(403).json({ success: false, message: 'Unauthorized reschedule action' });

    const allBookings = await db.getBookings();
    const conflict = allBookings.find(
      b => b.id !== id &&
           b.salonId === booking.salonId &&
           b.date === date &&
           b.time === time &&
           b.status === 'confirmed'
    );
    if (conflict) return res.status(409).json({ success: false, message: `Cannot reschedule: ${time} on ${date} is already booked.` });

    const blockedSlots = await db.getBlockedSlots(booking.salonId);
    const blockedConflict = blockedSlots.find(bs => bs.date === date && bs.time === time);
    if (blockedConflict) return res.status(409).json({ success: false, message: `Cannot reschedule: ${time} on ${date} is blocked by the salon.` });

    const closedDays = await db.getClosedDays(booking.salonId);
    const isClosedDay = closedDays.find(cd => cd.date === date);
    if (isClosedDay) return res.status(409).json({ success: false, message: `Cannot reschedule: salon is closed on ${date} — "${isClosedDay.reason}".` });

    await db.updateBooking(id, { date, time, rescheduledFrom: `${booking.date} ${booking.time}` });
    res.json({ success: true });
  } catch (err) {
    console.error('Booking reschedule error:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to reschedule booking' });
  }
});

app.post('/api/bookings/:id/update', async (req, res) => {
  try {
  const { id } = req.params;
  const { paymentMethod, packageId } = req.body;
  
  const booking = await db.getBooking(id);
  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  let salon = await db.getSalon(booking.salonId);
  if (!salon) {
    return res.status(404).json({ success: false, message: 'Salon not found for this booking' });
  }

  let finalPrice = booking.totalPrice;
  let originalPrice = booking.originalPrice || booking.totalPrice;
  let isPackageChanged = false;
  let updatedPackageId = null;
  let updatedPackageName = null;

  if (packageId) {
    const pkg = salon.packages.find(p => p.id === packageId);
    if (pkg) {
      finalPrice = pkg.price;
      isPackageChanged = true;
      updatedPackageId = pkg.id;
      updatedPackageName = pkg.name;
    }
  }

  const newCommission = Math.round(finalPrice * 0.03);
  const oldCommission = booking.commissionAmount || 0;
  const commissionDiff = newCommission - oldCommission;
  const payoutAmount = finalPrice - newCommission;

  const isOnlinePayment = booking.paymentStatus === 'paid-online'
    || booking.paymentStatus === 'paid'
    || booking.paymentMethod === 'card'
    || booking.paymentMethod === 'upi'
    || booking.paymentMethod === 'online'
    || booking.paymentMethod === 'stripe';

  // ─── Simulate payout processing ─────────────────────────────
  const payoutReference = `PAY${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2,6).toUpperCase()}`;
  const payoutInitiatedAt = new Date().toISOString();

  // Determine payout method: UPI first, then bank (NEFT), then simulated
  let payoutMethod = 'simulated';
  let payoutDestination = 'Platform Wallet';
  if (salon.upiDetails && salon.upiDetails.length > 0) {
    payoutMethod = 'upi';
    payoutDestination = salon.upiDetails[0].upiId;
  } else if (salon.bankDetails && salon.bankDetails.length > 0) {
    payoutMethod = 'neft';
    const bank = salon.bankDetails[0];
    payoutDestination = `${bank.bankName} ••••${bank.accountNumber.slice(-4)}`;
  }

  // Update booking with completion details and payout info
  await db.updateBooking(id, {
    status: 'completed',
    paymentMethod,
    totalPrice: finalPrice,
    originalPrice,
    isPackageChanged,
    updatedPackageId,
    updatedPackageName,
    paymentUpdatedBySalon: true,
    commissionAmount: newCommission,
    commissionPaid: isOnlinePayment,
    payoutAmount,
    payoutStatus: isOnlinePayment ? 'paid' : 'pay-at-salon',
    payoutReference,
    payoutMethod,
    payoutInitiatedAt
  });

  if (isOnlinePayment) {
    // Online payment: commission is auto-collected by platform.
    // At booking creation time, commissionAmount was added to commissionDue.
    // Now that payment is confirmed, REMOVE it from commissionDue (it's settled).
    // Only apply package-switch diff if price changed.
    const adjustedDue = Math.max(0, (salon.commissionDue || 0) - oldCommission + commissionDiff);
    await db.updateSalon(booking.salonId, { commissionDue: adjustedDue });

    // Notify salon of payout — rich detail
    const methodLabel = payoutMethod === 'upi' ? `UPI (${payoutDestination})` : payoutMethod === 'neft' ? `NEFT — ${payoutDestination}` : 'Platform Wallet';
    await db.createNotification({
      id: `notif-payout-salon-${id}-${Date.now()}`,
      target: booking.salonId,
      type: 'payout',
      message: `✅ Payout of ₹${payoutAmount.toLocaleString('en-IN')} initiated via ${methodLabel} for Appointment #${id}. Bill: ₹${finalPrice.toLocaleString('en-IN')} − Commission (3%) ₹${newCommission.toLocaleString('en-IN')} = Net ₹${payoutAmount.toLocaleString('en-IN')} | Ref: ${payoutReference}`,
      createdAt: new Date().toISOString(),
      read: false
    });

    // Notify admin of payout
    await db.createNotification({
      id: `notif-payout-admin-${id}-${Date.now()}`,
      target: 'admin',
      type: 'payout',
      message: `💰 Payout ₹${payoutAmount.toLocaleString('en-IN')} → "${salon.name}" via ${methodLabel}. Appointment #${id} | Commission retained: ₹${newCommission.toLocaleString('en-IN')} | Ref: ${payoutReference}`,
      createdAt: new Date().toISOString(),
      read: false
    });
  } else {
    // Pay-at-salon: add commission to dues as before
    if (commissionDiff !== 0) {
      await db.updateSalon(booking.salonId, {
        commissionDue: Math.max(0, (salon.commissionDue || 0) + commissionDiff)
      });
    }

    // Notify salon of commission due
    await db.createNotification({
      id: `notif-commission-salon-${id}-${Date.now()}`,
      target: booking.salonId,
      type: 'commission_due',
      message: `📋 Appointment #${id} completed (pay-at-salon). Commission of ₹${newCommission.toLocaleString('en-IN')} (3% of ₹${finalPrice.toLocaleString('en-IN')}) added to your outstanding dues.`,
      createdAt: new Date().toISOString(),
      read: false
    });

    // Notify admin of commission due
    await db.createNotification({
      id: `notif-commission-admin-${id}-${Date.now()}`,
      target: 'admin',
      type: 'commission_due',
      message: `📋 Appointment #${id} at salon "${salon.name}" completed (pay-at-salon). Commission of ₹${newCommission.toLocaleString('en-IN')} added to their outstanding dues.`,
      createdAt: new Date().toISOString(),
      read: false
    });
  }

  res.json({ success: true });
  } catch (err) {
    console.error('Booking update error:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to update booking' });
  }
});

app.post('/api/bookings/:id/report-fake', async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const booking = await db.getBooking(id);

  if (booking) {
    await db.updateBooking(id, {
      reportedAsFake: true,
      fakeReportReason: reason
    });
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, message: 'Booking not found' });
  }
});

// Salon verifies appointment & payment status
app.post('/api/bookings/:id/verify-status', async (req, res) => {
  try {
    const { appointmentTaken, paymentVerifiedBySalon, paymentMethod, salonNotes } = req.body;
    const booking = (await db.getBookings()).find(b => b.id === req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    
    const updates = {
      appointmentTaken: appointmentTaken ?? booking.appointmentTaken,
      paymentVerifiedBySalon: paymentVerifiedBySalon ?? booking.paymentVerifiedBySalon,
      salonNotes: salonNotes ?? booking.salonNotes ?? '',
    };
    if (paymentMethod) updates.paymentMethod = paymentMethod;
    if (paymentVerifiedBySalon) {
      updates.paymentStatus = paymentMethod === 'card' ? 'paid-online' : 'paid-at-salon';
    }
    
    await db.updateBooking(req.params.id, updates);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Salon modifies services on a booking
app.post('/api/bookings/:id/modify-services', async (req, res) => {
  try {
    const { modifiedServices, modifiedServiceNames, modifiedPrice } = req.body;
    if (!Array.isArray(modifiedServices) || typeof modifiedPrice !== 'number') {
      return res.status(400).json({ error: 'modifiedServices (array) and modifiedPrice (number) are required' });
    }
    const booking = (await db.getBookings()).find(b => b.id === req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    
    const oldCommission = booking.commissionAmount || Math.round(booking.totalPrice * 0.03);
    const newCommission = Math.round(modifiedPrice * 0.03);
    const commissionDiff = newCommission - oldCommission;
    
    const updates = {
      modifiedServices,
      modifiedServiceNames: modifiedServiceNames || [],
      modifiedPrice,
      originalPrice: booking.originalPrice || booking.totalPrice,
      totalPrice: modifiedPrice,
      commissionAmount: newCommission,
      isPackageChanged: true,
    };
    
    await db.updateBooking(req.params.id, updates);
    
    // Adjust salon commission due
    if (commissionDiff !== 0) {
      const salon = (await db.getSalons()).find(s => s.id === booking.salonId);
      if (salon) {
        await db.updateSalon(booking.salonId, {
          commissionDue: (salon.commissionDue || 0) + commissionDiff
        });
      }
    }
    
    res.json({ success: true, newCommission, modifiedPrice });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Blocked Slots ───────────────────────
app.get('/api/salons/:id/blocked-slots', async (req, res) => {
  try {
    const slots = await db.getBlockedSlots(req.params.id);
    res.json(slots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/salons/:id/block-slot', async (req, res) => {
  try {
    const { date, time, customerName, reason } = req.body;
    if (!date || !time) {
      return res.status(400).json({ error: 'date and time are required' });
    }

    // Prevent duplicate blocking
    const existingSlots = await db.getBlockedSlots(req.params.id);
    const alreadyBlocked = existingSlots.find(
      bs => bs.date === date && bs.time === time
    );
    if (alreadyBlocked) {
      return res.status(409).json({ error: 'This slot is already blocked' });
    }
    const slotData = {
      id: `bs-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      salonId: req.params.id,
      date,
      time,
      customerName: customerName || '',
      reason: reason || 'Walk-in customer',
      createdAt: new Date().toISOString(),
    };
    await db.addBlockedSlot(slotData);
    res.json({ success: true, slot: slotData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/salons/:id/blocked-slots/:slotId', async (req, res) => {
  try {
    await db.removeBlockedSlot(req.params.slotId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Closed Days (Public Holidays / Salon Closure) ────────────────────────

app.get('/api/salons/:id/closed-days', async (req, res) => {
  try {
    const days = await db.getClosedDays(req.params.id);
    res.json(days);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: get closed days across all salons
app.get('/api/admin/closed-days', async (req, res) => {
  try {
    const days = await db.getAllClosedDays();
    res.json(days);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/salons/:id/closed-days', async (req, res) => {
  try {
    const { date, reason } = req.body;
    if (!date) return res.status(400).json({ error: 'date is required' });

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'date must be in YYYY-MM-DD format' });
    }

    // Prevent past dates
    const today = new Date().toISOString().split('T')[0];
    if (date < today) {
      return res.status(400).json({ error: 'Cannot close a past date' });
    }

    // Check for duplicate
    const existing = await db.getClosedDays(req.params.id);
    if (existing.find(d => d.date === date)) {
      return res.status(409).json({ error: `${date} is already marked as closed` });
    }

    const closedDay = {
      id: `cd-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      salonId: req.params.id,
      date,
      reason: reason?.trim() || 'Salon Closed',
      createdAt: new Date().toISOString(),
    };

    await db.addClosedDay(closedDay);

    // Notify salon of the closure
    await db.createNotification({
      id: `notif-close-${closedDay.id}`,
      target: req.params.id,
      type: 'closure',
      message: `📅 ${date} has been marked as a closed day: "${closedDay.reason}". All time slots for this day are now blocked.`,
      createdAt: new Date().toISOString(),
      read: false
    });

    res.json({ success: true, closedDay });
  } catch (err) {
    console.error('Add closed day error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/salons/:id/closed-days/:date', async (req, res) => {
  try {
    const { id, date } = req.params;
    await db.removeClosedDay(id, decodeURIComponent(date));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reviews endpoints
app.post('/api/reviews', authenticateJWT, async (req, res) => {
  try {
  const reviewData = req.body;
  
  if (reviewData.userId !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Unauthorized review submission' });
  }

  const newReview = {
    ...reviewData,
    id: `rev-${Date.now()}`,
    createdAt: new Date().toISOString()
  };

  await db.createReview(newReview);

  // Mark corresponding booking as reviewed
  if (reviewData.bookingId) {
    const booking = await db.getBooking(reviewData.bookingId);
    if (booking) {
      await db.updateBooking(reviewData.bookingId, {
        feedbackSent: true,
        rating: reviewData.rating,
        review: reviewData.comment
      });
    }
  }

  // Update staff and salon ratings if applicable
  if (reviewData.staffId && reviewData.salonId) {
    const salon = await db.getSalon(reviewData.salonId);
    if (salon) {
      const staffIdx = salon.staff.findIndex(st => st.id === reviewData.staffId);
      const reviews = await db.getReviews();
      
      if (staffIdx >= 0) {
        const staffReviews = reviews.filter(r => r.staffId === reviewData.staffId);
        const avgRating = staffReviews.reduce((sum, r) => sum + r.rating, 0) / staffReviews.length;
        salon.staff[staffIdx].rating = avgRating;
        salon.staff[staffIdx].reviewCount = staffReviews.length;
      }

      // Update aggregate salon rating
      const salonReviews = reviews.filter(r => r.salonId === reviewData.salonId);
      if (salonReviews.length > 0) {
        salon.rating = salonReviews.reduce((sum, r) => sum + r.rating, 0) / salonReviews.length;
        salon.reviewCount = salonReviews.length;
      }

      await db.updateSalon(reviewData.salonId, {
        staff: salon.staff,
        rating: salon.rating,
        reviewCount: salon.reviewCount
      });
    }
  }

  res.json({ success: true, review: newReview });
  } catch (err) {
    console.error('Review submission error:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to submit review' });
  }
});

// ─── Messages (E2E Encrypted 1:1 Conversations) ────────────────────────────

app.get('/api/messages/:salonId', async (req, res) => {
  try {
    const messages = await db.getMessages(req.params.salonId);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get messages' });
  }
});

app.post('/api/messages/:salonId', async (req, res) => {
  try {
    const { sender, encryptedContent, context } = req.body;
    if (!sender || !encryptedContent) {
      return res.status(400).json({ success: false, message: 'sender and encryptedContent are required' });
    }
    const msg = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      salonId: req.params.salonId,
      sender,
      encryptedContent,
      context: context || 'direct',
      createdAt: new Date().toISOString(),
      isRead: false
    };
    await db.createMessage(msg);
    res.json({ success: true, message: msg });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
});

app.post('/api/messages/read/:id', async (req, res) => {
  try {
    await db.markMessageRead(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to mark message read' });
  }
});

// ─── Announcements (Admin Broadcast to All Salons) ─────────────────────────

app.get('/api/announcements', async (req, res) => {
  try {
    const announcements = await db.getAnnouncements();
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get announcements' });
  }
});

app.post('/api/announcements', async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'title and content are required' });
    }
    const announcement = {
      id: `ann_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title,
      content,
      createdAt: new Date().toISOString(),
      readBy: []
    };
    await db.createAnnouncement(announcement);
    res.json({ success: true, announcement });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create announcement' });
  }
});

app.post('/api/announcements/:id/read', async (req, res) => {
  try {
    const { salonId } = req.body;
    if (!salonId) return res.status(400).json({ success: false, message: 'salonId is required' });
    await db.markAnnouncementReadBySalon(req.params.id, salonId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to mark announcement read' });
  }
});

// ─── Platform Payment Details (public) ─────────────────────────────────────
// Platform's own bank/UPI details where salons send commission
const PLATFORM_PAYMENT = {
  upi: [
    { upiId: 'luxeluru@hdfcbank', holderName: 'Luxeluru Technologies' },
    { upiId: 'luxeluru@ybl',      holderName: 'Luxeluru Technologies' }
  ],
  bank: {
    accountHolderName: 'Luxeluru Technologies Pvt Ltd',
    bankName: 'HDFC Bank',
    accountNumber: '50200098765432',
    ifscCode: 'HDFC0000001',
    accountType: 'Current',
    branch: 'Koramangala, Bengaluru'
  }
};

app.get('/api/platform/payment-details', (req, res) => {
  res.json({ success: true, payment: PLATFORM_PAYMENT });
});

// ─── Commission Summary for a Salon ────────────────────────────────────────
app.get('/api/salons/:id/commission-summary', async (req, res) => {
  try {
    const salon = await db.getSalon(req.params.id);
    if (!salon) return res.status(404).json({ success: false, message: 'Salon not found' });

    // Get all bookings for this salon that are pay-at-salon and completed
    const allBookings = await db.getBookings();
    const payAtSalonBookings = allBookings.filter(b =>
      b.salonId === req.params.id &&
      b.status === 'completed' &&
      (b.payoutStatus === 'pay-at-salon' || b.paymentMethod === 'cash' || b.paymentMethod === 'pay-at-salon')
    );

    // Calculate due date: end of current month + 5 grace days
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0); // last day of current month
    const gracePeriodEnd = new Date(endOfMonth);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 5);

    // Determine commission status
    let commissionStatus = 'current';
    if (now > gracePeriodEnd) commissionStatus = 'overdue';
    else if (now > endOfMonth) commissionStatus = 'due';

    // Per-booking breakdown
    const breakdown = payAtSalonBookings.map(b => ({
      bookingId: b.id,
      date: b.date,
      time: b.time,
      serviceNames: b.serviceNames || [],
      totalBill: b.totalPrice || 0,
      commissionRate: 3,
      commissionAmount: b.commissionAmount || Math.round((b.totalPrice || 0) * 0.03),
      payoutAmount: b.payoutAmount || ((b.totalPrice || 0) - Math.round((b.totalPrice || 0) * 0.03)),
      completedAt: b.payoutInitiatedAt || b.createdAt
    }));

    const totalCommissionDue = breakdown.reduce((sum, b) => sum + b.commissionAmount, 0);
    const totalRevenue = breakdown.reduce((sum, b) => sum + b.totalBill, 0);

    res.json({
      success: true,
      salonId: req.params.id,
      salonName: salon.name,
      breakdown,
      totalCommissionDue: salon.commissionDue || 0,
      totalRevenue,
      appointmentCount: breakdown.length,
      commissionRate: 3,
      dueDate: endOfMonth.toISOString().split('T')[0],
      gracePeriodEnd: gracePeriodEnd.toISOString().split('T')[0],
      commissionStatus,
      commissionPaymentStatus: salon.commissionPaymentStatus || 'pending',
      commissionPaymentRef: salon.commissionPaymentRef || null,
      commissionSubmittedAt: salon.commissionSubmittedAt || null,
      commissionLastClearedAt: salon.commissionLastClearedAt || null,
      commissionLastClearedAmount: salon.commissionLastClearedAmount || 0,
      platformPayment: PLATFORM_PAYMENT
    });
  } catch (err) {
    console.error('Commission summary error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Submit Commission Payment (Salon) ─────────────────────────────────────
app.post('/api/salons/:id/submit-commission-payment', async (req, res) => {
  try {
    const { paymentRef, paymentMethod, amount, screenshotNote } = req.body;
    const salon = await db.getSalon(req.params.id);
    if (!salon) return res.status(404).json({ success: false, message: 'Salon not found' });

    if (!paymentRef || !paymentRef.trim())
      return res.status(400).json({ success: false, message: 'Payment reference/UTR number is required.' });

    await db.updateSalon(req.params.id, {
      commissionPaymentStatus: 'submitted',
      commissionPaymentRef: paymentRef.trim(),
      commissionSubmittedAt: new Date().toISOString()
    });

    // Notify admin
    await db.createNotification({
      id: `notif-comm-submit-${req.params.id}-${Date.now()}`,
      target: 'admin',
      type: 'commission',
      message: `💳 "${salon.name}" has submitted commission payment of ₹${(amount || salon.commissionDue || 0).toLocaleString('en-IN')} via ${paymentMethod || 'UPI/Bank'}. UTR/Ref: ${paymentRef}. Please verify and clear their dues.`,
      createdAt: new Date().toISOString(),
      read: false
    });

    // Notify salon
    await db.createNotification({
      id: `notif-comm-salon-${req.params.id}-${Date.now()}`,
      target: req.params.id,
      type: 'commission',
      message: `✅ Your commission payment (Ref: ${paymentRef}) has been submitted for verification. Admin will clear your dues within 24 hours.`,
      createdAt: new Date().toISOString(),
      read: false
    });

    res.json({ success: true, message: 'Payment submitted for verification.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Verify & Clear Commission (Admin) ─────────────────────────────────────
app.post('/api/salons/:id/verify-commission-payment', async (req, res) => {
  try {
    const salon = await db.getSalon(req.params.id);
    if (!salon) return res.status(404).json({ success: false, message: 'Salon not found' });

    const clearedAmount = salon.commissionDue || 0;

    await db.updateSalon(req.params.id, {
      commissionDue: 0,
      commissionPaymentStatus: 'verified',
      commissionLastClearedAt: new Date().toISOString(),
      commissionLastClearedAmount: clearedAmount
    });

    // Notify salon that dues are cleared
    await db.createNotification({
      id: `notif-comm-cleared-${req.params.id}-${Date.now()}`,
      target: req.params.id,
      type: 'commission',
      message: `🎉 Your commission payment of ₹${clearedAmount.toLocaleString('en-IN')} has been verified and your account dues are now cleared. Thank you!`,
      createdAt: new Date().toISOString(),
      read: false
    });

    res.json({ success: true, message: `Commission cleared. ₹${clearedAmount} dues removed.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Health check endpoint for frontend connectivity detection
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString(), dbMode: db.mode });
});

// Salon password change
app.post('/api/salons/:id/change-password', async (req, res) => {
  const { id } = req.params;
  const { currentPassword, newPassword } = req.body;
  const salon = await db.getSalon(id);

  if (!salon) {
    return res.status(404).json({ success: false, message: 'Salon not found' });
  }

  if (salon.password !== currentPassword && salon.password !== hashPassword(currentPassword)) {
    return res.status(401).json({ success: false, message: 'Current password is incorrect' });
  }

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
  }

  await db.updateSalon(id, { password: hashPassword(newPassword) });
  res.json({ success: true, message: 'Password updated successfully' });
});

// Notification endpoints (must be BEFORE the SPA wildcard)
app.get('/api/notifications', async (req, res) => {
  try {
    const { target } = req.query;
    const notifications = await db.getNotifications(target || null);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get notifications' });
  }
});

app.post('/api/notifications/:id/read', async (req, res) => {
  try {
    await db.markNotificationRead(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to mark notification read' });
  }
});

app.post('/api/notifications/mark-all-read', async (req, res) => {
  try {
    const { target } = req.body;
    if (!target) return res.status(400).json({ success: false, message: 'target is required' });
    await db.markAllNotificationsRead(target);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to mark all read' });
  }
});

// Serve static assets from the frontend build folder in production
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Fallback all non-API GET requests to index.html (for React Router)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      res.status(404).send('Not Found');
    }
  });
});

// Global error handler
app.use((err, req, res, _next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down server gracefully...');
  process.exit(0);
});

// ─── Global Error Handlers (prevent server crash) ───────
process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err);
});

// Express global error middleware
app.use((err, req, res, next) => {
  console.error('[EXPRESS ERROR]', err.stack || err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// Connect to Database first and then start server listening
const MONGODB_URI = process.env.MONGODB_URI;
db.connect(MONGODB_URI).then(async () => {
  // ─── Patch Demo Salon KYC Data in DB ─────────────────────────────────────
  // Directly UPDATE existing salon rows so admin sees full KYC details.
  // Only patches rows where ownerName is currently missing (idempotent).
  const DEMO_TL  = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
  const DEMO_TL2 = 'https://pdfobject.com/pdf/sample.pdf';
  const demoKyc = [
    { id:'LLANU569', ownerName:'Anjali Krishnamurthy',                phoneOwner:'+919845012301', panCardOwner:'ANJAK1234F', panCardBusiness:null,         tradeLicenseUrl:DEMO_TL,  registeredAt:'2024-03-15T09:30:00.000Z', bankDetails:[{id:'bd-1',accountHolderName:'Anjali Krishnamurthy',accountNumber:'3892740018273',ifscCode:'SBIN0010234',bankName:'State Bank of India',accountType:'current'}], upiDetails:[{id:'up-1',upiId:'anurahouseofbeauty@sbi',holderName:'Anjali Krishnamurthy'}] },
    { id:'LLOLA824', ownerName:'Oleander Fernandes',                  phoneOwner:'+919845012302', panCardOwner:'OLEAF2345G', panCardBusiness:'AABCO1234K',  tradeLicenseUrl:DEMO_TL2, registeredAt:'2024-05-20T11:00:00.000Z', bankDetails:[{id:'bd-2',accountHolderName:'Olavu Beauty Heaven Pvt Ltd',accountNumber:'1234500078901',ifscCode:'HDFC0001234',bankName:'HDFC Bank',accountType:'current'}], upiDetails:[{id:'up-2',upiId:'olavubeauty@hdfcbank',holderName:'Olavu Beauty Heaven'},{id:'up-2b',upiId:'oleander.fernandes@okaxis',holderName:'Oleander Fernandes'}] },
    { id:'LLHAI372', ownerName:'Harish Gowda',                        phoneOwner:'+919845012303', panCardOwner:'HARIG3456H', panCardBusiness:null,         tradeLicenseUrl:DEMO_TL,  registeredAt:'2024-01-10T08:00:00.000Z', bankDetails:[{id:'bd-3',accountHolderName:'Harish Gowda',accountNumber:'9870056712345',ifscCode:'ICIC0002345',bankName:'ICICI Bank',accountType:'savings'}], upiDetails:[{id:'up-3',upiId:'hairlounge.harish@icici',holderName:'Harish Gowda'}] },
    { id:'LLLUM185', ownerName:'Luminita Sharma',                     phoneOwner:'+919845012304', panCardOwner:null,          panCardBusiness:'AABCS4567P',  tradeLicenseUrl:DEMO_TL2, registeredAt:'2024-06-01T10:15:00.000Z', bankDetails:[{id:'bd-4',accountHolderName:'Luminious Salon LLP',accountNumber:'5678900123456',ifscCode:'KOTAK0003456',bankName:'Kotak Mahindra Bank',accountType:'current'}], upiDetails:[{id:'up-4',upiId:'luminioussalon@kotak',holderName:'Luminious Salon'}] },
    { id:'LLBEL903', ownerName:'Dr. Belinda Kamath',                  phoneOwner:'+919845012305', panCardOwner:'BELIK5678J', panCardBusiness:'AABCB5678R',  tradeLicenseUrl:DEMO_TL,  registeredAt:'2024-02-28T09:00:00.000Z', bankDetails:[{id:'bd-5',accountHolderName:'Belaku Derma Studio Pvt Ltd',accountNumber:'4321009876543',ifscCode:'AXIS0004567',bankName:'Axis Bank',accountType:'current'}], upiDetails:[{id:'up-5',upiId:'belakuderma@axisbank',holderName:'Belaku Derma Studio'}] },
    { id:'LLMAI421', ownerName:'Madhuri Pillai',                      phoneOwner:'+919845012306', panCardOwner:'MADIP6789K', panCardBusiness:null,         tradeLicenseUrl:DEMO_TL2, registeredAt:'2024-04-12T10:30:00.000Z', bankDetails:[{id:'bd-6',accountHolderName:'Madhuri Pillai',accountNumber:'7654321098765',ifscCode:'PUNB0005678',bankName:'Punjab National Bank',accountType:'savings'}], upiDetails:[{id:'up-6',upiId:'maisonbeaute@paytm',holderName:'Madhuri Pillai'}] },
    { id:'LLBLU756', ownerName:'Bhavana Shetty',                      phoneOwner:'+919845012307', panCardOwner:'BHAAS7890L', panCardBusiness:'AABCB7890S',  tradeLicenseUrl:DEMO_TL,  registeredAt:'2023-11-05T08:45:00.000Z', bankDetails:[{id:'bd-7',accountHolderName:'Blush Bridal Studio Pvt Ltd',accountNumber:'8765432109876',ifscCode:'SBIN0006789',bankName:'State Bank of India',accountType:'current'}], upiDetails:[{id:'up-7',upiId:'blushbridal@sbi',holderName:'Blush Bridal Studio'},{id:'up-7b',upiId:'bhavana.shetty@okicici',holderName:'Bhavana Shetty'}] },
    { id:'LLZEN294', ownerName:'Zenaida Nambiar',                     phoneOwner:'+919845012308', panCardOwner:'ZENAI8901M', panCardBusiness:null,         tradeLicenseUrl:DEMO_TL2, registeredAt:'2024-01-20T11:30:00.000Z', bankDetails:[{id:'bd-8',accountHolderName:'Zenith Wellness Spa',accountNumber:'2109876543210',ifscCode:'HDFC0007890',bankName:'HDFC Bank',accountType:'current'}], upiDetails:[{id:'up-8',upiId:'zenithwellness@hdfcbank',holderName:'Zenith Wellness Spa'}] },
    { id:'LLCHR618', ownerName:'Charu Mehta',                         phoneOwner:'+919845012309', panCardOwner:'CHAUM9012N', panCardBusiness:null,         tradeLicenseUrl:DEMO_TL,  registeredAt:'2024-03-08T09:00:00.000Z', bankDetails:[{id:'bd-9',accountHolderName:'Charu Mehta',accountNumber:'3210987654321',ifscCode:'ICIC0008901',bankName:'ICICI Bank',accountType:'savings'}], upiDetails:[{id:'up-9',upiId:'chromahair@icici',holderName:'Charu Mehta'}] },
    { id:'LLROY502', ownerName:'Rohan Vijaykumar',                    phoneOwner:'+919845012310', panCardOwner:'ROHAV0123P', panCardBusiness:'AABCR0123T',  tradeLicenseUrl:DEMO_TL2, registeredAt:'2024-05-01T10:00:00.000Z', bankDetails:[{id:'bd-10',accountHolderName:'Royal Cut Barbershop',accountNumber:'4321098765432',ifscCode:'KOTAK0009012',bankName:'Kotak Mahindra Bank',accountType:'current'}], upiDetails:[{id:'up-10',upiId:'royalcut@kotak',holderName:'Royal Cut Barbershop'}] },
    { id:'LLGLO839', ownerName:'Gloria Pinto',                        phoneOwner:'+919845012311', panCardOwner:'GLORIP123Q', panCardBusiness:null,         tradeLicenseUrl:DEMO_TL,  registeredAt:'2024-04-25T09:30:00.000Z', bankDetails:[{id:'bd-11',accountHolderName:'Gloria Pinto',accountNumber:'5432109876543',ifscCode:'AXIS0000123',bankName:'Axis Bank',accountType:'savings'}], upiDetails:[{id:'up-11',upiId:'glowgrace@axisbank',holderName:'Gloria Pinto'}] },
    { id:'LLOPU467', ownerName:'Ravi Shankar (Opulence Luxury Group)',phoneOwner:'+919845012312', panCardOwner:'RAVIS2345R', panCardBusiness:'AABCO2345U',  tradeLicenseUrl:DEMO_TL2, registeredAt:'2023-09-10T08:00:00.000Z', bankDetails:[{id:'bd-12',accountHolderName:'Opulence Spa Lounge Pvt Ltd',accountNumber:'6543210987654',ifscCode:'SBIN0001234',bankName:'State Bank of India',accountType:'current'}], upiDetails:[{id:'up-12',upiId:'opulencespa@sbi',holderName:'Opulence Spa Lounge'},{id:'up-12b',upiId:'ravi.shankar@okhdfc',holderName:'Ravi Shankar'}] },
    { id:'LLTRE138', ownerName:'Treesa Mathew',                       phoneOwner:'+919845012313', panCardOwner:'TREEM3456S', panCardBusiness:null,         tradeLicenseUrl:DEMO_TL,  registeredAt:'2024-02-14T10:00:00.000Z', bankDetails:[{id:'bd-13',accountHolderName:'Treesa Mathew',accountNumber:'7654321098765',ifscCode:'HDFC0002345',bankName:'HDFC Bank',accountType:'savings'}], upiDetails:[{id:'up-13',upiId:'tresstone@hdfcbank',holderName:'Treesa Mathew'}] },
    { id:'LLECL981', ownerName:'Eclaire Rodrigues',                   phoneOwner:'+919845012314', panCardOwner:'ECLAR4567T', panCardBusiness:'AABCE4567V',  tradeLicenseUrl:DEMO_TL2, registeredAt:'2024-06-10T11:00:00.000Z', bankDetails:[{id:'bd-14',accountHolderName:'Eclat Beauty Bar Pvt Ltd',accountNumber:'8765432109876',ifscCode:'ICIC0003456',bankName:'ICICI Bank',accountType:'current'}], upiDetails:[{id:'up-14',upiId:'eclatbeauty@icici',holderName:'Eclat Beauty Bar'}] },
    { id:'LLNIR725', ownerName:'Niranjana Iyer',                      phoneOwner:'+919845012315', panCardOwner:'NIRAI5678U', panCardBusiness:null,         tradeLicenseUrl:DEMO_TL,  registeredAt:'2023-12-01T09:00:00.000Z', bankDetails:[{id:'bd-15',accountHolderName:'Niranjana Iyer',accountNumber:'9876543210987',ifscCode:'KOTAK0004567',bankName:'Kotak Mahindra Bank',accountType:'savings'}], upiDetails:[{id:'up-15',upiId:'nirvanaspa@kotak',holderName:'Niranjana Iyer'}] },
  ];
  for (const kyc of demoKyc) {
    try {
      await db.updateSalon(kyc.id, {
        ownerName:       kyc.ownerName,
        phoneOwner:      kyc.phoneOwner,
        panCardOwner:    kyc.panCardOwner  || null,
        panCardBusiness: kyc.panCardBusiness || null,
        tradeLicenseUrl: kyc.tradeLicenseUrl,
        registeredAt:    kyc.registeredAt,
        bankDetails:     kyc.bankDetails,
        upiDetails:      kyc.upiDetails,
      });
      console.log(`[KYC Patch] Updated salon ${kyc.id} — ${kyc.ownerName}`);
    } catch (e) {
      console.warn(`[KYC Patch] Failed for ${kyc.id}:`, e.message);
    }
  }

  // ─── Seed Demo Closed Days for 3 Salons ──────────────────────────────────
  // Idempotent: skips if the date is already marked closed for that salon
  const demoClosedDays = [
    { salonId: 'LLBLU756', date: '2026-07-04', reason: 'Staff Training Day' },
    { salonId: 'LLBLU756', date: '2026-08-15', reason: 'Independence Day — Salon Closed' },
    { salonId: 'LLOPU467', date: '2026-07-10', reason: 'Renovation & Deep Cleaning' },
    { salonId: 'LLOPU467', date: '2026-08-15', reason: 'Independence Day — Salon Closed' },
    { salonId: 'LLNIR725', date: '2026-08-15', reason: 'Independence Day — Salon Closed' },
    { salonId: 'LLNIR725', date: '2026-07-20', reason: 'Annual Wellness Retreat (Staff Day Off)' },
  ];
  for (const entry of demoClosedDays) {
    try {
      const existing = await db.getClosedDays(entry.salonId);
      if (!existing.find(d => d.date === entry.date)) {
        await db.addClosedDay({
          id: `demo-close-${entry.salonId}-${entry.date}`,
          salonId: entry.salonId,
          date: entry.date,
          reason: entry.reason,
          createdAt: new Date().toISOString(),
        });
        console.log(`[Seed] Closed day added: ${entry.salonId} on ${entry.date}`);
      }
    } catch (e) {
      // Non-fatal — demo seed
    }
  }

  // ─── Ensure Test Salon LLLUX456 Has Correct Password & Status ──────────────
  // Idempotent: creates or updates so salon login always works, even after a fresh DB.
  try {
    const testSalon = await db.getSalon('LLLUX456');
    const correctPassword = hashPassword('salon@admin-test789');
    if (!testSalon) {
      // Create the test salon if DB is fresh (e.g. after Render redeploy)
      await db.createSalon({
        id: 'LLLUX456',
        name: 'luxury salon admin',
        tagline: 'Premium Luxury Salon Experience',
        area: 'Indiranagar',
        address: 'Indiranagar, Bengaluru, Karnataka',
        lat: 12.9784,
        lng: 77.6408,
        rating: 4.9,
        reviewCount: 120,
        categories: ['Hair', 'Skin', 'Nails'],
        image: '',
        openHours: '10:00 AM - 9:00 PM',
        phone: '+919999999998',
        email: 'luxurysalonadmin@test.com',
        services: [],
        packages: [],
        staff: [],
        featured: true,
        password: correctPassword,
        isActive: true,
        registrationStatus: 'approved',
        ownerName: 'Admin Owner',
        phoneOwner: '+919999999998',
        registeredAt: new Date().toISOString(),
        commissionDue: 0,
      });
      console.log('[Patch] Test salon LLLUX456 created in DB.');
    } else {
      await db.updateSalon('LLLUX456', {
        name: 'luxury salon admin',
        password: correctPassword,
        registrationStatus: 'approved',
        isActive: true,
        email: 'luxurysalonadmin@test.com',
        ownerName: 'Admin Owner',
      });
      console.log('[Patch] Test salon LLLUX456 password and status ensured.');
    }
  } catch (e) {
    console.warn('[Patch] Test salon password patch failed:', e.message);
  }

  // ─── Seed Approved Partner Salons From Environment Variable ─────────────────
  // Any salon approved by admin can be persisted across Render redeploys by adding
  // its data to the SEED_SALONS env var (JSON array) in the Render dashboard.
  // Format: [{"id":"LLXXX123","name":"Salon Name","email":"owner@email.com","password":"their_password","ownerName":"Owner Name"}]
  // The password here is the PLAIN TEXT password the salon uses to login.
  try {
    const seedSalonsEnv = process.env.SEED_SALONS;
    if (seedSalonsEnv) {
      const seedList = JSON.parse(seedSalonsEnv);
      for (const s of seedList) {
        if (!s.id || !s.email || !s.password) continue;
        const existing = await db.getSalon(s.id);
        if (!existing) {
          await db.createSalon({
            id: s.id,
            name: s.name || s.id,
            tagline: s.tagline || 'Premium Salon Experience',
            area: s.area || (s.address ? s.address.split(',')[0] : 'Bengaluru'),
            address: s.address || 'Bengaluru, Karnataka',
            lat: s.lat || 12.9716,
            lng: s.lng || 77.5946,
            rating: s.rating || 5.0,
            reviewCount: s.reviewCount || 0,
            categories: s.categories || ['hair', 'skin', 'wellness'],
            image: s.image || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80',
            openHours: s.openHours || '10:00 AM - 8:00 PM',
            phone: s.phone || '',
            email: s.email,
            services: s.services || [],
            packages: s.packages || [],
            staff: s.staff || [],
            featured: s.featured || false,
            password: hashPassword(s.password),
            isActive: true,
            registrationStatus: 'approved',
            ownerName: s.ownerName || '',
            phoneOwner: s.phoneOwner || s.phone || '',
            tradeLicenseUrl: s.tradeLicenseUrl || '',
            registeredAt: s.registeredAt || new Date().toISOString(),
            commissionDue: s.commissionDue || 0,
          });
          console.log(`[Seed] Partner salon ${s.id} (${s.name}) re-created from SEED_SALONS env.`);
        } else {
          // Always refresh password + status from env to ensure consistency
          await db.updateSalon(s.id, {
            password: hashPassword(s.password),
            registrationStatus: 'approved',
            isActive: true,
          });
          console.log(`[Seed] Partner salon ${s.id} credentials refreshed from SEED_SALONS env.`);
        }
      }
    }
  } catch (e) {
    console.warn('[Seed] SEED_SALONS parse/seed failed:', e.message);
  }

  // ─── Ensure Test User Exists in DB ─────────────────────────────────────────
  // Seeds adminuser1@test.com with hashed password so backend login works without Supabase.
  try {
    const testUserId = 'usr-admin-test';
    const existingUser = await db.getUser(testUserId);
    const correctUserPassword = hashPassword('user@admin-test789');
    if (!existingUser) {
      await db.createUser({
        id: testUserId,
        name: 'Admin Test User',
        email: 'adminuser1@test.com',
        phone: '+919999999999',
        password: correctUserPassword,
        createdAt: new Date().toISOString(),
        preferredLanguage: 'en',
      });
      console.log('[Patch] Test user adminuser1@test.com created in DB.');
    } else if (existingUser.password !== correctUserPassword) {
      await db.updateUser(testUserId, { password: correctUserPassword });
      console.log('[Patch] Test user password updated.');
    }
  } catch (e) {
    console.warn('[Patch] Test user seed failed:', e.message);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Luxeluru backend running on http://0.0.0.0:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
  });
}).catch(err => {
  console.error('Failed to initialize database, shutting down:', err);
  process.exit(1);
});
