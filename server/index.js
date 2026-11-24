import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

app.use(cors());
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

const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SALONS_FILE = path.join(DATA_DIR, 'salons.json');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');
const REVIEWS_FILE = path.join(DATA_DIR, 'reviews.json');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('Error creating data directory:', err);
  }
}

// Read JSON data helper
async function readData(filePath, defaultVal = []) {
  await ensureDataDir();
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    if (err.code === 'ENOENT') {
      await writeData(filePath, defaultVal);
      return defaultVal;
    }
    console.error(`Error reading file ${filePath}:`, err);
    return defaultVal;
  }
}

// Write JSON data helper
async function writeData(filePath, data) {
  await ensureDataDir();
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error writing file ${filePath}:`, err);
  }
}

// Seed endpoint
app.post('/api/seed', async (req, res) => {
  const { salons, users, bookings, reviews } = req.body;
  
  const existingSalons = await readData(SALONS_FILE);
  if (existingSalons.length === 0 && salons) {
    await writeData(SALONS_FILE, salons);
  }
  
  const existingUsers = await readData(USERS_FILE);
  if (existingUsers.length === 0 && users) {
    await writeData(USERS_FILE, users);
  }

  const existingBookings = await readData(BOOKINGS_FILE);
  if (existingBookings.length === 0 && bookings) {
    await writeData(BOOKINGS_FILE, bookings);
  }

  const existingReviews = await readData(REVIEWS_FILE);
  if (existingReviews.length === 0 && reviews) {
    await writeData(REVIEWS_FILE, reviews);
  }

  res.json({ success: true, message: 'Seeding completed' });
});

// GET endpoints
app.get('/api/users', async (req, res) => {
  const users = await readData(USERS_FILE);
  res.json(users);
});

app.get('/api/salons', async (req, res) => {
  const salons = await readData(SALONS_FILE);
  res.json(salons);
});

app.get('/api/bookings', async (req, res) => {
  const bookings = await readData(BOOKINGS_FILE);
  res.json(bookings);
});

app.get('/api/reviews', async (req, res) => {
  const reviews = await readData(REVIEWS_FILE);
  res.json(reviews);
});

// Auth endpoints
app.post('/api/users/login', async (req, res) => {
  const { emailOrPhone, password } = req.body;
  const users = await readData(USERS_FILE);
  const normalised = emailOrPhone.trim().toLowerCase();
  
  const found = users.find(u => 
    (u.email.toLowerCase() === normalised || u.phone.replace(/\s+/g, '') === normalised.replace(/\s+/g, '')) &&
    (u.password === password || u.password === hashPassword(password))
  );

  if (found) {
    res.json({ success: true, user: found });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

app.post('/api/users/register', async (req, res) => {
  const userData = req.body;
  const users = await readData(USERS_FILE);

  if (users.some(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
    return res.status(400).json({ success: false, message: 'Email already registered' });
  }

  const newUser = {
    ...userData,
    password: hashPassword(userData.password),
    id: `user-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  await writeData(USERS_FILE, users);
  res.json({ success: true, user: newUser });
});

app.post('/api/users/:id/update', async (req, res) => {
  const { id } = req.params;
  const { updates } = req.body;
  const users = await readData(USERS_FILE);
  const idx = users.findIndex(u => u.id === id);

  if (idx >= 0) {
    users[idx] = { ...users[idx], ...updates };
    await writeData(USERS_FILE, users);
    res.json({ success: true, user: users[idx] });
  } else {
    res.status(404).json({ success: false, message: 'User not found' });
  }
});

app.post('/api/salons/login', async (req, res) => {
  const { name, id, email, password } = req.body;
  const salons = await readData(SALONS_FILE);
  
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
  const salons = await readData(SALONS_FILE);
  
  const cleanedName = data.name.trim().replace(/[^a-zA-Z]/g, '');
  const prefix = (cleanedName.slice(0, 3) || 'REG').toUpperCase();
  const randomDigits = Math.floor(100 + Math.random() * 900);
  const generatedId = `LL${prefix}${randomDigits}`;
  
  const newSalon = {
    id: generatedId,
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

  salons.push(newSalon);
  await writeData(SALONS_FILE, salons);
  res.json({ success: true, salonId: generatedId });
});

app.post('/api/salons/:id/exit', async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const salons = await readData(SALONS_FILE);
  const idx = salons.findIndex(s => s.id === id);

  if (idx >= 0) {
    salons[idx] = {
      ...salons[idx],
      isActive: false,
      registrationStatus: 'rejected',
      exitReason: reason
    };
    await writeData(SALONS_FILE, salons);
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, message: 'Salon not found' });
  }
});

