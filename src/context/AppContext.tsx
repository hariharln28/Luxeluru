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
} from '../types';
import { salons, getActiveSalons } from '../data/salons';
import { scheduleFeedbackRequest } from '../utils/notifications';

interface AppContextType {
  user: User | null;
  language: Language;
  setLanguage: (lang: Language) => void;
  login: (email: string, password: string) => boolean;
  register: (data: Omit<User, 'id' | 'createdAt'>) => boolean;
  logout: () => void;
  bookings: Booking[];
  createBooking: (booking: Omit<Booking, 'id' | 'createdAt' | 'status' | 'userId'>) => Booking;
  cancelBooking: (id: string) => void;
  staffReviews: StaffReview[];
  addStaffReview: (review: Omit<StaffReview, 'id' | 'createdAt'>) => void;
  styleRecommendation: StyleRecommendation | null;
  setStyleRecommendation: (rec: StyleRecommendation | null) => void;
  userLocation: { lat: number; lng: number } | null;
  requestLocation: () => void;
  toasts: Toast[];
  addToast: (type: Toast['type'], message: string) => void;
  removeToast: (id: string) => void;
  activeSalons: typeof salons;
  paySalonCommission: (salonId: string) => void;
  updateUserProfile: (updates: Partial<User>) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEYS = {
  users: 'luxeluru_users',
  session: 'luxeluru_session',
  bookings: 'luxeluru_bookings',
  reviews: 'luxeluru_reviews',
  language: 'luxeluru_language',
};

function loadUsers(): User[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.users) || '[]');
  } catch {
    return [];
  }
}

function saveUsers(users: User[]) {
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
}

function loadBookings(): Booking[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.bookings) || '[]');
  } catch {
    return [];
  }
}

function saveBookings(bookings: Booking[]) {
  localStorage.setItem(STORAGE_KEYS.bookings, JSON.stringify(bookings));
}

function loadReviews(): StaffReview[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.reviews) || '[]');
  } catch {
    return [];
  }
}

function saveReviews(reviews: StaffReview[]) {
  localStorage.setItem(STORAGE_KEYS.reviews, JSON.stringify(reviews));
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const sessionId = localStorage.getItem(STORAGE_KEYS.session);
    if (!sessionId) return null;
    return loadUsers().find((u) => u.id === sessionId) ?? null;
  });

  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem(STORAGE_KEYS.language) as Language) || 'en';
  });

  const [bookings, setBookings] = useState<Booking[]>(loadBookings);
  const [staffReviews, setStaffReviews] = useState<StaffReview[]>(loadReviews);
  const [styleRecommendation, setStyleRecommendation] = useState<StyleRecommendation | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [activeSalons, setActiveSalons] = useState(getActiveSalons());

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEYS.language, lang);
    if (user) {
      const users = loadUsers();
      const idx = users.findIndex((u) => u.id === user.id);
      if (idx >= 0) {
        users[idx].preferredLanguage = lang;
        saveUsers(users);
        setUser({ ...users[idx] });
      }
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

  const login = useCallback((email: string, password: string): boolean => {
    const users = loadUsers();
    const found = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!found) return false;
    setUser(found);
    localStorage.setItem(STORAGE_KEYS.session, found.id);
    if (found.preferredLanguage) setLanguageState(found.preferredLanguage);
    return true;
  }, []);

  const register = useCallback((data: Omit<User, 'id' | 'createdAt'>): boolean => {
    const users = loadUsers();
    if (users.some((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
      return false;
    }
    const newUser: User = {
      ...data,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    saveUsers(users);
    setUser(newUser);
    localStorage.setItem(STORAGE_KEYS.session, newUser.id);
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEYS.session);
  }, []);

  const createBooking = useCallback(
    (data: Omit<Booking, 'id' | 'createdAt' | 'status' | 'userId'>): Booking => {
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
      saveBookings(updated);

      if (user) {
        scheduleFeedbackRequest(booking.id, booking.salonName, user.phone, () => {
          addToast('info', '24h feedback request sent via WhatsApp');
        });
      }
      return booking;
    },
    [user, bookings, addToast]
  );

  const cancelBooking = useCallback((id: string) => {
    const updated = bookings.map((b) =>
      b.id === id ? { ...b, status: 'cancelled' as const } : b
    );
    setBookings(updated);
    saveBookings(updated);
  }, [bookings]);

  const addStaffReview = useCallback((review: Omit<StaffReview, 'id' | 'createdAt'>) => {
    const newReview: StaffReview = {
      ...review,
      id: `review-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [...staffReviews, newReview];
    setStaffReviews(updated);
    saveReviews(updated);
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

  const paySalonCommission = useCallback((salonId: string) => {
    const salon = salons.find((s) => s.id === salonId);
    if (!salon) return;
    salon.commissionDue = 0;
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);
    salon.commissionPaidUntil = nextMonth.toISOString().split('T')[0];
    setActiveSalons(getActiveSalons());
    addToast('success', `Commission paid for ${salon.name}`);
  }, [addToast]);

  const updateUserProfile = useCallback((updates: Partial<User>) => {
    if (!user) return;
    const users = loadUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...updates };
      saveUsers(users);
      setUser(users[idx]);
    }
  }, [user]);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  return (
    <AppContext.Provider
      value={{
        user,
        language,
        setLanguage,
        login,
        register,
        logout,
        bookings,
        createBooking,
        cancelBooking,
        staffReviews,
        addStaffReview,
        styleRecommendation,
        setStyleRecommendation,
        userLocation,
        requestLocation,
        toasts,
        addToast,
        removeToast,
        activeSalons,
        paySalonCommission,
        updateUserProfile,
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

