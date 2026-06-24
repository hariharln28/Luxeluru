import mongoose from 'mongoose';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const SQLITE_FILE = path.join(DATA_DIR, 'database.sqlite');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') {
      console.error('Error creating data directory:', err);
    }
  }
}

// ==========================================
// MongoDB Schema Definitions
// ==========================================
let MongoUser, MongoSalon, MongoBooking, MongoReview, MongoBlockedSlot, MongoNotification, MongoMessage, MongoAnnouncement;

function initMongoModels() {
  if (MongoUser) return;

  const userSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    createdAt: { type: String, required: true },
    preferredLanguage: { type: String },
    blockedUntil: { type: String }
  });

  const salonSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    tagline: { type: String },
    area: { type: String },
    address: { type: String },
    lat: { type: Number },
    lng: { type: Number },
    rating: { type: Number },
    reviewCount: { type: Number },
    categories: [String],
    image: { type: String },
    openHours: { type: String },
    phone: { type: String },
    email: { type: String },
    services: { type: mongoose.Schema.Types.Mixed },
    packages: { type: mongoose.Schema.Types.Mixed },
    staff: { type: mongoose.Schema.Types.Mixed },
    featured: { type: Boolean, default: false },
    password: { type: String },
    isActive: { type: Boolean, default: false },
    registrationStatus: { type: String, default: 'pending' },
    ownerName: { type: String },
    phoneOwner: { type: String },
    tradeLicenseUrl: { type: String },
    registeredAt: { type: String },
    commissionDue: { type: Number, default: 0 },
    commissionPaidUntil: { type: String },
    exitReason: { type: String },
    exitRequestStatus: { type: String },
    exitRejectReason: { type: String },
    bankDetails: { type: mongoose.Schema.Types.Mixed, default: [] },
    upiDetails: { type: mongoose.Schema.Types.Mixed, default: [] },
    commissionPaymentStatus: { type: String, default: 'pending' },
    commissionPaymentRef: { type: String },
    commissionSubmittedAt: { type: String },
    commissionLastClearedAt: { type: String },
    commissionLastClearedAmount: { type: Number, default: 0 }
  });

  const bookingSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    salonId: { type: String, required: true },
    salonName: { type: String },
    serviceIds: [String],
    serviceNames: [String],
    staffId: { type: String },
    staffName: { type: String },
    date: { type: String },
    time: { type: String },
    totalPrice: { type: Number },
    originalPrice: { type: Number },
    paymentMethod: { type: String },
    status: { type: String, default: 'confirmed' },
    createdAt: { type: String },
    feedbackRequestedAt: { type: String },
    feedbackSent: { type: Boolean, default: false },
    rating: { type: Number },
    review: { type: String },
    isPackageChanged: { type: Boolean, default: false },
    updatedPackageId: { type: String },
    updatedPackageName: { type: String },
    paymentUpdatedBySalon: { type: Boolean, default: false },
    commissionAmount: { type: Number, default: 0 },
    commissionPaid: { type: Boolean, default: false },
    reportedAsFake: { type: Boolean, default: false },
    fakeReportReason: { type: String },
    customImageUrl: { type: String },
    customMessage: { type: String },
    aiStyleRecommendation: { type: Object }
  });

  const reviewSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    bookingId: { type: String },
    salonId: { type: String },
    salonName: { type: String },
    userId: { type: String },
    userName: { type: String },
    rating: { type: Number },
    comment: { type: String },
    staffId: { type: String },
    staffName: { type: String },
    createdAt: { type: String }
  });

  const blockedSlotSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    salonId: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    customerName: { type: String },
    reason: { type: String },
    createdAt: { type: String, required: true }
  });

  const notificationSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    target: { type: String, required: true },
    type: { type: String },
    message: { type: String },
    createdAt: { type: String },
    read: { type: Boolean, default: false }
  });

  const messageSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    salonId: { type: String, required: true },
    sender: { type: String, required: true }, // 'admin' or 'salon'
    encryptedContent: { type: String, required: true },
    context: { type: String, default: 'direct' }, // 'direct' or 'exit-dispute'
    createdAt: { type: String, required: true },
    isRead: { type: Boolean, default: false }
  });

  const announcementSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    createdAt: { type: String, required: true },
    readBy: [String] // array of salonIds
  });

  MongoUser = mongoose.model('User', userSchema);
  MongoSalon = mongoose.model('Salon', salonSchema);
  MongoBooking = mongoose.model('Booking', bookingSchema);
  MongoReview = mongoose.model('Review', reviewSchema);
  MongoBlockedSlot = mongoose.model('BlockedSlot', blockedSlotSchema);
  MongoNotification = mongoose.model('Notification', notificationSchema);
  MongoMessage = mongoose.model('Message', messageSchema);
  MongoAnnouncement = mongoose.model('Announcement', announcementSchema);
}

