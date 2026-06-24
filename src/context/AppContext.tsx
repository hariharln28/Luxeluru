import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type {
  User,
  Booking,
  Language,
  Toast,
  StaffReview,
  StyleRecommendation,
  Salon,
  Staff,
  PaymentMethod,
  BlockedSlot,
  Notification,
  Message,
  Announcement,
  ClosedDay,
} from '../types';
import { encryptMessage, decryptMessage } from '../utils/encryption';
import { salons as defaultSalons } from '../data/salons';
import { scheduleFeedbackRequest } from '../utils/notifications';
import { api, setAuthToken } from '../services/api';
import { supabase, supabaseConfigured } from '../services/supabaseClient';

interface AppContextType {
  user: User | null;
  users: User[];
  salon: Salon | null;
  isAdmin: boolean;
  language: Language;
  setLanguage: (lang: Language) => void;
  login: (emailOrPhone: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  salonLogin: (name: string, id: string, email: string, checkPass: string) => Promise<boolean>;
  adminLogin: (userStr: string, passStr: string) => Promise<boolean>;
  register: (data: Omit<User, 'id' | 'createdAt'>) => Promise<boolean>;
  salonRegister: (data: {
    ownerName: string;
    name: string;
    address: string;
    email: string;
    phone: string;
    phoneOwner: string;
    tradeLicenseUrl: string;
    panCardOwner?: string;
    panCardBusiness?: string;
  }) => Promise<string>;
  salonExit: (salonId: string, reason: string) => Promise<boolean>;
  approveSalonExit: (salonId: string) => Promise<boolean>;
  rejectSalonExit: (salonId: string, rejectReason: string) => Promise<boolean>;
  logout: () => void;
  bookings: Booking[];
  createBooking: (booking: Omit<Booking, 'id' | 'createdAt' | 'status' | 'userId'>) => Promise<Booking>;
  cancelBooking: (id: string) => void;
  rescheduleBooking: (id: string, date: string, time: string) => Promise<boolean>;
  updateBookingPayment: (id: string, paymentMethod: PaymentMethod, packageId?: string) => void;
  reportFakeBooking: (id: string, reason: string) => void;
  verifyBookingStatus: (id: string, data: { appointmentTaken?: boolean; paymentVerifiedBySalon?: boolean; paymentMethod?: string; salonNotes?: string }) => void;
  modifyBookingServices: (id: string, modifiedServices: string[], modifiedServiceNames: string[], modifiedPrice: number) => void;
  staffReviews: StaffReview[];
  addStaffReview: (review: Omit<StaffReview, 'id' | 'createdAt'>) => void;
  styleRecommendation: StyleRecommendation | null;
  setStyleRecommendation: (rec: StyleRecommendation | null) => void;
  userLocation: { lat: number; lng: number } | null;
  requestLocation: () => void;
  toasts: Toast[];
  addToast: (type: Toast['type'], message: string) => void;
  removeToast: (id: string) => void;
  salons: Salon[];
  activeSalons: Salon[];
  paySalonCommission: (salonId: string) => void;
  updateUserProfile: (updates: Partial<User>) => void;
  approveSalon: (salonId: string) => void;
  rejectSalon: (salonId: string) => void;
  removeSalonForcefully: (salonId: string) => void;
  deleteSalonPermanently: (salonId: string) => Promise<void>;
  updateSalonLocation: (salonId: string, address: string, lat: number, lng: number) => Promise<void>;
  updateSalonStaff: (salonId: string, staff: Staff[]) => Promise<void>;
  blockUserForcefully: (userId: string, dateStr: string) => void;
  unblockUserForcefully: (userId: string) => void;
  isUserBlocked: (userId: string) => { blocked: boolean; reason?: string; until?: string };
  blockedSlots: BlockedSlot[];
  fetchBlockedSlots: (salonId: string) => Promise<BlockedSlot[]>;
  blockSlot: (salonId: string, date: string, time: string, customerName?: string, reason?: string) => Promise<boolean>;
  unblockSlot: (salonId: string, slotId: string) => Promise<boolean>;
  // Closed Days
  closedDays: ClosedDay[];
  fetchClosedDays: (salonId: string) => Promise<ClosedDay[]>;
  closeDay: (salonId: string, date: string, reason?: string) => Promise<boolean>;
  openDay: (salonId: string, date: string) => Promise<boolean>;
  refreshData: () => Promise<void>;
  notifications: Notification[];
  fetchNotifications: (target: string) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: (target: string) => Promise<void>;
  // Messaging
  messages: Message[];
  announcements: Announcement[];
  sendDirectMessage: (salonId: string, plaintext: string, sender: 'admin' | 'salon', context?: 'direct' | 'exit-dispute') => Promise<boolean>;
  fetchMessages: (salonId: string) => Promise<void>;
  createAnnouncement: (title: string, content: string) => Promise<boolean>;
  markAnnouncementRead: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEYS = {
  users: 'luxeluru_users',
  session: 'luxeluru_session',
  bookings: 'luxeluru_bookings',
  reviews: 'luxeluru_reviews',
  language: 'luxeluru_language',
  salons: 'luxeluru_salons',
  salonSession: 'luxeluru_salon_session',
  salonSessionTimestamp: 'luxeluru_salon_session_ts',
  adminSession: 'luxeluru_admin_session',
};

const SALON_SESSION_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours

// Session auth keys use sessionStorage → auto-clears when browser/tab closes
const sessionStore = {
  get: (key: string) => sessionStorage.getItem(key),
  set: (key: string, val: string) => sessionStorage.setItem(key, val),
  remove: (key: string) => sessionStorage.removeItem(key),
};

// Local storage fallback helpers in case backend is unreachable
function loadLocalUsers(): User[] {
  try {
    const list: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.users) || '[]');
    const hasTestUser = list.some(u => u.email.toLowerCase() === 'adminuser1@test.com');
    if (!hasTestUser) {
      const testUser: User = {
        id: 'usr-admin-test',
        name: 'Admin Test User',
        email: 'adminuser1@test.com',
        phone: '+919999999999',
        password: 'user@admin-test789',
        createdAt: new Date().toISOString(),
        preferredLanguage: 'en',
      };
      const updated = [...list, testUser];
      localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(updated));
      return updated;
    }
    return list;
  } catch {
    return [];
  }
}

function loadLocalSalons(): Salon[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.salons);
    let list: Salon[] = [];
    if (!data) {
      list = defaultSalons;
    } else {
      list = JSON.parse(data);
    }

    const hasTestSalon = list.some(s => s.id.toLowerCase() === 'lllux456');
    if (!hasTestSalon) {
      const testSalon: Salon = {
        id: 'LLLUX456',
        name: 'luxury salon admin',
        tagline: 'Premium Test Salon for Admin',
        area: 'Indiranagar',
        address: 'Test Address, Indiranagar, Bengaluru',
        lat: 12.9784,
        lng: 77.6408,
        rating: 4.8,
        reviewCount: 150,
        categories: ['hair', 'skin'],
        image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80',
        openHours: '10:00 AM - 8:00 PM',
        phone: '+919999988888',
        email: 'luxurysalonadmin@test.com',
        featured: false,
        commissionPaidUntil: '2026-07-01',
        commissionDue: 0,
        password: 'salon@admin-test789',
        isActive: true,
        registrationStatus: 'approved',
        ownerName: 'Admin Owner',
        phoneOwner: '+919999988888',
        tradeLicenseUrl: 'test_license.pdf',
        services: [
          { id: 'ts-1', name: 'Premium Haircut', duration: 45, price: 1500, category: 'hair' },
          { id: 'ts-2', name: 'Face Spa', duration: 60, price: 2000, category: 'skin' }
        ],
        packages: [],
        staff: [
          {
            id: 'ts-staff-1',
            name: 'Expert Barber',
            role: 'Master Barber',
            rating: 4.9,
            reviewCount: 88,
            specialties: ['Grooming'],
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ExpertBarber'
          }
        ]
      };
      const updated = [...list, testSalon];
      localStorage.setItem(STORAGE_KEYS.salons, JSON.stringify(updated));
      return updated;
    }

    // Patch: fix broken/duplicate image URLs for specific salons
    const imageFixes: Record<string, string> = {
      'LLECL981': 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=800&q=80',
      'LLNIR725': 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=800&q=80',
      'LLOLA824': 'https://images.unsplash.com/photo-1470259078422-826894b933aa?w=800&q=80',
      'LLHAI372': 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&q=80',
      'LLBLU756': 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=800&q=80',
    };
    let patched = false;
    for (const s of list) {
      if (imageFixes[s.id] && s.image !== imageFixes[s.id]) {
        s.image = imageFixes[s.id];
        patched = true;
      }
    }
    if (patched) {
      localStorage.setItem(STORAGE_KEYS.salons, JSON.stringify(list));
    }

    return list;
  } catch {
    return defaultSalons;
  }
}

