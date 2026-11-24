import { Link } from 'react-router-dom';
import { Sparkles, MapPin, ArrowRight, Shield, Clock } from 'lucide-react';
import { useT } from '../hooks/useT';
import { useApp } from '../context/AppContext';
import { getActiveSalons } from '../data/salons';
import { SalonCard } from '../components/SalonCard';

export function LandingPage() {
  const tr = useT();
  const { user } = useApp();
  const featured = getActiveSalons().filter((s) => s.featured).slice(0, 4);

  return (
    <div>
      <section className="relative overflow-hidden px-4 py-20 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-[#c9a962]/5 via-transparent to-[#d4a5a5]/5" />
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[#c9a962]/5 blur-3xl" />
        <div className="relative mx-auto max-w-5xl text-center">
          <p className="mb-4 text-sm uppercase tracking-[0.3em] text-[#c9a962]">{tr('tagline')}</p>
          <h1 className="font-display text-4xl font-bold leading-tight sm:text-6xl">
            <span className="gold-gradient">{tr('heroTitle')}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-[#9a8fa8]">{tr('heroSubtitle')}</p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link to={user ? '/dashboard' : '/register'} className="luxe-btn inline-flex items-center gap-2 text-base">
              {tr('getStarted')} <ArrowRight className="h-5 w-5" />
            </Link>
            <Link to="/salons" className="luxe-btn-outline inline-flex items-center gap-2 text-base">
              {tr('exploreSalons')}
            </Link>
          </div>
          <p className="mt-8 text-sm text-[#6b6175]">{tr('trustedBy')}</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-6 sm:grid-cols-3">
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
              <p className="mt-2 text-sm text-[#9a8fa8]">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="font-display text-3xl text-[#e8d5a3]">{tr('featured')} {tr('salons')}</h2>
          <Link to="/salons" className="text-sm text-[#c9a962] hover:underline">View all →</Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((salon) => (
            <SalonCard key={salon.id} salon={salon} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16 text-center">
        <div className="luxe-card p-8 sm:p-12">
          <Clock className="mx-auto h-10 w-10 text-[#c9a962]" />
          <h2 className="mt-4 font-display text-2xl text-[#e8d5a3]">Style Emergency?</h2>
          <p className="mt-2 text-[#9a8fa8]">{tr('panicDesc')}</p>
          <Link to={user ? '/dashboard' : '/register'} className="luxe-btn mt-6 inline-block">
            {tr('findNearest')}
          </Link>
        </div>
      </section>
    </div>
  );
}