app.post('/api/salons/:id/approve', async (req, res) => {
  const { id } = req.params;
  const salons = await readData(SALONS_FILE);
  const idx = salons.findIndex(s => s.id === id);

  if (idx >= 0) {
    salons[idx] = {
      ...salons[idx],
      registrationStatus: 'approved',
      isActive: true
    };
    await writeData(SALONS_FILE, salons);
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, message: 'Salon not found' });
  }
});

app.post('/api/salons/:id/reject', async (req, res) => {
  const { id } = req.params;
  const salons = await readData(SALONS_FILE);
  const idx = salons.findIndex(s => s.id === id);

  if (idx >= 0) {
    salons[idx] = {
      ...salons[idx],
      registrationStatus: 'rejected',
      isActive: false
    };
    await writeData(SALONS_FILE, salons);
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, message: 'Salon not found' });
  }
});

app.post('/api/salons/:id/force-deactivate', async (req, res) => {
  const { id } = req.params;
  const salons = await readData(SALONS_FILE);
  const idx = salons.findIndex(s => s.id === id);

  if (idx >= 0) {
    salons[idx] = {
      ...salons[idx],
      isActive: false
    };
    await writeData(SALONS_FILE, salons);
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, message: 'Salon not found' });
  }
});

app.post('/api/salons/:id/pay-commission', async (req, res) => {
  const { id } = req.params;
  const salons = await readData(SALONS_FILE);
  const idx = salons.findIndex(s => s.id === id);

  if (idx >= 0) {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);
    
    salons[idx] = {
      ...salons[idx],
      commissionDue: 0,
      commissionPaidUntil: nextMonth.toISOString().split('T')[0],
      isActive: true
    };
    
    await writeData(SALONS_FILE, salons);
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
  const users = await readData(USERS_FILE);
  const idx = users.findIndex(u => u.id === userId);

  if (idx >= 0) {
    users[idx].blockedUntil = blockedUntil;
    await writeData(USERS_FILE, users);
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, message: 'User not found' });
  }
});

app.post('/api/admin/unblock-user', async (req, res) => {
  const { userId } = req.body;
  const users = await readData(USERS_FILE);
  const idx = users.findIndex(u => u.id === userId);

  if (idx >= 0) {
    delete users[idx].blockedUntil;
    await writeData(USERS_FILE, users);
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, message: 'User not found' });
  }
});

