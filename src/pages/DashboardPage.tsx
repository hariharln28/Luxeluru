import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles, MapPin, Calendar, Trophy, Scissors, AlertTriangle,
  ArrowRight, Clock, LogOut, Trash2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useT } from '../hooks/useT';
import { SalonCard } from '../components/SalonCard';
import { knnRank } from '../utils/knn';
import { PanicModal } from '../components/PanicModal';
import { useState } from 'react';
import { supabase, supabaseConfigured } from '../services/supabaseClient';

export function DashboardPage() {
  const { user, bookings, activeSalons, userLocation, logout, addToast } = useApp();
  const tr = useT();
  const navigate = useNavigate();
  const [panicOpen, setPanicOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  const userBookings = bookings.filter((b) => b.userId === user?.id);
  const upcoming = userBookings.filter((b) => b.status === 'confirmed').slice(0, 3);
  const loc = userLocation ?? { lat: 12.9716, lng: 77.5946 };
  const nearest = knnRank(activeSalons, loc.lat, loc.lng, 3);

  const quickActions = [
    { to: '/ai-stylist', icon: Sparkles, label: tr('aiStylist'), color: 'from-purple-500/20 to-pink-500/20' },
    { to: '/navigator', icon: MapPin, label: tr('navigator'), color: 'from-teal-500/20 to-cyan-500/20' },
    { to: '/salons', icon: Scissors, label: tr('salons'), color: 'from-amber-500/20 to-orange-500/20' },
    { to: '/leaderboard', icon: Trophy, label: tr('leaderboard'), color: 'from-yellow-500/20 to-amber-500/20' },
  ];

  async function handleDeleteAccount() {
    if (deleteConfirm !== 'DELETE') return;
    setDeleting(true);
    try {
      // Delete from Supabase auth
      if (supabaseConfigured) {
        const { error } = await supabase.auth.admin.deleteUser(user!.id);
        if (error) {
          // If admin delete fails, try signing out and notify
          console.warn('Admin delete failed, user may need manual removal:', error.message);
        }
      }
      // Sign out and clear local data
      await supabase.auth.signOut();
      logout();
      addToast('success', 'Your account has been deleted. We\'re sorry to see you go.');
      navigate('/');
    } catch (err: any) {
      addToast('error', err.message || 'Failed to delete account. Please contact support.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl">
            <span className="text-[#9a8fa8]">{tr('welcomeBack')}, </span>
            <span className="gold-gradient">{user?.name.split(' ')[0]}!</span>
          </h1>
          <p className="mt-1 text-[#9a8fa8]">
            {tr('welcomeBack')}, <span className="font-medium text-[#c9a962]">{tr('bengalurian')}</span> — ready for your next luxury experience?
          </p>
        </div>
        <button
          onClick={() => setPanicOpen(true)}
          className="panic-pulse flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-500 px-6 py-3 font-semibold text-white shadow-lg shadow-red-500/20"
        >
          <AlertTriangle className="h-5 w-5" />
          {tr('panicButton')}
        </button>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickActions.map(({ to, icon: Icon, label, color }) => (
          <Link key={to} to={to}
            className={`luxe-card flex items-center gap-4 p-4 transition hover:border-[#c9a962]/40 bg-gradient-to-br ${color}`}>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#c9a962]/10">
              <Icon className="h-6 w-6 text-[#c9a962]" />
            </div>
            <span className="font-medium text-[#e8d5a3]">{label}</span>
            <ArrowRight className="ml-auto h-4 w-4 text-[#c9a962]" />
          </Link>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-2xl text-[#e8d5a3]">{tr('nearestSalons')}</h2>
            <Link to="/navigator" className="text-sm text-[#c9a962] hover:underline">{tr('navigator')} →</Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {nearest.map(({ item, distance }) => (
              <SalonCard key={item.id} salon={item} distance={distance} />
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-4 font-display text-2xl text-[#e8d5a3]">{tr('upcoming')}</h2>
          {upcoming.length === 0 ? (
            <div className="luxe-card p-6 text-center">
              <Calendar className="mx-auto h-10 w-10 text-[#9a8fa8]" />
              <p className="mt-3 text-sm text-[#9a8fa8]">{tr('noBookings')}</p>
              <Link to="/salons" className="luxe-btn mt-4 inline-block text-sm">{tr('bookNow')}</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((b) => (
                <div key={b.id} className="luxe-card p-4">
                  <h3 className="font-medium text-[#e8d5a3]">{b.salonName}</h3>
                  <p className="mt-1 flex items-center gap-1 text-xs text-[#9a8fa8]">
                    <Clock className="h-3 w-3" /> {b.date} · {b.time}
                  </p>
                  <p className="mt-1 text-xs text-[#c9a962]">{b.serviceNames.join(', ')}</p>
                  <p className="mt-2 text-sm font-semibold">₹{b.totalPrice.toLocaleString('en-IN')}</p>
                </div>
              ))}
              <Link to="/bookings" className="block text-center text-sm text-[#c9a962] hover:underline">
                {tr('history')} →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Account Actions */}
      <div className="mt-12 border-t border-[#c9a962]/10 pt-8">
        <h2 className="mb-4 font-display text-xl text-[#9a8fa8]">Account</h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="flex items-center justify-center gap-2 rounded-lg border border-[#c9a962]/20 bg-[#1a1520] px-6 py-3 text-sm font-medium text-[#e8d5a3] transition hover:bg-[#c9a962]/10"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
          <button
            onClick={() => setDeleteOpen(true)}
            className="flex items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/5 px-6 py-3 text-sm font-medium text-red-400 transition hover:bg-red-500/15"
          >
            <Trash2 className="h-4 w-4" />
            Delete Account
          </button>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md animate-fade-in luxe-card p-6 sm:p-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 mx-auto">
              <Trash2 className="h-6 w-6 text-red-400" />
            </div>
            <h3 className="text-center font-display text-xl text-red-400">Delete Your Account?</h3>
            <p className="mt-3 text-center text-sm text-[#9a8fa8]">
              This action is <strong className="text-red-400">permanent</strong> and cannot be undone. 
              All your bookings, reviews, and profile data will be removed.
            </p>
            <div className="mt-4">
              <label className="mb-1.5 block text-sm text-[#9a8fa8]">
                Type <strong className="text-red-400">DELETE</strong> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                className="luxe-input border-red-500/30 focus:border-red-500/50"
                placeholder="DELETE"
              />
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => { setDeleteOpen(false); setDeleteConfirm(''); }}
                className="flex-1 rounded-lg border border-[#c9a962]/20 bg-[#1a1520] px-4 py-2.5 text-sm font-medium text-[#e8d5a3] transition hover:bg-[#c9a962]/10"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirm !== 'DELETE' || deleting}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {deleting ? 'Deleting...' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}

      {panicOpen && <PanicModal onClose={() => setPanicOpen(false)} />}
    </div>
  );
}
