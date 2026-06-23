import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Star, MapPin, Clock, Phone, Mail, Package, Check,
  CreditCard, Banknote, Navigation,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useT } from '../hooks/useT';
import {
  sendWhatsAppConfirmation,
  sendEmailConfirmation,
} from '../utils/notifications';
import { CheckoutModal } from '../components/CheckoutModal';
import type { PaymentMethod } from '../types';

const TIME_SLOTS = [
  '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM',
  '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM',
];

export function SalonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, salons, createBooking, addStaffReview, staffReviews, addToast, isUserBlocked, bookings, fetchBlockedSlots, blockedSlots, styleRecommendation, setStyleRecommendation } = useApp();
  const salon = salons.find((s) => s.id === id);
  const tr = useT();

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

  // Fetch blocked slots when date changes
  useEffect(() => {
    if (date && salon) {
      fetchBlockedSlots(salon.id);
    }
  }, [date, salon, fetchBlockedSlots]);

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
    sendEmailConfirmation(user!.email, currentSalon.name, bookingData.date, bookingData.time, serviceNames, total);
    addToast('success', tr('bookingSuccess'));
    addToast('info', tr('whatsappSent'));
    addToast('info', tr('emailSent'));
    addToast('info', tr('feedback24h'));
    setShowBooking(false);
    setShowCheckout(false);
    setPendingBookingData(null);
    setSelectedServices([]);
    setSelectedPackage(null);
    setStyleRecommendation(null);
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
        <img src={currentSalon.image} alt={currentSalon.name} className="h-full w-full object-cover" />
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
              />
              <button onClick={submitReview} className="luxe-btn mt-3">{tr('submit')}</button>
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
          <div className="luxe-card w-full max-w-md max-h-[90vh] overflow-y-auto p-6 animate-fade-in">
            <h3 className="font-display text-2xl text-[#e8d5a3]">{tr('confirmBooking')}</h3>

            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm text-[#9a8fa8]">{tr('selectDate')}</label>
                <input type="date" value={date} onChange={(e) => { setDate(e.target.value); setTime(''); }}
                  min={new Date().toISOString().split('T')[0]} className="luxe-input mt-1" />
              </div>
              <div>
                <label className="text-sm text-[#9a8fa8]">{tr('selectTime')}</label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {TIME_SLOTS.map((slot) => {
                    const isBlockedSlot = date && blockedSlots.some(
                      (bs) => bs.salonId === currentSalon.id && bs.date === date && bs.time === slot
                    );
                    const isAlreadyBooked = date && bookings.some(
                      (b) => b.salonId === currentSalon.id && b.date === date && b.time === slot && b.status === 'confirmed'
                    );
                    const isUnavailable = isBlockedSlot || isAlreadyBooked;

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
                        {isUnavailable && (
                          <span className="block text-[9px] opacity-60 mt-0.5">Booked</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="text-sm text-[#9a8fa8]">{tr('selectStaff')}</label>
                <select value={selectedStaff} onChange={(e) => setSelectedStaff(e.target.value)} className="luxe-input mt-1">
                  <option value="">Any available stylist</option>
                  {currentSalon.staff.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} — {s.role}</option>
                  ))}
                </select>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold text-[#9a8fa8] uppercase tracking-wider">{tr('paymentMethod')}</p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-xs font-semibold transition ${
                      paymentMethod === 'card'
                        ? 'border-[#c9a962] bg-[#c9a962]/10 text-[#c9a962]'
                        : 'border-[#c9a962]/20 text-[#9a8fa8] hover:border-[#c9a962]/40'
                    }`}
                  >
                    <CreditCard className="h-4 w-4" /> Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('upi')}
                    className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-xs font-semibold transition ${
                      paymentMethod === 'upi'
                        ? 'border-[#c9a962] bg-[#c9a962]/10 text-[#c9a962]'
                        : 'border-[#c9a962]/20 text-[#9a8fa8] hover:border-[#c9a962]/40'
                    }`}
                  >
                    <CreditCard className="h-4 w-4" /> UPI
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('pay-at-salon')}
                    className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-xs font-semibold transition ${
                      paymentMethod === 'pay-at-salon'
                        ? 'border-[#c9a962] bg-[#c9a962]/10 text-[#c9a962]'
                        : 'border-[#c9a962]/20 text-[#9a8fa8] hover:border-[#c9a962]/40'
                    }`}
                  >
                    <Banknote className="h-4 w-4" /> At Salon
                  </button>
                </div>
                <p className="mt-2 text-[10px] text-[#9a8fa8]">
                  {paymentMethod === 'pay-at-salon' ? 'Pay cash or card when you arrive at the salon.' : paymentMethod === 'card' ? 'Secure card payment via Stripe.' : 'Pay via UPI at checkout.'}
                </p>
              </div>
            </div>

            {user && isUserBlocked(user.id).blocked && (
              <div className="mt-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400">
                {isUserBlocked(user.id).reason}
              </div>
            )}

          <div className="mt-4 rounded-lg bg-[#c9a962]/5 p-3 text-[10px] text-[#9a8fa8] border border-[#c9a962]/10">
              <p className="font-semibold text-[#e8d5a3] mb-1">Cancellation Policy</p>
              <p>• Same day: <span className="text-amber-400">20% refund</span></p>
              <p>• 1 day before: <span className="text-amber-400">50% refund</span></p>
              <p>• 2 days before: <span className="text-emerald-400">70% refund</span></p>
              <p>• 3+ days before: <span className="text-emerald-400">100% refund</span></p>
              <p className="mt-1 opacity-60">(Applies to Card/UPI payments only)</p>
            </div>

            <div className="mt-6 flex gap-3">
              <button onClick={() => setShowBooking(false)} className="luxe-btn-outline flex-1">{tr('cancel')}</button>
              <button 
                onClick={handleBook} 
                disabled={user ? isUserBlocked(user.id).blocked : false}
                className={`luxe-btn flex-1 ${user && isUserBlocked(user.id).blocked ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {paymentMethod === 'card' || paymentMethod === 'upi' ? '💳 Proceed to Pay' : tr('confirmBooking')}
              </button>
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
          onSuccess={() => finaliseBooking(pendingBookingData, pendingBookingData.serviceNames, total)}
          onClose={() => { setShowCheckout(false); setShowBooking(true); }}
        />
      )}
    </div>
  );
}
