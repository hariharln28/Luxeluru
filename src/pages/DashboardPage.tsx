import { Link } from 'react-router-dom';
import {
  Sparkles, MapPin, Calendar, Trophy, Scissors, AlertTriangle,
  ArrowRight, Clock,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useT } from '../hooks/useT';
import { SalonCard } from '../components/SalonCard';
import { knnRank } from '../utils/knn';
import { PanicModal } from '../components/PanicModal';
import { useState } from 'react';

export function DashboardPage() {
  const { user, bookings, activeSalons, userLocation } = useApp();
  const tr = useT();
  const [panicOpen, setPanicOpen] = useState(false);

  const userBookings = bookings.filter((b) => b.userId === user?.id);
  const upcoming = userBookings.filter((b) => b.status === 'confirmed').slice(0, 3);
  const loc = userLocation ?? { lat: 12.9716, lng: 77.5946 };
  const nearest = knnRank(activeSalons, loc.lat, loc.lng, 3);

  const quickActions = [
    { to: '/ai-stylist', icon: Sparkles, label: tr('aiStylist'), color: 'from-purple-500/20 to-pink-500/20', border: 'hover:border-purple-500/40' },
    { to: '/navigator', icon: MapPin, label: tr('navigator'), color: 'from-teal-500/20 to-cyan-500/20', border: 'hover:border-teal-500/40' },
    { to: '/salons', icon: Scissors, label: tr('salons'), color: 'from-amber-500/20 to-orange-500/20', border: 'hover:border-amber-500/40' },
    { to: '/leaderboard', icon: Trophy, label: tr('leaderboard'), color: 'from-yellow-500/20 to-amber-500/20', border: 'hover:border-yellow-500/40' },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl">
            <span className="text-[#9a8fa8]">{tr('welcomeBack')}, </span>
            <span className="gold-gradient">{user?.name.split(' ')[0]}!</span>
          </h1>
          <p className="mt-1 text-sm text-[#9a8fa8]">
            Ready for your next luxury experience,{' '}
            <span className="font-medium text-[#c9a962]">{tr('bengalurian')}</span>?
          </p>
        </div>
        {/* Full-width panic button on mobile */}
        <button
          onClick={() => setPanicOpen(true)}
          className="panic-pulse w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-500 px-6 py-3 font-semibold text-white shadow-lg shadow-red-500/20"
          style={{ touchAction: 'manipulation', minHeight: 52 }}
        >
          <AlertTriangle className="h-5 w-5" />
          {tr('panicButton')}
        </button>
      </div>

      {/* Quick Actions — 2 cols on mobile, 4 on desktop */}
      <div className="mb-6 sm:mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {quickActions.map(({ to, icon: Icon, label, color, border }) => (
          <Link
            key={to}
            to={to}
            className={`luxe-card flex flex-col sm:flex-row items-center gap-2 sm:gap-4 p-4 transition ${border} bg-gradient-to-br ${color} active:scale-95`}
            style={{ touchAction: 'manipulation', minHeight: 72 }}
          >
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-[#c9a962]/10">
              <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-[#c9a962]" />
            </div>
            <span className="text-xs sm:text-sm font-medium text-[#e8d5a3] text-center sm:text-left leading-tight">{label}</span>
            <ArrowRight className="hidden sm:block ml-auto h-4 w-4 text-[#c9a962]" />
          </Link>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 sm:gap-8 lg:grid-cols-3">
        {/* Nearest Salons — 2/3 width on lg */}
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl sm:text-2xl text-[#e8d5a3]">{tr('nearestSalons')}</h2>
            <Link to="/navigator" className="inline-block py-1 px-2 text-sm text-[#c9a962] hover:underline shrink-0" style={{ touchAction: 'manipulation' }}>
              {tr('navigator')} →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {nearest.map(({ item, distance }) => (
              <SalonCard key={item.id} salon={item} distance={distance} />
            ))}
          </div>
        </div>

        {/* Upcoming Bookings */}
        <div>
          <h2 className="mb-4 font-display text-xl sm:text-2xl text-[#e8d5a3]">{tr('upcoming')}</h2>
          {upcoming.length === 0 ? (
            <div className="luxe-card p-6 text-center">
              <Calendar className="mx-auto h-10 w-10 text-[#9a8fa8]" />
              <p className="mt-3 text-sm text-[#9a8fa8]">{tr('noBookings')}</p>
              <Link to="/salons" className="luxe-btn mt-4 inline-flex text-sm">{tr('bookNow')}</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((b) => (
                <div key={b.id} className="luxe-card p-4">
                  <h3 className="font-medium text-[#e8d5a3] truncate">{b.salonName}</h3>
                  <p className="mt-1 flex items-center gap-1 text-xs text-[#9a8fa8]">
                    <Clock className="h-3 w-3 shrink-0" /> {b.date} · {b.time}
                  </p>
                  <p className="mt-1 text-xs text-[#c9a962] truncate">{b.serviceNames.join(', ')}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-sm font-semibold">₹{b.totalPrice.toLocaleString('en-IN')}</p>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400 font-medium">Confirmed</span>
                  </div>
                </div>
              ))}
              <Link to="/bookings" className="block text-center py-2 text-sm text-[#c9a962] hover:underline" style={{ touchAction: 'manipulation' }}>
                {tr('history')} →
              </Link>
            </div>
          )}
        </div>
      </div>

      {panicOpen && <PanicModal onClose={() => setPanicOpen(false)} />}
    </div>
  );
}
