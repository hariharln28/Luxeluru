import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  Building, 
  Calendar, 
  Clock, 
  IndianRupee, 
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  X, 
  AlertCircle,
  TrendingUp,
  CreditCard,
  Percent,
  Award,
  Lock,
  Unlock,
  UserPlus,
  RefreshCw,
  MapPin,
  Edit3,
  Trash2,
  Users,
  Sparkles,
  Bell,
  MessageSquare,
  Send,
  Megaphone
} from 'lucide-react';
import type { PaymentMethod } from '../types';
import { CheckoutModal } from '../components/CheckoutModal';

export function SalonDashboardPage() {
  const { 
    salon, 
    bookings, 
    updateBookingPayment, 
    reportFakeBooking, 
    paySalonCommission, 
    logout,
    blockedSlots,
    fetchBlockedSlots,
    blockSlot,
    unblockSlot,
    refreshData,
    updateSalonLocation,
    updateSalonStaff,
    verifyBookingStatus,
    modifyBookingServices,
    notifications,
    fetchNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    messages,
    announcements,
    sendDirectMessage,
    markAnnouncementRead
  } = useApp();

  const [refreshing, setRefreshing] = useState(false);
  const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  }, [refreshData]);
  
  const navigate = useNavigate();
  
  // Dashboard Tabs
  const [activeTab, setActiveTab] = useState<'appointments' | 'slots' | 'insights' | 'location' | 'team' | 'notifications' | 'messages'>('appointments');
  const [activeSubTab, setActiveSubTab] = useState<'chat' | 'announcements'>('chat');
  const [msgInput, setMsgInput] = useState('');
  const [msgSending, setMsgSending] = useState(false);

  const salonNotifications = notifications.filter(n => n.target === salon?.id);
  const unreadCount = salonNotifications.filter(n => !n.read).length;

  // Manage Slots state
  const [slotDate, setSlotDate] = useState(new Date().toISOString().split('T')[0]);
  const [blockCustomerName, setBlockCustomerName] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [blockingTime, setBlockingTime] = useState<string | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);

  // Location state
  const [editAddress, setEditAddress] = useState(salon?.address || '');
  const [editLat, setEditLat] = useState(String(salon?.lat || ''));
  const [editLng, setEditLng] = useState(String(salon?.lng || ''));

  // Team management state
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('');
  const [newStaffSpecialties, setNewStaffSpecialties] = useState('');
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);

  const TIME_SLOTS = [
    '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM',
    '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM',
  ];

  // Modals / forms state
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('cash');
  const [selectedPkgId, setSelectedPkgId] = useState<string>('');

  const [reportingBookingId, setReportingBookingId] = useState<string | null>(null);
  const [fakeReason, setFakeReason] = useState('');

  const [modifyingBookingId, setModifyingBookingId] = useState<string | null>(null);
  const [modifyServices, setModifyServices] = useState<string[]>([]);
  const [verifyNotes, setVerifyNotes] = useState('');

  // If no salon is logged in, redirect to login page
  if (!salon) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <AlertCircle className="mx-auto h-16 w-16 text-red-400 mb-4" />
        <h2 className="font-display text-2xl font-bold text-[#e8d5a3]">Access Denied</h2>
        <p className="mt-2 text-[#9a8fa8]">You must be logged in as a Salon Partner to view this dashboard.</p>
        <button onClick={() => navigate('/login')} className="luxe-btn mt-6">
          Go to Sign In
        </button>
      </div>
    );
  }

  // Filter bookings for this salon
  const salonBookings = bookings
    .filter((b) => b.salonId === salon.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const activeBookings = salonBookings.filter((b) => b.status === 'confirmed');
  const completedBookings = salonBookings.filter((b) => b.status === 'completed');
  
  // Dues calculations
  const totalCommissionDue = salon.commissionDue ?? 0;
  
  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const hardDeadline = new Date(endOfMonth);
  hardDeadline.setDate(hardDeadline.getDate() + 5);
  
  const diffTime = hardDeadline.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const isOverdue = totalCommissionDue > 0 && diffDays <= 0;

  // Analytics calculations
  const totalEarnings = completedBookings.reduce((sum, b) => sum + b.totalPrice, 0);
  const upiEarnings = completedBookings.filter(b => b.paymentMethod === 'upi').reduce((sum, b) => sum + b.totalPrice, 0);
  const cashEarnings = completedBookings.filter(b => b.paymentMethod === 'cash').reduce((sum, b) => sum + b.totalPrice, 0);
  const upiPercent = totalEarnings ? Math.round((upiEarnings / totalEarnings) * 100) : 0;
  const cashPercent = totalEarnings ? Math.round((cashEarnings / totalEarnings) * 100) : 0;

  // Package switch analytics
  const packageSwitches = completedBookings.filter(b => b.isPackageChanged).length;
  const switchPercent = completedBookings.length ? Math.round((packageSwitches / completedBookings.length) * 100) : 0;

  // Stylist performance analytics
  const stylistStatsMap = new Map<string, { name: string; completedJobs: number; revenue: number; rating: number }>();
  
  // Initialize with salon's actual staff pool
  salon.staff.forEach(s => {
    stylistStatsMap.set(s.name, {
      name: s.name,
      completedJobs: 0,
      revenue: 0,
      rating: s.rating
    });
  });

  // Populate from completed bookings
  completedBookings.forEach(b => {
    const sName = b.staffName || 'General Staff';
    const existing = stylistStatsMap.get(sName) || { name: sName, completedJobs: 0, revenue: 0, rating: 5.0 };
    stylistStatsMap.set(sName, {
      ...existing,
      completedJobs: existing.completedJobs + 1,
      revenue: existing.revenue + b.totalPrice
    });
  });

  const stylistStats = [...stylistStatsMap.values()].sort((a, b) => b.completedJobs - a.completedJobs);

  function openEditModal(bookingId: string) {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;
    setEditingBookingId(bookingId);
    setSelectedPayment(booking.paymentMethod);
    setSelectedPkgId(booking.originalPackageId || '');
  }

  function handleUpdatePaymentSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingBookingId) return;

    updateBookingPayment(editingBookingId, selectedPayment, selectedPkgId || undefined);
    setEditingBookingId(null);
  }

  function handleReportFakeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reportingBookingId || !fakeReason.trim()) return;

    reportFakeBooking(reportingBookingId, fakeReason);
    setReportingBookingId(null);
    setFakeReason('');
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Top Banner */}
      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between border-b border-[#c9a962]/10 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Building className="h-6 w-6 text-[#c9a962]" />
            <span className="font-mono text-sm text-[#9a8fa8] uppercase tracking-wider">Salon Code: {salon.id}</span>
          </div>
          <h1 className="mt-1 font-display text-3xl sm:text-4xl font-bold gold-gradient">{salon.name}</h1>
          <p className="mt-1 text-[#9a8fa8]">Logged in as Partner Manager · {salon.area}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
            isOverdue ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
          }`}>
            <span className={`h-2 w-2 rounded-full ${isOverdue ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`} />
            {isOverdue ? 'DEACTIVATED / UNPAID DUES' : 'ACTIVE ON PLATFORM'}
          </span>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="luxe-btn-outline text-xs px-4 py-2 flex items-center gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button onClick={() => { logout(); navigate('/login'); }} className="luxe-btn-outline text-xs px-4 py-2">
            Logout
          </button>
        </div>
      </div>

      {/* Overdue Alert */}
      {isOverdue && (
        <div className="mb-8 rounded-xl border border-red-500/30 bg-red-500/10 p-5 flex items-start gap-3">
          <AlertTriangle className="h-6 w-6 shrink-0 text-red-400" />
          <div>
            <h4 className="text-base font-bold text-red-200">Dues Overdue - Salon Hidden from Listings</h4>
            <p className="mt-1 text-sm text-red-300/80">
              Your platform fees have exceeded the grace period. Please clear the pending dues immediately to re-activate your listing and start accepting bookings again.
            </p>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="mb-8 flex rounded-xl border border-[#c9a962]/20 bg-[#1a1520] p-1 max-w-lg overflow-x-auto">
        <button
          onClick={() => setActiveTab('appointments')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition whitespace-nowrap px-3 ${
            activeTab === 'appointments' ? 'bg-[#c9a962] text-[#0f0d12]' : 'text-[#9a8fa8] hover:text-[#e8d5a3]'
          }`}
        >
          <Calendar className="h-4 w-4" />
          Appointments ({activeBookings.length})
        </button>
        <button
          onClick={() => { setActiveTab('slots'); if (salon) fetchBlockedSlots(salon.id); }}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition whitespace-nowrap px-3 ${
            activeTab === 'slots' ? 'bg-[#c9a962] text-[#0f0d12]' : 'text-[#9a8fa8] hover:text-[#e8d5a3]'
          }`}
        >
          <Lock className="h-4 w-4" />
          Manage Slots
        </button>
        <button
          onClick={() => setActiveTab('insights')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition whitespace-nowrap px-3 ${
            activeTab === 'insights' ? 'bg-[#c9a962] text-[#0f0d12]' : 'text-[#9a8fa8] hover:text-[#e8d5a3]'
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          Insights
        </button>
        <button
          onClick={() => setActiveTab('location')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold transition ${
            activeTab === 'location' ? 'bg-[#c9a962] text-[#0f0d12]' : 'text-[#9a8fa8] hover:text-[#e8d5a3]'
          }`}
        >
          <MapPin className="h-4 w-4" /> Location
        </button>
        <button
          onClick={() => setActiveTab('team')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold transition ${
            activeTab === 'team' ? 'bg-[#c9a962] text-[#0f0d12]' : 'text-[#9a8fa8] hover:text-[#e8d5a3]'
          }`}
        >
          <Users className="h-4 w-4" /> Team
        </button>
        <button
          onClick={() => { setActiveTab('notifications'); if (salon) fetchNotifications(salon.id); }}
          className={`relative flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold transition ${
            activeTab === 'notifications' ? 'bg-[#c9a962] text-[#0f0d12]' : 'text-[#9a8fa8] hover:text-[#e8d5a3]'
          }`}
        >
          <Bell className="h-4 w-4" />
          Notifications
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('messages')}
          className={`relative flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold transition ${
            activeTab === 'messages' ? 'bg-[#c9a962] text-[#0f0d12]' : 'text-[#9a8fa8] hover:text-[#e8d5a3]'
          }`}
          style={{ touchAction: 'manipulation' }}
        >
          <MessageSquare className="h-4 w-4" />
          Messages
          {(() => {
            const salonMsgs = messages.filter(m => m.salonId === salon?.id && m.sender === 'admin' && !m.isRead);
            const unreadAnn = announcements.filter(a => salon && !a.readBy.includes(salon.id));
            const total = salonMsgs.length + unreadAnn.length;
            return total > 0 ? (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                {total > 9 ? '9+' : total}
              </span>
            ) : null;
          })()}
        </button>
      </div>

      {/* APPOINTMENTS VIEW */}
      {activeTab === 'appointments' && (
        <>
          {/* Dashboard Stats */}
          <div className="grid gap-6 md:grid-cols-3 mb-10">
            <div className="luxe-card p-6">
              <p className="text-xs text-[#9a8fa8] uppercase tracking-wider font-semibold">Total Commission Due</p>
              <p className="mt-2 flex items-baseline gap-1 font-display text-4xl font-bold text-[#c9a962]">
                <IndianRupee className="h-8 w-8 text-[#c9a962]" />
                {totalCommissionDue.toLocaleString('en-IN')}
              </p>
              <p className="mt-2 text-xs text-[#9a8fa8]">3% of final bills from completed appointments.</p>
            </div>

            <div className="luxe-card p-6">
              <p className="text-xs text-[#9a8fa8] uppercase tracking-wider font-semibold">Payment Deadline</p>
              <p className="mt-2 font-display text-2xl font-bold text-[#e8d5a3]">
                {endOfMonth.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
              <p className="mt-2 text-xs text-[#9a8fa8]">
                Grace Period: Dues must be paid by the 5th of next month (5 days remaining).
              </p>
            </div>

            <div className="luxe-card p-6 flex flex-col justify-between">
              <div>
                <p className="text-xs text-[#9a8fa8] uppercase tracking-wider font-semibold">Dues Settlement</p>
                <p className="mt-1 text-xs text-[#9a8fa8]">Clear pending commission balance to remain active.</p>
              </div>
              <button
                onClick={() => setShowCheckout(true)}
                disabled={totalCommissionDue === 0}
                className={`w-full mt-4 flex items-center justify-center gap-2 luxe-btn ${
                  totalCommissionDue === 0 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <IndianRupee className="h-4 w-4" /> Clear Platform Dues
              </button>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Bookings update panel */}
            <div className="lg:col-span-2 space-y-6">
              <h2 className="font-display text-2xl text-[#e8d5a3] flex items-center gap-2">
                <span>Upcoming Appointments</span>
                <span className="rounded-full bg-[#c9a962]/10 px-2.5 py-0.5 text-xs text-[#c9a962]">
                  {activeBookings.length}
                </span>
              </h2>

              {activeBookings.length === 0 ? (
                <div className="luxe-card p-8 text-center text-[#9a8fa8]">
                  <Calendar className="mx-auto h-12 w-12 text-[#3d3347] mb-3" />
                  <p>No active/uncompleted bookings found.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeBookings.map((b) => (
                    <div key={b.id} className="luxe-card p-5 border-l-4 border-amber-500/40">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="rounded bg-[#1a1520] px-2 py-0.5 text-xs font-mono text-[#c9a962]">ID: {b.id}</span>
                            {b.reportedAsFake && (
                              <span className="rounded bg-red-500/20 px-2 py-0.5 text-xs text-red-400">Reported Fake</span>
                            )}
                          </div>
                          <p className="mt-2 text-sm text-[#e8d5a3]">{b.serviceNames.join(' · ')}</p>
                          <div className="mt-2 space-y-1 text-xs text-[#9a8fa8]">
                            <p className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5" /> Date: {b.date}</p>
                            <p className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" /> Time: {b.time}</p>
                            {b.staffName && <p>Stylist: {b.staffName}</p>}
                          </div>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-[#9a8fa8] text-xs">Customer Booked Price</p>
                          <p className="text-xl font-bold font-display text-[#c9a962] mt-0.5">₹{b.totalPrice.toLocaleString('en-IN')}</p>
                          <p className="text-xs text-[#9a8fa8] mt-1 uppercase">
                            {b.paymentMethod === 'card' ? '💳 Card (Online)' :
                             b.paymentMethod === 'upi' ? '📱 UPI (Online)' :
                             b.paymentMethod === 'pay-at-salon' ? '💵 Pay at Salon' :
                             b.paymentMethod === 'cash' ? '💵 Cash' : b.paymentMethod}
                            {b.paymentStatus === 'paid-online' && <span className="ml-1 text-emerald-400">(Paid ✓)</span>}
                          </p>
                        </div>
                      </div>

                      {/* AI Stylist & Custom Preferences */}
                      {(b.aiStyleRecommendation || b.customImageUrl || b.customMessage) && (
                        <div className="mt-4 bg-[#130f18]/60 border border-[#c9a962]/20 rounded-xl p-3.5 space-y-2">
                          <p className="text-xs font-semibold text-[#e8d5a3] flex items-center gap-1">
                            <Sparkles className="h-3.5 w-3.5 text-[#c9a962]" />
                            AI Stylist &amp; Custom Preferences
                          </p>
                          
                          {b.aiStyleRecommendation && b.aiStyleRecommendation.faceShape !== 'Custom Upload' && (
                            <div className="grid grid-cols-2 gap-2 text-[11px] text-[#9a8fa8] pb-2 border-b border-[#c9a962]/10">
                              <div>
                                <span className="text-[#e8d5a3] font-medium">Face Shape:</span> {b.aiStyleRecommendation.faceShape}
                              </div>
                              <div>
                                <span className="text-[#e8d5a3] font-medium">Skin Tone:</span> {b.aiStyleRecommendation.skinTone}
                              </div>
                              {b.aiStyleRecommendation.userAdjustedStyle && (
                                <div className="col-span-2">
                                  <span className="text-[#e8d5a3] font-medium">Selected Style:</span> {b.aiStyleRecommendation.userAdjustedStyle}
                                </div>
                              )}
                              {b.aiStyleRecommendation.userAdjustedColor && (
                                <div className="col-span-2">
                                  <span className="text-[#e8d5a3] font-medium">Selected Colour:</span> {b.aiStyleRecommendation.userAdjustedColor}
                                </div>
                              )}
                            </div>
                          )}

                          {b.customMessage && (
                            <div className="text-[11px] text-[#9a8fa8]">
                              <span className="text-[#e8d5a3] font-medium">Custom Notes:</span> "{b.customMessage}"
                            </div>
                          )}

                          {b.customImageUrl && (
                            <div className="pt-1">
                              <p className="text-[11px] text-[#e8d5a3] font-medium mb-1.5">Customer Reference Image:</p>
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => setViewingImageUrl(b.customImageUrl || null)}
                                  className="group relative flex-shrink-0 focus:outline-none"
                                  style={{ touchAction: 'manipulation' }}
                                  title="Click to view full size"
                                >
                                  <img
                                    src={b.customImageUrl}
                                    alt="Customer Reference"
                                    loading="lazy"
                                    className="h-20 w-20 rounded-xl object-cover border-2 border-[#c9a962]/40 group-hover:border-[#c9a962] transition"
                                  />
                                  <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 group-active:opacity-100 transition">
                                    <span className="text-white text-[10px] font-semibold">🔍 Open</span>
                                  </div>
                                </button>
                                <button
                                  onClick={() => setViewingImageUrl(b.customImageUrl || null)}
                                  className="text-xs text-[#c9a962] underline underline-offset-2 hover:text-[#e8d5a3] transition"
                                  style={{ touchAction: 'manipulation', minHeight: 36 }}
                                >
                                  📷 View Full Image
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="mt-4 flex flex-wrap gap-2 border-t border-[#c9a962]/10 pt-4">
                        <button
                          onClick={() => openEditModal(b.id)}
                          className="luxe-btn text-xs py-2 px-4"
                        >
                          Update & Mark Complete
                        </button>
                        {!b.reportedAsFake && (
                          <button
                            onClick={() => setReportingBookingId(b.id)}
                            className="luxe-btn-outline text-xs border-red-500/30 text-red-400 hover:bg-red-500/10 py-2 px-4"
                          >
                            Report Fake Appointment
                          </button>
                        )}
                      </div>

                      {/* Salon verification controls */}
                      <div className="mt-3 pt-3 border-t border-[#c9a962]/10 space-y-2">
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-1.5 text-xs text-[#9a8fa8] cursor-pointer">
                            <input
                              type="checkbox"
                              checked={b.appointmentTaken || false}
                              onChange={(e) => verifyBookingStatus(b.id, { appointmentTaken: e.target.checked })}
                              className="rounded border-[#c9a962]/30"
                            />
                            Customer Arrived
                          </label>
                          <label className="flex items-center gap-1.5 text-xs text-[#9a8fa8] cursor-pointer">
                            <input
                              type="checkbox"
                              checked={b.paymentVerifiedBySalon || false}
                              onChange={(e) => verifyBookingStatus(b.id, { paymentVerifiedBySalon: e.target.checked, paymentMethod: b.paymentMethod })}
                              className="rounded border-[#c9a962]/30"
                            />
                            Payment Received
                          </label>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Add notes..."
                            defaultValue={b.salonNotes || ''}
                            onBlur={(e) => { if (e.target.value !== (b.salonNotes || '')) verifyBookingStatus(b.id, { salonNotes: e.target.value }); }}
                            className="luxe-input text-xs flex-1 py-1.5"
                          />
                          <button
                            onClick={() => {
                              setModifyingBookingId(b.id);
                              setModifyServices(b.serviceIds);
                            }}
                            className="text-[10px] px-3 py-1.5 rounded-lg border border-[#c9a962]/20 text-[#c9a962] hover:bg-[#c9a962]/10 transition whitespace-nowrap"
                          >
                            Modify Services
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Completed list & commission tracking */}
            <div className="space-y-6">
              <h2 className="font-display text-2xl text-[#e8d5a3]">Previous Bookings Log</h2>
              {completedBookings.length === 0 ? (
                <div className="luxe-card p-6 text-center text-[#9a8fa8]">
                  <FileText className="mx-auto h-10 w-10 text-[#3d3347] mb-2" />
                  <p>No completed jobs recorded yet.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {completedBookings.map((b) => (
                    <div key={b.id} className="luxe-card p-4 text-xs">
                      <div className="flex justify-between items-start">
                        <span className="font-semibold text-[#e8d5a3]">{b.id}</span>
                        <span className="text-green-400 flex items-center gap-1 font-bold">
                          <CheckCircle className="h-3.5 w-3.5" /> Completed
                        </span>
                      </div>
                      <p className="mt-1 text-[#9a8fa8]">{b.date} · {b.time}</p>
                      <p className="mt-1.5 font-medium text-[#e8d5a3]">{b.serviceNames.join(' · ')}</p>
                      
                      {b.isPackageChanged && (
                        <div className="mt-2 bg-[#0f0d12] rounded p-1.5 text-[10px] text-amber-300">
                          <p><strong>Package Changed:</strong> {b.updatedPackageName}</p>
                          <p className="text-[9px] text-[#9a8fa8]">User originally chose: {b.originalPackageName}</p>
                        </div>
                      )}

                      {/* AI Stylist & Custom Preferences (Previous) */}
                      {(b.aiStyleRecommendation || b.customImageUrl || b.customMessage) && (
                        <div className="mt-2 bg-[#130f18]/40 border border-[#c9a962]/5 rounded p-2 space-y-1.5 text-[10px]">
                          <p className="font-semibold text-[#e8d5a3] flex items-center gap-1">
                            <Sparkles className="h-3 w-3 text-[#c9a962]" />
                            Style Preferences
                          </p>
                          {b.customMessage && (
                            <p className="text-[#9a8fa8]"><span className="text-[#e8d5a3]">Notes:</span> "{b.customMessage}"</p>
                          )}
                          {b.customImageUrl && (
                            <div className="flex items-center gap-2 flex-wrap pt-1">
                              <span className="text-[#e8d5a3]">Reference Image:</span>
                              <button
                                onClick={() => setViewingImageUrl(b.customImageUrl || null)}
                                className="flex items-center gap-1 rounded-lg bg-[#c9a962]/10 px-3 py-1.5 text-xs text-[#c9a962] hover:bg-[#c9a962]/20 transition"
                                style={{ touchAction: 'manipulation', minHeight: 36 }}
                              >
                                📷 View Image
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="mt-3 flex justify-between border-t border-[#c9a962]/5 pt-2">
                        <div>
                          <p className="text-[#9a8fa8]">Total Bill (Final)</p>
                          <p className="text-sm font-semibold text-[#c9a962]">
                            ₹{b.totalPrice.toLocaleString('en-IN')} &nbsp;
                            <span className="text-xs font-normal text-[#9a8fa8]">
                              ({b.paymentMethod === 'card' ? '💳 Card' :
                                b.paymentMethod === 'upi' ? '📱 UPI' :
                                b.paymentMethod === 'pay-at-salon' ? '💵 At Salon' :
                                b.paymentMethod === 'cash' ? '💵 Cash' : b.paymentMethod})
                            </span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[#9a8fa8]">Commission (3%)</p>
                          <p className="text-sm font-semibold text-amber-300">₹{(b.commissionAmount ?? 0).toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                      {b.paymentStatus && (
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          b.paymentStatus === 'paid-online' ? 'bg-green-500/20 text-green-400' :
                          b.paymentStatus === 'paid-at-salon' ? 'bg-blue-500/20 text-blue-400' :
                          b.paymentStatus === 'not-paid' ? 'bg-red-500/20 text-red-400' :
                          'bg-amber-500/20 text-amber-300'
                        }`}>{b.paymentStatus.replace(/-/g, ' ')}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* BUSINESS INSIGHTS & ANALYTICS TAB */}
      {activeTab === 'insights' && (
        <div className="space-y-8 animate-fade-in">
          {/* Analytics Top Cards */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="luxe-card p-6">
              <div className="flex items-center justify-between text-[#9a8fa8]">
                <span className="text-xs uppercase tracking-wider font-semibold">Total Revenue (Completed)</span>
                <IndianRupee className="h-4 w-4 text-[#c9a962]" />
              </div>
              <p className="mt-2 font-display text-3xl font-bold text-[#e8d5a3]">₹{totalEarnings.toLocaleString('en-IN')}</p>
              <p className="mt-1 text-[10px] text-[#9a8fa8]">Earned across {completedBookings.length} completed appointments.</p>
            </div>

            <div className="luxe-card p-6">
              <div className="flex items-center justify-between text-[#9a8fa8]">
                <span className="text-xs uppercase tracking-wider font-semibold">UPI Payment Share</span>
                <CreditCard className="h-4 w-4 text-[#c9a962]" />
              </div>
              <p className="mt-2 font-display text-3xl font-bold text-[#e8d5a3]">{upiPercent}%</p>
              <p className="mt-1 text-[10px] text-[#9a8fa8]">₹{upiEarnings.toLocaleString('en-IN')} received via digital UPI.</p>
            </div>

            <div className="luxe-card p-6">
              <div className="flex items-center justify-between text-[#9a8fa8]">
                <span className="text-xs uppercase tracking-wider font-semibold">Cash Payment Share</span>
                <IndianRupee className="h-4 w-4 text-[#c9a962]" />
              </div>
              <p className="mt-2 font-display text-3xl font-bold text-[#e8d5a3]">{cashPercent}%</p>
              <p className="mt-1 text-[10px] text-[#9a8fa8]">₹{cashEarnings.toLocaleString('en-IN')} received in cash payments.</p>
            </div>

            <div className="luxe-card p-6">
              <div className="flex items-center justify-between text-[#9a8fa8]">
                <span className="text-xs uppercase tracking-wider font-semibold">Package Switch Rate</span>
                <Percent className="h-4 w-4 text-[#c9a962]" />
              </div>
              <p className="mt-2 font-display text-3xl font-bold text-[#e8d5a3]">{switchPercent}%</p>
              <p className="mt-1 text-[10px] text-[#9a8fa8]">{packageSwitches} clients adjusted their package at arrival.</p>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Payment Method Split Graph representation */}
            <div className="luxe-card p-6 space-y-6">
              <h3 className="font-display text-xl text-[#e8d5a3] flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-[#c9a962]" /> Payment Mode Breakdown
              </h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-[#9a8fa8]">UPI Payments (Online)</span>
                    <span className="text-[#e8d5a3] font-semibold">₹{upiEarnings.toLocaleString('en-IN')} ({upiPercent}%)</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-[#0f0d12] overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#c9a962] to-[#e8d5a3] rounded-full transition-all duration-500" 
                      style={{ width: `${upiPercent}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-[#9a8fa8]">Cash Payments</span>
                    <span className="text-[#e8d5a3] font-semibold">₹{cashEarnings.toLocaleString('en-IN')} ({cashPercent}%)</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-[#0f0d12] overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500/50 to-[#c9a962] rounded-full transition-all duration-500" 
                      style={{ width: `${cashPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-[#0f0d12]/50 p-4 border border-[#c9a962]/10 text-xs text-[#9a8fa8] leading-relaxed">
                UPI payments represent digital wallet collections. Platform charges are 3% of this total revenue split regardless of payment method.
              </div>
            </div>

            {/* Stylists Leaderboard inside Salon */}
            <div className="luxe-card p-6 space-y-4">
              <h3 className="font-display text-xl text-[#e8d5a3] flex items-center gap-2">
                <Award className="h-5 w-5 text-[#c9a962]" /> Stylist Performance & Contribution
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#c9a962]/15 text-[#9a8fa8] uppercase tracking-wider pb-2">
                      <th className="pb-2 font-semibold">Stylist</th>
                      <th className="pb-2 text-center font-semibold">Completed Jobs</th>
                      <th className="pb-2 text-right font-semibold">Revenue Generated</th>
                      <th className="pb-2 text-right font-semibold">Platform Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#c9a962]/5">
                    {stylistStats.map((st) => (
                      <tr key={st.name} className="hover:bg-[#c9a962]/5 transition-colors">
                        <td className="py-2.5 font-medium text-[#e8d5a3]">{st.name}</td>
                        <td className="py-2.5 text-center text-[#9a8fa8]">{st.completedJobs}</td>
                        <td className="py-2.5 text-right font-semibold text-[#c9a962]">₹{st.revenue.toLocaleString('en-IN')}</td>
                        <td className="py-2.5 text-right text-amber-400">★ {st.rating.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LOCATION TAB */}
      {activeTab === 'location' && (
        <div className="space-y-6 animate-fade-in">
          <div className="luxe-card p-6 space-y-4">
            <h3 className="font-display text-xl text-[#e8d5a3] flex items-center gap-2">
              <MapPin className="h-5 w-5 text-[#c9a962]" /> Salon Location
            </h3>
            <p className="text-xs text-[#9a8fa8]">Update your salon address. Changes are visible to customers on the platform.</p>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#9a8fa8] font-semibold block mb-1">Full Address</label>
                <textarea
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  rows={2}
                  className="luxe-input text-sm"
                  placeholder="Enter complete salon address"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#9a8fa8] font-semibold block mb-1">Latitude</label>
                  <input type="text" value={editLat} onChange={(e) => setEditLat(e.target.value)} className="luxe-input text-sm" placeholder="e.g. 12.9716" />
                </div>
                <div>
                  <label className="text-xs text-[#9a8fa8] font-semibold block mb-1">Longitude</label>
                  <input type="text" value={editLng} onChange={(e) => setEditLng(e.target.value)} className="luxe-input text-sm" placeholder="e.g. 77.5946" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    const lat = parseFloat(editLat) || 0;
                    const lng = parseFloat(editLng) || 0;
                    if (!editAddress.trim()) return;
                    updateSalonLocation(salon.id, editAddress.trim(), lat, lng);
                  }}
                  className="luxe-btn text-sm py-2 px-6"
                >
                  Update Location
                </button>
                <a
                  href={`https://www.google.com/maps?q=${editLat},${editLng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="luxe-btn-outline text-sm py-2 px-6 flex items-center gap-2"
                >
                  <MapPin className="h-4 w-4" /> View on Google Maps
                </a>
              </div>
            </div>
            
            <div className="mt-4 p-3 rounded-lg bg-[#0f0d12]/50 text-xs text-[#9a8fa8]">
              <p><strong>Current Address:</strong> {salon.address}</p>
              <p className="mt-1"><strong>Coordinates:</strong> {salon.lat}, {salon.lng}</p>
            </div>
          </div>
        </div>
      )}

      {/* TEAM MANAGEMENT TAB */}
      {activeTab === 'team' && (
        <div className="space-y-6 animate-fade-in">
          <div className="luxe-card p-6 space-y-4">
            <h3 className="font-display text-xl text-[#e8d5a3] flex items-center gap-2">
              <Users className="h-5 w-5 text-[#c9a962]" /> Team Members
            </h3>
            <p className="text-xs text-[#9a8fa8]">Manage your salon staff. Changes are visible to customers when booking.</p>
            
            {/* Add new staff form */}
            <div className="rounded-lg bg-[#0f0d12]/50 p-4 space-y-3">
              <p className="text-xs text-[#c9a962] font-semibold">Add New Team Member</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <input type="text" value={newStaffName} onChange={(e) => setNewStaffName(e.target.value)} className="luxe-input text-sm" placeholder="Name" />
                <input type="text" value={newStaffRole} onChange={(e) => setNewStaffRole(e.target.value)} className="luxe-input text-sm" placeholder="Role (e.g. Senior Stylist)" />
                <input type="text" value={newStaffSpecialties} onChange={(e) => setNewStaffSpecialties(e.target.value)} className="luxe-input text-sm" placeholder="Specialties (comma-separated)" />
              </div>
              <button
                onClick={() => {
                  if (!newStaffName.trim() || !newStaffRole.trim()) return;
                  const newMember = {
                    id: `staff-${Date.now()}`,
                    name: newStaffName.trim(),
                    role: newStaffRole.trim(),
                    rating: 5.0,
                    reviewCount: 0,
                    specialties: newStaffSpecialties.split(',').map(s => s.trim()).filter(Boolean),
                    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${newStaffName.trim()}`
                  };
                  updateSalonStaff(salon.id, [...salon.staff, newMember]);
                  setNewStaffName('');
                  setNewStaffRole('');
                  setNewStaffSpecialties('');
                }}
                className="luxe-btn text-xs py-2 px-4 flex items-center gap-1.5"
              >
                <UserPlus className="h-3.5 w-3.5" /> Add Member
              </button>
            </div>

            {/* Staff list */}
            {salon.staff.length === 0 ? (
              <div className="text-center py-8 text-[#9a8fa8] text-sm">
                No team members yet. Add your first team member above.
              </div>
            ) : (
              <div className="space-y-3">
                {salon.staff.map(member => (
                  <div key={member.id} className="rounded-lg border border-[#c9a962]/10 bg-[#0f0d12]/30 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={member.avatar} alt={member.name} className="h-10 w-10 rounded-full bg-[#1a1520]" />
                      <div>
                        <p className="font-semibold text-[#e8d5a3] text-sm">{member.name}</p>
                        <p className="text-xs text-[#9a8fa8]">{member.role}</p>
                        {member.specialties.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {member.specialties.map(s => (
                              <span key={s} className="rounded-full bg-[#c9a962]/10 px-2 py-0.5 text-[10px] text-[#c9a962]">{s}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const updated = salon.staff.filter(s => s.id !== member.id);
                        updateSalonStaff(salon.id, updated);
                      }}
                      className="text-red-400 hover:text-red-300 transition p-2"
                      title="Remove member"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MANAGE SLOTS TAB */}
      {activeTab === 'slots' && (
        <div className="space-y-6">
          <div className="luxe-card p-6">
            <h3 className="font-display text-xl text-[#e8d5a3] mb-4">Block Slots for Walk-In Customers</h3>
            <p className="text-sm text-[#9a8fa8] mb-6">
              Block time slots for customers who visit your salon directly. Blocked slots will appear as unavailable to online customers.
            </p>

            {/* Date Picker */}
            <div className="mb-6">
              <label className="block text-sm text-[#9a8fa8] mb-1.5">Select Date</label>
              <input
                type="date"
                value={slotDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setSlotDate(e.target.value)}
                className="luxe-input max-w-xs"
              />
            </div>

            {/* Time Slot Grid */}
            <div className="mb-6">
              <label className="block text-sm text-[#9a8fa8] mb-3">Time Slots for {slotDate}</label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {TIME_SLOTS.map((slot) => {
                  const isBlocked = blockedSlots.some(
                    (bs) => bs.salonId === salon!.id && bs.date === slotDate && bs.time === slot
                  );
                  const existingBooking = bookings.find(
                    (b) => b.salonId === salon!.id && b.date === slotDate && b.time === slot && b.status === 'confirmed'
                  );
                  const isBooked = !!existingBooking;
                  const blockedSlotData = blockedSlots.find(
                    (bs) => bs.salonId === salon!.id && bs.date === slotDate && bs.time === slot
                  );

                  return (
                    <button
                      key={slot}
                      onClick={() => {
                        if (isBooked) return;
                        if (isBlocked && blockedSlotData) {
                          if (confirm(`Unblock ${slot} on ${slotDate}?`)) {
                            unblockSlot(salon!.id, blockedSlotData.id);
                          }
                        } else {
                          setBlockingTime(slot);
                          setBlockCustomerName('');
                          setBlockReason('');
                        }
                      }}
                      disabled={isBooked}
                      className={`rounded-lg py-3 px-2 text-sm font-medium transition text-center ${
                        isBooked
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 cursor-not-allowed opacity-60'
                          : isBlocked
                          ? 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                      }`}
                    >
                      <span className="block text-xs">{slot}</span>
                      <span className="block text-[10px] mt-0.5 opacity-70">
                        {isBooked ? 'Online Booking' : isBlocked ? '🔒 Blocked' : '✓ Available'}
                      </span>
                      {isBlocked && blockedSlotData?.customerName && (
                        <span className="block text-[9px] mt-0.5 truncate opacity-50">
                          {blockedSlotData.customerName}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-[10px] text-[#9a8fa8]">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Available — click to block</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-400" /> Blocked — click to unblock</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-400" /> Online Booking</span>
              </div>
            </div>
          </div>

          {/* Upcoming Blocked Slots List */}
          {blockedSlots.filter((bs) => bs.salonId === salon!.id && bs.date >= new Date().toISOString().split('T')[0]).length > 0 && (
            <div className="luxe-card p-6">
              <h3 className="font-display text-lg text-[#e8d5a3] mb-4">Upcoming Blocked Slots</h3>
              <div className="space-y-2">
                {blockedSlots
                  .filter((bs) => bs.salonId === salon!.id && bs.date >= new Date().toISOString().split('T')[0])
                  .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
                  .map((bs) => (
                    <div key={bs.id} className="flex items-center justify-between rounded-lg bg-[#0f0d12]/60 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Lock className="h-4 w-4 text-red-400" />
                        <div>
                          <p className="text-sm font-medium text-[#e8d5a3]">{bs.date} • {bs.time}</p>
                          {bs.customerName && <p className="text-xs text-[#9a8fa8]">{bs.customerName}</p>}
                          {bs.reason && <p className="text-xs text-[#9a8fa8]/60">{bs.reason}</p>}
                        </div>
                      </div>
                      <button
                        onClick={() => unblockSlot(salon!.id, bs.id)}
                        className="flex items-center gap-1 rounded-lg border border-emerald-500/30 px-3 py-1.5 text-xs text-emerald-400 hover:bg-emerald-500/10 transition"
                      >
                        <Unlock className="h-3 w-3" /> Unblock
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Block Slot Modal */}
      {blockingTime && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm luxe-card p-6 animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <UserPlus className="h-5 w-5 text-[#c9a962]" />
              <h3 className="font-display text-lg text-[#e8d5a3]">Block Slot</h3>
            </div>
            <p className="text-sm text-[#9a8fa8] mb-4">
              Blocking <strong className="text-[#c9a962]">{blockingTime}</strong> on <strong className="text-[#c9a962]">{slotDate}</strong>
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-[#9a8fa8] mb-1">Customer Name (optional)</label>
                <input
                  type="text"
                  value={blockCustomerName}
                  onChange={(e) => setBlockCustomerName(e.target.value)}
                  className="luxe-input text-sm"
                  placeholder="Walk-in customer name"
                />
              </div>
              <div>
                <label className="block text-xs text-[#9a8fa8] mb-1">Reason (optional)</label>
                <input
                  type="text"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="luxe-input text-sm"
                  placeholder="e.g. Walk-in appointment"
                />
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setBlockingTime(null)}
                className="flex-1 rounded-lg border border-[#c9a962]/20 bg-[#1a1520] py-2.5 text-sm font-medium text-[#e8d5a3] hover:bg-[#c9a962]/10 transition"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await blockSlot(salon!.id, slotDate, blockingTime!, blockCustomerName || undefined, blockReason || undefined);
                  setBlockingTime(null);
                }}
                className="luxe-btn flex-1"
              >
                Block Slot
              </button>
            </div>
          </div>
        </div>
      )}


      {/* UPDATE PAYMENT / PACKAGE MODAL */}
      {editingBookingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md luxe-card p-6 sm:p-8 relative animate-fade-in">
            <button 
              onClick={() => setEditingBookingId(null)}
              className="absolute right-4 top-4 text-[#9a8fa8] hover:text-[#e8d5a3]"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="font-display text-2xl text-[#e8d5a3] mb-4">Complete Service Details</h3>
            
            <form onSubmit={handleUpdatePaymentSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm text-[#9a8fa8]">Payment Method Confirmed by Customer</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedPayment('cash')}
                    className={`py-2 px-3 rounded-lg border text-sm font-medium transition ${
                      selectedPayment === 'cash' 
                        ? 'border-[#c9a962] bg-[#c9a962]/10 text-[#c9a962]' 
                        : 'border-[#c9a962]/20 text-[#9a8fa8] hover:text-[#e8d5a3]'
                    }`}
                  >
                    Paid by Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPayment('upi')}
                    className={`py-2 px-3 rounded-lg border text-sm font-medium transition ${
                      selectedPayment === 'upi' 
                        ? 'border-[#c9a962] bg-[#c9a962]/10 text-[#c9a962]' 
                        : 'border-[#c9a962]/20 text-[#9a8fa8] hover:text-[#e8d5a3]'
                    }`}
                  >
                    Paid by UPI (Online)
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm text-[#9a8fa8]">Did they change their package?</label>
                <select
                  value={selectedPkgId}
                  onChange={(e) => setSelectedPkgId(e.target.value)}
                  className="luxe-input"
                >
                  <option value="">No change in package / services</option>
                  {salon.packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} — ₹{pkg.price}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-lg bg-[#0f0d12] p-3 text-xs text-[#9a8fa8] space-y-1">
                <p>Estimated 3% platform charge will be calculated on save.</p>
                <p>If changed, final bill updates to select package price.</p>
              </div>

              <button type="submit" className="luxe-btn w-full mt-2">
                Save & Finalize Appointment
              </button>
            </form>
          </div>
        </div>
      )}

      {/* REPORT FAKE APPOINTMENT MODAL */}
      {reportingBookingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md luxe-card p-6 sm:p-8 relative animate-fade-in">
            <button 
              onClick={() => setReportingBookingId(null)}
              className="absolute right-4 top-4 text-[#9a8fa8] hover:text-[#e8d5a3]"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="font-display text-2xl text-[#e8d5a3] mb-2 flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-6 w-6" /> Report Fraud Booking
            </h3>
            <p className="text-xs text-[#9a8fa8] mb-4">
              Report this booking if the user scheduled an appointment but did not show up, or is misusing the booking system.
            </p>
            
            <form onSubmit={handleReportFakeSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm text-[#9a8fa8]">Valid Reason (Required)</label>
                <textarea
                  value={fakeReason}
                  onChange={(e) => setFakeReason(e.target.value)}
                  className="luxe-input min-h-[100px]"
                  placeholder="State the reason (e.g. Customer did not show up after multiple calls, booking is a duplicate...)"
                  required
                />
              </div>

              <button type="submit" className="luxe-btn bg-red-600 text-white hover:shadow-red-500/20 w-full">
                Submit Report to Admin
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modify Services Modal */}
      {modifyingBookingId && (() => {
        const booking = salonBookings.find(b => b.id === modifyingBookingId);
        if (!booking) return null;
        const currentServiceIds = modifyServices;
        const currentTotal = currentServiceIds.reduce((sum, sid) => {
          const svc = salon.services.find(s => s.id === sid);
          return sum + (svc?.price || 0);
        }, 0);
        const newCommission = Math.round(currentTotal * 0.03);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-2xl border border-[#c9a962]/20 bg-[#1a1520] p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <h3 className="font-display text-xl text-[#e8d5a3]">Modify Booking Services</h3>
              <p className="text-xs text-[#9a8fa8]">Select the services the customer is actually getting:</p>
              <div className="space-y-2">
                {salon.services.map(svc => (
                  <label key={svc.id} className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition ${
                    currentServiceIds.includes(svc.id) ? 'border-[#c9a962] bg-[#c9a962]/10' : 'border-[#c9a962]/10 hover:border-[#c9a962]/30'
                  }`}>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={currentServiceIds.includes(svc.id)}
                        onChange={() => {
                          setModifyServices(prev =>
                            prev.includes(svc.id) ? prev.filter(id => id !== svc.id) : [...prev, svc.id]
                          );
                        }}
                        className="rounded border-[#c9a962]/30"
                      />
                      <span className="text-sm text-[#e8d5a3]">{svc.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-[#c9a962]">₹{svc.price}</span>
                  </label>
                ))}
              </div>
              <div className="border-t border-[#c9a962]/10 pt-3 space-y-1 text-xs">
                <div className="flex justify-between text-[#9a8fa8]">
                  <span>Original Price</span>
                  <span>₹{booking.originalPrice || booking.totalPrice}</span>
                </div>
                <div className="flex justify-between text-[#e8d5a3] font-semibold text-sm">
                  <span>New Total</span>
                  <span>₹{currentTotal}</span>
                </div>
                <div className="flex justify-between text-[#c9a962]">
                  <span>Platform Commission (3%)</span>
                  <span>₹{newCommission}</span>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setModifyingBookingId(null)}
                  className="flex-1 rounded-lg border border-[#c9a962]/20 px-4 py-2.5 text-sm text-[#9a8fa8] hover:text-[#e8d5a3] transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const names = currentServiceIds.map(sid => salon.services.find(s => s.id === sid)?.name || '').filter(Boolean);
                    modifyBookingServices(modifyingBookingId, currentServiceIds, names, currentTotal);
                    setModifyingBookingId(null);
                  }}
                  disabled={currentServiceIds.length === 0}
                  className="flex-1 luxe-btn text-sm py-2.5 disabled:opacity-50"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MESSAGES TAB */}
      {activeTab === 'messages' && (
        <div className="space-y-6 animate-fade-in">
          {/* Sub-tab navigation */}
          <div className="flex gap-1 rounded-xl bg-[#130f18]/60 p-1 border border-[#c9a962]/10">
            <button
              onClick={() => setActiveSubTab('chat')}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition ${
                activeSubTab === 'chat' ? 'bg-[#c9a962] text-[#0f0d12]' : 'text-[#9a8fa8] hover:text-[#e8d5a3]'
              }`}
              style={{ touchAction: 'manipulation' }}
            >
              <Lock className="h-4 w-4" /> Direct Message Admin
            </button>
            <button
              onClick={() => {
                setActiveSubTab('announcements');
                // Mark all unread announcements as read
                if (salon) {
                  announcements
                    .filter(a => !a.readBy.includes(salon.id))
                    .forEach(a => markAnnouncementRead(a.id));
                }
              }}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition relative ${
                activeSubTab === 'announcements' ? 'bg-[#c9a962] text-[#0f0d12]' : 'text-[#9a8fa8] hover:text-[#e8d5a3]'
              }`}
              style={{ touchAction: 'manipulation' }}
            >
              <Megaphone className="h-4 w-4" /> Platform Announcements
              {salon && announcements.filter(a => !a.readBy.includes(salon.id)).length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                  {announcements.filter(a => !a.readBy.includes(salon.id)).length}
                </span>
              )}
            </button>
          </div>

          {/* Chat with admin */}
          {activeSubTab === 'chat' && (
            <div className="luxe-card p-5">
              <div className="flex items-center gap-2 mb-4 border-b border-[#c9a962]/10 pb-3">
                <Lock className="h-4 w-4 text-[#c9a962]" />
                <h3 className="font-display text-lg text-[#e8d5a3]">Admin Conversation</h3>
                <span className="ml-auto text-[10px] text-[#9a8fa8] bg-[#c9a962]/10 px-2 py-0.5 rounded-full">🔒 End-to-End Encrypted</span>
              </div>

              {/* Message thread */}
              <div className="space-y-3 max-h-[55dvh] overflow-y-auto pr-1 mb-4">
                {messages.filter(m => m.salonId === salon?.id && m.context !== 'exit-dispute').length === 0 ? (
                  <div className="text-center py-12 text-[#9a8fa8]">
                    <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No messages yet. Start the conversation with admin.</p>
                  </div>
                ) : (
                  messages
                    .filter(m => m.salonId === salon?.id && m.context !== 'exit-dispute')
                    .map((m) => (
                      <div
                        key={m.id}
                        className={`flex ${
                          m.sender === 'salon' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                            m.sender === 'salon'
                              ? 'bg-[#c9a962] text-[#0f0d12] rounded-br-sm'
                              : 'bg-[#221c28] border border-[#c9a962]/15 text-[#e8d5a3] rounded-bl-sm'
                          }`}
                        >
                          {m.decryptedContent || m.encryptedContent}
                        </div>
                      </div>
                    ))
                )}
              </div>

              {/* Message input */}
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!msgInput.trim() || !salon) return;
                  setMsgSending(true);
                  await sendDirectMessage(salon.id, msgInput.trim(), 'salon', 'direct');
                  setMsgInput('');
                  setMsgSending(false);
                }}
                className="flex gap-2"
              >
                <input
                  value={msgInput}
                  onChange={(e) => setMsgInput(e.target.value)}
                  placeholder="Type a message to admin..."
                  className="luxe-input flex-1"
                  style={{ fontSize: 16 }}
                  disabled={msgSending}
                />
                <button
                  type="submit"
                  disabled={!msgInput.trim() || msgSending}
                  className="luxe-btn px-4 disabled:opacity-50 flex items-center gap-2"
                  style={{ touchAction: 'manipulation', minHeight: 44 }}
                >
                  {msgSending ? <span className="animate-spin">⏳</span> : <Send className="h-4 w-4" />}
                </button>
              </form>
            </div>
          )}

          {/* Announcements */}
          {activeSubTab === 'announcements' && (
            <div className="space-y-4">
              {announcements.length === 0 ? (
                <div className="luxe-card p-8 text-center text-[#9a8fa8]">
                  <Megaphone className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No platform announcements yet.</p>
                </div>
              ) : (
                announcements.map((a) => (
                  <div
                    key={a.id}
                    className={`luxe-card p-4 border ${
                      salon && !a.readBy.includes(salon.id)
                        ? 'border-[#c9a962]/40 bg-[#c9a962]/5'
                        : 'border-[#c9a962]/10'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Megaphone className="h-5 w-5 text-[#c9a962] shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="font-semibold text-sm text-[#e8d5a3] truncate">{a.title}</p>
                          {salon && !a.readBy.includes(salon.id) && (
                            <span className="shrink-0 text-[9px] bg-red-500 text-white rounded-full px-2 py-0.5 font-bold">NEW</span>
                          )}
                        </div>
                        <p className="text-sm text-[#9a8fa8] leading-relaxed whitespace-pre-wrap">{a.content}</p>
                        <p className="text-[10px] text-[#6b6175] mt-2">{new Date(a.createdAt).toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* NOTIFICATIONS PANEL */}
      {activeTab === 'notifications' && (
        <div className="luxe-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-[#c9a962]" />
              <h2 className="text-lg font-bold text-[#e8d5a3]">Payment Notifications</h2>
              {unreadCount > 0 && (
                <span className="flex items-center justify-center rounded-full bg-red-500/20 border border-red-500/30 px-2 py-0.5 text-xs font-semibold text-red-400">
                  {unreadCount} unread
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllNotificationsRead(salon.id)}
                className="text-xs text-[#c9a962] hover:text-[#e8d5a3] transition underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          {salonNotifications.length === 0 ? (
            <div className="text-center py-16 text-[#9a8fa8]">
              <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No notifications yet.</p>
              <p className="text-xs mt-1 opacity-70">Payout and commission updates will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {salonNotifications.map(notif => (
                <div
                  key={notif.id}
                  className={`flex items-start gap-4 rounded-xl border p-4 transition cursor-pointer ${
                    notif.read
                      ? 'border-[#c9a962]/10 bg-[#0f0d12]/40'
                      : 'border-[#c9a962]/40 bg-[#c9a962]/5 shadow-md'
                  }`}
                  onClick={() => !notif.read && markNotificationRead(notif.id)}
                >
                  <div className={`mt-1 flex-shrink-0 rounded-full p-2 ${
                    notif.type === 'payout' ? 'bg-emerald-500/20 text-emerald-400' :
                    notif.type === 'payment_received' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-amber-500/20 text-amber-400'
                  }`}>
                    {notif.type === 'payout' ? <CheckCircle className="h-4 w-4" /> :
                     notif.type === 'payment_received' ? <CreditCard className="h-4 w-4" /> :
                     <IndianRupee className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-relaxed ${notif.read ? 'text-[#9a8fa8]' : 'text-[#e8d5a3]'}`}>
                      {notif.message}
                    </p>
                    <p className="mt-1.5 text-xs text-[#9a8fa8]/70">
                      {new Date(notif.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>
                  {!notif.read && (
                    <div className="mt-2 flex-shrink-0 h-2 w-2 rounded-full bg-[#c9a962] animate-pulse" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stripe Checkout Modal */}
      {showCheckout && (
        <CheckoutModal
          amount={totalCommissionDue}
          salonName={salon.name}
          onSuccess={() => {
            paySalonCommission(salon.id);
            setShowCheckout(false);
          }}
          onClose={() => setShowCheckout(false)}
        />
      )}

      {/* Full Size Image Viewer Modal */}
      {viewingImageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setViewingImageUrl(null)}
        >
          <div
            className="relative max-w-3xl w-full animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button — large tap target */}
            <button
              onClick={() => setViewingImageUrl(null)}
              className="absolute -top-3 -right-3 z-10 flex items-center justify-center rounded-full bg-[#c9a962] text-[#0f0d12] shadow-xl hover:bg-[#e8d5a3] transition"
              style={{ touchAction: 'manipulation', width: 44, height: 44 }}
              aria-label="Close image viewer"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={viewingImageUrl}
              alt="Customer Reference — Full Size"
              className="max-h-[85dvh] w-auto max-w-full rounded-2xl object-contain border border-[#c9a962]/20 shadow-2xl"
            />
            <p className="mt-2 text-center text-xs text-[#9a8fa8]">Tap anywhere outside or × to close</p>
          </div>
        </div>
      )}
    </div>
  );
}
