export type Language = 'en' | 'hi' | 'kn';

export type PaymentMethod = 'cash' | 'upi' | 'card' | 'pay-at-salon';

export type SalonCategory =
  | 'hair'
  | 'skin'
  | 'nails'
  | 'spa'
  | 'bridal'
  | 'grooming'
  | 'wellness';

export interface Staff {
  id: string;
  name: string;
  role: string;
  rating: number;
  reviewCount: number;
  specialties: string[];
  avatar: string;
}

export interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  category: SalonCategory;
}

export interface Package {
  id: string;
  name: string;
  description: string;
  services: string[];
  price: number;
  savings: number;
}

export interface Salon {
  id: string;
  name: string;
  tagline: string;
  area: string;
  address: string;
  lat: number;
  lng: number;
  rating: number;
  reviewCount: number;
  categories: SalonCategory[];
  image: string;
  openHours: string;
  phone: string;
  email: string;
  services: Service[];
  packages: Package[];
  staff: Staff[];
  featured: boolean;
  commissionPaidUntil?: string;
  commissionDue?: number;
  password?: string;
  isActive?: boolean;
  registrationStatus?: 'pending' | 'approved' | 'rejected';
  ownerName?: string;
  phoneOwner?: string;
  tradeLicenseUrl?: string;
  exitReason?: string;
  registeredAt?: string;
  panCardOwner?: string;
  panCardBusiness?: string;
  exitRequestStatus?: 'pending' | 'approved' | 'rejected';
  exitRejectReason?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  createdAt: string;
  preferredLanguage: Language;
  blockedUntil?: string;
}

export interface Booking {
  id: string;
  userId: string;
  salonId: string;
  salonName: string;
  serviceIds: string[];
  serviceNames: string[];
  staffId?: string;
  staffName?: string;
  date: string;
  time: string;
  totalPrice: number;
  paymentMethod: PaymentMethod;
  status: 'confirmed' | 'completed' | 'cancelled';
  createdAt: string;
  feedbackSent?: boolean;
  feedbackRequestedAt?: string;
  rating?: number;
  review?: string;
  paymentUpdatedBySalon?: boolean;
  originalPrice?: number;
  originalPackageId?: string;
  originalPackageName?: string;
  updatedPackageId?: string;
  updatedPackageName?: string;
  isPackageChanged?: boolean;
  commissionAmount?: number;
  commissionPaid?: boolean;
  reportedAsFake?: boolean;
  fakeReportReason?: string;
  // Payment tracking
  paymentStatus?: 'pending' | 'paid-online' | 'paid-at-salon' | 'not-paid';
  stripePaymentId?: string;
  // Salon verification
  appointmentTaken?: boolean;
  paymentVerifiedBySalon?: boolean;
  salonNotes?: string;
  // Service modification by salon
  modifiedServices?: string[];
  modifiedServiceNames?: string[];
  modifiedPrice?: number;
  rescheduledFrom?: { date: string; time: string };
  refundAmount?: number;
  customImageUrl?: string;
  customMessage?: string;
  aiStyleRecommendation?: StyleRecommendation;
  payoutAmount?: number;
  payoutStatus?: 'pending' | 'paid' | 'pay-at-salon';
}

export interface BlockedSlot {
  id: string;
  salonId: string;
  date: string;
  time: string;
  customerName?: string;
  reason?: string;
  createdAt: string;
}

export interface StaffReview {
  id: string;
  staffId: string;
  salonId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface StyleRecommendation {
  faceShape: string;
  skinTone: string;
  gender: 'male' | 'female';
  suggestedHairColors: string[];
  suggestedStyles: string[];
  userAdjustedColor?: string;
  userAdjustedStyle?: string;
  customImageUrl?: string;
  customMessage?: string;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export interface Notification {
  id: string;
  target: string; // 'admin' or salonId
  type: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export interface Message {
  id: string;
  salonId: string;
  sender: 'admin' | 'salon';
  encryptedContent: string;
  context: 'direct' | 'exit-dispute';
  createdAt: string;
  isRead: boolean;
  // decryptedContent is added client-side after decryption
  decryptedContent?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  readBy: string[]; // array of salonIds that have read this
}
