import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useT } from '../hooks/useT';
import { SalonCard } from '../components/SalonCard';
import type { SalonCategory } from '../types';

const ALL_CATEGORIES: SalonCategory[] = ['hair', 'skin', 'nails', 'spa', 'bridal', 'grooming', 'wellness'];

export function SalonsPage() {
  const { activeSalons } = useApp();
  const tr = useT();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<SalonCategory | 'all'>('all');
  const [featuredOnly, setFeaturedOnly] = useState(false);

  const filtered = useMemo(() => {
    return activeSalons.filter((s) => {
      if (featuredOnly && !s.featured) return false;
      if (category !== 'all' && !s.categories.includes(category)) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          s.area.toLowerCase().includes(q) ||
          s.services.some((sv) => sv.name.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [activeSalons, search, category, featuredOnly]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8 sm:px-6">
      <h1 className="font-display text-3xl gold-gradient">{tr('salons')}</h1>
      <p className="mt-1 text-sm text-[#9a8fa8]">{activeSalons.length} luxury salons across Bengaluru</p>

      <div className="mt-5 space-y-3">
        {/* Search — full-width with clear button */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9a8fa8]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tr('search')}
            inputMode="search"
            className="luxe-input pl-10 pr-10"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-[#9a8fa8] hover:text-white"
              style={{ touchAction: 'manipulation', minWidth: 32, minHeight: 32 }}
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Category chips — horizontal scroll on mobile */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setCategory('all')}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
              category === 'all'
                ? 'bg-[#c9a962] text-[#0f0d12]'
                : 'border border-[#c9a962]/30 text-[#9a8fa8] hover:border-[#c9a962]/60'
            }`}
            style={{ touchAction: 'manipulation', minHeight: 38 }}
          >
            {tr('all')}
          </button>
          {ALL_CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c === category ? 'all' : c)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium capitalize transition ${
                category === c
                  ? 'bg-[#c9a962] text-[#0f0d12]'
                  : 'border border-[#c9a962]/30 text-[#9a8fa8] hover:border-[#c9a962]/60'
              }`}
              style={{ touchAction: 'manipulation', minHeight: 38 }}
            >
              {tr(c)}
            </button>
          ))}
        </div>

        {/* Featured toggle — custom toggle switch */}
        <label className="inline-flex items-center gap-3 cursor-pointer select-none" style={{ touchAction: 'manipulation' }}>
          <div
            onClick={() => setFeaturedOnly(!featuredOnly)}
            role="switch"
            aria-checked={featuredOnly}
            className={`relative h-6 w-11 rounded-full transition-colors cursor-pointer ${
              featuredOnly ? 'bg-[#c9a962]' : 'bg-[#3d3347]'
            }`}
          >
            <div className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${
              featuredOnly ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </div>
          <span className="text-sm text-[#9a8fa8]">{tr('featured')} only</span>
        </label>
      </div>

      {/* Results count */}
      <p className="mt-4 text-xs text-[#6b6175]">
        {filtered.length} salon{filtered.length !== 1 ? 's' : ''} found
        {(search || category !== 'all' || featuredOnly) && (
          <button
            onClick={() => { setSearch(''); setCategory('all'); setFeaturedOnly(false); }}
            className="ml-3 text-[#c9a962] hover:underline"
            style={{ touchAction: 'manipulation' }}
          >
            Clear filters
          </button>
        )}
      </p>

      {filtered.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-[#9a8fa8] font-medium">{tr('noSalonsFound')}</p>
          <p className="mt-1 text-sm text-[#6b6175]">Try a different search or category</p>
          <button
            onClick={() => { setSearch(''); setCategory('all'); setFeaturedOnly(false); }}
            className="luxe-btn-outline mt-4 inline-flex"
            style={{ touchAction: 'manipulation' }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((salon) => (
            <SalonCard key={salon.id} salon={salon} />
          ))}
        </div>
      )}
    </div>
  );
}
