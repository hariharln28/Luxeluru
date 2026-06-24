import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Star, MapPin, Clock, Phone, Mail, Package, Check,
  CreditCard, Banknote, Navigation,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useT } from '../hooks/useT';
import {
  sendWhatsAppConfirmation,
} from '../utils/notifications';
import { CheckoutModal } from '../components/CheckoutModal';
import type { PaymentMethod } from '../types';

const TIME_SLOTS = [
  '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM',
  '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM',
];

export function SalonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, salons, createBooking, addStaffReview, staffReviews, addToast, isUserBlocked, bookings, fetchBlockedSlots, blockedSlots, closedDays, fetchClosedDays, styleRecommendation, setStyleRecommendation } = useApp();
  const salon = salons.find((s) => s.id === id);
  const tr = useT();
  const navigate = useNavigate();

  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pay-at-salon');
  const [showBooking, setShowBooking] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [pendingBookingData, setPendingBookingData] = useState<null | Parameters<typeof createBooking>[0]>(null);
  const [reviewStaff, setReviewStaff] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // Fetch blocked slots and closed days when date changes
  useEffect(() => {
    if (date && salon) {
      fetchBlockedSlots(salon.id);
      fetchClosedDays(salon.id);
    }
  }, [date, salon, fetchBlockedSlots, fetchClosedDays]);

  if (!salon) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <p className="text-[#9a8fa8]">Salon not found</p>
        <Link to="/salons" className="luxe-btn mt-4 inline-block">{tr('salons')}</Link>
      </div>
    );
  }

  const currentSalon = salon;
  const pkg = selectedPackage ? currentSalon.packages.find((p) => p.id === selectedPackage) : null;
  const serviceTotal = selectedServices.reduce((sum, sid) => {
    const svc = currentSalon.services.find((sv) => sv.id === sid);
    return sum + (svc?.price ?? 0);
  }, 0);
  const total = pkg ? pkg.price : serviceTotal;

  function toggleService(sid: string) {
    setSelectedPackage(null);
    setSelectedServices((prev) =>
      prev.includes(sid) ? prev.filter((s) => s !== sid) : [...prev, sid]
    );
  }

  function selectPackage(pid: string) {
    setSelectedPackage(pid);
    setSelectedServices([]);
  }

  async function handleBook() {
    if (!user) return;
    const blockStatus = isUserBlocked(user.id);
    if (blockStatus.blocked) {
      addToast('error', blockStatus.reason || 'You are blocked from booking appointments.');
      return;
    }
    if (!date || !time) {
      addToast('error', 'Please select date and time');
      return;
    }
    if (total === 0) {
      addToast('error', 'Please select services or a package');
      return;
    }

    const serviceNames = pkg
      ? pkg.services.map((sid) => currentSalon.services.find((sv) => sv.id === sid)?.name ?? '').filter(Boolean)
      : selectedServices.map((sid) => currentSalon.services.find((sv) => sv.id === sid)?.name ?? '').filter(Boolean);

    const staff = currentSalon.staff.find((st) => st.id === selectedStaff);

    const bookingData = {
      salonId: currentSalon.id,
      salonName: currentSalon.name,
      serviceIds: pkg ? pkg.services : selectedServices,
      serviceNames,
      staffId: staff?.id,
      staffName: staff?.name,
      date,
      time,
      totalPrice: total,
      paymentMethod,
      paymentStatus: (paymentMethod === 'card' || paymentMethod === 'upi') ? 'paid-online' as const : 'pending' as const,
      customImageUrl: styleRecommendation?.customImageUrl,
      customMessage: styleRecommendation?.customMessage,
      aiStyleRecommendation: styleRecommendation || undefined,
    };

    // For card/UPI: open the checkout modal first, then create booking on payment success
    if (paymentMethod === 'card' || paymentMethod === 'upi') {
      setPendingBookingData(bookingData);
      setShowBooking(false);
      setShowCheckout(true);
      return;
    }

    // Pay-at-salon: confirm directly
    await finaliseBooking(bookingData, serviceNames, total);
  }

  async function finaliseBooking(
    bookingData: Parameters<typeof createBooking>[0],
    serviceNames: string[],
    total: number
  ) {
    await createBooking(bookingData);
    sendWhatsAppConfirmation(user!.phone, currentSalon.name, bookingData.date, bookingData.time, serviceNames);
    addToast('success', tr('bookingSuccess'));
    addToast('info', tr('whatsappSent'));
    addToast('info', tr('feedback24h'));
    setShowBooking(false);
    setShowCheckout(false);
    setPendingBookingData(null);
    setSelectedServices([]);
    setSelectedPackage(null);
    setStyleRecommendation(null);
    // Redirect to dashboard to show the newly booked upcoming appointment
    navigate('/dashboard');
  }

  function submitReview() {
    if (!user || !reviewStaff) return;
    addStaffReview({
      staffId: reviewStaff,
      salonId: currentSalon.id,
      userId: user.id,
      userName: user.name,
      rating: reviewRating,
      comment: reviewComment,
    });
    addToast('success', 'Review submitted!');
    setReviewStaff('');
    setReviewComment('');
  }

  return (
    <div className={`mx-auto max-w-7xl px-4 py-8 sm:px-6 ${total > 0 ? 'pb-28 lg:pb-8' : ''}`}>
      <div className="relative h-56 overflow-hidden rounded-2xl sm:h-72">
        <img src={currentSalon.image} alt={currentSalon.name} loading="lazy" decoding="async" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0d12] via-transparent to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex flex-wrap items-baseline gap-2.5">
            <h1 className="font-display text-3xl sm:text-4xl text-white">{currentSalon.name}</h1>
            <span className="rounded bg-[#c9a962]/20 px-2 py-0.5 text-xs font-semibold text-[#c9a962]">
              ID: {currentSalon.id}
            </span>
          </div>
          <p className="text-[#e8d5a3]">{currentSalon.tagline}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <div className="flex flex-wrap gap-4 text-sm text-[#9a8fa8]">
            <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-[#c9a962] text-[#c9a962]" /> {currentSalon.rating} ({currentSalon.reviewCount})</span>
            <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {currentSalon.area}</span>
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {currentSalon.openHours}</span>
            <a href={`tel:${currentSalon.phone}`} className="flex items-center gap-1 hover:text-[#c9a962]"><Phone className="h-4 w-4" /> {currentSalon.phone}</a>
            <a href={`mailto:${currentSalon.email}`} className="flex items-center gap-1 hover:text-[#c9a962]"><Mail className="h-4 w-4" /> {currentSalon.email}</a>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${currentSalon.lat},${currentSalon.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[#c9a962] hover:text-[#e8d5a3] font-semibold"
            >
              <Navigation className="h-4 w-4" /> Get Directions
            </a>
          </div>

          <section>
            <h2 className="font-display text-2xl text-[#e8d5a3]">{tr('services')}</h2>
            <div className="mt-4 space-y-2">
              {currentSalon.services.map((s) => (
                <button
                  key={s.id}
                  onClick={() => toggleService(s.id)}
                  className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition ${
                    selectedServices.includes(s.id)
                      ? 'border-[#c9a962] bg-[#c9a962]/10'
                      : 'border-[#c9a962]/10 hover:border-[#c9a962]/30'
                  }`}
                >
                  <div>
                    <p className="font-medium text-[#e8d5a3]">{s.name}</p>
                    <p className="text-xs text-[#9a8fa8]">{s.duration} {tr('minutes')}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-[#c9a962]">₹{s.price.toLocaleString('en-IN')}</span>
                    {selectedServices.includes(s.id) && <Check className="h-5 w-5 text-[#c9a962]" />}
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl text-[#e8d5a3]">{tr('packages')}</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {currentSalon.packages.map((p) => (
                <button
                  key={p.id}
                  onClick={() => selectPackage(p.id)}
                  className={`luxe-card p-4 text-left transition ${
                    selectedPackage === p.id ? 'border-[#c9a962] ring-1 ring-[#c9a962]/30' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <Package className="h-5 w-5 shrink-0 text-[#c9a962]" />
                    <div>
                      <p className="font-medium text-[#e8d5a3]">{p.name}</p>
                      <p className="mt-1 text-xs text-[#9a8fa8]">{p.description}</p>
                      <p className="mt-2 font-semibold text-[#c9a962]">₹{p.price.toLocaleString('en-IN')}</p>
                      <p className="text-xs text-green-400">{tr('saved')} ₹{p.savings.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl text-[#e8d5a3]">{tr('staff')}</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {currentSalon.staff.map((member) => {
                const reviews = staffReviews.filter((r) => r.staffId === member.id);
                const avgRating = reviews.length
                  ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
                  : member.rating;
                return (
                  <div key={member.id} className="luxe-card flex gap-4 p-4">
                    <img src={member.avatar} alt={member.name} className="h-14 w-14 rounded-full bg-[#1a1520]" />
                    <div>
                      <p className="font-medium text-[#e8d5a3]">{member.name}</p>
                      <p className="text-xs text-[#9a8fa8]">{member.role}</p>
                      <div className="mt-1 flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-[#c9a962] text-[#c9a962]" />
                        <span className="text-sm">{avgRating.toFixed(1)}</span>
                        <span className="text-xs text-[#9a8fa8]">({member.reviewCount + reviews.length})</span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {member.specialties.map((sp) => (
                          <span key={sp} className="text-[10px] text-[#c9a962]">{sp}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {user && (
            <section className="luxe-card p-6">
              <h3 className="font-display text-xl text-[#e8d5a3]">{tr('leaveReview')}</h3>
              <select value={reviewStaff} onChange={(e) => setReviewStaff(e.target.value)} className="luxe-input mt-3">
                <option value="">{tr('selectStaff')}</option>
                {currentSalon.staff.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <div className="mt-3 flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setReviewRating(n)}>
                    <Star className={`h-6 w-6 ${n <= reviewRating ? 'fill-[#c9a962] text-[#c9a962]' : 'text-[#3d3347]'}`} />
                  </button>
                ))}
              </div>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder={tr('writeReview')}
                className="luxe-input mt-3 min-h-[80px] resize-none"
                style={{ fontSize: '16px' }}
              />
              <button onClick={submitReview} className="luxe-btn mt-3" style={{ minHeight: 44, touchAction: 'manipulation' }}>{tr('submit')}</button>
            </section>
          )}
        </div>

        <div>
          <div className="sticky top-24 luxe-card p-6">
            <h3 className="font-display text-xl text-[#e8d5a3]">{tr('bookNow')}</h3>
            <p className="mt-1 text-xs text-[#9a8fa8]">{currentSalon.address}</p>

            {total > 0 && (
              <div className="mt-4 rounded-lg bg-[#c9a962]/10 p-3">
                <p className="text-sm text-[#9a8fa8]">{tr('total')}</p>
                <p className="font-display text-2xl text-[#c9a962]">₹{total.toLocaleString('en-IN')}</p>
              </div>
            )}

            {user ? (
              <button onClick={() => setShowBooking(true)} className="luxe-btn mt-4 w-full">
                {tr('confirmBooking')}
              </button>
            ) : (
              <Link to="/login" className="luxe-btn mt-4 block w-full text-center">{tr('login')}</Link>
            )}

            <p className="mt-3 text-center text-xs text-[#9a8fa8]">{tr('payAtSalon')}</p>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Booking Bar for Mobile/Tablet */}
      {total > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#c9a962]/20 bg-[#1a1520]/95 p-4 shadow-2xl backdrop-blur-xl lg:hidden animate-fade-in">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div>
              <p className="text-xs text-[#9a8fa8]">
                {selectedPackage
                  ? 'Package Selected'
                  : `${selectedServices.length} service${selectedServices.length > 1 ? 's' : ''} selected`}
              </p>
              <p className="font-display text-xl font-bold text-[#c9a962]">
                ₹{total.toLocaleString('en-IN')}
              </p>
            </div>
            {user ? (
              <button
                onClick={() => setShowBooking(true)}
                className="luxe-btn py-2 px-6 text-sm"
              >
                {tr('confirmBooking')}
              </button>
            ) : (
              <Link
                to="/login"
                className="luxe-btn py-2 px-6 text-sm text-center"
              >
                {tr('login')}
              </Link>
            )}
          </div>
        </div>
      )}

      {showBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="luxe-card w-full max-w-lg max-h-[92vh] overflow-y-auto p-6 animate-fade-in">
            <h3 className="font-display text-2xl text-[#e8d5a3]">Book Appointment</h3>
            <p className="text-xs text-[#9a8fa8] mt-0.5">{currentSalon.name}</p>

            <div className="mt-5 space-y-4">
              {/* Date */}
              <div>
                <label className="text-sm text-[#9a8fa8]">{tr('selectDate')}</label>
                <input type="date" value={date} onChange={(e) => { setDate(e.target.value); setTime(''); }}
                  min={new Date().toISOString().split('T')[0]} className="luxe-input mt-1" />
              </div>

              {/* Time */}
              <div>
                <label className="text-sm text-[#9a8fa8]">{tr('selectTime')}</label>

                {/* Closed Day Banner */}
                {date && closedDays.some(cd => cd.salonId === currentSalon.id && cd.date === date) ? (
                  <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-center">
                    <p className="text-2xl mb-1">🚫</p>
                    <p className="font-semibold text-red-400">Salon Closed on this Day</p>
                    <p className="text-xs text-red-400/70 mt-1">
                      {closedDays.find(cd => cd.salonId === currentSalon.id && cd.date === date)?.reason}
                    </p>
                    <p className="text-xs text-[#9a8fa8] mt-2">Please select a different date to book.</p>
                  </div>
                ) : (
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {TIME_SLOTS.map((slot) => {
                    const today = new Date().toISOString().split('T')[0];
                    const now = new Date();
                    const isBlockedSlot = date && blockedSlots.some(
                      (bs) => bs.salonId === currentSalon.id && bs.date === date && bs.time === slot
                    );
                    const isAlreadyBooked = date && bookings.some(
                      (b) => b.salonId === currentSalon.id && b.date === date && b.time === slot && b.status === 'confirmed'
                    );
                    // Disable slots that have already passed today
                    let isPast = false;
                    if (date === today) {
                      const [timePart, ampm] = slot.split(' ');
                      let [h, m] = timePart.split(':').map(Number);
                      if (ampm === 'PM' && h !== 12) h += 12;
                      if (ampm === 'AM' && h === 12) h = 0;
                      const slotTime = new Date();
                      slotTime.setHours(h, m, 0, 0);
                      isPast = slotTime <= now;
                    }
                    const isUnavailable = isBlockedSlot || isAlreadyBooked || isPast;
                    return (
                      <button key={slot}
                        onClick={() => !isUnavailable && setTime(slot)}
                        disabled={!!isUnavailable}
                        className={`rounded-lg py-2 text-xs transition ${
                          isUnavailable
                            ? 'border border-red-500/20 text-red-400/60 cursor-not-allowed bg-red-500/5'
                            : time === slot
                            ? 'bg-[#c9a962] text-[#0f0d12]'
                            : 'border border-[#c9a962]/20 hover:border-[#c9a962]/50'
                        }`}>
                        {slot}
                        {isPast && <span className="block text-[9px] opacity-60 mt-0.5">Past</span>}
                        {!isPast && isUnavailable && <span className="block text-[9px] opacity-60 mt-0.5">Booked</span>}
                      </button>
                    );
                  })}
                </div>
                )}
              </div>

              {/* Staff */}
              <div>
                <label className="text-sm text-[#9a8fa8]">{tr('selectStaff')}</label>
                <select value={selectedStaff} onChange={(e) => setSelectedStaff(e.target.value)} className="luxe-input mt-1">
                  <option value="">Any available stylist</option>
                  {currentSalon.staff.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} — {s.role}</option>
                  ))}
                </select>
              </div>

              {/* Payment Method */}
              <div>
                <p className="mb-2 text-xs font-semibold text-[#9a8fa8] uppercase tracking-wider">{tr('paymentMethod')}</p>
                <div className="grid grid-cols-3 gap-2">
                  <button type="button" onClick={() => setPaymentMethod('card')}
                    className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-xs font-semibold transition ${
                      paymentMethod === 'card' ? 'border-[#c9a962] bg-[#c9a962]/10 text-[#c9a962]' : 'border-[#c9a962]/20 text-[#9a8fa8] hover:border-[#c9a962]/40'
                    }`}>
                    <CreditCard className="h-4 w-4" /> Card
                  </button>
                  <button type="button" onClick={() => setPaymentMethod('upi')}
                    className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-xs font-semibold transition ${
                      paymentMethod === 'upi' ? 'border-[#c9a962] bg-[#c9a962]/10 text-[#c9a962]' : 'border-[#c9a962]/20 text-[#9a8fa8] hover:border-[#c9a962]/40'
                    }`}>
                    <CreditCard className="h-4 w-4" /> UPI
                  </button>
                  <button type="button" onClick={() => setPaymentMethod('pay-at-salon')}
                    className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-xs font-semibold transition ${
                      paymentMethod === 'pay-at-salon' ? 'border-[#c9a962] bg-[#c9a962]/10 text-[#c9a962]' : 'border-[#c9a962]/20 text-[#9a8fa8] hover:border-[#c9a962]/40'
                    }`}>
                    <Banknote className="h-4 w-4" /> At Salon
                  </button>
                </div>
              </div>
            </div>

            {/* ── CALCULATED BILL SUMMARY ───────────────────────── */}
            <div className="mt-5 rounded-2xl border border-[#c9a962]/30 bg-[#0f0d12]/70 p-4">
              <p className="text-xs font-bold text-[#c9a962] uppercase tracking-widest mb-3">Your Bill</p>

              {/* Services / Package list */}
              <div className="space-y-1.5 mb-3">
                {pkg ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#e8d5a3]">📦 {pkg.name}</span>
                    <span className="text-[#c9a962] font-semibold">₹{pkg.price.toLocaleString('en-IN')}</span>
                  </div>
                ) : selectedServices.map((sid) => {
                  const svc = currentSalon.services.find(sv => sv.id === sid);
                  return svc ? (
                    <div key={sid} className="flex justify-between text-sm">
                      <span className="text-[#e8d5a3]">✂️ {svc.name}</span>
                      <span className="text-[#c9a962] font-semibold">₹{svc.price.toLocaleString('en-IN')}</span>
                    </div>
                  ) : null;
                })}
              </div>

              {/* Staff / Date / Time summary if chosen */}
              {(date || time || selectedStaff) && (
                <div className="border-t border-[#c9a962]/10 pt-3 mb-3 space-y-1 text-xs text-[#9a8fa8]">
                  {date && <p>📅 Date: <span className="text-[#e8d5a3]">{date}</span></p>}
                  {time && <p>⏰ Time: <span className="text-[#e8d5a3]">{time}</span></p>}
                  {selectedStaff && <p>💇 Stylist: <span className="text-[#e8d5a3]">{currentSalon.staff.find(s => s.id === selectedStaff)?.name}</span></p>}
                </div>
              )}

              {/* Total */}
              <div className="border-t border-[#c9a962]/20 pt-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#9a8fa8]">Total Amount</p>
                  <p className="font-display text-2xl font-bold text-[#c9a962]">₹{total.toLocaleString('en-IN')}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-[#9a8fa8]">Payment via</p>
                  <p className="text-xs font-semibold text-[#e8d5a3]">
                    {paymentMethod === 'card' ? '💳 Card (Online)' :
                     paymentMethod === 'upi'  ? '📱 UPI (Online)'  :
                     '💵 Pay at Salon'}
                  </p>
                </div>
              </div>

              {/* Card/UPI note */}
              {(paymentMethod === 'card' || paymentMethod === 'upi') && (
                <div className="mt-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-[11px] text-emerald-400">
                  ✅ Your appointment will be <strong>automatically confirmed</strong> once payment is completed.
                </div>
              )}

              {/* Pay-at-salon note */}
              {paymentMethod === 'pay-at-salon' && (
                <div className="mt-3 rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-[11px] text-amber-400">
                  💵 Pay cash or card directly when you arrive at the salon.
                </div>
              )}
            </div>

            {/* Cancellation policy */}
            <div className="mt-3 rounded-xl bg-[#c9a962]/5 p-3 text-[10px] text-[#9a8fa8] border border-[#c9a962]/10">
              <p className="font-semibold text-[#e8d5a3] mb-1">Cancellation & Refund Policy</p>
              <p>• Same day: <span className="text-amber-400">20% refund</span></p>
              <p>• 1 day before: <span className="text-amber-400">50% refund</span></p>
              <p>• 2 days before: <span className="text-emerald-400">70% refund</span></p>
              <p>• 3+ days before: <span className="text-emerald-400">100% refund</span></p>
              <p className="mt-1 opacity-60">(Applies to Card/UPI payments only)</p>
            </div>

            {/* Blocked user warning */}
            {user && isUserBlocked(user.id).blocked && (
              <div className="mt-3 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400">
                {isUserBlocked(user.id).reason}
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-5 flex gap-3">
              <button onClick={() => setShowBooking(false)} className="luxe-btn-outline flex-1">
                Back
              </button>

              {(paymentMethod === 'card' || paymentMethod === 'upi') ? (
                /* Card/UPI — opens checkout modal, auto-books on payment success */
                <button
                  onClick={handleBook}
                  disabled={!date || !time || total === 0 || (user ? isUserBlocked(user.id).blocked : true)}
                  className={`flex-1 luxe-btn flex items-center justify-center gap-2 ${
                    (!date || !time || total === 0) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <CreditCard className="h-4 w-4" />
                  Pay ₹{total.toLocaleString('en-IN')} &amp; Book
                </button>
              ) : (
                /* Pay-at-salon — directly confirms booking */
                <button
                  onClick={handleBook}
                  disabled={!date || !time || total === 0 || (user ? isUserBlocked(user.id).blocked : true)}
                  className={`flex-1 luxe-btn flex items-center justify-center gap-2 ${
                    (!date || !time || total === 0) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <Banknote className="h-4 w-4" />
                  Confirm Booking
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal for Card/UPI */}
      {showCheckout && pendingBookingData && (
        <CheckoutModal
          amount={total}
          salonName={currentSalon.name}
          paymentMethod={paymentMethod as 'card' | 'upi'}
          onSuccess={() => pendingBookingData && finaliseBooking(pendingBookingData, pendingBookingData.serviceNames, total)}
          onClose={() => { setShowCheckout(false); setShowBooking(true); }}
        />
      )}
    </div>
  );
}