// ==========================================
// SQLite Connection & Table Init
// ==========================================
let sqliteDb = null;

async function initSqlite() {
  await ensureDataDir();
  sqliteDb = await open({
    filename: SQLITE_FILE,
    driver: sqlite3.Database
  });

  await sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE,
      phone TEXT,
      password TEXT,
      createdAt TEXT,
      preferredLanguage TEXT,
      blockedUntil TEXT
    );

    CREATE TABLE IF NOT EXISTS salons (
      id TEXT PRIMARY KEY,
      name TEXT,
      tagline TEXT,
      area TEXT,
      address TEXT,
      lat REAL,
      lng REAL,
      rating REAL,
      reviewCount INTEGER,
      categories TEXT,
      image TEXT,
      openHours TEXT,
      phone TEXT,
      email TEXT,
      services TEXT,
      packages TEXT,
      staff TEXT,
      featured INTEGER,
      password TEXT,
      isActive INTEGER,
      registrationStatus TEXT,
      ownerName TEXT,
      phoneOwner TEXT,
      tradeLicenseUrl TEXT,
      registeredAt TEXT,
      commissionDue REAL,
      commissionPaidUntil TEXT,
      exitReason TEXT
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      userId TEXT,
      salonId TEXT,
      salonName TEXT,
      serviceIds TEXT,
      serviceNames TEXT,
      staffId TEXT,
      staffName TEXT,
      date TEXT,
      time TEXT,
      totalPrice REAL,
      originalPrice REAL,
      paymentMethod TEXT,
      status TEXT,
      createdAt TEXT,
      feedbackRequestedAt TEXT,
      feedbackSent INTEGER,
      rating REAL,
      review TEXT,
      isPackageChanged INTEGER,
      updatedPackageId TEXT,
      updatedPackageName TEXT,
      paymentUpdatedBySalon INTEGER,
      commissionAmount REAL,
      commissionPaid INTEGER,
      reportedAsFake INTEGER,
      fakeReportReason TEXT,
      customImageUrl TEXT,
      customMessage TEXT,
      aiStyleRecommendation TEXT
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      bookingId TEXT,
      salonId TEXT,
      salonName TEXT,
      userId TEXT,
      userName TEXT,
      rating REAL,
      comment TEXT,
      staffId TEXT,
      staffName TEXT,
      createdAt TEXT
    );

    CREATE TABLE IF NOT EXISTS blocked_slots (
      id TEXT PRIMARY KEY,
      salonId TEXT,
      date TEXT,
      time TEXT,
      customerName TEXT,
      reason TEXT,
      createdAt TEXT
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      target TEXT,
      type TEXT,
      message TEXT,
      createdAt TEXT,
      read INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      salonId TEXT NOT NULL,
      sender TEXT NOT NULL,
      encryptedContent TEXT NOT NULL,
      context TEXT DEFAULT 'direct',
      createdAt TEXT NOT NULL,
      isRead INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      readBy TEXT DEFAULT '[]'
    );
  `);

  try {
    await sqliteDb.run("ALTER TABLE bookings ADD COLUMN customImageUrl TEXT");
  } catch (e) { /* already exists */ }
  try {
    await sqliteDb.run("ALTER TABLE bookings ADD COLUMN customMessage TEXT");
  } catch (e) { /* already exists */ }
  try {
    await sqliteDb.run("ALTER TABLE bookings ADD COLUMN aiStyleRecommendation TEXT");
  } catch (e) { /* already exists */ }
  try { await sqliteDb.run("ALTER TABLE bookings ADD COLUMN payoutAmount REAL"); } catch (e) { /* already exists */ }
  try { await sqliteDb.run("ALTER TABLE bookings ADD COLUMN payoutStatus TEXT"); } catch (e) { /* already exists */ }
  try { await sqliteDb.run("ALTER TABLE bookings ADD COLUMN appointmentTaken INTEGER DEFAULT 0"); } catch (e) { /* already exists */ }
  try { await sqliteDb.run("ALTER TABLE bookings ADD COLUMN paymentVerifiedBySalon INTEGER DEFAULT 0"); } catch (e) { /* already exists */ }
  try { await sqliteDb.run("ALTER TABLE bookings ADD COLUMN salonNotes TEXT"); } catch (e) { /* already exists */ }
  try { await sqliteDb.run("ALTER TABLE bookings ADD COLUMN paymentStatus TEXT"); } catch (e) { /* already exists */ }
  try { await sqliteDb.run("ALTER TABLE bookings ADD COLUMN modifiedServices TEXT"); } catch (e) { /* already exists */ }
  try { await sqliteDb.run("ALTER TABLE bookings ADD COLUMN modifiedServiceNames TEXT"); } catch (e) { /* already exists */ }
  try { await sqliteDb.run("ALTER TABLE bookings ADD COLUMN modifiedPrice REAL"); } catch (e) { /* already exists */ }

  try { await sqliteDb.run("ALTER TABLE salons ADD COLUMN exitRequestStatus TEXT"); } catch (e) { /* already exists */ }
  try { await sqliteDb.run("ALTER TABLE salons ADD COLUMN exitRejectReason TEXT"); } catch (e) { /* already exists */ }
  try { await sqliteDb.run("ALTER TABLE salons ADD COLUMN panCardOwner TEXT"); } catch (e) { /* already exists */ }
  try { await sqliteDb.run("ALTER TABLE salons ADD COLUMN panCardBusiness TEXT"); } catch (e) { /* already exists */ }
  try { await sqliteDb.run("ALTER TABLE salons ADD COLUMN bankDetails TEXT"); } catch (e) { /* already exists */ }
  try { await sqliteDb.run("ALTER TABLE salons ADD COLUMN upiDetails TEXT"); } catch (e) { /* already exists */ }
  try { await sqliteDb.run("ALTER TABLE bookings ADD COLUMN payoutReference TEXT"); } catch (e) { /* already exists */ }
  try { await sqliteDb.run("ALTER TABLE bookings ADD COLUMN payoutMethod TEXT"); } catch (e) { /* already exists */ }
  try { await sqliteDb.run("ALTER TABLE bookings ADD COLUMN payoutInitiatedAt TEXT"); } catch (e) { /* already exists */ }
  // Commission payment tracking for pay-at-salon
  try { await sqliteDb.run("ALTER TABLE salons ADD COLUMN commissionPaymentStatus TEXT DEFAULT 'pending'"); } catch (e) { /* already exists */ }
  try { await sqliteDb.run("ALTER TABLE salons ADD COLUMN commissionPaymentRef TEXT"); } catch (e) { /* already exists */ }
  try { await sqliteDb.run("ALTER TABLE salons ADD COLUMN commissionSubmittedAt TEXT"); } catch (e) { /* already exists */ }
  try { await sqliteDb.run("ALTER TABLE salons ADD COLUMN commissionLastClearedAt TEXT"); } catch (e) { /* already exists */ }
  try { await sqliteDb.run("ALTER TABLE salons ADD COLUMN commissionLastClearedAmount REAL DEFAULT 0"); } catch (e) { /* already exists */ }
}

// Helper to convert SQLite row objects back to standard JS objects (parsing JSON strings)
function mapSqlUser(u) {
  if (!u) return null;
  return { ...u };
}

function mapSqlSalon(s) {
  if (!s) return null;
  return {
    ...s,
    featured: Boolean(s.featured),
    isActive: Boolean(s.isActive),
    categories: s.categories ? JSON.parse(s.categories) : [],
    services: s.services ? JSON.parse(s.services) : [],
    packages: s.packages ? JSON.parse(s.packages) : [],
    staff: s.staff ? JSON.parse(s.staff) : [],
    bankDetails: s.bankDetails ? JSON.parse(s.bankDetails) : [],
    upiDetails: s.upiDetails ? JSON.parse(s.upiDetails) : []
  };
}

function mapSqlBooking(b) {
  if (!b) return null;
  return {
    ...b,
    feedbackSent: Boolean(b.feedbackSent),
    isPackageChanged: Boolean(b.isPackageChanged),
    paymentUpdatedBySalon: Boolean(b.paymentUpdatedBySalon),
    commissionPaid: Boolean(b.commissionPaid),
    reportedAsFake: Boolean(b.reportedAsFake),
    serviceIds: b.serviceIds ? JSON.parse(b.serviceIds) : [],
    serviceNames: b.serviceNames ? JSON.parse(b.serviceNames) : [],
    aiStyleRecommendation: b.aiStyleRecommendation ? JSON.parse(b.aiStyleRecommendation) : undefined
  };
}

function mapSqlReview(r) {
  if (!r) return null;
  return { ...r };
}

// ==========================================
// Database Adapter Implementation
// ==========================================
class DatabaseManager {
  constructor() {
    this.mode = 'sqlite'; // Default mode
  }

  async connect(uri) {
    if (uri) {
      try {
        console.log('Connecting to MongoDB database...');
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
        initMongoModels();
        this.mode = 'mongodb';
        console.log('Successfully connected to MongoDB.');
        return;
      } catch (err) {
        console.error('MongoDB connection failed, falling back to SQLite:', err.message);
      }
    }
    console.log('Initializing SQLite database...');
    await initSqlite();
    this.mode = 'sqlite';
    console.log('SQLite database initialized at:', SQLITE_FILE);
  }

  // USERS
  async getUsers() {
    if (this.mode === 'mongodb') {
      const docs = await MongoUser.find({});
      return docs.map(d => d.toObject());
    } else {
      const rows = await sqliteDb.all('SELECT * FROM users');
      return rows.map(mapSqlUser);
    }
  }

  async getUser(id) {
    if (this.mode === 'mongodb') {
      const doc = await MongoUser.findOne({ id });
      return doc ? doc.toObject() : null;
    } else {
      const row = await sqliteDb.get('SELECT * FROM users WHERE id = ?', id);
      return mapSqlUser(row);
    }
  }

  async createUser(userData) {
    if (this.mode === 'mongodb') {
      const doc = new MongoUser(userData);
      await doc.save();
      return doc.toObject();
    } else {
      await sqliteDb.run(
        `INSERT INTO users (id, name, email, phone, password, createdAt, preferredLanguage, blockedUntil)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        userData.id,
        userData.name,
        userData.email,
        userData.phone,
        userData.password,
        userData.createdAt,
        userData.preferredLanguage || null,
        userData.blockedUntil || null
      );
      return userData;
    }
  }

  async updateUser(id, updates) {
    if (this.mode === 'mongodb') {
      const doc = await MongoUser.findOneAndUpdate({ id }, { $set: updates }, { new: true });
      return doc ? doc.toObject() : null;
    } else {
      const keys = Object.keys(updates);
      if (keys.length === 0) return this.getUser(id);
      
      const setClause = keys.map(k => `${k} = ?`).join(', ');
      const values = keys.map(k => updates[k]);
      values.push(id);

      await sqliteDb.run(`UPDATE users SET ${setClause} WHERE id = ?`, ...values);
      return this.getUser(id);
    }
  }

  // SALONS
  async getSalons() {
    if (this.mode === 'mongodb') {
      const docs = await MongoSalon.find({});
      return docs.map(d => d.toObject());
    } else {
      const rows = await sqliteDb.all('SELECT * FROM salons');
      return rows.map(mapSqlSalon);
    }
  }

  async getSalon(id) {
    if (this.mode === 'mongodb') {
      const doc = await MongoSalon.findOne({ id });
      return doc ? doc.toObject() : null;
    } else {
      const row = await sqliteDb.get('SELECT * FROM salons WHERE id = ?', id);
      return mapSqlSalon(row);
    }
  }

  async createSalon(salonData) {
    if (this.mode === 'mongodb') {
      const doc = new MongoSalon(salonData);
      await doc.save();
      return doc.toObject();
    } else {
      await sqliteDb.run(
        `INSERT INTO salons (id, name, tagline, area, address, lat, lng, rating, reviewCount, categories,
         image, openHours, phone, email, services, packages, staff, featured, password, isActive,
         registrationStatus, ownerName, phoneOwner, tradeLicenseUrl, registeredAt, commissionDue,
         commissionPaidUntil, exitReason, panCardOwner, panCardBusiness, bankDetails, upiDetails)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        salonData.id,
        salonData.name,
        salonData.tagline || null,
        salonData.area || null,
        salonData.address || null,
        salonData.lat || null,
        salonData.lng || null,
        salonData.rating || 5.0,
        salonData.reviewCount || 0,
        JSON.stringify(salonData.categories || []),
        salonData.image || null,
        salonData.openHours || null,
        salonData.phone || null,
        salonData.email || null,
        JSON.stringify(salonData.services || []),
        JSON.stringify(salonData.packages || []),
        JSON.stringify(salonData.staff || []),
        salonData.featured ? 1 : 0,
        salonData.password || null,
        salonData.isActive ? 1 : 0,
        salonData.registrationStatus || 'pending',
        salonData.ownerName || null,
        salonData.phoneOwner || null,
        salonData.tradeLicenseUrl || null,
        salonData.registeredAt || null,
        salonData.commissionDue || 0,
        salonData.commissionPaidUntil || null,
        salonData.exitReason || null,
        salonData.panCardOwner || null,
        salonData.panCardBusiness || null,
        JSON.stringify(salonData.bankDetails || []),
        JSON.stringify(salonData.upiDetails || [])
      );
      return salonData;
    }
  }

  async updateSalon(id, updates) {
    if (this.mode === 'mongodb') {
      const doc = await MongoSalon.findOneAndUpdate({ id }, { $set: updates }, { new: true });
      return doc ? doc.toObject() : null;
    } else {
      const keys = Object.keys(updates);
      if (keys.length === 0) return this.getSalon(id);

      const setClause = keys.map(k => `${k} = ?`).join(', ');
      const values = keys.map(k => {
        const val = updates[k];
        if (Array.isArray(val) || typeof val === 'object') {
          return JSON.stringify(val);
        }
        if (typeof val === 'boolean') {
          return val ? 1 : 0;
        }
        return val;
      });
      values.push(id);

      await sqliteDb.run(`UPDATE salons SET ${setClause} WHERE id = ?`, ...values);
      return this.getSalon(id);
    }
  }

  async deleteSalon(id) {
    if (this.mode === 'mongodb') {
      await MongoSalon.deleteOne({ id });
    } else {
      await sqliteDb.run('DELETE FROM salons WHERE id = ?', id);
    }
  }

  // BOOKINGS
  async getBookings() {
    if (this.mode === 'mongodb') {
      const docs = await MongoBooking.find({});
      return docs.map(d => d.toObject());
    } else {
      const rows = await sqliteDb.all('SELECT * FROM bookings');
      return rows.map(mapSqlBooking);
    }
  }

  async getBooking(id) {
    if (this.mode === 'mongodb') {
      const doc = await MongoBooking.findOne({ id });
      return doc ? doc.toObject() : null;
    } else {
      const row = await sqliteDb.get('SELECT * FROM bookings WHERE id = ?', id);
      return mapSqlBooking(row);
    }
  }

  async createBooking(bData) {
    if (this.mode === 'mongodb') {
      const doc = new MongoBooking(bData);
      await doc.save();
      return doc.toObject();
    } else {
      await sqliteDb.run(
        `INSERT INTO bookings (id, userId, salonId, salonName, serviceIds, serviceNames, staffId, staffName,
         date, time, totalPrice, originalPrice, paymentMethod, status, createdAt, feedbackRequestedAt,
         feedbackSent, rating, review, isPackageChanged, updatedPackageId, updatedPackageName,
         paymentUpdatedBySalon, commissionAmount, commissionPaid, reportedAsFake, fakeReportReason,
         customImageUrl, customMessage, aiStyleRecommendation)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        bData.id,
        bData.userId,
        bData.salonId,
        bData.salonName || null,
        JSON.stringify(bData.serviceIds || []),
        JSON.stringify(bData.serviceNames || []),
        bData.staffId || null,
        bData.staffName || null,
        bData.date || null,
        bData.time || null,
        bData.totalPrice || null,
        bData.originalPrice || null,
        bData.paymentMethod || null,
        bData.status || 'confirmed',
        bData.createdAt || null,
        bData.feedbackRequestedAt || null,
        bData.feedbackSent ? 1 : 0,
        bData.rating || null,
        bData.review || null,
        bData.isPackageChanged ? 1 : 0,
        bData.updatedPackageId || null,
        bData.updatedPackageName || null,
        bData.paymentUpdatedBySalon ? 1 : 0,
        bData.commissionAmount || 0,
        bData.commissionPaid ? 1 : 0,
        bData.reportedAsFake ? 1 : 0,
        bData.fakeReportReason || null,
        bData.customImageUrl || null,
        bData.customMessage || null,
        bData.aiStyleRecommendation ? JSON.stringify(bData.aiStyleRecommendation) : null
      );
      return bData;
    }
  }

  async updateBooking(id, updates) {
    if (this.mode === 'mongodb') {
      const doc = await MongoBooking.findOneAndUpdate({ id }, { $set: updates }, { new: true });
      return doc ? doc.toObject() : null;
    } else {
      const keys = Object.keys(updates);
      if (keys.length === 0) return this.getBooking(id);

      const setClause = keys.map(k => `${k} = ?`).join(', ');
      const values = keys.map(k => {
        const val = updates[k];
        if (Array.isArray(val) || typeof val === 'object') {
          return JSON.stringify(val);
        }
        if (typeof val === 'boolean') {
          return val ? 1 : 0;
        }
        return val;
      });
      values.push(id);

      await sqliteDb.run(`UPDATE bookings SET ${setClause} WHERE id = ?`, ...values);
      return this.getBooking(id);
    }
  }

  // REVIEWS
  async getReviews() {
    if (this.mode === 'mongodb') {
      const docs = await MongoReview.find({});
      return docs.map(d => d.toObject());
    } else {
      const rows = await sqliteDb.all('SELECT * FROM reviews');
      return rows.map(mapSqlReview);
    }
  }

  async createReview(revData) {
    if (this.mode === 'mongodb') {
      const doc = new MongoReview(revData);
      await doc.save();
      return doc.toObject();
    } else {
      await sqliteDb.run(
        `INSERT INTO reviews (id, bookingId, salonId, salonName, userId, userName, rating, comment, staffId, staffName, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        revData.id,
        revData.bookingId || null,
        revData.salonId || null,
        revData.salonName || null,
        revData.userId || null,
        revData.userName || null,
        revData.rating || 5.0,
        revData.comment || null,
        revData.staffId || null,
        revData.staffName || null,
        revData.createdAt || null
      );
      return revData;
    }
  }

  // ─── Blocked Slots ───────────────────────
  async getBlockedSlots(salonId) {
    if (this.mode === 'mongodb') {
      const docs = await MongoBlockedSlot.find({ salonId });
      return docs.map(d => d.toObject());
    } else {
      const rows = await sqliteDb.all('SELECT * FROM blocked_slots WHERE salonId = ?', salonId);
      return rows;
    }
  }

  async addBlockedSlot(slotData) {
    if (this.mode === 'mongodb') {
      const doc = new MongoBlockedSlot(slotData);
      await doc.save();
      return slotData;
    } else {
      await sqliteDb.run(
        `INSERT INTO blocked_slots (id, salonId, date, time, customerName, reason, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        slotData.id,
        slotData.salonId,
        slotData.date,
        slotData.time,
        slotData.customerName || null,
        slotData.reason || null,
        slotData.createdAt
      );
      return slotData;
    }
  }

  async removeBlockedSlot(id) {
    if (this.mode === 'mongodb') {
      await MongoBlockedSlot.deleteOne({ id });
    } else {
      await sqliteDb.run('DELETE FROM blocked_slots WHERE id = ?', id);
    }
    return true;
  }

  // NOTIFICATIONS
  async getNotifications(target) {
    if (this.mode === 'mongodb') {
      const docs = target
        ? await MongoNotification.find({ target })
        : await MongoNotification.find({});
      return docs.map(d => d.toObject());
    } else {
      const rows = target
        ? await sqliteDb.all('SELECT * FROM notifications WHERE target = ? ORDER BY createdAt DESC', target)
        : await sqliteDb.all('SELECT * FROM notifications ORDER BY createdAt DESC');
      return rows.map(r => ({ ...r, read: Boolean(r.read) }));
    }
  }

  async createNotification(nData) {
    if (this.mode === 'mongodb') {
      const doc = new MongoNotification(nData);
      await doc.save();
      return doc.toObject();
    } else {
      await sqliteDb.run(
        `INSERT INTO notifications (id, target, type, message, createdAt, read) VALUES (?, ?, ?, ?, ?, ?)`,
        nData.id,
        nData.target,
        nData.type || null,
        nData.message || null,
        nData.createdAt || new Date().toISOString(),
        0
      );
      return nData;
    }
  }

  async markNotificationRead(id) {
    if (this.mode === 'mongodb') {
      await MongoNotification.findOneAndUpdate({ id }, { $set: { read: true } });
    } else {
      await sqliteDb.run('UPDATE notifications SET read = 1 WHERE id = ?', id);
    }
    return true;
  }

  async markAllNotificationsRead(target) {
    if (this.mode === 'mongodb') {
      await MongoNotification.updateMany({ target }, { $set: { read: true } });
    } else {
      await sqliteDb.run('UPDATE notifications SET read = 1 WHERE target = ?', target);
    }
    return true;
  }

  // Dynamic Seeding Helper
  async seed(data) {
    const { salons, users, bookings, reviews } = data;

    if (salons && salons.length > 0) {
      const existing = await this.getSalons();
      if (existing.length === 0) {
        console.log(`Seeding ${salons.length} salons...`);
        for (const s of salons) {
          await this.createSalon(s);
        }
      }
    }

    if (users && users.length > 0) {
      const existing = await this.getUsers();
      if (existing.length === 0) {
        console.log(`Seeding ${users.length} users...`);
        for (const u of users) {
          await this.createUser(u);
        }
      }
    }

    if (bookings && bookings.length > 0) {
      const existing = await this.getBookings();
      if (existing.length === 0) {
        console.log(`Seeding ${bookings.length} bookings...`);
        for (const b of bookings) {
          await this.createBooking(b);
        }
      }
    }

    if (reviews && reviews.length > 0) {
      const existing = await this.getReviews();
      if (existing.length === 0) {
        console.log(`Seeding ${reviews.length} reviews...`);
        for (const r of reviews) {
          await this.createReview(r);
        }
      }
    }
    console.log('Seeding process completed.');
  }

  // MESSAGES
  async getMessages(salonId) {
    if (this.mode === 'mongodb') {
      const docs = await MongoMessage.find({ salonId }).sort({ createdAt: 1 });
      return docs.map(d => d.toObject());
    } else {
      const rows = await sqliteDb.all('SELECT * FROM messages WHERE salonId = ? ORDER BY createdAt ASC', salonId);
      return rows.map(r => ({ ...r, isRead: Boolean(r.isRead) }));
    }
  }

  async createMessage(data) {
    if (this.mode === 'mongodb') {
      const doc = new MongoMessage(data);
      await doc.save();
      return doc.toObject();
    } else {
      await sqliteDb.run(
        `INSERT INTO messages (id, salonId, sender, encryptedContent, context, createdAt, isRead)
         VALUES (?, ?, ?, ?, ?, ?, 0)`,
        data.id, data.salonId, data.sender, data.encryptedContent,
        data.context || 'direct', data.createdAt
      );
      return data;
    }
  }

  async markMessageRead(id) {
    if (this.mode === 'mongodb') {
      await MongoMessage.findOneAndUpdate({ id }, { $set: { isRead: true } });
    } else {
      await sqliteDb.run('UPDATE messages SET isRead = 1 WHERE id = ?', id);
    }
  }

  async getUnreadMessageCount(salonId, sender) {
    // sender = who sent the unread messages (i.e., the OTHER party's messages)
    if (this.mode === 'mongodb') {
      return MongoMessage.countDocuments({ salonId, sender, isRead: false });
    } else {
      const row = await sqliteDb.get(
        'SELECT COUNT(*) as count FROM messages WHERE salonId = ? AND sender = ? AND isRead = 0',
        salonId, sender
      );
      return row?.count || 0;
    }
  }

  // ANNOUNCEMENTS
  async getAnnouncements() {
    if (this.mode === 'mongodb') {
      const docs = await MongoAnnouncement.find({}).sort({ createdAt: -1 });
      return docs.map(d => d.toObject());
    } else {
      const rows = await sqliteDb.all('SELECT * FROM announcements ORDER BY createdAt DESC');
      return rows.map(r => ({ ...r, readBy: r.readBy ? JSON.parse(r.readBy) : [] }));
    }
  }

  async createAnnouncement(data) {
    if (this.mode === 'mongodb') {
      const doc = new MongoAnnouncement(data);
      await doc.save();
      return doc.toObject();
    } else {
      await sqliteDb.run(
        `INSERT INTO announcements (id, title, content, createdAt, readBy)
         VALUES (?, ?, ?, ?, '[]')`,
        data.id, data.title, data.content, data.createdAt
      );
      return data;
    }
  }

  async markAnnouncementReadBySalon(id, salonId) {
    if (this.mode === 'mongodb') {
      await MongoAnnouncement.findOneAndUpdate({ id }, { $addToSet: { readBy: salonId } });
    } else {
      const row = await sqliteDb.get('SELECT readBy FROM announcements WHERE id = ?', id);
      if (row) {
        const readBy = JSON.parse(row.readBy || '[]');
        if (!readBy.includes(salonId)) {
          readBy.push(salonId);
          await sqliteDb.run('UPDATE announcements SET readBy = ? WHERE id = ?', JSON.stringify(readBy), id);
        }
      }
    }
  }
}

export const db = new DatabaseManager();