function loadLocalBookings(): Booking[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.bookings) || '[]');
  } catch {
    return [];
  }
}

function loadLocalReviews(): StaffReview[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.reviews) || '[]');
  } catch {
    return [];
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [salonsList, setSalonsList] = useState<Salon[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [staffReviews, setStaffReviews] = useState<StaffReview[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [closedDays, setClosedDays] = useState<ClosedDay[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  
  const [user, setUser] = useState<User | null>(null);
  const [salon, setSalon] = useState<Salon | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem(STORAGE_KEYS.language) as Language) || 'en';
  });

  const [styleRecommendation, setStyleRecommendation] = useState<StyleRecommendation | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Fetch initial data from server or fallback to local storage
  const syncWithBackend = useCallback(async () => {
    try {
      let backendSalons = await api.getSalons();
      let backendUsers = await api.getUsers();
      let backendBookings = await api.getBookings();
      let backendReviews = await api.getReviews();

      // Trigger seed if backend is empty
      if (backendSalons.length === 0) {
        const localSalons = loadLocalSalons();
        const localUsers = loadLocalUsers();
        const localBookings = loadLocalBookings();
        const localReviews = loadLocalReviews();

        await api.seed({
          salons: localSalons,
          users: localUsers,
          bookings: localBookings,
          reviews: localReviews,
        });

        backendSalons = await api.getSalons();
        backendUsers = await api.getUsers();
        backendBookings = await api.getBookings();
        backendReviews = await api.getReviews();
      }

      setSalonsList(backendSalons);
      setUsers(backendUsers);
      setBookings(backendBookings);
      setStaffReviews(backendReviews);

      const sessionSalonId = sessionStore.get(STORAGE_KEYS.salonSession);
      const sessionTs = sessionStore.get(STORAGE_KEYS.salonSessionTimestamp);
      if (sessionSalonId) {
        const isExpired = sessionTs && (Date.now() - parseInt(sessionTs, 10)) > SALON_SESSION_TIMEOUT;
        if (isExpired) {
          sessionStore.remove(STORAGE_KEYS.salonSession);
          sessionStore.remove(STORAGE_KEYS.salonSessionTimestamp);
          // Toast will be shown once component mounts
        } else {
          const foundSalon = backendSalons.find(s => s.id === sessionSalonId);
          if (foundSalon) {
            setSalon(foundSalon);
          }
        }
      }

      const adminSession = sessionStore.get(STORAGE_KEYS.adminSession) === 'true';
      if (adminSession) {
        setIsAdmin(true);
      }
    } catch (err) {
      console.warn('Backend sync failed, using localStorage fallbacks:', err);
      const localSalons = loadLocalSalons();
      const localUsers = loadLocalUsers();
      const localBookings = loadLocalBookings();
      const localReviews = loadLocalReviews();

      setSalonsList(localSalons);
      setUsers(localUsers);
      setBookings(localBookings);
      setStaffReviews(localReviews);

      const sessionSalonId = sessionStore.get(STORAGE_KEYS.salonSession);
      const sessionTs = sessionStore.get(STORAGE_KEYS.salonSessionTimestamp);
      if (sessionSalonId) {
        const isExpired = sessionTs && (Date.now() - parseInt(sessionTs, 10)) > SALON_SESSION_TIMEOUT;
        if (isExpired) {
          sessionStore.remove(STORAGE_KEYS.salonSession);
          sessionStore.remove(STORAGE_KEYS.salonSessionTimestamp);
        } else {
          const foundSalon = localSalons.find(s => s.id === sessionSalonId);
          if (foundSalon) {
            setSalon(foundSalon);
          }
        }
      }

      setIsAdmin(sessionStore.get(STORAGE_KEYS.adminSession) === 'true');
    }
  }, []);

  useEffect(() => {
    syncWithBackend();
  }, [syncWithBackend]);

  // Expose a refreshData function for pages that need to refetch
  const refreshData = useCallback(async () => {
    try {
      const [backendSalons, backendUsers, backendBookings, backendReviews] = await Promise.all([
        api.getSalons(), api.getUsers(), api.getBookings(), api.getReviews()
      ]);
      setSalonsList(backendSalons);
      setUsers(backendUsers);
      setBookings(backendBookings);
      setStaffReviews(backendReviews);
    } catch (err) {
      console.warn('refreshData failed:', err);
    }
  }, []);

  // Notification methods
  const fetchNotifications = useCallback(async (target: string) => {
    try {
      const data = await api.getNotifications(target);
      setNotifications(prev => {
        // Merge: keep all existing for different targets, replace for this target
        const filtered = prev.filter(n => n.target !== target);
        return [...filtered, ...data];
      });
    } catch (err) {
      console.warn('Failed to fetch notifications:', err);
    }
  }, []);

  const markNotificationRead = useCallback(async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.warn('Failed to mark notification read:', err);
    }
  }, []);

  const markAllNotificationsRead = useCallback(async (target: string) => {
    try {
      await api.markAllNotificationsRead(target);
      setNotifications(prev => prev.map(n => n.target === target ? { ...n, read: true } : n));
    } catch (err) {
      console.warn('Failed to mark all notifications read:', err);
    }
  }, []);

  // Poll notifications every 30s when salon or admin is logged in
  useEffect(() => {
    const target = isAdmin ? 'admin' : salon ? salon.id : null;
    if (!target) return;
    fetchNotifications(target);
    const interval = setInterval(() => fetchNotifications(target), 30000);
    return () => clearInterval(interval);
  }, [isAdmin, salon, fetchNotifications]);

  // Listen for Supabase Authentication State Changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setAuthToken(session.access_token);
        api.getUsers().then((backendUsers) => {
          const foundUser = backendUsers.find(u => u.id === session.user.id);
          if (foundUser) {
            setUser(foundUser);
            if (foundUser.preferredLanguage) setLanguageState(foundUser.preferredLanguage);
          } else {
            const newUser = {
              id: session.user.id,
              name: session.user.user_metadata.name || session.user.email!.split('@')[0],
              email: session.user.email!,
              phone: session.user.user_metadata.phone || '',
              createdAt: new Date().toISOString(),
            };
            api.userRegister(newUser).then((res) => {
              setUser(res.user);
            }).catch(() => {});
          }
        }).catch(() => {});
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setAuthToken(session.access_token);
        api.getUsers().then((backendUsers) => {
          const foundUser = backendUsers.find(u => u.id === session.user.id);
          if (foundUser) {
            setUser(foundUser);
            if (foundUser.preferredLanguage) setLanguageState(foundUser.preferredLanguage);
          } else {
            const newUser = {
              id: session.user.id,
              name: session.user.user_metadata.name || session.user.email!.split('@')[0],
              email: session.user.email!,
              phone: session.user.user_metadata.phone || '',
              createdAt: new Date().toISOString(),
            };
            api.userRegister(newUser).then((res) => {
              setUser(res.user);
            }).catch(() => {});
          }
        }).catch(() => {});
      } else {
        setAuthToken(null);
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Compute activeSalons dynamically based on registration status, active flag, and commission status
  // Exclude admin test salon from user-facing listings
  const TEST_SALON_ID = 'LLLUX456';
  const activeSalons = salonsList.filter((s) => {
    if (s.id === TEST_SALON_ID) return false; // Admin test salon — never show to users
    if (s.registrationStatus !== 'approved') return false;
    if (s.isActive === false) return false;
    if (!s.commissionPaidUntil) return true;
    const paidUntil = new Date(s.commissionPaidUntil);
    const graceEnd = new Date(paidUntil);
    graceEnd.setDate(graceEnd.getDate() + 5);
    const now = new Date();
    if (s.commissionDue && s.commissionDue > 0 && now > graceEnd) return false;
    return true;
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEYS.language, lang);
    if (user) {
      api.updateUserProfile(user.id, { preferredLanguage: lang })
        .then(res => {
          if (res.success) {
            setUser(res.user);
            setUsers(prev => prev.map(u => u.id === user.id ? res.user : u));
          }
        })
        .catch(() => {
          // Local fallback
          const currentUsers = loadLocalUsers();
          const idx = currentUsers.findIndex((u) => u.id === user.id);
          if (idx >= 0) {
            currentUsers[idx].preferredLanguage = lang;
            localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(currentUsers));
            setUsers(currentUsers);
            setUser({ ...currentUsers[idx] });
          }
        });
    }
  }, [user]);

  const addToast = useCallback((type: Toast['type'], message: string) => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const login = useCallback(async (emailOrPhone: string, password: string): Promise<boolean> => {
    if (!supabaseConfigured) {
      addToast('error', 'Authentication is not configured. Please set up Supabase credentials.');
      return false;
    }
    try {
      let email = emailOrPhone.trim();
      if (!email.includes('@')) {
        const found = users.find(
          (u) => u.phone.replace(/\s+/g, '') === email.replace(/\s+/g, '')
        );
        if (found) {
          email = found.email;
        } else {
          addToast('error', 'Phone number not found. Please log in with email.');
          return false;
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Give specific, helpful error messages
        if (error.message.includes('Email not confirmed') || error.message.includes('email_not_confirmed')) {
          addToast('error', 'Please verify your email before signing in. Check your inbox (and spam folder) for the confirmation link.');
        } else if (error.message.includes('Invalid login credentials') || error.message.includes('invalid_credentials')) {
          addToast('error', 'Invalid email or password. Please check your credentials and try again.');
        } else if (error.message.includes('rate limit') || error.status === 429) {
          addToast('error', 'Too many login attempts. Please wait a minute and try again.');
        } else {
          addToast('error', error.message);
        }
        return false;
      }

      if (data.user && data.session) {
        setAuthToken(data.session.access_token);
        const backendUsers = await api.getUsers();
        const foundUser = backendUsers.find((u) => u.id === data.user!.id);
        if (foundUser) {
          setUser(foundUser);
          if (foundUser.preferredLanguage) setLanguageState(foundUser.preferredLanguage);
        } else {
          const newUser = {
            id: data.user.id,
            name: data.user.user_metadata.name || data.user.email!.split('@')[0],
            email: data.user.email!,
            phone: data.user.user_metadata.phone || '',
            createdAt: new Date().toISOString(),
          };
          const res = await api.userRegister(newUser);
          setUser(res.user);
        }
        addToast('success', 'Logged in successfully!');
        return true;
      }
      return false;
    } catch (err: any) {
      if (err.message && err.message.includes('fetch')) {
        addToast('error', 'Network error. Please check your internet connection.');
      } else {
        addToast('error', err.message || 'Login failed. Please try again.');
      }
      return false;
    }
  }, [users, addToast]);

  const loginWithGoogle = useCallback(async () => {
    if (!supabaseConfigured) {
      addToast('error', 'Authentication is not configured. Please set up Supabase credentials.');
      return;
    }
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/dashboard',
        },
      });
      if (error) {
        addToast('error', error.message);
      }
    } catch (err: any) {
      addToast('error', err.message || 'Google sign-in failed.');
    }
  }, [addToast]);


  const resetPassword = useCallback(async (email: string): Promise<boolean> => {
    if (!supabaseConfigured) {
      addToast('error', 'Password reset is not available. Supabase is not configured.');
      return false;
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/login',
      });
      if (error) {
        addToast('error', error.message);
        return false;
      }
      addToast('success', 'Password reset email sent! Check your inbox.');
      return true;
    } catch (err: any) {
      addToast('error', err.message || 'Failed to send reset email');
      return false;
    }
  }, [addToast]);

  const salonLogin = useCallback(async (name: string, id: string, email: string, checkPass: string): Promise<boolean | { attemptsRemaining?: number }> => {
    try {
      const res = await api.salonLogin(name, id, email, checkPass);
      if (res.success) {
        setSalon(res.salon);
        sessionStore.set(STORAGE_KEYS.salonSession, res.salon.id);
        sessionStore.set(STORAGE_KEYS.salonSessionTimestamp, Date.now().toString());
        addToast('success', `Welcome back, ${res.salon.name}!`);
        return true;
      }
      return false;
    } catch (err: any) {
      // Rate limit (429) or lockout (423) — surface the message
      if (err?.message?.includes('Too many') || err?.message?.includes('Account locked')) {
        addToast('error', err.message);
        return false;
      }
      // If server returns 403 registration not approved, toast it
      if (err.message && err.message.includes('registration')) {
        addToast('error', 'Salon registration is not approved yet.');
        return false;
      }
      // Extract attemptsRemaining from error if available
      // The api request function throws the message, but we need the full response
      // For now, fall through to local fallback

      // Local fallback
      const currentSalons = loadLocalSalons();
      const found = currentSalons.find(
        (s) =>
          s.name.toLowerCase().trim() === name.toLowerCase().trim() &&
          s.id.toLowerCase().trim() === id.toLowerCase().trim() &&
          s.email.toLowerCase().trim() === email.toLowerCase().trim() &&
          s.password === checkPass
      );
      if (!found) return false;

      if (found.registrationStatus !== 'approved') {
        addToast('error', 'Salon registration is not approved yet.');
        return false;
      }

      setSalon(found);
      sessionStore.set(STORAGE_KEYS.salonSession, found.id);
      sessionStore.set(STORAGE_KEYS.salonSessionTimestamp, Date.now().toString());
      addToast('success', `Welcome back, ${found.name}!`);
      return true;
    }
  }, [addToast]);

  const adminLogin = useCallback(async (userStr: string, passStr: string): Promise<boolean> => {
    try {
      const res = await api.adminLogin(userStr, passStr);
      if (res.success) {
        setIsAdmin(true);
        sessionStore.set(STORAGE_KEYS.adminSession, 'true');
        addToast('success', 'Logged in as Administrator');
        return true;
      }
      return false;
    } catch {
      // Local fallback
      if (userStr === 'ADMINLLURU' && passStr === 'ADMIN@LUXE26') {
        setIsAdmin(true);
        sessionStore.set(STORAGE_KEYS.adminSession, 'true');
        addToast('success', 'Logged in as Administrator');
        return true;
      }
      return false;
    }
  }, [addToast]);

  const register = useCallback(async (data: Omit<User, 'id' | 'createdAt'>): Promise<boolean> => {
    if (!supabaseConfigured) {
      addToast('error', 'Authentication is not configured. Please set up Supabase credentials.');
      return false;
    }
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            phone: data.phone,
          }
        }
      });

      if (error) {
        // Provide user-friendly messages for common errors
        if (error.message.includes('rate limit') || error.status === 429) {
          addToast('error', 'Too many attempts. Please wait a minute and try again.');
        } else if (error.message.includes('already registered') || error.message.includes('already been registered')) {
          addToast('error', 'An account with this email already exists. Please sign in instead.');
        } else {
          addToast('error', error.message);
        }
        return false;
      }

      // Supabase returns a user with a fake id when email already exists (security feature)
      // Check for this case: identities array will be empty
      if (authData.user && authData.user.identities && authData.user.identities.length === 0) {
        addToast('error', 'An account with this email already exists. Please sign in instead.');
        return false;
      }

      if (authData.user) {
        const newUser = {
          id: authData.user.id,
          name: data.name,
          email: data.email,
          phone: data.phone,
          createdAt: new Date().toISOString(),
        };
        await api.userRegister(newUser);
        addToast('success', 'Account created! Check your email to verify, then sign in.');
        return true;
      }
      return false;
    } catch (err: any) {
      if (err.message && err.message.includes('fetch')) {
        addToast('error', 'Network error. Please check your internet connection.');
      } else {
        addToast('error', err.message || 'Registration failed. Please try again.');
      }
      return false;
    }
  }, [addToast]);


  const salonRegister = useCallback(async (data: {
    ownerName: string;
    name: string;
    address: string;
    email: string;
    phone: string;
    phoneOwner: string;
    tradeLicenseUrl: string;
    panCardOwner?: string;
    panCardBusiness?: string;
  }): Promise<string> => {
    try {
      const res = await api.salonRegister(data);
      if (res.success) {
        // Refetch salons to get the new registered one
        const updatedSalons = await api.getSalons();
        setSalonsList(updatedSalons);
        return res.salonId;
      }
      throw new Error('Registration failed');
    } catch {
      // Local fallback
      const currentSalons = loadLocalSalons();
      const tempId = `PENDING-${Date.now()}`;
      
      const newSalon: Salon = {
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
        password: 'SALON@123',
        isActive: false,
        registrationStatus: 'pending' as const,
        ownerName: data.ownerName,
        phoneOwner: data.phoneOwner,
        tradeLicenseUrl: data.tradeLicenseUrl,
        registeredAt: new Date().toISOString(),
        commissionDue: 0,
        commissionPaidUntil: new Date().toISOString().split('T')[0],
        panCardOwner: data.panCardOwner || '',
        panCardBusiness: data.panCardBusiness || ''
      };
      
      currentSalons.push(newSalon);
      localStorage.setItem(STORAGE_KEYS.salons, JSON.stringify(currentSalons));
      setSalonsList(currentSalons);
      return tempId;
    }
  }, []);

  const salonExit = useCallback(async (salonId: string, reason: string): Promise<boolean> => {
    try {
      const res = await api.salonExit(salonId, reason);
      if (res.success) {
        setSalonsList(prev => prev.map(s => s.id === salonId ? { ...s, exitRequestStatus: 'pending', exitReason: reason } : s));
        const updated = salonsList.find(s => s.id === salonId);
        if (updated) {
          addToast('success', `Exit request sent to Admin for ${updated.name}`);
        }
        return true;
      }
      return false;
    } catch {
      // Local fallback
      const currentSalons = loadLocalSalons();
      const idx = currentSalons.findIndex((s) => s.id === salonId);
      if (idx >= 0) {
        currentSalons[idx] = {
          ...currentSalons[idx],
          exitRequestStatus: 'pending' as const,
          exitReason: reason,
        };
        localStorage.setItem(STORAGE_KEYS.salons, JSON.stringify(currentSalons));
        setSalonsList(currentSalons);
        addToast('success', `Exit request sent to Admin for ${currentSalons[idx].name}`);
        return true;
      }
      return false;
    }
  }, [addToast, salonsList]);

  const approveSalonExit = useCallback(async (salonId: string): Promise<boolean> => {
    try {
      const res = await api.approveSalonExit(salonId);
      if (res.success) {
        setSalonsList(prev => prev.map(s => s.id === salonId ? { ...s, isActive: false, registrationStatus: 'rejected', exitRequestStatus: 'approved' } : s));
        addToast('success', `Salon exit approved.`);
        return true;
      }
      return false;
    } catch {
      // Local fallback
      setSalonsList(prev => {
        const updated = prev.map(s => s.id === salonId ? { ...s, isActive: false, registrationStatus: 'rejected' as const, exitRequestStatus: 'approved' as const } : s);
        localStorage.setItem(STORAGE_KEYS.salons, JSON.stringify(updated));
        return updated;
      });
      addToast('success', `Salon exit approved.`);
      return true;
    }
  }, [addToast]);

  const rejectSalonExit = useCallback(async (salonId: string, rejectReason: string): Promise<boolean> => {
    try {
      const res = await api.rejectSalonExit(salonId, rejectReason);
      if (res.success) {
        setSalonsList(prev => prev.map(s => s.id === salonId
          ? { ...s, exitRequestStatus: 'rejected' as const, exitRejectReason: rejectReason }
          : s
        ));
        addToast('success', 'Salon exit request rejected. Reason saved.');
        return true;
      }
      return false;
    } catch {
      // Local fallback
      setSalonsList(prev => {
        const updated = prev.map(s =>
          s.id === salonId
            ? { ...s, exitRequestStatus: 'rejected' as const, exitRejectReason: rejectReason }
            : s
        );
        localStorage.setItem(STORAGE_KEYS.salons, JSON.stringify(updated));
        return updated;
      });
      addToast('success', 'Salon exit request rejected.');
      return true;
    }
  }, [addToast]);

  // ── Messaging & Announcements ──────────────────────────────────────────
  const fetchMessages = useCallback(async (salonId: string) => {
    try {
      const raw = await api.getMessages(salonId);
      // Decrypt all messages client-side
      const decrypted = await Promise.all(
        raw.map(async (m) => {
          const decryptedContent = await decryptMessage(m.encryptedContent, salonId);
          return { ...m, decryptedContent };
        })
      );
      setMessages(prev => {
        // Replace messages for this salonId
        const others = prev.filter(m => m.salonId !== salonId);
        return [...others, ...decrypted];
      });
    } catch (err) {
      console.warn('Failed to fetch messages:', err);
    }
  }, []);

  const sendDirectMessage = useCallback(async (
    salonId: string,
    plaintext: string,
    sender: 'admin' | 'salon',
    context: 'direct' | 'exit-dispute' = 'direct'
  ): Promise<boolean> => {
    try {
      const encrypted = await encryptMessage(plaintext, salonId);
      const res = await api.sendMessage(salonId, sender, encrypted, context);
      if (res.success) {
        // Optimistically add the sent message with decryptedContent
        const newMsg: Message = {
          ...res.message,
          decryptedContent: plaintext,
        };
        setMessages(prev => [...prev, newMsg]);
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Failed to send message:', err);
      return false;
    }
  }, []);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const data = await api.getAnnouncements();
      setAnnouncements(data);
    } catch (err) {
      console.warn('Failed to fetch announcements:', err);
    }
  }, []);

  const createAnnouncement = useCallback(async (title: string, content: string): Promise<boolean> => {
    try {
      const res = await api.createAnnouncement(title, content);
      if (res.success) {
        setAnnouncements(prev => [res.announcement, ...prev]);
        addToast('success', 'Announcement sent to all active salons.');
        return true;
      }
      return false;
    } catch {
      addToast('error', 'Failed to send announcement.');
      return false;
    }
  }, [addToast]);

  const markAnnouncementRead = useCallback(async (id: string) => {
    if (!salon) return;
    try {
      await api.markAnnouncementRead(id, salon.id);
      setAnnouncements(prev =>
        prev.map(a => a.id === id && !a.readBy.includes(salon.id)
          ? { ...a, readBy: [...a.readBy, salon.id] }
          : a
        )
      );
    } catch (err) {
      console.warn('Failed to mark announcement read:', err);
    }
  }, [salon]);

  const logout = useCallback(() => {
    // Clear all authentication state
    setUser(null);
    setSalon(null);
    setIsAdmin(false);
    setStyleRecommendation(null);
    setBlockedSlots([]);

    // Sign out of Supabase
    supabase.auth.signOut();

    // Clear all session keys from localStorage
    sessionStore.remove(STORAGE_KEYS.salonSession);
    sessionStore.remove(STORAGE_KEYS.salonSessionTimestamp);
    sessionStore.remove(STORAGE_KEYS.adminSession);
  }, []);

  const isUserBlocked = useCallback((userId: string): { blocked: boolean; reason?: string; until?: string } => {
    const foundUser = users.find((u) => u.id === userId);
    if (!foundUser) return { blocked: false };

    const todayStr = new Date().toISOString().split('T')[0];

    if (foundUser.blockedUntil && foundUser.blockedUntil >= todayStr) {
      return {
        blocked: true,
        reason: 'Your account is blocked by the platform administrator.',
        until: foundUser.blockedUntil,
      };
    }

    // Check for past confirmed bookings that weren't completed or cancelled
    const userBookings = bookings.filter((b) => b.userId === userId);
    const missedBooking = userBookings.find((b) => b.status === 'confirmed' && b.date < todayStr);
    
    if (missedBooking) {
      const appointmentDate = new Date(missedBooking.date);
      const blockEndDate = new Date(appointmentDate);
      blockEndDate.setDate(blockEndDate.getDate() + 4); 
      const blockEndStr = blockEndDate.toISOString().split('T')[0];
      
      if (todayStr <= blockEndStr) {
        return {
          blocked: true,
          reason: `Blocked until ${blockEndStr} due to missed appointment at ${missedBooking.salonName} on ${missedBooking.date} without rescheduling in advance.`,
          until: blockEndStr,
        };
      }
    }

    return { blocked: false };
  }, [users, bookings]);

  // ─── Blocked Slots ────────────────────────────────────
  const fetchBlockedSlots = useCallback(async (salonId: string): Promise<BlockedSlot[]> => {
    try {
      const slots = await api.getBlockedSlots(salonId);
      setBlockedSlots(slots);
      return slots;
    } catch {
      return [];
    }
  }, []);

  const blockSlot = useCallback(async (
    salonId: string, date: string, time: string, customerName?: string, reason?: string
  ): Promise<boolean> => {
    try {
      const res = await api.blockSlot(salonId, { date, time, customerName, reason });
      if (res.success) {
        setBlockedSlots(prev => [...prev, res.slot]);
        addToast('success', `Slot blocked: ${time} on ${date}`);
        return true;
      }
      return false;
    } catch {
      addToast('error', 'Failed to block slot');
      return false;
    }
  }, [addToast]);

  const unblockSlot = useCallback(async (salonId: string, slotId: string): Promise<boolean> => {
    try {
      const res = await api.unblockSlot(salonId, slotId);
      if (res.success) {
        setBlockedSlots(prev => prev.filter(s => s.id !== slotId));
        addToast('success', 'Slot unblocked');
        return true;
      }
      return false;
    } catch {
      addToast('error', 'Failed to unblock slot');
      return false;
    }
  }, [addToast]);

  // ─── Closed Days ─────────────────────────────────────────────────────────────
  const fetchClosedDays = useCallback(async (salonId: string): Promise<ClosedDay[]> => {
    try {
      const days = await api.getClosedDays(salonId);
      setClosedDays(days);
      return days;
    } catch {
      return [];
    }
  }, []);

  const closeDay = useCallback(async (salonId: string, date: string, reason?: string): Promise<boolean> => {
    try {
      const res = await api.addClosedDay(salonId, { date, reason });
      if (res.success) {
        setClosedDays(prev => [...prev.filter(d => !(d.salonId === salonId && d.date === date)), res.closedDay]);
        addToast('success', `${date} marked as closed: ${res.closedDay.reason}`);
        return true;
      }
      return false;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to mark day as closed';
      addToast('error', msg);
      return false;
    }
  }, [addToast]);

  const openDay = useCallback(async (salonId: string, date: string): Promise<boolean> => {
    try {
      const res = await api.removeClosedDay(salonId, date);
      if (res.success) {
        setClosedDays(prev => prev.filter(d => !(d.salonId === salonId && d.date === date)));
        addToast('success', `${date} reopened — slots are now available`);
        return true;
      }
      return false;
    } catch {
      addToast('error', 'Failed to reopen day');
      return false;
    }
  }, [addToast]);

  const createBooking = useCallback(
    async (data: Omit<Booking, 'id' | 'createdAt' | 'status' | 'userId'>): Promise<Booking> => {
      const blockStatus = isUserBlocked(user!.id);
      if (blockStatus.blocked) {
        throw new Error(blockStatus.reason);
      }

      try {
        const fullData = { ...data, userId: user!.id, feedbackRequestedAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() };
        const res = await api.addBooking(fullData);
        if (res.success) {
          setBookings(prev => [...prev, res.booking]);
          if (user) {
            scheduleFeedbackRequest(res.booking.id, res.booking.salonName, user.phone, () => {
              addToast('info', '24h feedback request sent via WhatsApp');
            });
          }
          return res.booking;
        }
        throw new Error('Booking placement failed');
      } catch (err: any) {
        // If it's a conflict error (409), surface it to the user
        if (err?.message?.includes('already booked') || err?.message?.includes('blocked by the salon')) {
          throw err;
        }
        // Local fallback for network errors
        const commissionAmount = Math.round((data.totalPrice || 0) * 0.03);
        const booking: Booking = {
          ...data,
          id: `booking-${Date.now()}`,
          userId: user!.id,
          status: 'confirmed',
          createdAt: new Date().toISOString(),
          feedbackRequestedAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          commissionAmount,
          commissionPaid: false,
        };
        const updated = [...bookings, booking];
        setBookings(updated);
        localStorage.setItem(STORAGE_KEYS.bookings, JSON.stringify(updated));

        if (user) {
          scheduleFeedbackRequest(booking.id, booking.salonName, user.phone, () => {
            addToast('info', '24h feedback request sent via WhatsApp');
          });
        }
        return booking;
      }
    },
    [user, bookings, addToast, isUserBlocked]
  );

  const cancelBooking = useCallback(async (id: string) => {
    try {
      const res = await api.cancelBooking(id);
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' as const, refundAmount: res.refundAmount } : b));
    } catch {
      // Local fallback (when backend unreachable)
      const updated = bookings.map((b) => {
        if (b.id === id) {
          let refundAmount = 0;
          const isOnline = b.paymentStatus === 'paid-online' || b.paymentMethod === 'card' || b.paymentMethod === 'upi';
          if (isOnline) {
            const today = new Date(); today.setHours(0,0,0,0);
            const apptDate = new Date(b.date); apptDate.setHours(0,0,0,0);
            const diffDays = Math.round((apptDate.getTime() - today.getTime()) / (24*60*60*1000));
            let percent = 0;
            if (diffDays <= 0) percent = 20;
            else if (diffDays === 1) percent = 50;
            else if (diffDays === 2) percent = 70;
            else percent = 100;
            refundAmount = Math.round(b.totalPrice * percent / 100);
          }
          return { ...b, status: 'cancelled' as const, refundAmount };
        }
        return b;
      });
      setBookings(updated);
      localStorage.setItem(STORAGE_KEYS.bookings, JSON.stringify(updated));
    }
  }, [bookings]);

  const rescheduleBooking = useCallback(async (id: string, date: string, time: string): Promise<boolean> => {
    const b = bookings.find((bk) => bk.id === id);
    if (!b) return false;

    const todayStr = new Date().toISOString().split('T')[0];
    if (todayStr >= b.date) {
      addToast('error', 'Appointments can only be rescheduled BEFORE the day of the appointment.');
      return false;
    }

    try {
      const res = await api.rescheduleBooking(id, date, time);
      if (res.success) {
        setBookings(prev => {
          const updated = prev.map(bk => bk.id === id ? { ...bk, date, time } : bk);
          localStorage.setItem(STORAGE_KEYS.bookings, JSON.stringify(updated));
          return updated;
        });
        addToast('success', `Appointment rescheduled to ${date} at ${time}.`);
        return true;
      }
      addToast('error', 'Failed to reschedule. The slot may be taken.');
      return false;
    } catch {
      // Local fallback
      setBookings(prev => {
        const updated = prev.map(bk => bk.id === id ? { ...bk, date, time } : bk);
        localStorage.setItem(STORAGE_KEYS.bookings, JSON.stringify(updated));
        return updated;
      });
      addToast('success', `Appointment rescheduled to ${date} at ${time}.`);
      return true;
    }
  }, [addToast, bookings]);

  const updateBookingPayment = useCallback(async (id: string, paymentMethod: PaymentMethod, packageId?: string) => {
    try {
      await api.updateBookingPayment(id, paymentMethod, packageId);
      
      // Update local states on success
      const b = bookings.find(bk => bk.id === id);
      if (b) {
        const salonObj = salonsList.find(s => s.id === b.salonId);
        let finalPrice = b.totalPrice;
        if (salonObj && packageId) {
          const pkg = salonObj.packages.find(p => p.id === packageId);
          if (pkg) finalPrice = pkg.price;
        }
        const newCommission = Math.round(finalPrice * 0.03);
        const oldCommission = b.commissionAmount || 0;
        const commissionDiff = newCommission - oldCommission;

        setBookings(prev => prev.map(bk => bk.id === id ? {
          ...bk,
          paymentMethod,
          totalPrice: finalPrice,
          status: 'completed',
          paymentUpdatedBySalon: true,
          commissionAmount: newCommission,
          commissionPaid: false
        } : bk));

        if (commissionDiff !== 0) {
          setSalonsList(prev => prev.map(s => s.id === b.salonId ? {
            ...s,
            commissionDue: Math.max(0, (s.commissionDue ?? 0) + commissionDiff)
          } : s));

          setSalon(curr => {
            if (curr && curr.id === b.salonId) {
              return {
                ...curr,
                commissionDue: Math.max(0, (curr.commissionDue ?? 0) + commissionDiff)
              };
            }
            return curr;
          });
        }

        addToast('success', 'Appointment marked as completed. Commission updated.');
      }
    } catch {
      // Local fallback
      const currentBookings = loadLocalBookings();
      const idx = currentBookings.findIndex((b) => b.id === id);
      if (idx >= 0) {
        const b = currentBookings[idx];
        let finalPrice = b.totalPrice;
        let isChanged = false;
        let originalPkgId = b.originalPackageId || '';
        let originalPkgName = b.originalPackageName || '';
        let updatedPkgId = b.updatedPackageId || '';
        let updatedPkgName = b.updatedPackageName || '';

        const currentSalons = loadLocalSalons();
        const salonObj = currentSalons.find((s) => s.id === b.salonId);

        if (salonObj) {
          if (!b.originalPackageId) {
            const matchPkg = salonObj.packages.find((p) => p.price === b.totalPrice);
            originalPkgId = matchPkg ? matchPkg.id : 'custom';
            originalPkgName = matchPkg ? matchPkg.name : 'Custom Services';
          } else {
            originalPkgId = b.originalPackageId;
            originalPkgName = b.originalPackageName || '';
          }

          if (packageId) {
            const pkg = salonObj.packages.find((p) => p.id === packageId);
            if (pkg) {
              if (originalPkgId !== packageId) {
                isChanged = true;
                updatedPkgId = pkg.id;
                updatedPkgName = pkg.name;
                finalPrice = pkg.price;
              } else {
                isChanged = false;
                updatedPkgId = '';
                updatedPkgName = '';
                finalPrice = pkg.price;
              }
            }
          }
        }

        const newCommission = Math.round(finalPrice * 0.03);
        const oldCommission = b.commissionAmount || 0;
        const commissionDiff = newCommission - oldCommission;

        currentBookings[idx] = {
          ...b,
          paymentMethod,
          totalPrice: finalPrice,
          status: 'completed',
          paymentUpdatedBySalon: true,
          isPackageChanged: isChanged,
          originalPackageId: originalPkgId || undefined,
          originalPackageName: originalPkgName || undefined,
          updatedPackageId: updatedPkgId || undefined,
          updatedPackageName: updatedPkgName || undefined,
          commissionAmount: newCommission,
          commissionPaid: false,
        };

        localStorage.setItem(STORAGE_KEYS.bookings, JSON.stringify(currentBookings));
        setBookings(currentBookings);

        if (commissionDiff !== 0) {
          setSalonsList((prev) => {
            const updated = prev.map((s) => {
              if (s.id === b.salonId) {
                return {
                  ...s,
                  commissionDue: Math.max(0, (s.commissionDue ?? 0) + commissionDiff),
                };
              }
              return s;
            });
            localStorage.setItem(STORAGE_KEYS.salons, JSON.stringify(updated));
            return updated;
        });

          setSalon((curr) => {
            if (curr && curr.id === b.salonId) {
              return {
                ...curr,
                commissionDue: Math.max(0, (curr.commissionDue ?? 0) + commissionDiff),
              };
            }
            return curr;
          });
        }

        addToast('success', 'Appointment marked as completed. Commission updated.');
      }
    }
  }, [addToast, bookings, salonsList]);

  const reportFakeBooking = useCallback(async (id: string, reason: string) => {
    try {
      await api.reportFakeBooking(id, reason);
      setBookings(prev => prev.map(b => b.id === id ? { ...b, reportedAsFake: true, fakeReportReason: reason } : b));
      addToast('info', 'Booking reported as fake. Notification sent to Admin.');
    } catch {
      // Local fallback
      const currentBookings = loadLocalBookings();
      const idx = currentBookings.findIndex((b) => b.id === id);
      if (idx >= 0) {
        currentBookings[idx] = {
          ...currentBookings[idx],
          reportedAsFake: true,
          fakeReportReason: reason,
        };
        localStorage.setItem(STORAGE_KEYS.bookings, JSON.stringify(currentBookings));
        setBookings(currentBookings);
        addToast('info', 'Booking reported as fake. Notification sent to Admin.');
      }
    }
  }, [addToast]);

  const verifyBookingStatus = useCallback(async (id: string, data: {
    appointmentTaken?: boolean;
    paymentVerifiedBySalon?: boolean;
    paymentMethod?: string;
    salonNotes?: string;
  }) => {
    try {
      await api.verifyBookingStatus(id, data);
      setBookings(prev => prev.map(b => b.id === id ? {
        ...b,
        appointmentTaken: data.appointmentTaken ?? b.appointmentTaken,
        paymentVerifiedBySalon: data.paymentVerifiedBySalon ?? b.paymentVerifiedBySalon,
        paymentMethod: (data.paymentMethod as any) ?? b.paymentMethod,
        salonNotes: data.salonNotes ?? b.salonNotes,
        paymentStatus: data.paymentVerifiedBySalon ? (data.paymentMethod === 'card' ? 'paid-online' : 'paid-at-salon') : b.paymentStatus,
      } : b));
      addToast('success', 'Booking status updated.');
    } catch {
      // Local fallback
      setBookings(prev => prev.map(b => b.id === id ? {
        ...b, ...data,
        paymentStatus: data.paymentVerifiedBySalon ? 'paid-at-salon' as const : b.paymentStatus,
      } : b));
      const local = loadLocalBookings();
      const idx = local.findIndex(b => b.id === id);
      if (idx >= 0) {
        Object.assign(local[idx], data);
        localStorage.setItem(STORAGE_KEYS.bookings, JSON.stringify(local));
      }
      addToast('success', 'Booking status updated.');
    }
  }, [addToast]);

  const modifyBookingServices = useCallback(async (
    id: string, modifiedServices: string[], modifiedServiceNames: string[], modifiedPrice: number
  ) => {
    try {
      await api.modifyBookingServices(id, { modifiedServices, modifiedServiceNames, modifiedPrice });
      setBookings(prev => prev.map(b => b.id === id ? {
        ...b,
        modifiedServices,
        modifiedServiceNames,
        modifiedPrice,
        originalPrice: b.originalPrice || b.totalPrice,
        totalPrice: modifiedPrice,
        commissionAmount: Math.round(modifiedPrice * 0.03),
        isPackageChanged: true,
      } : b));
      addToast('success', 'Booking services updated. Commission recalculated.');
    } catch {
      // Local fallback
      setBookings(prev => prev.map(b => b.id === id ? {
        ...b,
        modifiedServices,
        modifiedServiceNames,
        modifiedPrice,
        originalPrice: b.originalPrice || b.totalPrice,
        totalPrice: modifiedPrice,
        commissionAmount: Math.round(modifiedPrice * 0.03),
        isPackageChanged: true,
      } : b));
      const local = loadLocalBookings();
      const idx = local.findIndex(b => b.id === id);
      if (idx >= 0) {
        local[idx] = { ...local[idx], modifiedServices, modifiedServiceNames, modifiedPrice, originalPrice: local[idx].originalPrice || local[idx].totalPrice, totalPrice: modifiedPrice, commissionAmount: Math.round(modifiedPrice * 0.03), isPackageChanged: true };
        localStorage.setItem(STORAGE_KEYS.bookings, JSON.stringify(local));
      }
      addToast('success', 'Booking services updated. Commission recalculated.');
    }
  }, [addToast]);


  const addStaffReview = useCallback(async (review: Omit<StaffReview, 'id' | 'createdAt'>) => {
    try {
      const res = await api.addStaffReview(review);
      if (res.success) {
        setStaffReviews(prev => [...prev, res.review]);
        // Refetch salons to sync ratings updates
        const updatedSalons = await api.getSalons();
        const updatedBookings = await api.getBookings();
        setSalonsList(updatedSalons);
        setBookings(updatedBookings);
      }
    } catch {
      // Local fallback
      const newReview: StaffReview = {
        ...review,
        id: `review-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      const updated = [...staffReviews, newReview];
      setStaffReviews(updated);
      localStorage.setItem(STORAGE_KEYS.reviews, JSON.stringify(updated));
    }
  }, [staffReviews]);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setUserLocation({ lat: 12.9716, lng: 77.5946 });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUserLocation({ lat: 12.9716, lng: 77.5946 })
    );
  }, []);

  const paySalonCommission = useCallback(async (salonId: string) => {
    try {
      await api.paySalonCommission(salonId);
      
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(1);

      setSalonsList(prev => prev.map(s => s.id === salonId ? {
        ...s,
        commissionDue: 0,
        commissionPaidUntil: nextMonth.toISOString().split('T')[0],
        isActive: true,
      } : s));

      setSalon(curr => {
        if (curr && curr.id === salonId) {
          return {
            ...curr,
            commissionDue: 0,
            commissionPaidUntil: nextMonth.toISOString().split('T')[0],
            isActive: true,
          };
        }
        return curr;
      });

      addToast('success', 'Commission cleared. Salon is now active.');
    } catch {
      // Local fallback
      setSalonsList((prev) => {
        const updated = prev.map((s) => {
          if (s.id === salonId) {
            const nextMonth = new Date();
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            nextMonth.setDate(1);
            return {
              ...s,
              commissionDue: 0,
              commissionPaidUntil: nextMonth.toISOString().split('T')[0],
              isActive: true,
            };
          }
          return s;
        });
        localStorage.setItem(STORAGE_KEYS.salons, JSON.stringify(updated));
        return updated;
      });

      setSalon((curr) => {
        if (curr && curr.id === salonId) {
          const nextMonth = new Date();
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          nextMonth.setDate(1);
          return {
            ...curr,
            commissionDue: 0,
            commissionPaidUntil: nextMonth.toISOString().split('T')[0],
            isActive: true,
          };
        }
        return curr;
      });

      addToast('success', 'Commission cleared. Salon is now active.');
    }
  }, [addToast]);

  const approveSalon = useCallback(async (salonId: string) => {
    try {
      const res = await api.approveSalon(salonId);
      // Refetch salons since the ID may have changed (PENDING → LL...)
      const updatedSalons = await api.getSalons();
      setSalonsList(updatedSalons);
      const newId = res.newSalonId || salonId;
      addToast('success', `Salon approved! New Salon ID: ${newId}`);
    } catch {
      // Local fallback — generate ID locally
      const salon = salonsList.find(s => s.id === salonId);
      const cleanedName = (salon?.name || 'SAL').trim().replace(/[^a-zA-Z]/g, '');
      const prefix = (cleanedName.slice(0, 3) || 'SAL').toUpperCase();
      const randomDigits = Math.floor(100 + Math.random() * 900);
      const newId = `LL${prefix}${randomDigits}`;

      setSalonsList((prev) => {
        const updated = prev.map((s) => {
          if (s.id === salonId) {
            return {
              ...s,
              id: newId,
              registrationStatus: 'approved' as const,
              isActive: true,
            };
          }
          return s;
        });
        localStorage.setItem(STORAGE_KEYS.salons, JSON.stringify(updated));
        return updated;
      });
      addToast('success', `Salon approved! New Salon ID: ${newId}`);
    }
  }, [addToast, salonsList]);

  const rejectSalon = useCallback(async (salonId: string) => {
    try {
      await api.rejectSalon(salonId);
      setSalonsList(prev => prev.map(s => s.id === salonId ? { ...s, registrationStatus: 'rejected' as const, isActive: false } : s));
      addToast('info', 'Salon registration application rejected.');
    } catch {
      // Local fallback
      setSalonsList((prev) => {
        const updated = prev.map((s) => {
          if (s.id === salonId) {
            return {
              ...s,
              registrationStatus: 'rejected' as const,
              isActive: false,
            };
          }
          return s;
        });
        localStorage.setItem(STORAGE_KEYS.salons, JSON.stringify(updated));
        return updated;
      });
      addToast('info', 'Salon registration application rejected.');
    }
  }, [addToast]);

  const removeSalonForcefully = useCallback(async (salonId: string) => {
    try {
      await api.removeSalonForcefully(salonId);
      setSalonsList(prev => prev.map(s => s.id === salonId ? {
        ...s,
        isActive: false,
        registrationStatus: 'rejected' as const,
        exitReason: 'Forcefully removed by Administrator.',
      } : s));
      addToast('info', 'Salon forcefully removed from the platform.');
    } catch {
      // Local fallback
      setSalonsList((prev) => {
        const updated = prev.map((s) => {
          if (s.id === salonId) {
            return {
              ...s,
              isActive: false,
              registrationStatus: 'rejected' as const,
              exitReason: 'Forcefully removed by Administrator.',
            };
          }
          return s;
        });
        localStorage.setItem(STORAGE_KEYS.salons, JSON.stringify(updated));
        return updated;
      });
      addToast('info', 'Salon forcefully removed from the platform.');
    }
  }, [addToast]);

  const deleteSalonPermanently = useCallback(async (salonId: string) => {
    try {
      await api.deleteSalonPermanently(salonId);
      setSalonsList(prev => prev.filter(s => s.id !== salonId));
      addToast('success', 'Salon permanently deleted from the platform.');
    } catch (err: any) {
      if (err?.message) {
        addToast('error', err.message);
      } else {
        // Local fallback
        setSalonsList(prev => {
          const updated = prev.filter(s => s.id !== salonId);
          localStorage.setItem(STORAGE_KEYS.salons, JSON.stringify(updated));
          return updated;
        });
        addToast('success', 'Salon permanently deleted from the platform.');
      }
    }
  }, [addToast]);

  const updateSalonLocation = useCallback(async (salonId: string, address: string, lat: number, lng: number) => {
    try {
      await api.updateSalonLocation(salonId, address, lat, lng);
      setSalonsList(prev => prev.map(s => s.id === salonId ? { ...s, address, lat, lng, area: address.split(',')[0] || s.area } : s));
      if (salon && salon.id === salonId) {
        setSalon(prev => prev ? { ...prev, address, lat, lng, area: address.split(',')[0] || prev.area } : null);
      }
      addToast('success', 'Salon location updated successfully.');
    } catch {
      // Local fallback
      setSalonsList(prev => {
        const updated = prev.map(s => s.id === salonId ? { ...s, address, lat, lng, area: address.split(',')[0] || s.area } : s);
        localStorage.setItem(STORAGE_KEYS.salons, JSON.stringify(updated));
        return updated;
      });
      if (salon && salon.id === salonId) {
        setSalon(prev => prev ? { ...prev, address, lat, lng, area: address.split(',')[0] || prev.area } : null);
      }
      addToast('success', 'Salon location updated successfully.');
    }
  }, [addToast, salon]);

  const updateSalonStaff = useCallback(async (salonId: string, staff: Staff[]) => {
    try {
      await api.updateSalonStaff(salonId, staff);
      setSalonsList(prev => prev.map(s => s.id === salonId ? { ...s, staff } : s));
      if (salon && salon.id === salonId) {
        setSalon(prev => prev ? { ...prev, staff } : null);
      }
      addToast('success', 'Team updated successfully.');
    } catch {
      // Local fallback
      setSalonsList(prev => {
        const updated = prev.map(s => s.id === salonId ? { ...s, staff } : s);
        localStorage.setItem(STORAGE_KEYS.salons, JSON.stringify(updated));
        return updated;
      });
      if (salon && salon.id === salonId) {
        setSalon(prev => prev ? { ...prev, staff } : null);
      }
      addToast('success', 'Team updated successfully.');
    }
  }, [addToast, salon]);

  const blockUserForcefully = useCallback(async (userId: string, dateStr: string) => {
    try {
      await api.blockUser(userId, dateStr);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, blockedUntil: dateStr } : u));
      if (user && user.id === userId) {
        setUser(prev => prev ? { ...prev, blockedUntil: dateStr } : null);
      }
      addToast('success', `User account blocked until ${dateStr}`);
    } catch {
      // Local fallback
      const currentUsers = loadLocalUsers();
      const idx = currentUsers.findIndex((u) => u.id === userId);
      if (idx >= 0) {
        currentUsers[idx] = { ...currentUsers[idx], blockedUntil: dateStr };
        localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(currentUsers));
        setUsers(currentUsers);
        if (user && user.id === userId) {
          setUser(currentUsers[idx]);
        }
        addToast('success', `User account blocked until ${dateStr}`);
      }
    }
  }, [user, addToast]);

  const unblockUserForcefully = useCallback(async (userId: string) => {
    try {
      await api.unblockUser(userId);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, blockedUntil: undefined } : u));
      if (user && user.id === userId) {
        setUser(prev => prev ? { ...prev, blockedUntil: undefined } : null);
      }
      addToast('success', 'User account unblocked successfully');
    } catch {
      // Local fallback
      const currentUsers = loadLocalUsers();
      const idx = currentUsers.findIndex((u) => u.id === userId);
      if (idx >= 0) {
        currentUsers[idx] = { ...currentUsers[idx], blockedUntil: undefined };
        localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(currentUsers));
        setUsers(currentUsers);
        if (user && user.id === userId) {
          setUser(currentUsers[idx]);
        }
        addToast('success', 'User account unblocked successfully');
      }
    }
  }, [user, addToast]);

  const updateUserProfile = useCallback((updates: Partial<User>) => {
    if (!user) return;
    api.updateUserProfile(user.id, updates)
      .then(res => {
        if (res.success) {
          setUser(res.user);
          setUsers(prev => prev.map(u => u.id === user.id ? res.user : u));
        }
      })
      .catch(() => {
        // Local fallback
        const currentUsers = loadLocalUsers();
        const idx = currentUsers.findIndex((u) => u.id === user.id);
        if (idx >= 0) {
          currentUsers[idx] = { ...currentUsers[idx], ...updates };
          localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(currentUsers));
          setUsers(currentUsers);
          setUser(currentUsers[idx]);
        }
      });
  }, [user]);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  // Poll messages and announcements every 15s when salon or admin is logged in
  useEffect(() => {
    if (!salon && !isAdmin) return;
    // Fetch announcements for salons and admin
    fetchAnnouncements();
    const annInterval = setInterval(fetchAnnouncements, 30000);
    // Fetch salon-specific messages
    if (salon) {
      fetchMessages(salon.id);
      const msgInterval = setInterval(() => fetchMessages(salon.id), 15000);
      return () => { clearInterval(annInterval); clearInterval(msgInterval); };
    }
    return () => clearInterval(annInterval);
  }, [salon, isAdmin, fetchMessages, fetchAnnouncements]);

  return (
    <AppContext.Provider
      value={{
        user,
        users,
        salon,
        isAdmin,
        language,
        setLanguage,
        login,
        loginWithGoogle,
        resetPassword,
        salonLogin,
        adminLogin,
        register,
        salonRegister,
        salonExit,
        logout,
        bookings,
        createBooking,
        cancelBooking,
        rescheduleBooking,
        updateBookingPayment,
        reportFakeBooking,
        verifyBookingStatus,
        modifyBookingServices,
        staffReviews,
        addStaffReview,
        styleRecommendation,
        setStyleRecommendation,
        userLocation,
        requestLocation,
        toasts,
        addToast,
        removeToast,
        salons: salonsList,
        activeSalons,
        paySalonCommission,
        updateUserProfile,
        approveSalon,
        rejectSalon,
        removeSalonForcefully,
        deleteSalonPermanently,
        updateSalonLocation,
        updateSalonStaff,
        blockUserForcefully,
        unblockUserForcefully,
        isUserBlocked,
        blockedSlots,
        fetchBlockedSlots,
        blockSlot,
        unblockSlot,
        closedDays,
        fetchClosedDays,
        closeDay,
        openDay,
        refreshData,
        notifications,
        fetchNotifications,
        markNotificationRead,
        markAllNotificationsRead,
        messages,
        announcements,
        sendDirectMessage,
        fetchMessages,
        createAnnouncement,
        markAnnouncementRead,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
