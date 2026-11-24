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
  PaymentMethod,
} from '../types';
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
  }) => Promise<string>;
  salonExit: (salonId: string, reason: string) => Promise<boolean>;
  logout: () => void;
  bookings: Booking[];
  createBooking: (booking: Omit<Booking, 'id' | 'createdAt' | 'status' | 'userId'>) => Promise<Booking>;
  cancelBooking: (id: string) => void;
  rescheduleBooking: (id: string, date: string, time: string) => Promise<boolean>;
  updateBookingPayment: (id: string, paymentMethod: PaymentMethod, packageId?: string) => void;
  reportFakeBooking: (id: string, reason: string) => void;
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
  blockUserForcefully: (userId: string, dateStr: string) => void;
  unblockUserForcefully: (userId: string) => void;
  isUserBlocked: (userId: string) => { blocked: boolean; reason?: string; until?: string };
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
  adminSession: 'luxeluru_admin_session',
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

      const sessionSalonId = localStorage.getItem(STORAGE_KEYS.salonSession);
      if (sessionSalonId) {
        const foundSalon = backendSalons.find(s => s.id === sessionSalonId);
        if (foundSalon) {
          setSalon(foundSalon);
        }
      }

      const adminSession = localStorage.getItem(STORAGE_KEYS.adminSession) === 'true';
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

      const sessionSalonId = localStorage.getItem(STORAGE_KEYS.salonSession);
      if (sessionSalonId) {
        const foundSalon = localSalons.find(s => s.id === sessionSalonId);
        if (foundSalon) {
          setSalon(foundSalon);
        }
      }

      setIsAdmin(localStorage.getItem(STORAGE_KEYS.adminSession) === 'true');
    }
  }, []);

  useEffect(() => {
    syncWithBackend();
  }, [syncWithBackend]);

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
  const activeSalons = salonsList.filter((s) => {
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
        addToast('error', error.message);
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
      addToast('error', err.message || 'Login failed');
      return false;
    }
  }, [users, addToast]);


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

  const salonLogin = useCallback(async (name: string, id: string, email: string, checkPass: string): Promise<boolean> => {
    try {
      const res = await api.salonLogin(name, id, email, checkPass);
      if (res.success) {
        setSalon(res.salon);
        localStorage.setItem(STORAGE_KEYS.salonSession, res.salon.id);
        addToast('success', `Welcome back, ${res.salon.name}!`);
        return true;
      }
      return false;
    } catch (err: any) {
      // If server returns 403 registration not approved, toast it
      if (err.message && err.message.includes('registration')) {
        addToast('error', 'Salon registration is not approved yet.');
        return false;
      }
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
      localStorage.setItem(STORAGE_KEYS.salonSession, found.id);
      addToast('success', `Welcome back, ${found.name}!`);
      return true;
    }
  }, [addToast]);

  const adminLogin = useCallback(async (userStr: string, passStr: string): Promise<boolean> => {
    try {
      const res = await api.adminLogin(userStr, passStr);
      if (res.success) {
        setIsAdmin(true);
        localStorage.setItem(STORAGE_KEYS.adminSession, 'true');
        addToast('success', 'Logged in as Administrator');
        return true;
      }
      return false;
    } catch {
      // Local fallback
      if (userStr === 'ADMINLLURU' && passStr === 'ADMIN@LUXE26') {
        setIsAdmin(true);
        localStorage.setItem(STORAGE_KEYS.adminSession, 'true');
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
        addToast('error', error.message);
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
        addToast('success', 'Registration successful! Check your email to verify your account.');
        return true;
      }
      return false;
    } catch (err: any) {
      addToast('error', err.message || 'Registration failed');
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
      const cleanedName = data.name.trim().replace(/[^a-zA-Z]/g, '');
      const prefix = (cleanedName.slice(0, 3) || 'REG').toUpperCase();
      const randomDigits = Math.floor(100 + Math.random() * 900);
      const generatedId = `LL${prefix}${randomDigits}`;
      
      const newSalon: Salon = {
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
        password: 'SALON@123',
        isActive: false,
        registrationStatus: 'pending' as const,
        ownerName: data.ownerName,
        phoneOwner: data.phoneOwner,
        tradeLicenseUrl: data.tradeLicenseUrl,
        registeredAt: new Date().toISOString(),
        commissionDue: 0,
        commissionPaidUntil: new Date().toISOString().split('T')[0]
      };
      
      currentSalons.push(newSalon);
      localStorage.setItem(STORAGE_KEYS.salons, JSON.stringify(currentSalons));
      setSalonsList(currentSalons);
      return generatedId;
    }
  }, []);

  const salonExit = useCallback(async (salonId: string, reason: string): Promise<boolean> => {
    try {
      const res = await api.salonExit(salonId, reason);
      if (res.success) {
        setSalonsList(prev => prev.map(s => s.id === salonId ? { ...s, isActive: false, registrationStatus: 'rejected', exitReason: reason } : s));
        const updated = salonsList.find(s => s.id === salonId);
        if (updated) {
          addToast('success', `Exit request processed for ${updated.name}`);
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
          isActive: false,
          registrationStatus: 'rejected' as const,
          exitReason: reason,
        };
        localStorage.setItem(STORAGE_KEYS.salons, JSON.stringify(currentSalons));
        setSalonsList(currentSalons);
        addToast('success', `Exit request processed for ${currentSalons[idx].name}`);
        return true;
      }
      return false;
    }
  }, [addToast, salonsList]);

  const logout = useCallback(() => {
    setUser(null);
    setSalon(null);
    setIsAdmin(false);
    supabase.auth.signOut();
    localStorage.removeItem(STORAGE_KEYS.salonSession);
    localStorage.removeItem(STORAGE_KEYS.adminSession);
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
      } catch {
        // Local fallback
        const booking: Booking = {
          ...data,
          id: `booking-${Date.now()}`,
          userId: user!.id,
          status: 'confirmed',
          createdAt: new Date().toISOString(),
          feedbackRequestedAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
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
      await api.cancelBooking(id);
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' as const } : b));
    } catch {
      // Local fallback
      const updated = bookings.map((b) =>
        b.id === id ? { ...b, status: 'cancelled' as const } : b
      );
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
        setBookings(prev => prev.map(bk => bk.id === id ? { ...bk, date, time } : bk));
        addToast('success', 'Appointment rescheduled successfully!');
        return true;
      }
      return false;
    } catch {
      // Local fallback
      const currentBookings = loadLocalBookings();
      const idx = currentBookings.findIndex((bk) => bk.id === id);
      if (idx >= 0) {
        currentBookings[idx] = {
          ...currentBookings[idx],
          date,
          time,
        };
        localStorage.setItem(STORAGE_KEYS.bookings, JSON.stringify(currentBookings));
        setBookings(currentBookings);
        addToast('success', 'Appointment rescheduled successfully!');
        return true;
      }
      return false;
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
        const commission = Math.round(finalPrice * 0.05);

        setBookings(prev => prev.map(bk => bk.id === id ? {
          ...bk,
          paymentMethod,
          totalPrice: finalPrice,
          status: 'completed',
          paymentUpdatedBySalon: true,
          commissionAmount: commission,
          commissionPaid: false
        } : bk));

        setSalonsList(prev => prev.map(s => s.id === b.salonId ? {
          ...s,
          commissionDue: (s.commissionDue ?? 0) + commission
        } : s));

        setSalon(curr => {
          if (curr && curr.id === b.salonId) {
            return {
              ...curr,
              commissionDue: (curr.commissionDue ?? 0) + commission
            };
          }
          return curr;
        });

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

        const commission = Math.round(finalPrice * 0.05);

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
          commissionAmount: commission,
          commissionPaid: false,
        };

        localStorage.setItem(STORAGE_KEYS.bookings, JSON.stringify(currentBookings));
        setBookings(currentBookings);

        setSalonsList((prev) => {
          const updated = prev.map((s) => {
            if (s.id === b.salonId) {
              return {
                ...s,
                commissionDue: (s.commissionDue ?? 0) + commission,
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
              commissionDue: (curr.commissionDue ?? 0) + commission,
            };
          }
          return curr;
        });

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
      await api.approveSalon(salonId);
      setSalonsList(prev => prev.map(s => s.id === salonId ? { ...s, registrationStatus: 'approved' as const, isActive: true } : s));
      addToast('success', 'Salon approved and activated on platform!');
    } catch {
      // Local fallback
      setSalonsList((prev) => {
        const updated = prev.map((s) => {
          if (s.id === salonId) {
            return {
              ...s,
              registrationStatus: 'approved' as const,
              isActive: true,
            };
          }
          return s;
        });
        localStorage.setItem(STORAGE_KEYS.salons, JSON.stringify(updated));
        return updated;
      });
      addToast('success', 'Salon approved and activated on platform!');
    }
  }, [addToast]);

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
        blockUserForcefully,
        unblockUserForcefully,
        isUserBlocked,
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
