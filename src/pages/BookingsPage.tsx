import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Star, X, RefreshCw, Sparkles, IndianRupee, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useT } from '../hooks/useT';

export function BookingsPage() {
  const { user, bookings, cancelBooking } = useApp();
  const tr = useT();

  const userBookings = bookings
    .filter((b) => b.userId === user?.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const upcoming = userBookings.filter((b) => b.status === 'confirmed');
  const past = userBookings.filter((b) => b.status !== 'confirmed');

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-3xl gold-gradient">{tr('history')}</h1>
      <p className="mt-2 text-[#9a8fa8]">{tr('feedback24h')}</p>

      {userBookings.length === 0 ? (
        <div className="luxe-card mt-8 p-12 text-center">
          <Calendar className="mx-auto h-12 w-12 text-[#9a8fa8]" />
          <p className="mt-4 text-[#9a8fa8]">{tr('noBookings')}</p>
          <Link to="/salons" className="luxe-btn mt-4 inline-block">{tr('bookNow')}</Link>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-4 font-display text-xl text-[#e8d5a3]">{tr('upcoming')}</h2>
              <div className="space-y-4">
                {upcoming.map((b) => (
                  <BookingCard key={b.id} booking={b} tr={tr} onCancel={() => cancelBooking(b.id)} />
                ))}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-4 font-display text-xl text-[#e8d5a3]">{tr('completed')}</h2>
              <div className="space-y-4">
                {past.map((b) => (
                  <BookingCard key={b.id} booking={b} tr={tr} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function BookingCard({
  booking,
  tr,
  onCancel,
}: {
  booking: import('../types').Booking;
  tr: (key: import('../i18n/translations').TranslationKey) => string;
  onCancel?: () => void;
}) {
  const { rescheduleBooking } = useApp();
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [newDate, setNewDate] = useState(booking.date);
  const [newTime, setNewTime] = useState(booking.time);

  // Compute refund preview when cancel dialog opens
  function getRefundPreview() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const apptDate = new Date(booking.date);
    apptDate.setHours(0, 0, 0, 0);
    const diffDays = Math.round((apptDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
    const isOnline = booking.paymentStatus === 'paid-online' || booking.paymentMethod === 'card' || booking.paymentMethod === 'upi';
    if (!isOnline) return { percent: 0, amount: 0, isOnline };
    let percent = 0;
    if (diffDays <= 0) percent = 20;
    else if (diffDays === 1) percent = 50;
    else if (diffDays === 2) percent = 70;
    else percent = 100;
    return { percent, amount: Math.round(booking.totalPrice * percent / 100), isOnline, diffDays };
  }

  // Time slots matching the salon booking system format
  const TIME_SLOTS = [
    '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM',
    '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM',
  ];

  // Sync local state when booking prop updates (after successful reschedule)
  useEffect(() => {
    setNewDate(booking.date);
    setNewTime(booking.time);
  }, [booking.date, booking.time]);

  const todayStr = new Date().toISOString().split('T')[0];
  const canReschedule = booking.status === 'confirmed' && booking.date > todayStr;

  async function handleSave() {
    if (!newDate || !newTime) return;
    if (newDate === booking.date && newTime === booking.time) {
      setIsRescheduling(false);
      return;
    }
    const success = await rescheduleBooking(booking.id, newDate, newTime);
    if (success) {
      setIsRescheduling(false);
    }
  }

  return (
    <div className="luxe-card p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <h3 className="font-display text-xl text-[#e8d5a3]">{booking.salonName}</h3>
          
          {isRescheduling ? (
            <div className="mt-4 space-y-3 rounded-lg bg-[#0f0d12]/50 p-4 max-w-sm">
              <p className="text-xs text-[#c9a962] font-semibold">Select New Date & Time</p>
              <div>
                <label className="text-[10px] text-[#9a8fa8] block mb-1">New Date</label>
                <input
                  type="date"
                  value={newDate}
                  min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="luxe-input text-xs py-1 px-2"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#9a8fa8] block mb-1">New Time</label>
                <select
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="luxe-input text-xs py-1.5 px-2"
                >
                  {TIME_SLOTS.map(slot => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={handleSave} className="luxe-btn text-[10px] py-1 px-3">
                  Save Changes
                </button>
                <button 
                  onClick={() => { setIsRescheduling(false); setNewDate(booking.date); setNewTime(booking.time); }} 
                  className="luxe-btn-outline text-[10px] py-1 px-3 border-red-500/30 text-red-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-2 space-y-1 text-sm text-[#9a8fa8]">
                <p className="flex items-center gap-2"><Calendar className="h-4 w-4 text-[#c9a962]" /> {booking.date}</p>
                <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-[#c9a962]" /> {booking.time}</p>
                {booking.staffName && (
                  <p className="flex items-center gap-2"><Star className="h-4 w-4 text-[#c9a962]" /> {booking.staffName}</p>
                )}
              </div>
              <p className="mt-2 text-sm">{booking.serviceNames.join(' · ')}</p>
            </>
          )}
          
          <p className="mt-2 text-xs text-[#9a8fa8]">
            {tr('paymentMethod')}: {
              booking.paymentMethod === 'card' ? '💳 Card (Online)' :
              booking.paymentMethod === 'upi' ? '📱 UPI (Online)' :
              booking.paymentMethod === 'pay-at-salon' ? '💵 Pay at Salon' :
              booking.paymentMethod === 'cash' ? '💵 Cash' :
              booking.paymentMethod
            }
            {booking.paymentStatus === 'paid-online' && <span className="ml-1 text-emerald-400 font-semibold">(Paid ✓)</span>}
          </p>
          {booking.status === 'cancelled' && booking.refundAmount !== undefined && (
            <p className="mt-1 text-[10px] font-semibold text-green-400">
              {booking.refundAmount > 0
                ? `✅ Refund Processed: ₹${booking.refundAmount.toLocaleString('en-IN')}`
                : `❌ No refund — cancelled on the appointment day`
              }
            </p>
          )}

          {/* AI Stylist & Custom Preferences */}
          {(booking.aiStyleRecommendation || booking.customImageUrl || booking.customMessage) && (
            <div className="mt-3 bg-[#130f18]/40 border border-[#c9a962]/10 rounded-xl p-3 space-y-2">
              <p className="text-xs font-semibold text-[#e8d5a3] flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-[#c9a962]" />
                AI Stylist &amp; Custom Preference
              </p>
              
              {booking.aiStyleRecommendation && booking.aiStyleRecommendation.faceShape !== 'Custom Upload' && (
                <div className="grid grid-cols-2 gap-2 text-[11px] text-[#9a8fa8] pb-1 border-b border-[#c9a962]/5">
                  <div>
                    <span className="text-[#e8d5a3] font-medium">Face Shape:</span> {booking.aiStyleRecommendation.faceShape}
                  </div>
                  <div>
                    <span className="text-[#e8d5a3] font-medium">Skin Tone:</span> {booking.aiStyleRecommendation.skinTone}
                  </div>
                  {booking.aiStyleRecommendation.userAdjustedStyle && (
                    <div className="col-span-2">
                      <span className="text-[#e8d5a3] font-medium">Style:</span> {booking.aiStyleRecommendation.userAdjustedStyle}
                    </div>
                  )}
                  {booking.aiStyleRecommendation.userAdjustedColor && (
                    <div className="col-span-2">
                      <span className="text-[#e8d5a3] font-medium">Colour:</span> {booking.aiStyleRecommendation.userAdjustedColor}
                    </div>
                  )}
                </div>
              )}

              {booking.customMessage && (
                <div className="text-[11px] text-[#9a8fa8]">
                  <span className="text-[#e8d5a3] font-medium">Your Notes:</span> "{booking.customMessage}"
                </div>
              )}

              {booking.customImageUrl && (
                <div className="flex items-center gap-2 pt-1 text-[11px] text-[#9a8fa8]">
                  <span className="text-[#e8d5a3] font-medium">Uploaded Reference:</span>
                  <a href={booking.customImageUrl} target="_blank" rel="noreferrer" className="text-[#c9a962] hover:underline">
                    View Image
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="text-left sm:text-right">
          <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
            booking.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
            booking.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
            'bg-[#c9a962]/20 text-[#c9a962]'
          }`}>
            {tr(booking.status === 'confirmed' ? 'confirmed' : booking.status === 'cancelled' ? 'cancelled' : 'completed')}
          </span>
          <p className="mt-2 font-display text-xl text-[#c9a962]">₹{booking.totalPrice.toLocaleString('en-IN')}</p>
        </div>
      </div>
      
      {!isRescheduling && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-[#c9a962]/10 pt-4">
          <Link to={`/salons/${booking.salonId}`} className="luxe-btn-outline text-sm py-2 px-4">
            {tr('viewSalon')}
          </Link>
          <Link to={`/salons/${booking.salonId}`} className="luxe-btn-outline flex items-center gap-1 text-sm py-2 px-4">
            <RefreshCw className="h-4 w-4" /> {tr('rebook')}
          </Link>
          {canReschedule && (
            <button 
              onClick={() => setIsRescheduling(true)} 
              className="luxe-btn text-sm py-2 px-4"
            >
              Reschedule
            </button>
          )}
          {onCancel && booking.status === 'confirmed' && (
            <button onClick={() => setShowCancelConfirm(true)} className="flex items-center gap-1 text-sm text-red-400 hover:underline">
              <X className="h-4 w-4" /> {tr('cancel')}
            </button>
          )}
        </div>
      )}

      {/* Cancel Confirmation Modal with Refund Preview */}
      {showCancelConfirm && (() => {
        const preview = getRefundPreview();
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl border border-[#c9a962]/30 bg-[#1a1520] p-6 shadow-2xl animate-fade-in">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0" />
                <h3 className="text-lg font-bold text-[#e8d5a3]">Cancel Appointment?</h3>
              </div>

              <div className="rounded-xl border border-[#c9a962]/20 bg-[#0f0d12]/60 p-4 space-y-2 mb-5">
                <p className="text-sm font-semibold text-[#e8d5a3]">{booking.salonName}</p>
                <p className="text-xs text-[#9a8fa8]">{booking.date} at {booking.time}</p>
                <div className="border-t border-[#c9a962]/10 pt-2 mt-2">
                  <p className="text-xs text-[#9a8fa8] mb-1">Cancellation Policy:</p>
                  {preview.isOnline ? (
                    <div className="space-y-1">
                      <p className="text-xs text-[#9a8fa8]">• Same day: <span className="text-amber-400 font-semibold">20% refund</span></p>
                      <p className="text-xs text-[#9a8fa8]">• 1 day before: <span className="text-amber-400 font-semibold">50% refund</span></p>
                      <p className="text-xs text-[#9a8fa8]">• 2 days before: <span className="text-emerald-400 font-semibold">70% refund</span></p>
                      <p className="text-xs text-[#9a8fa8]">• 3+ days before: <span className="text-emerald-400 font-semibold">100% refund</span></p>
                      <div className="mt-3 rounded-lg bg-[#c9a962]/10 border border-[#c9a962]/20 p-3 flex items-center gap-2">
                        <IndianRupee className="h-4 w-4 text-[#c9a962]" />
                        <div>
                          <p className="text-xs text-[#9a8fa8]">Your Estimated Refund</p>
                          <p className="text-lg font-bold text-[#c9a962]">₹{preview.amount.toLocaleString('en-IN')} <span className="text-sm text-[#9a8fa8]">(~{preview.percent}%)</span></p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-amber-400">Pay-at-salon bookings are not eligible for online refunds.</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 rounded-lg border border-[#c9a962]/20 bg-[#1a1520] py-2.5 text-sm font-medium text-[#e8d5a3] hover:bg-[#c9a962]/10 transition"
                >
                  Keep Appointment
                </button>
                <button
                  onClick={() => { setShowCancelConfirm(false); onCancel?.(); }}
                  className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-500 transition"
                >
                  Confirm Cancel
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
