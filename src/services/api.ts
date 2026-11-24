import type { User, Salon, Booking, StaffReview, BlockedSlot, Notification, Message, Announcement } from '../types';

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

// Retry a fetch with exponential backoff
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3,
  timeoutMs = 15000
): Promise<Response> {
  let lastError: Error = new Error('Network request failed');

  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);
      return res;
    } catch (err: unknown) {
      clearTimeout(timer);
      const isAbort = err instanceof DOMException && err.name === 'AbortError';
      lastError = new Error(
        isAbort
          ? `Request timed out after ${timeoutMs / 1000}s. Check your internet connection.`
          : (err instanceof Error ? err.message : 'Network error')
      );
      // Only retry GET requests (safe/idempotent); never retry mutations on failure
      const method = (options.method || 'GET').toUpperCase();
      const isRetryable = method === 'GET';
      if (!isRetryable || attempt === retries) break;
      // Exponential backoff: 500ms, 1000ms, 2000ms
      await new Promise(r => setTimeout(r, 500 * Math.pow(2, attempt - 1)));
    }
  }

  throw lastError;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options?.headers || {}),
  };

  if (authToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${authToken}`;
  }

  const fetchOptions: RequestInit = { ...options, headers };

  const res = await fetchWithRetry(url, fetchOptions);

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed with status ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const api = {
  // Seeding
  seed: (data: { salons: Salon[]; users: User[]; bookings: Booking[]; reviews: StaffReview[] }) =>
    request<{ success: boolean; message: string }>('/api/seed', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Get data lists
  getUsers: () => request<User[]>('/api/users'),
  getSalons: () => request<Salon[]>('/api/salons'),
  getBookings: () => request<Booking[]>('/api/bookings'),
  getReviews: () => request<StaffReview[]>('/api/reviews'),

  // User Auth & Profiles
  userLogin: (emailOrPhone: string, password: string) =>
    request<{ success: boolean; user: User }>('/api/users/login', {
      method: 'POST',
      body: JSON.stringify({ emailOrPhone, password }),
    }),

  userRegister: (userData: Partial<User> & { id: string; email: string }) =>
    request<{ success: boolean; user: User }>('/api/users/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  updateUserProfile: (id: string, updates: Partial<User>) =>
    request<{ success: boolean; user: User }>(`/api/users/${id}/update`, {
      method: 'POST',
      body: JSON.stringify({ updates }),
    }),

  // Salon operations
  salonLogin: (name: string, id: string, email: string, checkPass: string) =>
    request<{ success: boolean; salon: Salon }>('/api/salons/login', {
      method: 'POST',
      body: JSON.stringify({ name, id, email, password: checkPass }),
    }),

  setSalonPassword: (email: string, salonId: string, newPassword: string) =>
    request<{ success: boolean; message: string }>('/api/salons/set-password', {
      method: 'POST',
      body: JSON.stringify({ email, salonId, newPassword }),
    }),

  salonRegister: (salonData: {
    ownerName: string;
    name: string;
    address: string;
    email: string;
    phone: string;
    phoneOwner: string;
    tradeLicenseUrl: string;
    panCardOwner?: string;
    panCardBusiness?: string;
  }) =>
    request<{ success: boolean; salonId: string }>('/api/salons/register', {
      method: 'POST',
      body: JSON.stringify(salonData),
    }),

  salonExit: (id: string, reason: string) =>
    request<{ success: boolean }>(`/api/salons/${id}/exit`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  approveSalonExit: (id: string) =>
    request<{ success: boolean }>(`/api/salons/${id}/approve-exit`, {
      method: 'POST',
    }),

  rejectSalonExit: (id: string, rejectReason: string) =>
    request<{ success: boolean }>(`/api/salons/${id}/reject-exit`, {
      method: 'POST',
      body: JSON.stringify({ rejectReason }),
    }),

  approveSalon: (id: string) =>
    request<{ success: boolean; newSalonId?: string }>(`/api/salons/${id}/approve`, {
      method: 'POST',
    }),

  rejectSalon: (id: string) =>
    request<{ success: boolean }>(`/api/salons/${id}/reject`, {
      method: 'POST',
    }),

  removeSalonForcefully: (id: string) =>
    request<{ success: boolean }>(`/api/salons/${id}/force-deactivate`, {
      method: 'POST',
    }),

  deleteSalonPermanently: (id: string) =>
    request<{ success: boolean; message: string }>(`/api/salons/${id}`, {
      method: 'DELETE',
    }),

  updateSalonLocation: (id: string, address: string, lat: number, lng: number) =>
    request<{ success: boolean }>(`/api/salons/${id}/update-location`, {
      method: 'POST',
      body: JSON.stringify({ address, lat, lng }),
    }),

  updateSalonStaff: (id: string, staff: any[]) =>
    request<{ success: boolean }>(`/api/salons/${id}/update-staff`, {
      method: 'POST',
      body: JSON.stringify({ staff }),
    }),

  paySalonCommission: (id: string) =>
    request<{ success: boolean }>(`/api/salons/${id}/pay-commission`, {
      method: 'POST',
    }),

  // Admin Auth & management
  adminLogin: (username: string, password: string) =>
    request<{ success: boolean }>('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  blockUser: (userId: string, blockedUntil: string) =>
    request<{ success: boolean }>('/api/admin/block-user', {
      method: 'POST',
      body: JSON.stringify({ userId, blockedUntil }),
    }),

  unblockUser: (userId: string) =>
    request<{ success: boolean }>('/api/admin/unblock-user', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),

  // Bookings
  addBooking: (bookingData: Omit<Booking, 'id' | 'createdAt' | 'status'>) =>
    request<{ success: boolean; booking: Booking }>('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    }),

  cancelBooking: (id: string) =>
    request<{ success: boolean }>(`/api/bookings/${id}/cancel`, {
      method: 'POST',
    }),

  rescheduleBooking: (id: string, date: string, time: string) =>
    request<{ success: boolean }>(`/api/bookings/${id}/reschedule`, {
      method: 'POST',
      body: JSON.stringify({ date, time }),
    }),

  updateBookingPayment: (id: string, paymentMethod: string, packageId?: string) =>
    request<{ success: boolean }>(`/api/bookings/${id}/update`, {
      method: 'POST',
      body: JSON.stringify({ paymentMethod, packageId }),
    }),

  reportFakeBooking: (id: string, reason: string) =>
    request<{ success: boolean }>(`/api/bookings/${id}/report-fake`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  verifyBookingStatus: (bookingId: string, data: {
    appointmentTaken?: boolean;
    paymentVerifiedBySalon?: boolean;
    paymentMethod?: string;
    salonNotes?: string;
  }) =>
    request<{ success: boolean }>(`/api/bookings/${bookingId}/verify-status`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  modifyBookingServices: (bookingId: string, data: {
    modifiedServices: string[];
    modifiedServiceNames: string[];
    modifiedPrice: number;
  }) =>
    request<{ success: boolean; newCommission: number; modifiedPrice: number }>(`/api/bookings/${bookingId}/modify-services`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Blocked Slots
  getBlockedSlots: (salonId: string) =>
    request<BlockedSlot[]>(`/api/salons/${salonId}/blocked-slots`),

  blockSlot: (salonId: string, data: { date: string; time: string; customerName?: string; reason?: string }) =>
    request<{ success: boolean; slot: BlockedSlot }>(`/api/salons/${salonId}/block-slot`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  unblockSlot: (salonId: string, slotId: string) =>
    request<{ success: boolean }>(`/api/salons/${salonId}/blocked-slots/${slotId}`, {
      method: 'DELETE',
    }),

  // Reviews
  addStaffReview: (reviewData: Omit<StaffReview, 'id' | 'createdAt'>) =>
    request<{ success: boolean; review: StaffReview }>('/api/reviews', {
      method: 'POST',
      body: JSON.stringify(reviewData),
    }),

  // Notifications
  getNotifications: (target: string) =>
    request<Notification[]>(`/api/notifications?target=${encodeURIComponent(target)}`),

  markNotificationRead: (id: string) =>
    request<{ success: boolean }>(`/api/notifications/${id}/read`, { method: 'POST' }),

  markAllNotificationsRead: (target: string) =>
    request<{ success: boolean }>('/api/notifications/mark-all-read', {
      method: 'POST',
      body: JSON.stringify({ target }),
    }),

  // Messages (E2E encrypted 1:1 conversations)
  getMessages: (salonId: string) =>
    request<Message[]>(`/api/messages/${salonId}`),

  sendMessage: (salonId: string, sender: 'admin' | 'salon', encryptedContent: string, context: 'direct' | 'exit-dispute' = 'direct') =>
    request<{ success: boolean; message: Message }>(`/api/messages/${salonId}`, {
      method: 'POST',
      body: JSON.stringify({ sender, encryptedContent, context }),
    }),

  markMessageRead: (id: string) =>
    request<{ success: boolean }>(`/api/messages/read/${id}`, { method: 'POST' }),

  // Announcements (admin broadcast to all salons)
  getAnnouncements: () =>
    request<Announcement[]>('/api/announcements'),

  createAnnouncement: (title: string, content: string) =>
    request<{ success: boolean; announcement: Announcement }>('/api/announcements', {
      method: 'POST',
      body: JSON.stringify({ title, content }),
    }),

  markAnnouncementRead: (id: string, salonId: string) =>
    request<{ success: boolean }>(`/api/announcements/${id}/read`, {
      method: 'POST',
      body: JSON.stringify({ salonId }),
    }),
};