// Bookings endpoints
app.post('/api/bookings', async (req, res) => {
  const bookingData = req.body;
  const bookings = await readData(BOOKINGS_FILE);

  const newBooking = {
    ...bookingData,
    id: `bk-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: 'confirmed'
  };

  bookings.push(newBooking);
  await writeData(BOOKINGS_FILE, bookings);
  res.json({ success: true, booking: newBooking });
});

app.post('/api/bookings/:id/cancel', async (req, res) => {
  const { id } = req.params;
  const bookings = await readData(BOOKINGS_FILE);
  const idx = bookings.findIndex(b => b.id === id);

  if (idx >= 0) {
    bookings[idx].status = 'cancelled';
    await writeData(BOOKINGS_FILE, bookings);
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, message: 'Booking not found' });
  }
});

app.post('/api/bookings/:id/reschedule', async (req, res) => {
  const { id } = req.params;
  const { date, time } = req.body;
  const bookings = await readData(BOOKINGS_FILE);
  const idx = bookings.findIndex(b => b.id === id);

  if (idx >= 0) {
    bookings[idx].date = date;
    bookings[idx].time = time;
    await writeData(BOOKINGS_FILE, bookings);
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, message: 'Booking not found' });
  }
});

app.post('/api/bookings/:id/update', async (req, res) => {
  const { id } = req.params;
  const { paymentMethod, packageId } = req.body;
  const bookings = await readData(BOOKINGS_FILE);
  const salons = await readData(SALONS_FILE);
  const idx = bookings.findIndex(b => b.id === id);

  if (idx >= 0) {
    const booking = bookings[idx];
    const salon = salons.find(s => s.id === booking.salonId);

    if (!salon) {
      return res.status(404).json({ success: false, message: 'Salon not found for this booking' });
    }

    let finalPrice = booking.totalPrice;
    let originalPrice = booking.originalPrice || booking.totalPrice;
    let isPackageChanged = false;
    let updatedPackageId = undefined;
    let updatedPackageName = undefined;

    if (packageId) {
      const pkg = salon.packages.find(p => p.id === packageId);
      if (pkg) {
        finalPrice = pkg.price;
        isPackageChanged = true;
        updatedPackageId = pkg.id;
        updatedPackageName = pkg.name;
      }
    }

    const commissionAmount = Math.round(finalPrice * 0.05);

    // Update booking fields
    bookings[idx] = {
      ...booking,
      status: 'completed',
      paymentMethod,
      totalPrice: finalPrice,
      originalPrice,
      isPackageChanged,
      updatedPackageId,
      updatedPackageName,
      paymentUpdatedBySalon: true,
      commissionAmount,
      commissionPaid: false
    };

    // Update salon's cumulative commissionDue
    const salonIdx = salons.findIndex(s => s.id === booking.salonId);
    if (salonIdx >= 0) {
      salons[salonIdx].commissionDue = (salons[salonIdx].commissionDue || 0) + commissionAmount;
      await writeData(SALONS_FILE, salons);
    }

    await writeData(BOOKINGS_FILE, bookings);
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, message: 'Booking not found' });
  }
});

app.post('/api/bookings/:id/report-fake', async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const bookings = await readData(BOOKINGS_FILE);
  const idx = bookings.findIndex(b => b.id === id);

  if (idx >= 0) {
    bookings[idx].reportedAsFake = true;
    bookings[idx].fakeReportReason = reason;
    await writeData(BOOKINGS_FILE, bookings);
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, message: 'Booking not found' });
  }
});

// Reviews endpoints
app.post('/api/reviews', async (req, res) => {
  const reviewData = req.body;
  const reviews = await readData(REVIEWS_FILE);
  const bookings = await readData(BOOKINGS_FILE);
  const salons = await readData(SALONS_FILE);

  const newReview = {
    ...reviewData,
    id: `rev-${Date.now()}`,
    createdAt: new Date().toISOString()
  };

  reviews.push(newReview);
  await writeData(REVIEWS_FILE, reviews);

  // Mark corresponding booking as reviewed
  if (reviewData.bookingId) {
    const bookingIdx = bookings.findIndex(b => b.id === reviewData.bookingId);
    if (bookingIdx >= 0) {
      bookings[bookingIdx].feedbackSent = true;
      bookings[bookingIdx].rating = reviewData.rating;
      bookings[bookingIdx].review = reviewData.comment;
      await writeData(BOOKINGS_FILE, bookings);
    }
  }

  // Update staff and salon ratings if applicable
  if (reviewData.staffId && reviewData.salonId) {
    const salonIdx = salons.findIndex(s => s.id === reviewData.salonId);
    if (salonIdx >= 0) {
      const salon = salons[salonIdx];
      const staffIdx = salon.staff.findIndex(st => st.id === reviewData.staffId);
      
      if (staffIdx >= 0) {
        const staff = salon.staff[staffIdx];
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

      await writeData(SALONS_FILE, salons);
    }
  }

  res.json({ success: true, review: newReview });
});

// Health check endpoint for frontend connectivity detection
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// Salon password change (after approval, salon can set their own password)
app.post('/api/salons/:id/change-password', async (req, res) => {
  const { id } = req.params;
  const { currentPassword, newPassword } = req.body;
  const salons = await readData(SALONS_FILE);
  const idx = salons.findIndex(s => s.id === id);

  if (idx < 0) {
    return res.status(404).json({ success: false, message: 'Salon not found' });
  }

  const salon = salons[idx];
  if (salon.password !== currentPassword && salon.password !== hashPassword(currentPassword)) {
    return res.status(401).json({ success: false, message: 'Current password is incorrect' });
  }

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
  }

  salons[idx].password = hashPassword(newPassword);
  await writeData(SALONS_FILE, salons);
  res.json({ success: true, message: 'Password updated successfully' });
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

app.listen(PORT, () => {
  console.log(`Luxeluru backend running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Data stored in: ${DATA_DIR}`);
});
