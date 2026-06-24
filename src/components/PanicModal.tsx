import { useState, useEffect } from 'react';
import {
  MapPin, Phone, Navigation, X, Star, Clock,
  CreditCard, Banknote, Check, Calendar, AlertTriangle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useT } from '../hooks/useT';
import { knnRank, getGoogleMapsNavigateUrl } from '../utils/knn';
import { CheckoutModal } from './CheckoutModal';
import type { PaymentMethod, Salon } from '../types';

// ─── Same time slots as SalonDetailPage ──────────────────────────────────────
const TIME_SLOTS = [
  '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM',
  '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM',
];

/** Parse a slot string like "2:00 PM" into a Date for today */
function parseSlotTime(slot: string): Date {
  const [timePart, ampm] = slot.split(' ');
  let [h, m] = timePart.split(':').map(Number);
  if (ampm === 'PM' && h !== 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

/** Convert "2:00 PM" → "14:00:00" for ISO date string construction */
function convertTo24(slot: string): string {
  const [timePart, ampm] = slot.split(' ');
  let [h, m] = timePart.split(':').map(Number);
  if (ampm === 'PM' && h !== 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
}

/** Returns the earliest available slot (up to 7 days ahead) for a given salon */
function getNextAvailableSlot(
  salonId: string,
  bookings: any[],
  blockedSlots: any[]
): { date: string; time: string } | null {
  const now = new Date();

  for (let dayOffset = 0; dayOffset <= 6; dayOffset++) {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    const dateStr = d.toISOString().split('T')[0];

    for (const slot of TIME_SLOTS) {
      // Skip past slots for today
      if (dayOffset === 0 && parseSlotTime(slot) <= now) continue;

      const isBooked = bookings.some(
        b => b.salonId === salonId && b.date === dateStr && b.time === slot && b.status === 'confirmed'
      );
      const isBlocked = blockedSlots.some(
        bs => bs.salonId === salonId && bs.date === dateStr && bs.time === slot
      );

      if (!isBooked && !isBlocked) return { date: dateStr, time: slot };
    }
  }
  return null;
}

interface PanicModalProps {
  onClose: () => void;
}

export function PanicModal({ onClose }: PanicModalProps) {
  const {
    activeSalons, userLocation, requestLocation,
    bookings, blockedSlots, fetchBlockedSlots,
    createBooking, addToast, isUserBlocked, user,
  } = useApp();
  const tr = useT();
  const navigate = useNavigate();

  const loc = userLocation ?? { lat: 12.9716, lng: 77.5946 };

  // Get 5 nearest salons by distance, then rank by soonest available slot
  const nearestByDist = knnRank(activeSalons, loc.lat, loc.lng, 5);

  // Prefetch blocked slots for all nearby salons on mount
  useEffect(() => {
    nearestByDist.forEach(({ item }) => fetchBlockedSlots(item.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const salonsWithSlots = nearestByDist
    .map(({ item, distance }) => ({
      salon: item,
      distance,
      nextSlot: getNextAvailableSlot(item.id, bookings, blockedSlots),
    }))
    .filter(s => s.nextSlot !== null)
    .sort((a, b) => {
      // Sort by earliest available slot date+time
      const aT = new Date(`${a.nextSlot!.date}T${convertTo24(a.nextSlot!.time)}`).getTime();
      const bT = new Date(`${b.nextSlot!.date}T${convertTo24(b.nextSlot!.time)}`).getTime();
      return aT - bT;
    })
    .slice(0, 3);

  // ── Booking state ────────────────────────────────────────────────────────
  const [bookingSalon, setBookingSalon] = useState<Salon | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pay-at-salon');
  const [showCheckout, setShowCheckout] = useState(false);
  const [pendingData, setPendingData] = useState<{ booking: any; serviceNames: string[]; total: number } | null>(null);

  const total = selectedServices.reduce((sum, sid) => {
    const svc = bookingSalon?.services.find(sv => sv.id === sid);
    return sum + (svc?.price ?? 0);
  }, 0);

  const today = new Date().toISOString().split('T')[0];
  const now = new Date();

  function openBooking(salon: Salon, slot: { date: string; time: string }) {
    setBookingSalon(salon);
    setDate(slot.date);
    setTime(slot.time);
    setSelectedServices([]);
    setSelectedStaff('');
    setPaymentMethod('pay-at-salon');
    fetchBlockedSlots(salon.id);
  }

  async function handleConfirmBook() {
    if (!user || !bookingSalon) return;
    const blockStatus = isUserBlocked(user.id);
    if (blockStatus.blocked) {
      addToast('error', blockStatus.reason || 'You are blocked from booking.');
      return;
    }
    if (!date || !time) { addToast('error', 'Please select date and time'); return; }
    if (total === 0) { addToast('error', 'Please select at least one service'); return; }

    const serviceNames = selectedServices
      .map(sid => bookingSalon.services.find(sv => sv.id === sid)?.name ?? '')
      .filter(Boolean);
    const staff = bookingSalon.staff.find(st => st.id === selectedStaff);

    const bookingData = {
      salonId: bookingSalon.id,
      salonName: bookingSalon.name,
      serviceIds: selectedServices,
      serviceNames,
      staffId: staff?.id,
      staffName: staff?.name,
      date,
      time,
      totalPrice: total,
      paymentMethod,
      paymentStatus: (paymentMethod === 'card' || paymentMethod === 'upi')
        ? 'paid-online' as const
        : 'pending' as const,
    };

    if (paymentMethod === 'card' || paymentMethod === 'upi') {
      setPendingData({ booking: bookingData, serviceNames, total });
      setShowCheckout(true);
      return;
    }

    await finaliseBooking(bookingData, serviceNames, total);
  }

  async function finaliseBooking(bookingData: any, serviceNames: string[], bookTotal: number) {
    await createBooking(bookingData);
    addToast('success', tr('bookingSuccess'));
    onClose();
    navigate('/bookings');
  }

  // ── BOOKING FORM VIEW ─────────────────────────────────────────────────────
  if (bookingSalon) {
    const salonBlockedSlots = blockedSlots.filter(bs => bs.salonId === bookingSalon.id);

    return (
      <>
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="luxe-card w-full max-w-lg animate-fade-in flex flex-col max-h-[92dvh]">
            {/* Sticky header */}
            <div className="flex items-center gap-3 border-b border-[#c9a962]/10 px-5 py-4 shrink-0">
              <button
                onClick={() => setBookingSalon(null)}
                className="text-[#9a8fa8] hover:text-white text-sm flex items-center gap-1"
                style={{ touchAction: 'manipulation' }}
              >
                ← Back
              </button>
              <div className="flex-1 min-w-0">
                <h2 className="font-display text-base text-[#c9a962] truncate">{bookingSalon.name}</h2>
                <p className="text-[11px] text-red-400 font-semibold">🚨 Emergency Booking</p>
              </div>
              <button onClick={onClose} className="text-[#9a8fa8] hover:text-white p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 p-5 space-y-5">
              {/* Next slot banner */}
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 flex items-center gap-3">
                <Clock className="h-5 w-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-emerald-300">
                    Pre-selected: {date === today ? 'Today' : date} at {time}
                  </p>
                  <p className="text-xs text-[#9a8fa8]">Change date/time below if needed</p>
                </div>
              </div>

              {/* Services */}
              <div>
                <p className="text-sm font-semibold text-[#9a8fa8] mb-2">Select Services</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {bookingSalon.services.map(svc => (
                    <button
                      key={svc.id}
                      type="button"
                      onClick={() => setSelectedServices(prev =>
                        prev.includes(svc.id) ? prev.filter(s => s !== svc.id) : [...prev, svc.id]
                      )}
                      className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                        selectedServices.includes(svc.id)
                          ? 'border-[#c9a962] bg-[#c9a962]/10 text-[#c9a962]'
                          : 'border-[#c9a962]/20 text-[#9a8fa8] hover:border-[#c9a962]/40'
                      }`}
                      style={{ touchAction: 'manipulation', minHeight: 44 }}
                    >
                      <span className="truncate">{svc.name}</span>
                      <span className="shrink-0 ml-2 text-xs font-semibold">₹{svc.price.toLocaleString('en-IN')}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="text-sm text-[#9a8fa8]">Date</label>
                <input
                  type="date"
                  value={date}
                  min={today}
                  onChange={e => { setDate(e.target.value); setTime(''); }}
                  className="luxe-input mt-1"
                  style={{ fontSize: 16 }}
                />
              </div>

              {/* Time slots */}
              {date && (
                <div>
                  <label className="text-sm text-[#9a8fa8] mb-2 block">Time Slot</label>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {TIME_SLOTS.map(slot => {
                      const isBooked = bookings.some(
                        b => b.salonId === bookingSalon.id && b.date === date && b.time === slot && b.status === 'confirmed'
                      );
                      const isBlockedSlot = salonBlockedSlots.some(bs => bs.date === date && bs.time === slot);
                      const isPast = date === today && parseSlotTime(slot) <= now;
                      const isUnavailable = isBooked || isBlockedSlot || isPast;

                      return (
                        <button
                          key={slot}
                          type="button"
                          disabled={isUnavailable}
                          onClick={() => !isUnavailable && setTime(slot)}
                          className={`rounded-lg py-2 text-xs font-medium transition ${
                            isUnavailable
                              ? 'border border-red-500/20 text-red-400/60 cursor-not-allowed bg-red-500/5'
                              : time === slot
                              ? 'bg-[#c9a962] text-[#0f0d12]'
                              : 'border border-[#c9a962]/20 hover:border-[#c9a962]/50 text-[#e8d5a3]'
                          }`}
                          style={{ touchAction: 'manipulation', minHeight: 36 }}
                        >
                          {slot}
                          {(isBooked || isBlockedSlot) && (
                            <span className="block text-[9px] opacity-60 mt-0.5">Taken</span>
                          )}
                          {isPast && <span className="block text-[9px] opacity-60 mt-0.5">Past</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Staff */}
              <div>
                <label className="text-sm text-[#9a8fa8]">Stylist (optional)</label>
                <select
                  value={selectedStaff}
                  onChange={e => setSelectedStaff(e.target.value)}
                  className="luxe-input mt-1"
                  style={{ fontSize: 16 }}
                >
                  <option value="">Any available stylist</option>
                  {bookingSalon.staff.map(s => (
                    <option key={s.id} value={s.id}>{s.name} — {s.role}</option>
                  ))}
                </select>
              </div>

              {/* Payment method */}
              <div>
                <p className="mb-2 text-xs font-semibold text-[#9a8fa8] uppercase tracking-wider">Payment Method</p>
                <div className="grid grid-cols-3 gap-2">
                  {(['card', 'upi', 'pay-at-salon'] as PaymentMethod[]).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-xs font-semibold transition ${
                        paymentMethod === m
                          ? 'border-[#c9a962] bg-[#c9a962]/10 text-[#c9a962]'
                          : 'border-[#c9a962]/20 text-[#9a8fa8] hover:border-[#c9a962]/40'
                      }`}
                      style={{ touchAction: 'manipulation', minHeight: 44 }}
                    >
                      {m === 'pay-at-salon'
                        ? <><Banknote className="h-3.5 w-3.5" /> At Salon</>
                        : <><CreditCard className="h-3.5 w-3.5" /> {m === 'card' ? 'Card' : 'UPI'}</>
                      }
                    </button>
                  ))}
                </div>
              </div>

              {/* Bill summary */}
              {total > 0 && (
                <div className="rounded-xl border border-[#c9a962]/30 bg-[#0f0d12]/70 p-4">
                  <p className="text-xs font-bold text-[#c9a962] uppercase tracking-widest mb-3">Your Bill</p>
                  <div className="space-y-1.5 mb-3">
                    {selectedServices.map(sid => {
                      const svc = bookingSalon.services.find(sv => sv.id === sid);
                      return svc ? (
                        <div key={sid} className="flex justify-between text-sm">
                          <span className="text-[#e8d5a3]">✂️ {svc.name}</span>
                          <span className="text-[#c9a962] font-semibold">₹{svc.price.toLocaleString('en-IN')}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                  {(date || time || selectedStaff) && (
                    <div className="border-t border-[#c9a962]/10 pt-3 mb-3 space-y-1 text-xs text-[#9a8fa8]">
                      {date && <p>📅 Date: <span className="text-[#e8d5a3]">{date === today ? 'Today' : date}</span></p>}
                      {time && <p>⏰ Time: <span className="text-[#e8d5a3]">{time}</span></p>}
                      {selectedStaff && (
                        <p>💇 Stylist: <span className="text-[#e8d5a3]">{bookingSalon.staff.find(s => s.id === selectedStaff)?.name}</span></p>
                      )}
                    </div>
                  )}
                  <div className="border-t border-[#c9a962]/20 pt-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[#9a8fa8]">Total Amount</p>
                      <p className="font-display text-2xl font-bold text-[#c9a962]">₹{total.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="text-right text-xs text-[#9a8fa8]">
                      <p>Payment via</p>
                      <p className="font-semibold text-[#e8d5a3]">
                        {paymentMethod === 'card' ? '💳 Card' : paymentMethod === 'upi' ? '📱 UPI' : '💵 At Salon'}
                      </p>
                    </div>
                  </div>
                  {(paymentMethod === 'card' || paymentMethod === 'upi') && (
                    <div className="mt-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-[11px] text-emerald-400">
                      ✅ Appointment confirmed automatically after payment.
                    </div>
                  )}
                  {paymentMethod === 'pay-at-salon' && (
                    <div className="mt-3 rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-[11px] text-amber-400">
                      💵 Pay directly when you arrive.
                    </div>
                  )}
                </div>
              )}

              {/* Blocked warning */}
              {user && isUserBlocked(user.id).blocked && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400">
                  <AlertTriangle className="h-4 w-4 inline mr-1" />
                  {isUserBlocked(user.id).reason}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 pb-2">
                <button
                  onClick={() => setBookingSalon(null)}
                  className="luxe-btn-outline flex-1"
                  style={{ minHeight: 48, touchAction: 'manipulation' }}
                >
                  Back
                </button>
                {(paymentMethod === 'card' || paymentMethod === 'upi') ? (
                  <button
                    onClick={handleConfirmBook}
                    disabled={!date || !time || total === 0 || (user ? isUserBlocked(user.id).blocked : true)}
                    className="flex-1 luxe-btn flex items-center justify-center gap-2 disabled:opacity-50"
                    style={{ minHeight: 48, touchAction: 'manipulation' }}
                  >
                    <CreditCard className="h-4 w-4" />
                    Pay ₹{total.toLocaleString('en-IN')} &amp; Book
                  </button>
                ) : (
                  <button
                    onClick={handleConfirmBook}
                    disabled={!date || !time || total === 0 || (user ? isUserBlocked(user.id).blocked : true)}
                    className="flex-1 luxe-btn flex items-center justify-center gap-2 disabled:opacity-50"
                    style={{ minHeight: 48, touchAction: 'manipulation' }}
                  >
                    <Check className="h-4 w-4" /> Confirm Booking
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Checkout modal for card/UPI */}
        {showCheckout && pendingData && (
          <CheckoutModal
            amount={pendingData.total}
            salonName={bookingSalon.name}
            paymentMethod={paymentMethod as 'card' | 'upi'}
            onSuccess={() => finaliseBooking(pendingData.booking, pendingData.serviceNames, pendingData.total)}
            onClose={() => setShowCheckout(false)}
          />
        )}
      </>
    );
  }

  // ── DEFAULT VIEW: ranked salon list ─────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="luxe-card w-full max-w-lg animate-fade-in overflow-y-auto max-h-[92dvh]">
        <div className="p-6">
          {/* Header */}
          <div className="mb-5 flex items-start justify-between">
            <div>
              <h2 className="font-display text-2xl text-red-400">{tr('emergencyStyle')}</h2>
              <p className="mt-1 text-sm text-[#9a8fa8]">
                Nearest salons · ranked by soonest available slot
              </p>
            </div>
            <button onClick={onClose} className="text-[#9a8fa8] hover:text-white p-1">
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Salon cards */}
          {salonsWithSlots.length === 0 ? (
            <div className="py-10 text-center text-[#9a8fa8]">
              <Clock className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No available slots found nearby within 7 days.</p>
              <p className="text-xs mt-1">Try sharing your location for better results.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {salonsWithSlots.map(({ salon, distance, nextSlot }, idx) => (
                <div
                  key={salon.id}
                  className={`rounded-xl border p-4 transition ${
                    idx === 0
                      ? 'border-[#c9a962]/40 bg-[#c9a962]/5'
                      : 'border-[#c9a962]/15 bg-[#0f0d12]/40'
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="relative shrink-0">
                      <img
                        src={salon.image}
                        alt={salon.name}
                        loading="lazy"
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                      {idx === 0 && (
                        <span className="absolute -top-1.5 -left-1.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white leading-tight">
                          NEAREST
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-base text-[#e8d5a3] truncate">{salon.name}</h3>
                      <p className="text-xs text-[#9a8fa8] flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {salon.area} · {distance.toFixed(1)} km
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star className="h-3.5 w-3.5 fill-[#c9a962] text-[#c9a962]" />
                        <span className="text-xs text-[#e8d5a3]">{salon.rating}</span>
                      </div>
                      {nextSlot && (
                        <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2 py-1">
                          <Clock className="h-3 w-3 text-emerald-400 shrink-0" />
                          <p className="text-[11px] text-emerald-300 font-semibold">
                            {nextSlot.date === today ? 'Today' : nextSlot.date} · {nextSlot.time}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action row */}
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => nextSlot && openBooking(salon, nextSlot)}
                      className="flex-1 luxe-btn text-sm flex items-center justify-center gap-1.5"
                      style={{ touchAction: 'manipulation', minHeight: 42 }}
                    >
                      <Calendar className="h-4 w-4" /> Book Now
                    </button>
                    <a
                      href={getGoogleMapsNavigateUrl(salon.lat, salon.lng)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="luxe-btn-outline px-3 flex items-center justify-center"
                      title="Navigate"
                      style={{ touchAction: 'manipulation', minHeight: 42 }}
                    >
                      <Navigation className="h-4 w-4" />
                    </a>
                    <a
                      href={`tel:${salon.phone}`}
                      className="luxe-btn-outline px-3 flex items-center justify-center"
                      title="Call salon"
                      style={{ touchAction: 'manipulation', minHeight: 42 }}
                    >
                      <Phone className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={requestLocation}
            className="mt-4 w-full text-center text-xs text-[#c9a962] hover:underline py-2"
            style={{ touchAction: 'manipulation' }}
          >
            {tr('shareLocation')}
          </button>
        </div>
      </div>
    </div>
  );
}
