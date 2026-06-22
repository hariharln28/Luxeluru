import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Star, X, RefreshCw } from 'lucide-react';
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
  const [newDate, setNewDate] = useState(booking.date);
  const [newTime, setNewTime] = useState(booking.time);

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
            {tr('paymentMethod')}: {booking.paymentMethod === 'cash' ? tr('cash') : tr('upi')} · {tr('payAtSalon')}
          </p>
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
            <button onClick={onCancel} className="flex items-center gap-1 text-sm text-red-400 hover:underline">
              <X className="h-4 w-4" /> {tr('cancel')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
