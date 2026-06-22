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

// CORS: allow Vite dev server and any deployed frontend origin
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, same-origin in production)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'production') {
      return callback(null, true);
    }
    callback(new Error(`CORS policy: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json());

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
  const users = await db.getUsers();
  res.json(users);
});

app.get('/api/salons', async (req, res) => {
  const salons = await db.getSalons();
  res.json(salons);
});

app.get('/api/bookings', async (req, res) => {
  const bookings = await db.getBookings();
  res.json(bookings);
});

app.get('/api/reviews', async (req, res) => {
  const reviews = await db.getReviews();
  res.json(reviews);
});

// Auth endpoints
app.post('/api/users/register', async (req, res) => {
  const userData = req.body;
  
  if (!userData.id) {
    return res.status(400).json({ success: false, message: 'User ID is required' });
  }

  const existing = await db.getUser(userData.id);
  if (existing) {
    return res.json({ success: true, user: existing });
  }

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
});

app.post('/api/users/:id/update', authenticateJWT, async (req, res) => {
  const { id } = req.params;
  const { updates } = req.body;
  
  // Authorization check: user can only update their own profile
  if (req.user.id !== id) {
    return res.status(403).json({ success: false, message: 'Unauthorized profile update' });
  }
  
  const user = await db.getUser(id);
  if (user) {
    const updated = await db.updateUser(id, updates);
    res.json({ success: true, user: updated });
  } else {
    res.status(404).json({ success: false, message: 'User not found' });
  }
});

app.post('/api/salons/login', async (req, res) => {
  const { name, id, email, password } = req.body;
  const salons = await db.getSalons();
  
  const found = salons.find(s => 
    s.name.toLowerCase().trim() === name.toLowerCase().trim() &&
    s.id.toLowerCase().trim() === id.toLowerCase().trim() &&
    s.email.toLowerCase().trim() === email.toLowerCase().trim() &&
    (s.password === password || s.password === hashPassword(password))
  );

  if (found) {
    if (found.registrationStatus !== 'approved') {
      res.status(403).json({ success: false, message: 'Salon registration is not approved yet.' });
    } else {
      res.json({ success: true, salon: found });
    }
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

app.post('/api/salons/register', async (req, res) => {
  const data = req.body;
  
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
    password: hashPassword('SALON@123'),
    isActive: false,
    registrationStatus: 'pending',
    ownerName: data.ownerName,
    phoneOwner: data.phoneOwner,
    tradeLicenseUrl: data.tradeLicenseUrl,
    registeredAt: new Date().toISOString(),
    commissionDue: 0,
    commissionPaidUntil: new Date().toISOString().split('T')[0]
  };

  await db.createSalon(newSalon);
  res.json({ success: true, salonId: tempId });
});

app.post('/api/salons/:id/exit', async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  
  const salon = await db.getSalon(id);
  if (salon) {
    await db.updateSalon(id, {
      isActive: false,
      registrationStatus: 'rejected',
      exitReason: reason
    });
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, message: 'Salon not found' });
  }
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
  const salon = await db.getSalon(id);

  if (salon) {
    await db.updateSalon(id, { isActive: false });
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, message: 'Salon not found' });
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
  const { userId, blockedUntil } = req.body;
  const user = await db.getUser(userId);

  if (user) {
    await db.updateUser(userId, { blockedUntil });
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, message: 'User not found' });
  }
});

app.post('/api/admin/unblock-user', async (req, res) => {
  const { userId } = req.body;
  const user = await db.getUser(userId);

  if (user) {
    await db.updateUser(userId, { blockedUntil: null });
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, message: 'User not found' });
  }
});

// Bookings endpoints
app.post('/api/bookings', authenticateJWT, async (req, res) => {
  const bookingData = req.body;
  
  // Verify that booking userId matches the authenticated user
  if (bookingData.userId !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Unauthorized booking placement' });
  }

  // ─── Double-booking prevention ───────────────────────
  // Check for existing confirmed bookings at the same salon+date+time
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

  res.json({ success: true, booking: newBooking });
});

app.post('/api/bookings/:id/cancel', authenticateJWT, async (req, res) => {
  const { id } = req.params;
  const booking = await db.getBooking(id);

  if (booking) {
    if (booking.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized cancel action' });
    }
    await db.updateBooking(id, { status: 'cancelled' });

    // Reverse commission on cancellation
    if (booking.commissionAmount) {
      const salon = await db.getSalon(booking.salonId);
      if (salon) {
        await db.updateSalon(booking.salonId, {
          commissionDue: Math.max(0, (salon.commissionDue || 0) - booking.commissionAmount)
        });
      }
    }

    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, message: 'Booking not found' });
  }
});

app.post('/api/bookings/:id/reschedule', authenticateJWT, async (req, res) => {
  const { id } = req.params;
  const { date, time } = req.body;
  const booking = await db.getBooking(id);

  if (booking) {
    if (booking.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized reschedule action' });
    }

    // Conflict check: prevent rescheduling into an occupied slot
    const allBookings = await db.getBookings();
    const conflict = allBookings.find(
      b => b.id !== id &&
           b.salonId === booking.salonId &&
           b.date === date &&
           b.time === time &&
           b.status === 'confirmed'
    );
    if (conflict) {
      return res.status(409).json({
        success: false,
        message: `Cannot reschedule: ${time} on ${date} is already booked.`
      });
    }

    const blockedSlots = await db.getBlockedSlots(booking.salonId);
    const blockedConflict = blockedSlots.find(
      bs => bs.date === date && bs.time === time
    );
    if (blockedConflict) {
      return res.status(409).json({
        success: false,
        message: `Cannot reschedule: ${time} on ${date} is blocked by the salon.`
      });
    }

    await db.updateBooking(id, { date, time });
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, message: 'Booking not found' });
  }
});

app.post('/api/bookings/:id/update', async (req, res) => {
  const { id } = req.params;
  const { paymentMethod, packageId } = req.body;
  
  const booking = await db.getBooking(id);
  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  const salon = await db.getSalon(booking.salonId);
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

  // Update booking fields
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
    commissionPaid: false
  });

  // Adjust salon's commissionDue only by the difference (commission was already added at booking time)
  if (commissionDiff !== 0) {
    await db.updateSalon(booking.salonId, {
      commissionDue: Math.max(0, (salon.commissionDue || 0) + commissionDiff)
    });
  }

  res.json({ success: true });
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

// Reviews endpoints
app.post('/api/reviews', authenticateJWT, async (req, res) => {
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

// Connect to Database first and then start server listening
const MONGODB_URI = process.env.MONGODB_URI;
db.connect(MONGODB_URI).then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Luxeluru backend running on http://0.0.0.0:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
  });
}).catch(err => {
  console.error('Failed to initialize database, shutting down:', err);
  process.exit(1);
});
