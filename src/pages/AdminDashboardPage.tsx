import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  Shield, 
  Users, 
  Scissors, 
  Building, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Trash2, 
  Lock, 
  Unlock, 
  FileText,
  AlertCircle,
  TrendingUp,
  IndianRupee,
  Activity,
  Percent,
  LogIn,
  LogOut,
  RefreshCw,
  CalendarCheck,
  UserCheck,
  UserX,
  BarChart3,
  CreditCard,
  Banknote,
  Clock,
  Phone,
  Mail,
  Bell,
  MessageSquare,
  Send,
  Megaphone,
  ChevronRight
} from 'lucide-react';

export function AdminDashboardPage() {
  const { 
    isAdmin, 
    salons, 
    users, 
    bookings, 
    approveSalon, 
    rejectSalon, 
    removeSalonForcefully, 
    deleteSalonPermanently,
    blockUserForcefully, 
    unblockUserForcefully,
    approveSalonExit,
    rejectSalonExit,
    logout,
    refreshData,
    addToast,
    notifications,
    fetchNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    messages,
    announcements,
    sendDirectMessage,
    fetchMessages,
    createAnnouncement,
    activeSalons,
    closedDays,
    fetchClosedDays,
  } = useApp();
  
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'pending' | 'salons' | 'users' | 'platform' | 'test-signin' | 'notifications' | 'messages'>('pending');
  const [refreshing, setRefreshing] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const adminNotifications = notifications.filter(n => n.target === 'admin');
  const adminUnreadCount = adminNotifications.filter(n => !n.read).length;
  
  // Blocking modal state
  const [blockingUserId, setBlockingUserId] = useState<string | null>(null);
  const [blockDays, setBlockDays] = useState('3');
  const [deletingSalonId, setDeletingSalonId] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [expandedSalonId, setExpandedSalonId] = useState<string | null>(null);

  // Exit rejection modal state
  const [rejectExitId, setRejectExitId] = useState<string | null>(null);
  const [rejectExitReason, setRejectExitReason] = useState('');

  // Messages tab state
  const [selectedSalonId, setSelectedSalonId] = useState<string | null>(null);
  const [adminMsgInput, setAdminMsgInput] = useState('');
  const [adminMsgSending, setAdminMsgSending] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastContent, setBroadcastContent] = useState('');
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [adminMsgSubTab, setAdminMsgSubTab] = useState<'conversations' | 'broadcast'>('conversations');

  // Auto-refresh data on mount and every 30 seconds
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setNetworkError(false);
    try {
      await refreshData();
    } catch {
      setNetworkError(true);
    } finally {
      setRefreshing(false);
    }
  }, [refreshData]);

  // Network online/offline detection — auto-retry refresh when connection returns
  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); setNetworkError(false); handleRefresh(); };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleRefresh]);

  useEffect(() => {
    // Refresh on mount to get latest data
    handleRefresh();
    // Poll every 30 seconds for new registrations
    const interval = setInterval(() => {
      refreshData();
    }, 30000);
    return () => clearInterval(interval);
  }, [handleRefresh, refreshData]);

  // HIGH SECURITY: Auto sign-out admin the moment they leave the dashboard
  // Covers: React navigation, browser back/forward, tab switch, browser close
  const isOnDashboard = useRef(true);
  const currentPath = useLocation().pathname;

  useEffect(() => {
    isOnDashboard.current = true;

    // Lock on browser/tab close or hard refresh
    const handleBeforeUnload = () => {
      sessionStorage.removeItem('luxeluru_admin_session');
    };

    // Lock when tab is hidden (user switches to another tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        logout();
        navigate('/');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Lock when component unmounts (React router navigation away)
      if (isOnDashboard.current) {
        isOnDashboard.current = false;
        logout();
        navigate('/');
      }
    };
  }, [logout, navigate]);

  // Also watch React router path changes as a secondary guard
  useEffect(() => {
    if (currentPath !== '/admin-dashboard' && isOnDashboard.current) {
      isOnDashboard.current = false;
      logout();
      navigate('/');
    }
  }, [currentPath, logout, navigate]);

  // Guard page for unauthorized users
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <AlertCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
        <h2 className="font-display text-2xl font-bold text-[#e8d5a3]">Unauthorized</h2>
        <p className="mt-2 text-[#9a8fa8]">You must be logged in as the Administrator to view this panel.</p>
        <button onClick={() => navigate('/partner-with-us')} className="luxe-btn mt-6">
          Go to Partner & Admin Page
        </button>
      </div>
    );
  }

  // Filter salons
  const pendingSalons = salons.filter((s) => s.registrationStatus === 'pending');
  const otherSalons = salons.filter((s) => s.registrationStatus !== 'pending');

  // Filter reported fake bookings
  const reportedBookings = bookings.filter((b) => b.reportedAsFake === true);

  // Platform Analytics Calculations
  const completedBookings = bookings.filter(b => b.status === 'completed');
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
  const cancelledBookings = bookings.filter(b => b.status === 'cancelled');

  const totalGMV = completedBookings.reduce((sum, b) => sum + b.totalPrice, 0);
  const totalPlatformCommissions = completedBookings.reduce((sum, b) => sum + (b.commissionAmount ?? 0), 0);
  const totalOutstandingDue = salons.reduce((sum, s) => sum + (s.commissionDue ?? 0), 0);
  
  const activeSalonsCount = salons.filter(s => s.isActive && s.registrationStatus === 'approved').length;
  const deactivatedSalonsCount = salons.filter(s => !s.isActive && s.registrationStatus === 'approved').length;
  const exitedSalonsCount = salons.filter(s => s.exitReason?.includes('exited')).length;

  const packageSwitches = completedBookings.filter(b => b.isPackageChanged).length;
  const switchPercent = completedBookings.length ? Math.round((packageSwitches / completedBookings.length) * 100) : 0;
  
  const spamBookingsCount = bookings.filter(b => b.reportedAsFake).length;
  const spamRatio = bookings.length ? Math.round((spamBookingsCount / bookings.length) * 100) : 0;

  // Additional tracking metrics
  const rejectedSalons = salons.filter(s => s.registrationStatus === 'rejected');
  const approvedSalons = salons.filter(s => s.registrationStatus === 'approved');
  const todayStr = new Date().toISOString().split('T')[0];
  const todayBookings = bookings.filter(b => b.date === todayStr);
  const uniqueBookingUsers = new Set(bookings.map(b => b.userId)).size;
  const blockedUsersCount = users.filter(u => u.blockedUntil && u.blockedUntil >= todayStr).length;

  // Enhanced tracking metrics
  const avgBookingValue = completedBookings.length ? Math.round(totalGMV / completedBookings.length) : 0;
  const rescheduledBookings = bookings.filter(b => b.rescheduledFrom).length;
  const todayRevenue = bookings.filter(b => b.date === todayStr && b.status === 'completed').reduce((s, b) => s + b.totalPrice, 0);
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().split('T')[0];
  const thisWeekBookings = bookings.filter(b => b.date >= weekAgoStr);
  const newUsersThisWeek = users.filter(u => u.createdAt && u.createdAt >= weekAgo.toISOString()).length;
  const newSalonsThisWeek = salons.filter(s => s.registeredAt && s.registeredAt >= weekAgo.toISOString()).length;
  const commissionPaidSalons = approvedSalons.filter(s => s.commissionPaidUntil && new Date(s.commissionPaidUntil) >= new Date()).length;
  const commissionOverdueSalons = approvedSalons.filter(s => {
    if (!s.commissionPaidUntil) return false;
    return new Date(s.commissionPaidUntil) < new Date() && (s.commissionDue ?? 0) > 0;
  }).length;
  const forcefullyRemovedSalons = salons.filter(s => s.exitReason && !s.exitReason.includes('exited')).length;

  // Payment tracking metrics
  const paidOnlineBookings = bookings.filter(b => b.paymentStatus === 'paid-online');
  const paidAtSalonBookings = bookings.filter(b => b.paymentStatus === 'paid-at-salon');
  const pendingPaymentBookings = bookings.filter(b => !b.paymentStatus || b.paymentStatus === 'pending');
  const notPaidBookings = bookings.filter(b => b.paymentStatus === 'not-paid');
  const onlinePaymentRevenue = paidOnlineBookings.reduce((s, b) => s + b.totalPrice, 0);
  const modifiedBookings = bookings.filter(b => b.modifiedPrice && b.modifiedPrice !== b.totalPrice);
  
  // Unverified bookings: past date, confirmed status, salon hasn't verified
  const unverifiedBookings = bookings.filter(b => {
    if (b.status !== 'confirmed') return false;
    if (b.appointmentTaken !== undefined) return false;
    const bookingDate = new Date(b.date);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return bookingDate < now;
  });

  // Per-salon booking breakdown
  const perSalonStats = useMemo(() => {
    const map: Record<string, { name: string; total: number; completed: number; cancelled: number; revenue: number }> = {};
    bookings.forEach(b => {
      if (!map[b.salonId]) {
        map[b.salonId] = { name: b.salonName, total: 0, completed: 0, cancelled: 0, revenue: 0 };
      }
      map[b.salonId].total++;
      if (b.status === 'completed') { map[b.salonId].completed++; map[b.salonId].revenue += b.totalPrice; }
      if (b.status === 'cancelled') map[b.salonId].cancelled++;
    });
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
  }, [bookings]);

  // Recent bookings (last 10)
  const recentBookings = useMemo(() => {
    return [...bookings].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);
  }, [bookings]);

  function handleBlockSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!blockingUserId) return;

    const days = parseInt(blockDays) || 3;
    const blockUntilDate = new Date();
    blockUntilDate.setDate(blockUntilDate.getDate() + days);
    const dateStr = blockUntilDate.toISOString().split('T')[0];

    blockUserForcefully(blockingUserId, dateStr);
    setBlockingUserId(null);
    setBlockDays('3');
  }

  // Check registration remaining days (5-day limit)
  function getDaysRemaining(registeredAt?: string): { days: number; text: string; urgent: boolean } {
    if (!registeredAt) return { days: 5, text: '5 days left', urgent: false };
    const regDate = new Date(registeredAt);
    const now = new Date();
    const diffTime = now.getTime() - regDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const daysLeft = 5 - diffDays;
    
    if (daysLeft <= 0) {
      return { days: 0, text: 'Verification Due!', urgent: true };
    }
    return { 
      days: daysLeft, 
      text: `${daysLeft} days left`, 
      urgent: daysLeft <= 2 
    };
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">

      {/* Network status banners */}
      {!isOnline && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-400" />
          <span><strong>No internet connection.</strong> You are offline — data may be outdated. Actions will fail until connection is restored.</span>
        </div>
      )}
      {isOnline && networkError && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-400" />
          <span><strong>Network issue detected.</strong> Could not reach the server. Data shown may be stale. <button onClick={handleRefresh} className="underline ml-1">Retry now</button></span>
        </div>
      )}

      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#c9a962]/10 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-red-500 animate-pulse" />
            <span className="font-mono text-xs text-red-400 uppercase tracking-widest font-semibold">Security Level: root</span>
          </div>
          <h1 className="mt-1 font-display text-3xl sm:text-4xl font-bold gold-gradient">Admin Control Center</h1>
          <p className="mt-1 text-[#9a8fa8]">LuxeLuru Platform Administrator Dashboard</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="luxe-btn bg-[#1a1520] border border-[#c9a962]/30 hover:bg-[#c9a962]/10 text-[#c9a962] text-sm flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap rounded-xl border border-[#c9a962]/20 bg-[#1a1520] p-1 mb-8 max-w-2xl gap-1 sm:gap-0">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition ${
            activeTab === 'pending' ? 'bg-[#c9a962] text-[#0f0d12]' : 'text-[#9a8fa8] hover:text-[#e8d5a3]'
          }`}
        >
          <Building className="h-4 w-4" />
          Applications ({pendingSalons.length})
        </button>
        <button
          onClick={() => setActiveTab('salons')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition ${
            activeTab === 'salons' ? 'bg-[#c9a962] text-[#0f0d12]' : 'text-[#9a8fa8] hover:text-[#e8d5a3]'
          }`}
        >
          <Scissors className="h-4 w-4" />
          Salons ({otherSalons.length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition ${
            activeTab === 'users' ? 'bg-[#c9a962] text-[#0f0d12]' : 'text-[#9a8fa8] hover:text-[#e8d5a3]'
          }`}
        >
          <Users className="h-4 w-4" />
          Users & Fraud
        </button>
        <button
          onClick={() => setActiveTab('platform')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition ${
            activeTab === 'platform' ? 'bg-[#c9a962] text-[#0f0d12]' : 'text-[#9a8fa8] hover:text-[#e8d5a3]'
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          Platform Analytics
        </button>
        <button
          onClick={() => { setActiveTab('test-signin'); }}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition ${
            activeTab === 'test-signin' ? 'bg-[#c9a962] text-[#0f0d12]' : 'text-[#9a8fa8] hover:text-[#e8d5a3]'
          }`}
        >
          <LogIn className="h-4 w-4" />
          Test Sign In
        </button>
        <button
          onClick={() => { setActiveTab('notifications'); fetchNotifications('admin'); }}
          className={`relative flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition ${
            activeTab === 'notifications' ? 'bg-[#c9a962] text-[#0f0d12]' : 'text-[#9a8fa8] hover:text-[#e8d5a3]'
          }`}
        >
          <Bell className="h-4 w-4" />
          Notifications
          {adminUnreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {adminUnreadCount > 9 ? '9+' : adminUnreadCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('messages')}
          className={`relative flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition ${
            activeTab === 'messages' ? 'bg-[#c9a962] text-[#0f0d12]' : 'text-[#9a8fa8] hover:text-[#e8d5a3]'
          }`}
          style={{ touchAction: 'manipulation' }}
        >
          <MessageSquare className="h-4 w-4" />
          Messages
          {messages.filter(m => m.sender === 'salon' && !m.isRead).length > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {messages.filter(m => m.sender === 'salon' && !m.isRead).length > 9 ? '9+' : messages.filter(m => m.sender === 'salon' && !m.isRead).length}
            </span>
          )}
        </button>
      </div>

      {/* TABS VIEWS */}
      {activeTab === 'pending' && (
        <div className="space-y-6 animate-fade-in">
          <div className="border-b border-[#c9a962]/10 pb-2">
            <h3 className="font-display text-2xl text-[#e8d5a3]">New Salon Onboarding Requests</h3>
            <p className="text-xs text-[#9a8fa8] mt-0.5">Approve new salons after reviewing trade license files within 5 days.</p>
          </div>

          {pendingSalons.length === 0 ? (
            <div className="luxe-card p-12 text-center text-[#9a8fa8]">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500/20 mb-3" />
              <p>No pending registration requests. All clear!</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {pendingSalons.map((s) => {
                const limit = getDaysRemaining(s.registeredAt);
                return (
                  <div key={s.id} className="luxe-card p-6 flex flex-col justify-between border-l-4 border-amber-500/30">
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="rounded bg-[#0f0d12] px-2 py-0.5 text-xs font-mono text-[#c9a962] font-semibold">{s.id}</span>
                          <h4 className="font-display text-xl text-[#e8d5a3] mt-2 font-bold">{s.name}</h4>
                        </div>
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          limit.urgent ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {limit.text}
                        </span>
                      </div>

                      <div className="mt-4 space-y-2 text-xs text-[#9a8fa8] border-b border-[#c9a962]/5 pb-4">
                        <p><strong>Owner Name:</strong> {s.ownerName}</p>
                        <p><strong>Owner Phone:</strong> {s.phoneOwner}</p>
                        <p><strong>Salon Email:</strong> {s.email}</p>
                        <p><strong>Salon Phone:</strong> {s.phone}</p>
                        <p><strong>Address:</strong> {s.address}</p>
                        {s.panCardOwner && (
                          <p><strong>Owner PAN:</strong> <span className="font-mono text-[#e8d5a3]">{s.panCardOwner}</span></p>
                        )}
                        {s.panCardBusiness && (
                          <p><strong>Business PAN:</strong> <span className="font-mono text-[#e8d5a3]">{s.panCardBusiness}</span></p>
                        )}
                        <div className="mt-2 bg-[#0f0d12]/50 p-2 rounded">
                          <p className="flex items-center gap-1.5 text-[#e8d5a3]">
                            <FileText className="h-4 w-4 text-[#c9a962]" />
                            <span>Trade License: </span>
                            {s.tradeLicenseUrl && s.tradeLicenseUrl.startsWith('data:') ? (
                              <a
                                href={s.tradeLicenseUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#c9a962] underline hover:text-[#e8d5a3] font-semibold"
                              >
                                📄 View Document
                              </a>
                            ) : s.tradeLicenseUrl && (s.tradeLicenseUrl.startsWith('http') || s.tradeLicenseUrl.startsWith('blob')) ? (
                              <a
                                href={s.tradeLicenseUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#c9a962] underline hover:text-[#e8d5a3] font-semibold"
                              >
                                📄 View Document
                              </a>
                            ) : (
                              <strong>{s.tradeLicenseUrl || 'N/A'}</strong>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={() => approveSalon(s.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 luxe-btn py-2 text-xs"
                      >
                        <CheckCircle className="h-4 w-4" /> Approve & Activate
                      </button>
                      <button
                        onClick={() => rejectSalon(s.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 luxe-btn-outline border-red-500/30 text-red-400 hover:bg-red-500/10 py-2 text-xs"
                      >
                        <XCircle className="h-4 w-4" /> Reject Request
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'salons' && (
        <div className="space-y-6 animate-fade-in">
          <div className="border-b border-[#c9a962]/10 pb-2">
            <h3 className="font-display text-2xl text-[#e8d5a3]">Manage Partner Salons</h3>
            <p className="text-xs text-[#9a8fa8] mt-0.5">Audit billing, verify dues payments, and forcefully remove problematic salons.</p>
          </div>

          {/* Exit Requests */}
          {salons.filter(s => s.exitRequestStatus === 'pending').length > 0 && (
            <div className="mb-8">
              <h2 className="mb-4 font-display text-xl text-amber-400 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" /> Exit Requests
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {salons.filter(s => s.exitRequestStatus === 'pending').map(salon => (
                  <div key={salon.id} className="luxe-card p-5 border border-amber-500/20">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-display text-lg text-[#e8d5a3]">{salon.name}</h3>
                        <p className="text-xs text-[#9a8fa8]">{salon.ownerName}</p>
                      </div>
                      <span className="bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full text-[10px] font-bold">Pending Exit</span>
                    </div>
                    <div className="mb-4 bg-[#0f0d12]/50 p-3 rounded-lg text-xs">
                      <p className="text-[#9a8fa8]">Reason for exit:</p>
                      <p className="text-[#e8d5a3] mt-1 italic">"{salon.exitReason || 'No reason provided'}"</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => approveSalonExit(salon.id)}
                        className="flex-1 bg-red-500/10 text-red-400 border border-red-500/20 py-2 rounded-lg text-sm font-semibold hover:bg-red-500/20 transition"
                      >
                        Approve Exit
                      </button>
                      <button
                        onClick={() => { setRejectExitId(salon.id); setRejectExitReason(''); }}
                        className="flex-1 luxe-btn-outline py-2 text-sm"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            {otherSalons.map((s) => {
              const now = new Date();
              const paidUntil = s.commissionPaidUntil ? new Date(s.commissionPaidUntil) : null;
              const graceEnd = paidUntil ? new Date(paidUntil) : null;
              if (graceEnd) graceEnd.setDate(graceEnd.getDate() + 5);
              const isDeactivatedDueToCommission = s.commissionDue && s.commissionDue > 0 && graceEnd && now > graceEnd;
              const statusText = s.exitReason?.includes('exited')
                ? 'Exited Platform'
                : s.isActive === false
                ? 'Forcefully Removed'
                : isDeactivatedDueToCommission
                ? 'Deactivated (Overdue)'
                : 'Active';
              const isExpanded = expandedSalonId === s.id;
              const today = new Date().toISOString().split('T')[0];
              const salonClosedDays = closedDays.filter(cd => cd.salonId === s.id && cd.date >= today);

              return (
                <div key={s.id} className="luxe-card overflow-hidden border border-[#c9a962]/15">
                  {/* Summary row */}
                  <div
                    className="flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-4 cursor-pointer hover:bg-[#c9a962]/5 transition-colors"
                    onClick={() => { const next = isExpanded ? null : s.id; setExpandedSalonId(next); if (next) fetchClosedDays(next); }}
                  >
                    <div className="flex-1 min-w-[180px]">
                      <p className="font-semibold text-[#e8d5a3] text-sm">{s.name}</p>
                      <p className="text-[10px] text-[#9a8fa8] font-mono mt-0.5">Code: {s.id}</p>
                    </div>
                    <div className="text-xs min-w-[150px]">
                      <p className="text-[#e8d5a3] font-medium">{s.ownerName || 'N/A'}</p>
                      <p className="text-[#9a8fa8]">{s.email}</p>
                    </div>
                    <div className="text-xs text-[#9a8fa8] min-w-[80px]">{s.area}</div>
                    <div className="text-xs min-w-[120px]">
                      <p className={`font-semibold ${(s.commissionDue ?? 0) > 0 ? 'text-amber-300' : 'text-green-400'}`}>₹{(s.commissionDue ?? 0).toLocaleString('en-IN')}</p>
                      <p className="text-[10px] text-[#9a8fa8] mt-0.5">
                        {s.commissionPaymentStatus === 'submitted' ? (
                          <span className="text-blue-400 font-semibold">🕐 Pending Verify</span>
                        ) : s.commissionPaymentStatus === 'verified' ? (
                          <span className="text-green-400 font-semibold">✅ Cleared</span>
                        ) : (s.commissionDue ?? 0) > 0 ? (
                          <span className="text-amber-400">⚠ Unpaid</span>
                        ) : (
                          'No dues'
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {s.commissionPaymentStatus === 'submitted' && (
                        <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold bg-blue-500/20 text-blue-400 animate-pulse">
                          💳 Verify Payment
                        </span>
                      )}
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        statusText === 'Active' ? 'bg-green-500/20 text-green-400' :
                        statusText === 'Deactivated (Overdue)' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {statusText}
                      </span>
                      <span className="text-[#9a8fa8] text-xs select-none">{isExpanded ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {/* Expanded registration details */}
                  {isExpanded && (
                    <div className="border-t border-[#c9a962]/15 bg-[#0f0d12]/60 px-5 py-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs animate-fade-in">
                      {/* Identity */}
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#c9a962] mb-1">Owner Identity</p>
                        <div><span className="text-[#9a8fa8]">Owner Name: </span><span className="text-[#e8d5a3] font-medium">{s.ownerName || 'N/A'}</span></div>
                        <div><span className="text-[#9a8fa8]">Owner Phone: </span><span className="text-[#e8d5a3]">{s.phoneOwner || 'N/A'}</span></div>
                        <div><span className="text-[#9a8fa8]">Owner PAN: </span>
                          <span className="font-mono text-[#e8d5a3]">{s.panCardOwner || <span className="italic opacity-40">Not provided</span>}</span>
                        </div>
                        <div><span className="text-[#9a8fa8]">Business PAN: </span>
                          <span className="font-mono text-[#e8d5a3]">{s.panCardBusiness || <span className="italic opacity-40">Not provided</span>}</span>
                        </div>
                      </div>

                      {/* Salon contact */}
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#c9a962] mb-1">Salon Contact</p>
                        <div><span className="text-[#9a8fa8]">Salon Phone: </span><span className="text-[#e8d5a3]">{s.phone || 'N/A'}</span></div>
                        <div><span className="text-[#9a8fa8]">Business Email: </span><span className="text-[#e8d5a3] break-all">{s.email || 'N/A'}</span></div>
                        <div><span className="text-[#9a8fa8]">Full Address: </span><span className="text-[#e8d5a3]">{s.address || 'N/A'}</span></div>
                        <div><span className="text-[#9a8fa8]">Registered: </span>
                          <span className="text-[#e8d5a3]">
                            {s.registeredAt ? new Date(s.registeredAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                          </span>
                        </div>
                      </div>

                      {/* Trade licence */}
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#c9a962] mb-1">Trade Licence</p>
                        {s.tradeLicenseUrl && (s.tradeLicenseUrl.startsWith('data:') || s.tradeLicenseUrl.startsWith('http') || s.tradeLicenseUrl.startsWith('blob')) ? (
                          <a
                            href={s.tradeLicenseUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={s.tradeLicenseUrl.startsWith('data:') ? `trade-license-${s.id}` : undefined}
                            className="inline-flex items-center gap-1.5 text-[#c9a962] hover:underline font-medium"
                          >
                            📄 View / Download Document
                          </a>
                        ) : (
                          <span className="italic text-[#9a8fa8] opacity-60">No document uploaded</span>
                        )}

                        {/* Payout Details — Read-only */}
                        <div className="mt-3 pt-3 border-t border-[#c9a962]/10 space-y-2">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#c9a962] mb-1">Payout Details (Read-only)</p>
                          {/* UPI IDs */}
                          {s.upiDetails && s.upiDetails.length > 0 ? (
                            <div className="space-y-1.5">
                              <p className="text-[10px] text-[#9a8fa8] uppercase tracking-wide">UPI IDs</p>
                              {s.upiDetails.map((u: any, i: number) => (
                                <div key={u.id || i} className="flex items-center gap-2 rounded-lg bg-[#0f0d12]/60 px-3 py-2 border border-[#c9a962]/10">
                                  <span className="text-[10px]">📱</span>
                                  <div>
                                    <p className="text-xs font-mono text-[#e8d5a3]">{u.upiId}</p>
                                    <p className="text-[10px] text-[#9a8fa8]">{u.holderName}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-[#9a8fa8] italic">No UPI IDs configured</p>
                          )}
                          {/* Bank Accounts */}
                          {s.bankDetails && s.bankDetails.length > 0 ? (
                            <div className="space-y-1.5 mt-2">
                              <p className="text-[10px] text-[#9a8fa8] uppercase tracking-wide">Bank Accounts</p>
                              {s.bankDetails.map((b: any, i: number) => (
                                <div key={b.id || i} className="rounded-lg bg-[#0f0d12]/60 px-3 py-2 border border-[#c9a962]/10">
                                  <p className="text-xs font-medium text-[#e8d5a3]">{b.bankName} — {b.accountType}</p>
                                  <p className="text-[10px] text-[#9a8fa8]">{b.accountHolderName}</p>
                                  <p className="text-[10px] font-mono text-[#c9a962]">••••{b.accountNumber?.slice(-4)} · IFSC: {b.ifscCode}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-[#9a8fa8] italic">No bank accounts configured</p>
                          )}

                          {/* Commission Dues Management */}
                          <div className="mt-3 pt-3 border-t border-[#c9a962]/10 space-y-2">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#c9a962] mb-1">Commission Dues (Pay-at-Salon)</p>
                            <div className="rounded-lg bg-[#0f0d12]/60 px-3 py-3 border border-amber-500/10 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[#9a8fa8]">Outstanding: </span>
                                <span className={`font-bold text-sm ${(s.commissionDue ?? 0) > 0 ? 'text-amber-400' : 'text-green-400'}`}>
                                  ₹{(s.commissionDue ?? 0).toLocaleString('en-IN')}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-[#9a8fa8]">Payment Status: </span>
                                <span className={`text-xs font-semibold ${
                                  s.commissionPaymentStatus === 'verified' ? 'text-green-400' :
                                  s.commissionPaymentStatus === 'submitted' ? 'text-blue-400' :
                                  (s.commissionDue ?? 0) > 0 ? 'text-amber-400' : 'text-[#9a8fa8]'
                                }`}>
                                  {s.commissionPaymentStatus === 'verified' ? '✅ Cleared'
                                    : s.commissionPaymentStatus === 'submitted' ? '🕐 Submitted — Pending Verification'
                                    : (s.commissionDue ?? 0) > 0 ? '⚠️ Unpaid' : 'No dues'}
                                </span>
                              </div>
                              {s.commissionPaymentRef && (
                                <div className="flex items-center justify-between">
                                  <span className="text-[#9a8fa8]">Payment Ref: </span>
                                  <span className="font-mono text-xs text-[#e8d5a3]">{s.commissionPaymentRef}</span>
                                </div>
                              )}
                              {s.commissionSubmittedAt && (
                                <div className="flex items-center justify-between">
                                  <span className="text-[#9a8fa8]">Submitted: </span>
                                  <span className="text-xs text-[#9a8fa8]">{new Date(s.commissionSubmittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                              )}
                              {s.commissionLastClearedAt && (
                                <div className="flex items-center justify-between">
                                  <span className="text-[#9a8fa8]">Last Cleared: </span>
                                  <span className="text-xs text-green-400">₹{(s.commissionLastClearedAmount ?? 0).toLocaleString('en-IN')} on {new Date(s.commissionLastClearedAt).toLocaleDateString('en-IN')}</span>
                                </div>
                              )}
                              {/* Verify Payment Button */}
                              {s.commissionPaymentStatus === 'submitted' && s.id !== 'LLLUX456' && (
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (!confirm(`Verify commission payment of ₹${(s.commissionDue ?? 0).toLocaleString('en-IN')} from "${s.name}"? This will clear their dues.`)) return;
                                    try {
                                      const res = await fetch(`/api/salons/${s.id}/verify-commission-payment`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
                                      const data = await res.json();
                                      if (data.success) {
                                        alert(`✅ Commission cleared for ${s.name}. ₹${(s.commissionDue ?? 0).toLocaleString('en-IN')} dues removed.`);
                                        refreshData();
                                      } else {
                                        alert(data.message || 'Failed to verify.');
                                      }
                                    } catch { alert('Network error. Try again.'); }
                                  }}
                                  className="mt-2 w-full flex items-center justify-center gap-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 px-3 py-2 text-xs text-blue-400 font-semibold hover:bg-blue-500/20 transition"
                                  style={{ touchAction: 'manipulation' }}
                                >
                                  ✅ Verify & Clear Commission Payment
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Closed Days — Visibility for Admin */}
                        <div className="mt-3 pt-3 border-t border-[#c9a962]/10 space-y-2">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#c9a962] mb-1 flex items-center gap-2">
                            🚫 Upcoming Closed Days
                            {salonClosedDays.length > 0 && (
                              <span className="bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full text-[9px] font-bold">
                                {salonClosedDays.length} day{salonClosedDays.length !== 1 ? 's' : ''}
                              </span>
                            )}
                          </p>
                          {salonClosedDays.length === 0 ? (
                            <p className="text-xs text-[#9a8fa8] italic">No upcoming closures scheduled</p>
                          ) : (
                            <div className="space-y-1.5">
                              {salonClosedDays
                                .sort((a, b) => a.date.localeCompare(b.date))
                                .map(cd => (
                                  <div key={cd.id} className="flex items-center justify-between rounded-lg bg-red-500/5 border border-red-500/20 px-3 py-2">
                                    <div>
                                      <p className="text-xs font-semibold text-[#e8d5a3]">{cd.date}</p>
                                      <p className="text-[10px] text-red-400/70">{cd.reason}</p>
                                    </div>
                                    <span className="text-[10px] bg-red-500/15 text-red-400 px-2 py-0.5 rounded-full">Closed</span>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>

                        <div className="mt-3 pt-3 border-t border-[#c9a962]/10">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#c9a962] mb-1">Actions</p>
                          {s.id === 'LLLUX456' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-[#c9a962] font-semibold bg-[#c9a962]/10 px-2 py-1 rounded-full">
                              🛡️ Test Account
                            </span>
                          ) : (
                            <div className="flex flex-col gap-2">
                              {s.isActive !== false && !s.exitReason?.includes('exited') && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); removeSalonForcefully(s.id); }}
                                  className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors font-semibold hover:underline"
                                >
                                  <Trash2 className="h-3.5 w-3.5" /> Remove Forcefully
                                </button>
                              )}
                              {(s.isActive === false || s.exitReason?.includes('exited')) && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setDeletingSalonId(s.id); }}
                                  className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-400 transition-colors font-semibold hover:underline"
                                >
                                  <XCircle className="h-3.5 w-3.5" /> Delete Permanently
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="grid gap-8 lg:grid-cols-3 animate-fade-in">
          {/* Fake Booking Reports */}
          <div className="lg:col-span-1 space-y-6">
            <div className="border-b border-[#c9a962]/10 pb-2">
              <h3 className="font-display text-xl text-red-400 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" /> Fake Booking Alerts
              </h3>
              <p className="text-xs text-[#9a8fa8] mt-0.5">Notifications sent by salons reporting bookings fake or spam.</p>
            </div>

            {reportedBookings.length === 0 ? (
              <div className="luxe-card p-6 text-center text-[#9a8fa8] text-xs">
                <CheckCircle className="mx-auto h-8 w-8 text-green-500/10 mb-2" />
                <p>No fake appointment reports received.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {reportedBookings.map((b) => {
                  const customer = users.find((u) => u.id === b.userId);
                  return (
                    <div key={b.id} className="luxe-card p-4 border-l-4 border-red-500/40 text-xs">
                      <div className="flex justify-between items-start">
                        <span className="font-semibold text-red-300">ALERT: Spam Booking</span>
                        <span className="text-[#9a8fa8] font-mono text-[10px]">ID: {b.id}</span>
                      </div>
                      <p className="mt-2 text-[#e8d5a3]"><strong>Reported by:</strong> {b.salonName}</p>
                      
                      <div className="mt-2 bg-[#0f0d12] rounded p-2 text-[#9a8fa8] space-y-1">
                        <p><strong>Customer Name:</strong> {customer?.name || 'Unknown'}</p>
                        <p><strong>Customer Phone:</strong> {customer?.phone || 'Unknown'}</p>
                        <p><strong>Appointment:</strong> {b.date} at {b.time}</p>
                      </div>
                      <div className="mt-2 text-red-200">
                        <p><strong>Salon Report Reason:</strong></p>
                        <p className="italic mt-0.5 text-[#9a8fa8]">"{b.fakeReportReason || 'No details provided'}"</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* User Management List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="border-b border-[#c9a962]/10 pb-2 flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h3 className="font-display text-2xl text-[#e8d5a3]">Registered Users</h3>
                <p className="text-xs text-[#9a8fa8] mt-0.5">
                  {users.length} total registered &middot; Block users who spam fake bookings.
                </p>
              </div>
            </div>

            {/* Search bar */}
            <input
              type="text"
              placeholder="Search by name, email, phone or user ID..."
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              className="luxe-input text-xs w-full"
            />
            
            <div className="overflow-x-auto rounded-xl border border-[#c9a962]/15 bg-[#1a1520]/60">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#c9a962]/20 bg-[#0f0d12] text-[#9a8fa8] font-semibold text-[10px] uppercase tracking-wider">
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Registered</th>
                    <th className="px-4 py-3">Bookings</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c9a962]/10">
                  {(() => {
                    const q = userSearch.toLowerCase();
                    const filtered = users.filter(u =>
                      !q ||
                      u.name?.toLowerCase().includes(q) ||
                      u.email?.toLowerCase().includes(q) ||
                      u.phone?.includes(q) ||
                      u.id?.toLowerCase().includes(q)
                    );
                    if (filtered.length === 0) return (
                      <tr><td colSpan={6} className="px-5 py-8 text-center text-[#9a8fa8] text-xs">No users match your search.</td></tr>
                    );
                    return filtered.map((u) => {
                      const todayStr = new Date().toISOString().split('T')[0];
                      const isBlocked = u.blockedUntil && u.blockedUntil >= todayStr;
                      const userBookings = bookings.filter(b => b.userId === u.id).length;
                      // Name: if it looks like just an email-prefix (no spaces, short), show email below more prominently
                      const displayName = u.name && u.name.length > 1 ? u.name : u.email?.split('@')[0] ?? 'Unknown';
                      const registeredDate = u.createdAt
                        ? new Date(u.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                        : 'Unknown';

                      return (
                        <tr key={u.id} className="hover:bg-[#c9a962]/5 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-semibold text-[#e8d5a3] capitalize">{displayName}</p>
                            <p className="text-[10px] text-[#9a8fa8] font-mono mt-0.5 truncate max-w-[140px]" title={u.id}>ID: {u.id}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-[#e8d5a3] truncate max-w-[180px]" title={u.email}>{u.email}</p>
                            <p className="text-[#9a8fa8] mt-0.5">{u.phone || <span className="italic opacity-50">No phone</span>}</p>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <p className="text-[#e8d5a3]">{registeredDate}</p>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-[#c9a962] font-semibold">{userBookings}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold ${
                              isBlocked ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                            }`}>
                              {isBlocked ? `Blocked until ${u.blockedUntil}` : 'Active'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {(u.id === 'usr-admin-test' || u.email === 'adminuser1@test.com') ? (
                              <span className="inline-flex items-center gap-1 text-[10px] text-[#c9a962] font-semibold bg-[#c9a962]/10 px-2 py-1 rounded-full">
                                🛡️ Test Account
                              </span>
                            ) : isBlocked ? (
                              <button
                                onClick={() => unblockUserForcefully(u.id)}
                                className="flex items-center justify-center gap-1 text-[10px] font-semibold text-green-400 hover:text-green-300 hover:underline mx-auto transition-colors"
                              >
                                <Unlock className="h-3.5 w-3.5" /> Unblock
                              </button>
                            ) : (
                              <button
                                onClick={() => setBlockingUserId(u.id)}
                                className="flex items-center justify-center gap-1 text-[10px] font-semibold text-red-400 hover:text-red-300 hover:underline mx-auto transition-colors"
                              >
                                <Lock className="h-3.5 w-3.5" /> Block...
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PLATFORM ANALYTICS TAB */}
      {activeTab === 'platform' && (
        <div className="space-y-8 animate-fade-in">
          {/* Top stats blocks */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="luxe-card p-6 border-l-4 border-[#c9a962]">
              <div className="flex items-center justify-between text-[#9a8fa8]">
                <span className="text-xs uppercase tracking-wider font-semibold">Total Platform GMV</span>
                <IndianRupee className="h-4 w-4 text-[#c9a962]" />
              </div>
              <p className="mt-2 font-display text-3xl font-bold text-[#e8d5a3]">₹{totalGMV.toLocaleString('en-IN')}</p>
              <p className="text-[10px] text-[#9a8fa8] mt-1">Value of all completed transactions.</p>
            </div>

            <div className="luxe-card p-6 border-l-4 border-green-500/50">
              <div className="flex items-center justify-between text-[#9a8fa8]">
                <span className="text-xs uppercase tracking-wider font-semibold">Commission Collected</span>
                <TrendingUp className="h-4 w-4 text-green-400" />
              </div>
              <p className="mt-2 font-display text-3xl font-bold text-green-400">₹{totalPlatformCommissions.toLocaleString('en-IN')}</p>
              <p className="text-[10px] text-[#9a8fa8] mt-1">Platform revenue (3% service charge).</p>
            </div>

            <div className="luxe-card p-6 border-l-4 border-amber-500/50">
              <div className="flex items-center justify-between text-[#9a8fa8]">
                <span className="text-xs uppercase tracking-wider font-semibold">Outstanding Fees</span>
                <AlertTriangle className="h-4 w-4 text-amber-400" />
              </div>
              <p className="mt-2 font-display text-3xl font-bold text-amber-400">₹{totalOutstandingDue.toLocaleString('en-IN')}</p>
              <p className="text-[10px] text-[#9a8fa8] mt-1">Commissions currently due from salons.</p>
            </div>

            <div className="luxe-card p-6 border-l-4 border-red-500/50">
              <div className="flex items-center justify-between text-[#9a8fa8]">
                <span className="text-xs uppercase tracking-wider font-semibold">Flagged Bookings Rate</span>
                <Percent className="h-4 w-4 text-red-400" />
              </div>
              <p className="mt-2 font-display text-3xl font-bold text-red-400">{spamRatio}%</p>
              <p className="text-[10px] text-[#9a8fa8] mt-1">{spamBookingsCount} bookings reported spam by salons.</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Salon status splits */}
            <div className="luxe-card p-6 space-y-4">
              <h3 className="font-display text-lg text-[#e8d5a3] flex items-center gap-2">
                <Activity className="h-5 w-5 text-[#c9a962]" /> Salon Health & Registration Ratios
              </h3>
              
              <div className="grid grid-cols-5 gap-3 text-center">
                <div className="bg-[#0f0d12] p-4 rounded-lg">
                  <p className="text-2xl font-bold text-green-400">{activeSalonsCount}</p>
                  <p className="text-[10px] text-[#9a8fa8] mt-1">Active</p>
                </div>
                <div className="bg-[#0f0d12] p-4 rounded-lg">
                  <p className="text-2xl font-bold text-blue-400">{approvedSalons.length}</p>
                  <p className="text-[10px] text-[#9a8fa8] mt-1">Approved</p>
                </div>
                <div className="bg-[#0f0d12] p-4 rounded-lg">
                  <p className="text-2xl font-bold text-[#c9a962]">{pendingSalons.length}</p>
                  <p className="text-[10px] text-[#9a8fa8] mt-1">Pending</p>
                </div>
                <div className="bg-[#0f0d12] p-4 rounded-lg">
                  <p className="text-2xl font-bold text-red-400">{rejectedSalons.length}</p>
                  <p className="text-[10px] text-[#9a8fa8] mt-1">Rejected</p>
                </div>
                <div className="bg-[#0f0d12] p-4 rounded-lg">
                  <p className="text-2xl font-bold text-orange-400">{deactivatedSalonsCount}</p>
                  <p className="text-[10px] text-[#9a8fa8] mt-1">Deactivated</p>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-[#c9a962]/10 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#9a8fa8]">Total Partner Database Size</span>
                  <span className="text-[#e8d5a3] font-semibold">{salons.length} Salons</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9a8fa8]">Salons Active on User Dashboard</span>
                  <span className="text-green-400 font-semibold">{activeSalonsCount} Salons</span>
                </div>
              </div>
            </div>

            {/* Booking conversions */}
            <div className="luxe-card p-6 space-y-4">
              <h3 className="font-display text-lg text-[#e8d5a3] flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#c9a962]" /> Booking Conversion Metrics
              </h3>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#9a8fa8]">Completed Bookings ({completedBookings.length})</span>
                    <span className="text-green-400 font-semibold">{bookings.length ? Math.round((completedBookings.length / bookings.length) * 100) : 0}%</span>
                  </div>
                  <div className="h-2 w-full bg-[#0f0d12] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full" 
                      style={{ width: `${bookings.length ? (completedBookings.length / bookings.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#9a8fa8]">Upcoming Confirmed ({confirmedBookings.length})</span>
                    <span className="text-amber-300 font-semibold">{bookings.length ? Math.round((confirmedBookings.length / bookings.length) * 100) : 0}%</span>
                  </div>
                  <div className="h-2 w-full bg-[#0f0d12] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 rounded-full" 
                      style={{ width: `${bookings.length ? (confirmedBookings.length / bookings.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#9a8fa8]">Cancelled Bookings ({cancelledBookings.length})</span>
                    <span className="text-red-400 font-semibold">{bookings.length ? Math.round((cancelledBookings.length / bookings.length) * 100) : 0}%</span>
                  </div>
                  <div className="h-2 w-full bg-[#0f0d12] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-500 rounded-full" 
                      style={{ width: `${bookings.length ? (cancelledBookings.length / bookings.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 text-[10px] text-[#9a8fa8] flex justify-between">
                <span>Total Bookings Placed: <strong>{bookings.length}</strong></span>
                <span>Customer Package Adjustments: <strong>{switchPercent}% ({packageSwitches} jobs)</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Stats Row */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="luxe-card p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/15">
                <UserCheck className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-blue-400">{users.length}</p>
                <p className="text-[10px] text-[#9a8fa8]">Total Users on Platform</p>
              </div>
            </div>
            <div className="luxe-card p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/15">
                <CalendarCheck className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-purple-400">{todayBookings.length}</p>
                <p className="text-[10px] text-[#9a8fa8]">Bookings Today</p>
              </div>
            </div>
            <div className="luxe-card p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/15">
                <Users className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-cyan-400">{uniqueBookingUsers}</p>
                <p className="text-[10px] text-[#9a8fa8]">Unique Users Booked</p>
              </div>
            </div>
            <div className="luxe-card p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/15">
                <UserX className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-red-400">{blockedUsersCount}</p>
                <p className="text-[10px] text-[#9a8fa8]">Blocked Users</p>
              </div>
            </div>
          </div>

          {/* Payment Analytics */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="luxe-card p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/15">
                <CreditCard className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-green-400">{paidOnlineBookings.length}</p>
                <p className="text-[10px] text-[#9a8fa8]">Paid Online (₹{onlinePaymentRevenue.toLocaleString('en-IN')})</p>
              </div>
            </div>
            <div className="luxe-card p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/15">
                <Banknote className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-blue-400">{paidAtSalonBookings.length}</p>
                <p className="text-[10px] text-[#9a8fa8]">Paid at Salon</p>
              </div>
            </div>
            <div className="luxe-card p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/15">
                <Clock className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-amber-400">{pendingPaymentBookings.length}</p>
                <p className="text-[10px] text-[#9a8fa8]">Payment Pending</p>
              </div>
            </div>
            <div className="luxe-card p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/15">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-red-400">{notPaidBookings.length}</p>
                <p className="text-[10px] text-[#9a8fa8]">Not Paid</p>
              </div>
            </div>
          </div>

          {/* Unverified Bookings — Salon didn't update status */}
          {unverifiedBookings.length > 0 && (
            <div className="luxe-card p-6 space-y-4 border-l-4 border-red-500/50">
              <h3 className="font-display text-lg text-red-400 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" /> Unverified Bookings — Action Required ({unverifiedBookings.length})
              </h3>
              <p className="text-xs text-[#9a8fa8]">These bookings have passed their date but the salon hasn't updated appointment/payment status. Contact the customer to verify.</p>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {unverifiedBookings.slice(0, 20).map(b => {
                  const customer = users.find(u => u.id === b.userId);
                  return (
                    <div key={b.id} className="rounded-lg bg-[#0f0d12]/50 p-4 flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-[#e8d5a3]">{customer?.name || 'Unknown'}</p>
                        <p className="text-[10px] text-[#9a8fa8]">{b.salonName} · {b.date} · {b.time} · ₹{b.totalPrice}</p>
                        <p className="text-[10px] text-[#9a8fa8]">Payment: {b.paymentStatus || 'unknown'} · Method: {b.paymentMethod}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {customer?.phone && (
                          <a href={`tel:${customer.phone}`} className="flex items-center gap-1 rounded-lg bg-green-500/10 px-3 py-1.5 text-[10px] text-green-400 hover:bg-green-500/20 transition">
                            <Phone className="h-3 w-3" /> Call
                          </a>
                        )}
                        {customer?.email && (
                          <a href={`mailto:${customer.email}?subject=Luxeluru Appointment Verification — ${b.date}&body=Hi ${customer.name}, we are reaching out regarding your appointment at ${b.salonName} on ${b.date}. Please confirm if you attended the appointment and completed the payment.`} className="flex items-center gap-1 rounded-lg bg-blue-500/10 px-3 py-1.5 text-[10px] text-blue-400 hover:bg-blue-500/20 transition">
                            <Mail className="h-3 w-3" /> Email
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Platform Intelligence — Comprehensive Tracking */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="luxe-card p-6 space-y-3">
              <h3 className="font-display text-lg text-[#e8d5a3] flex items-center gap-2">
                <Activity className="h-5 w-5 text-[#c9a962]" /> This Week's Snapshot
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#0f0d12] p-3 rounded-lg text-center">
                  <p className="text-lg font-bold text-[#c9a962]">{thisWeekBookings.length}</p>
                  <p className="text-[10px] text-[#9a8fa8]">Bookings This Week</p>
                </div>
                <div className="bg-[#0f0d12] p-3 rounded-lg text-center">
                  <p className="text-lg font-bold text-green-400">₹{todayRevenue.toLocaleString('en-IN')}</p>
                  <p className="text-[10px] text-[#9a8fa8]">Revenue Today</p>
                </div>
                <div className="bg-[#0f0d12] p-3 rounded-lg text-center">
                  <p className="text-lg font-bold text-blue-400">{newUsersThisWeek}</p>
                  <p className="text-[10px] text-[#9a8fa8]">New Users This Week</p>
                </div>
                <div className="bg-[#0f0d12] p-3 rounded-lg text-center">
                  <p className="text-lg font-bold text-purple-400">{newSalonsThisWeek}</p>
                  <p className="text-[10px] text-[#9a8fa8]">New Salon Apps This Week</p>
                </div>
              </div>
            </div>

            <div className="luxe-card p-6 space-y-3">
              <h3 className="font-display text-lg text-[#e8d5a3] flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-[#c9a962]" /> Deep Metrics
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-[#c9a962]/10">
                  <span className="text-[#9a8fa8]">Avg. Booking Value</span>
                  <span className="text-[#e8d5a3] font-bold">₹{avgBookingValue.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#c9a962]/10">
                  <span className="text-[#9a8fa8]">Rescheduled Appointments</span>
                  <span className="text-amber-300 font-bold">{rescheduledBookings}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#c9a962]/10">
                  <span className="text-[#9a8fa8]">User Engagement Rate</span>
                  <span className="text-cyan-400 font-bold">{users.length ? Math.round((uniqueBookingUsers / users.length) * 100) : 0}%</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#c9a962]/10">
                  <span className="text-[#9a8fa8]">Commission Paid (Current)</span>
                  <span className="text-green-400 font-bold">{commissionPaidSalons} salons</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#c9a962]/10">
                  <span className="text-[#9a8fa8]">Commission Overdue</span>
                  <span className="text-red-400 font-bold">{commissionOverdueSalons} salons</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-[#9a8fa8]">Forcefully Removed Salons</span>
                  <span className="text-orange-400 font-bold">{forcefullyRemovedSalons}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Per-Salon Booking Breakdown */}
          {perSalonStats.length > 0 && (
            <div className="luxe-card p-6 space-y-4">
              <h3 className="font-display text-lg text-[#e8d5a3] flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-[#c9a962]" /> Bookings Per Salon
              </h3>
              <div className="overflow-x-auto rounded-lg border border-[#c9a962]/10">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[#0f0d12] text-[#9a8fa8] uppercase tracking-wider">
                      <th className="px-4 py-3 text-left">Salon</th>
                      <th className="px-4 py-3 text-center">Total</th>
                      <th className="px-4 py-3 text-center">Completed</th>
                      <th className="px-4 py-3 text-center">Cancelled</th>
                      <th className="px-4 py-3 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#c9a962]/10">
                    {perSalonStats.map(([salonId, stats]) => (
                      <tr key={salonId} className="hover:bg-[#c9a962]/5 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-[#e8d5a3]">{stats.name}</p>
                          <p className="text-[10px] text-[#9a8fa8] font-mono">{salonId}</p>
                        </td>
                        <td className="px-4 py-3 text-center font-semibold text-[#e8d5a3]">{stats.total}</td>
                        <td className="px-4 py-3 text-center text-green-400">{stats.completed}</td>
                        <td className="px-4 py-3 text-center text-red-400">{stats.cancelled}</td>
                        <td className="px-4 py-3 text-right font-semibold text-[#c9a962]">₹{stats.revenue.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recent Bookings Log */}
          {recentBookings.length > 0 && (
            <div className="luxe-card p-6 space-y-4">
              <h3 className="font-display text-lg text-[#e8d5a3] flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#c9a962]" /> Recent Booking Activity
              </h3>
              <div className="overflow-x-auto rounded-lg border border-[#c9a962]/10">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[#0f0d12] text-[#9a8fa8] uppercase tracking-wider">
                      <th className="px-4 py-3 text-left">User</th>
                      <th className="px-4 py-3 text-left">Salon</th>
                      <th className="px-4 py-3 text-center">Date</th>
                      <th className="px-4 py-3 text-center">Time</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#c9a962]/10">
                    {recentBookings.map(b => {
                      const bookingUser = users.find(u => u.id === b.userId);
                      return (
                        <tr key={b.id} className="hover:bg-[#c9a962]/5 transition-colors">
                          <td className="px-4 py-3 text-[#e8d5a3]">{bookingUser?.name || 'Unknown'}</td>
                          <td className="px-4 py-3 text-[#e8d5a3]">{b.salonName}</td>
                          <td className="px-4 py-3 text-center text-[#9a8fa8]">{b.date}</td>
                          <td className="px-4 py-3 text-center text-[#9a8fa8]">{b.time}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              b.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                              b.status === 'confirmed' ? 'bg-amber-500/20 text-amber-300' :
                              b.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                              'bg-[#9a8fa8]/20 text-[#9a8fa8]'
                            }`}>
                              {b.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-[#c9a962]">₹{b.totalPrice.toLocaleString('en-IN')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TEST SIGN IN TAB */}
      {activeTab === 'test-signin' && (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
          <div className="border-b border-[#c9a962]/10 pb-2">
            <h3 className="font-display text-2xl text-[#e8d5a3]">Test Sign In Information</h3>
            <p className="text-xs text-[#9a8fa8] mt-0.5">
              Use these pre-configured test credentials to sign in and test the platform experience from both user and partner salon perspectives.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* User Test Box */}
            <div className="luxe-card p-6 flex flex-col justify-between border-t-2 border-[#c9a962]">
              <div>
                <h4 className="font-display text-lg text-[#e8d5a3] font-bold mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-[#c9a962]" /> User Test Credentials
                </h4>
                <div className="space-y-3 text-xs bg-[#0f0d12]/50 p-4 rounded-lg border border-[#c9a962]/10">
                  <p className="flex justify-between">
                    <span className="text-[#9a8fa8]">Email:</span>
                    <span className="text-[#e8d5a3] font-mono font-semibold">adminuser1@test.com</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-[#9a8fa8]">Password:</span>
                    <span className="text-[#e8d5a3] font-mono font-semibold">user@admin-test789</span>
                  </p>
                </div>
                <p className="mt-4 text-xs text-[#9a8fa8] leading-relaxed">
                  Log out of this Admin session and go to the User Login page to enter these details.
                </p>
              </div>
            </div>

            {/* Salon Test Box */}
            <div className="luxe-card p-6 flex flex-col justify-between border-t-2 border-[#c9a962]">
              <div>
                <h4 className="font-display text-lg text-[#e8d5a3] font-bold mb-4 flex items-center gap-2">
                  <Scissors className="h-5 w-5 text-[#c9a962]" /> Salon Test Credentials
                </h4>
                <div className="space-y-3 text-xs bg-[#0f0d12]/50 p-4 rounded-lg border border-[#c9a962]/10">
                  <p className="flex justify-between">
                    <span className="text-[#9a8fa8]">Salon Name:</span>
                    <span className="text-[#e8d5a3] font-mono font-semibold">luxury salon admin</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-[#9a8fa8]">Salon ID:</span>
                    <span className="text-[#e8d5a3] font-mono font-semibold">LLLUX456</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-[#9a8fa8]">Registered Email:</span>
                    <span className="text-[#e8d5a3] font-mono font-semibold">luxurysalonadmin@test.com</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-[#9a8fa8]">Password:</span>
                    <span className="text-[#e8d5a3] font-mono font-semibold">salon@admin-test789</span>
                  </p>
                </div>
                <p className="mt-4 text-xs text-[#9a8fa8] leading-relaxed">
                  Log out of this Admin session and go to the Salon Partner Login page to enter these details.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-center mt-6">
            <button
              onClick={() => { logout(); navigate('/'); }}
              className="flex items-center gap-2 luxe-btn py-3 px-8 text-sm font-semibold"
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </div>
        </div>
      )}

      {/* NOTIFICATIONS PANEL */}
      {activeTab === 'notifications' && (
        <div className="luxe-card p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-[#c9a962]" />
              <h3 className="font-display text-2xl text-[#e8d5a3]">Payout & Commission Notifications</h3>
              {adminUnreadCount > 0 && (
                <span className="flex items-center justify-center rounded-full bg-red-500/20 border border-red-500/30 px-2 py-0.5 text-xs font-semibold text-red-400">
                  {adminUnreadCount} unread
                </span>
              )}
            </div>
            {adminUnreadCount > 0 && (
              <button
                onClick={() => markAllNotificationsRead('admin')}
                className="text-xs text-[#c9a962] hover:text-[#e8d5a3] transition underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          {adminNotifications.length === 0 ? (
            <div className="text-center py-20 text-[#9a8fa8]">
              <Bell className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="text-sm font-medium">No notifications yet.</p>
              <p className="text-xs mt-1 opacity-70">Payout confirmations and commission alerts will appear here when appointments are completed.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {adminNotifications.map(notif => (
                <div
                  key={notif.id}
                  className={`flex items-start gap-4 rounded-xl border p-5 transition cursor-pointer ${
                    notif.read
                      ? 'border-[#c9a962]/10 bg-[#0f0d12]/40'
                      : 'border-[#c9a962]/40 bg-[#c9a962]/5 shadow-lg'
                  }`}
                  onClick={() => !notif.read && markNotificationRead(notif.id)}
                >
                  <div className={`mt-1 flex-shrink-0 rounded-full p-2.5 ${
                    notif.type === 'payout' ? 'bg-emerald-500/20 text-emerald-400' :
                    notif.type === 'payment_received' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-amber-500/20 text-amber-400'
                  }`}>
                    {notif.type === 'payout' ? <CheckCircle className="h-5 w-5" /> :
                     notif.type === 'payment_received' ? <CreditCard className="h-5 w-5" /> :
                     <IndianRupee className="h-5 w-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-relaxed ${notif.read ? 'text-[#9a8fa8]' : 'text-[#e8d5a3]'}`}>
                      {notif.message}
                    </p>
                    <p className="mt-2 text-xs text-[#9a8fa8]/70">
                      {new Date(notif.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>
                  {!notif.read && (
                    <div className="mt-2 flex-shrink-0 h-2.5 w-2.5 rounded-full bg-[#c9a962] animate-pulse" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MESSAGES TAB */}
      {activeTab === 'messages' && (
        <div className="space-y-6 animate-fade-in">
          {/* Sub-tabs */}
          <div className="flex gap-1 rounded-xl bg-[#130f18]/60 p-1 border border-[#c9a962]/10">
            <button
              onClick={() => setAdminMsgSubTab('conversations')}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition ${
                adminMsgSubTab === 'conversations' ? 'bg-[#c9a962] text-[#0f0d12]' : 'text-[#9a8fa8] hover:text-[#e8d5a3]'
              }`}
              style={{ touchAction: 'manipulation' }}
            >
              <Users className="h-4 w-4" /> Salon Conversations
            </button>
            <button
              onClick={() => setAdminMsgSubTab('broadcast')}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition ${
                adminMsgSubTab === 'broadcast' ? 'bg-[#c9a962] text-[#0f0d12]' : 'text-[#9a8fa8] hover:text-[#e8d5a3]'
              }`}
              style={{ touchAction: 'manipulation' }}
            >
              <Megaphone className="h-4 w-4" /> Broadcast to All
            </button>
          </div>

          {/* Conversations */}
          {adminMsgSubTab === 'conversations' && (
            <div className="grid gap-4 lg:grid-cols-3">
              {/* Salon List */}
              <div className="luxe-card p-4">
                <h3 className="font-display text-lg text-[#e8d5a3] mb-3">Active Salons</h3>
                <div className="space-y-2 max-h-[60dvh] overflow-y-auto">
                  {activeSalons.filter(s => s.isActive).map(s => {
                    const unread = messages.filter(m => m.salonId === s.id && m.sender === 'salon' && !m.isRead).length;
                    return (
                      <button
                        key={s.id}
                        onClick={() => { setSelectedSalonId(s.id); fetchMessages(s.id); }}
                        className={`w-full flex items-center gap-3 rounded-xl p-3 text-left transition relative ${
                          selectedSalonId === s.id
                            ? 'bg-[#c9a962]/15 border border-[#c9a962]/40'
                            : 'hover:bg-[#221c28] border border-transparent'
                        }`}
                        style={{ touchAction: 'manipulation' }}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#e8d5a3] truncate">{s.name}</p>
                          <p className="text-[11px] text-[#9a8fa8] truncate">{s.id}</p>
                        </div>
                        {unread > 0 && (
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                            {unread}
                          </span>
                        )}
                        <ChevronRight className="h-4 w-4 text-[#9a8fa8] shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Chat panel */}
              <div className="lg:col-span-2 luxe-card p-5">
                {!selectedSalonId ? (
                  <div className="flex flex-col items-center justify-center h-full py-16 text-[#9a8fa8]">
                    <MessageSquare className="h-12 w-12 mb-3 opacity-30" />
                    <p className="text-sm">Select a salon to view conversation</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-4 border-b border-[#c9a962]/10 pb-3">
                      <Lock className="h-4 w-4 text-[#c9a962]" />
                      <h3 className="font-display text-lg text-[#e8d5a3] truncate">
                        {activeSalons.find(s => s.id === selectedSalonId)?.name || selectedSalonId}
                      </h3>
                      <span className="ml-auto shrink-0 text-[10px] text-[#9a8fa8] bg-[#c9a962]/10 px-2 py-0.5 rounded-full">🔒 Encrypted</span>
                    </div>

                    {/* Messages */}
                    <div className="space-y-3 max-h-[45dvh] overflow-y-auto pr-1 mb-4">
                      {messages.filter(m => m.salonId === selectedSalonId).length === 0 ? (
                        <div className="text-center py-10 text-[#9a8fa8]">
                          <p className="text-sm">No messages yet. Start the conversation.</p>
                        </div>
                      ) : (
                        messages
                          .filter(m => m.salonId === selectedSalonId)
                          .map((m) => (
                            <div key={m.id} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                              <div
                                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                                  m.sender === 'admin'
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

                    {/* Input */}
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!adminMsgInput.trim() || !selectedSalonId) return;
                        setAdminMsgSending(true);
                        await sendDirectMessage(selectedSalonId, adminMsgInput.trim(), 'admin', 'direct');
                        setAdminMsgInput('');
                        setAdminMsgSending(false);
                      }}
                      className="flex gap-2"
                    >
                      <input
                        value={adminMsgInput}
                        onChange={(e) => setAdminMsgInput(e.target.value)}
                        placeholder="Type a message..."
                        className="luxe-input flex-1"
                        style={{ fontSize: 16 }}
                        disabled={adminMsgSending}
                      />
                      <button
                        type="submit"
                        disabled={!adminMsgInput.trim() || adminMsgSending}
                        className="luxe-btn px-4 disabled:opacity-50"
                        style={{ touchAction: 'manipulation', minHeight: 44 }}
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Broadcast */}
          {adminMsgSubTab === 'broadcast' && (
            <div className="luxe-card p-6 space-y-5">
              <div className="border-b border-[#c9a962]/10 pb-4">
                <h3 className="font-display text-xl text-[#e8d5a3]">📣 Broadcast Announcement</h3>
                <p className="text-sm text-[#9a8fa8] mt-1">Send a platform-wide message to all active salon partners.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-[#9a8fa8] mb-1.5">Announcement Title</label>
                  <input
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    className="luxe-input"
                    placeholder="e.g. Platform Maintenance Notice, New Feature Update"
                    style={{ fontSize: 16 }}
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#9a8fa8] mb-1.5">Message Content</label>
                  <textarea
                    value={broadcastContent}
                    onChange={(e) => setBroadcastContent(e.target.value)}
                    className="luxe-input min-h-[140px]"
                    placeholder="Type your announcement message here..."
                    style={{ fontSize: 16, resize: 'vertical' }}
                  />
                </div>
                <button
                  onClick={async () => {
                    if (!broadcastTitle.trim() || !broadcastContent.trim()) {
                      addToast('error', 'Please fill in both title and message.');
                      return;
                    }
                    setBroadcastSending(true);
                    await createAnnouncement(broadcastTitle.trim(), broadcastContent.trim());
                    setBroadcastTitle('');
                    setBroadcastContent('');
                    setBroadcastSending(false);
                  }}
                  disabled={broadcastSending || !broadcastTitle.trim() || !broadcastContent.trim()}
                  className="luxe-btn w-full disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ touchAction: 'manipulation', minHeight: 48 }}
                >
                  {broadcastSending ? (
                    <><span className="animate-spin">⏳</span> Sending...</>
                  ) : (
                    <><Megaphone className="h-5 w-5" /> Send to All Active Salons</>
                  )}
                </button>
              </div>

              {/* Recent announcements */}
              {announcements.length > 0 && (
                <div className="border-t border-[#c9a962]/10 pt-4 space-y-3">
                  <h4 className="text-sm font-semibold text-[#9a8fa8]">Recent Announcements</h4>
                  {announcements.slice(0, 5).map(a => (
                    <div key={a.id} className="rounded-xl border border-[#c9a962]/10 bg-[#130f18]/40 p-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-[#e8d5a3]">{a.title}</p>
                        <p className="text-[10px] text-[#9a8fa8]">{a.readBy.length} salons read</p>
                      </div>
                      <p className="text-xs text-[#9a8fa8] line-clamp-2">{a.content}</p>
                      <p className="text-[10px] text-[#6b6175] mt-1">{new Date(a.createdAt).toLocaleString('en-IN')}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* BLOCK USER MODAL */}
      {blockingUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm luxe-card p-6 relative animate-fade-in">
            <button 
              onClick={() => setBlockingUserId(null)}
              className="absolute right-4 top-4 text-[#9a8fa8] hover:text-[#e8d5a3]"
            >
              <XCircle className="h-5 w-5" />
            </button>
            <h3 className="font-display text-xl text-[#e8d5a3] mb-2 flex items-center gap-2 text-red-400">
              <Lock className="h-5 w-5" /> Block User Account
            </h3>
            <p className="text-xs text-[#9a8fa8] mb-4">
              Select the duration to block the user. Blocked users cannot schedule any appointments.
            </p>
            
            <form onSubmit={handleBlockSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm text-[#9a8fa8]">Block Duration (Days)</label>
                <select
                  value={blockDays}
                  onChange={(e) => setBlockDays(e.target.value)}
                  className="luxe-input"
                >
                  <option value="3">3 Days (Missed Booking Penalty)</option>
                  <option value="7">7 Days (Spam Warning)</option>
                  <option value="15">15 Days (Chronic Fake Booking)</option>
                  <option value="30">30 Days (Severe Policy Violation)</option>
                  <option value="365">1 Year (Permanent Exclusion)</option>
                </select>
              </div>

              <button type="submit" className="luxe-btn bg-red-600 text-white w-full">
                Enforce Account Block
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Salon Confirmation Modal */}
      {deletingSalonId && (() => {
        const salonToDelete = salons.find(s => s.id === deletingSalonId);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-[#1a1520] p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/15">
                  <Trash2 className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-red-400">Delete Salon Permanently</h3>
                  <p className="text-xs text-[#9a8fa8]">This action cannot be undone</p>
                </div>
              </div>

              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-200 space-y-1">
                <p><strong>Salon:</strong> {salonToDelete?.name || deletingSalonId}</p>
                <p><strong>ID:</strong> <span className="font-mono">{deletingSalonId}</span></p>
                <p className="mt-2 text-red-300">⚠️ This will permanently remove the salon and all its data from the database. All associated bookings and records will become orphaned.</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setDeletingSalonId(null)}
                  className="flex-1 rounded-lg border border-[#c9a962]/20 py-2.5 text-xs font-semibold text-[#9a8fa8] hover:text-[#e8d5a3] transition"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    await deleteSalonPermanently(deletingSalonId);
                    setDeletingSalonId(null);
                  }}
                  className="flex-1 rounded-lg bg-red-600 py-2.5 text-xs font-semibold text-white hover:bg-red-500 transition flex items-center justify-center gap-2"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Yes, Delete Permanently
                </button>
              </div>
            </div>
          </div>
        );
      })()}
      {/* Exit Rejection Reason Modal */}
      {rejectExitId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
          <div className="luxe-card w-full max-w-md p-6 animate-fade-in">
            <h3 className="font-display text-xl text-[#e8d5a3] mb-4">Reject Exit Request</h3>
            <p className="text-sm text-[#9a8fa8] mb-4">
              Provide a reason for rejecting this salon's exit request. The salon will see this reason.
            </p>
            <textarea
              value={rejectExitReason}
              onChange={(e) => setRejectExitReason(e.target.value)}
              className="luxe-input min-h-[100px] mb-4"
              placeholder="Reason for rejection (e.g. outstanding dues, pending bookings, etc.)"
              style={{ fontSize: 16 }}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setRejectExitId(null)}
                className="luxe-btn-outline flex-1"
                style={{ touchAction: 'manipulation' }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!rejectExitReason.trim()) {
                    addToast('error', 'Please provide a reason for rejection.');
                    return;
                  }
                  await rejectSalonExit(rejectExitId, rejectExitReason.trim());
                  setRejectExitId(null);
                  setRejectExitReason('');
                }}
                className="luxe-btn flex-1"
                style={{ touchAction: 'manipulation' }}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
