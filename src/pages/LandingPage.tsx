import { Link } from 'react-router-dom';
import { Sparkles, MapPin, ArrowRight, Shield } from 'lucide-react';
import { useT } from '../hooks/useT';
import { useApp } from '../context/AppContext';
import { SalonCard } from '../components/SalonCard';

export function LandingPage() {
  const tr = useT();
  const { user, activeSalons } = useApp();
  const featured = activeSalons.filter((s) => s.featured).slice(0, 4);

  return (
    <div className="overflow-x-hidden">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-16 sm:py-28">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#c9a962]/5 via-transparent to-[#d4a5a5]/5" />
        {/* Constrained decorative blobs — won't overflow */}
        <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 translate-x-1/3 -translate-y-1/3 rounded-full bg-[#c9a962]/5 blur-3xl" />
        <div className="pointer-events-none absolute left-0 bottom-0 h-56 w-56 -translate-x-1/3 translate-y-1/3 rounded-full bg-[#d4a5a5]/5 blur-3xl" />
        <div className="relative mx-auto max-w-4xl text-center">
          <p className="mb-4 text-xs sm:text-sm uppercase tracking-[0.3em] text-[#c9a962]">{tr('tagline')}</p>
          <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl lg:text-7xl">
            <span className="gold-gradient">{tr('heroTitle')}</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base sm:text-lg text-[#9a8fa8] leading-relaxed">{tr('heroSubtitle')}</p>
          {/* Full-width on mobile, inline on sm+ */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
            <Link
              to={user ? '/dashboard' : '/register'}
              className="luxe-btn w-full sm:w-auto inline-flex items-center justify-center gap-2 text-base px-8"
            >
              {tr('getStarted')} <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              to="/salons"
              className="luxe-btn-outline w-full sm:w-auto inline-flex items-center justify-center gap-2 text-base px-8"
            >
              {tr('exploreSalons')}
            </Link>
          </div>
          <div className="mt-5">
            <Link to="/partner-with-us" className="inline-block py-2 px-3 text-sm font-semibold text-[#c9a962] hover:underline" style={{ touchAction: 'manipulation' }}>
              Partner with Us — Register Your Salon
            </Link>
          </div>
          <p className="mt-4 text-xs text-[#6b6175]">{tr('trustedBy')}</p>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-3">
          {[
            { icon: Sparkles, title: tr('aiPowered'), desc: 'Camera-based face analysis for personalized hair colour & style recommendations' },
            { icon: MapPin, title: tr('smartNav'), desc: 'KNN-powered navigation finds the nearest luxury salons instantly' },
            { icon: Shield, title: 'Trusted Reviews', desc: 'Rate stylists & salons — real leaderboard helps you choose the best' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="luxe-card p-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#c9a962]/10">
                <Icon className="h-7 w-7 text-[#c9a962]" />
              </div>
              <h3 className="font-display text-xl text-[#e8d5a3]">{title}</h3>
              <p className="mt-2 text-sm text-[#9a8fa8] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Salons — horizontal scroll on mobile */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-display text-2xl sm:text-3xl text-[#e8d5a3]">{tr('featured')} {tr('salons')}</h2>
            <Link to="/salons" className="inline-block py-2 px-2 text-sm text-[#c9a962] hover:underline shrink-0" style={{ touchAction: 'manipulation' }}>
              View all →
            </Link>
          </div>
          {/* Horizontal scroll on mobile, grid on desktop */}
          <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible sm:pb-0">
            {featured.map((salon) => (
              <div key={salon.id} className="min-w-[280px] sm:min-w-0 w-full">
                <SalonCard salon={salon} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Emergency CTA */}
      <section className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
        <div className="luxe-card p-8 sm:p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
            <span className="text-3xl">🚨</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl text-[#e8d5a3]">Style Emergency?</h2>
          <p className="mt-3 text-[#9a8fa8] leading-relaxed max-w-md mx-auto">{tr('panicDesc')}</p>
          <Link to={user ? '/dashboard' : '/register'} className="luxe-btn mt-6 inline-flex items-center gap-2">
            {tr('findNearest')} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
