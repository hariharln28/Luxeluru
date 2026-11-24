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
  RefreshCw
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
    refreshData
  } = useApp();

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  }, [refreshData]);
  
  const navigate = useNavigate();
  
  // Dashboard Tabs
  const [activeTab, setActiveTab] = useState<'appointments' | 'slots' | 'insights'>('appointments');

  // Manage Slots state
  const [slotDate, setSlotDate] = useState(new Date().toISOString().split('T')[0]);
  const [blockCustomerName, setBlockCustomerName] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [blockingTime, setBlockingTime] = useState<string | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);

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
                          <p className="text-xs text-[#9a8fa8] mt-1 uppercase">Payment: {b.paymentMethod}</p>
                        </div>
                      </div>

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

                      <div className="mt-3 flex justify-between border-t border-[#c9a962]/5 pt-2">
                        <div>
                          <p className="text-[#9a8fa8]">Total Bill (Final)</p>
                          <p className="text-sm font-semibold text-[#c9a962]">₹{b.totalPrice.toLocaleString('en-IN')} ({b.paymentMethod})</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[#9a8fa8]">Commission (3%)</p>
                          <p className="text-sm font-semibold text-amber-300">₹{(b.commissionAmount ?? 0).toLocaleString('en-IN')}</p>
                        </div>
                      </div>
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
    </div>
  );
}
