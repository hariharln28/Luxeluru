import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-3xl gold-gradient">{tr('salons')}</h1>
      <p className="mt-2 text-[#9a8fa8]">{activeSalons.length} luxury salons across Bengaluru</p>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9a8fa8]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tr('search')}
            className="luxe-input pl-10"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as SalonCategory | 'all')}
          className="luxe-input w-full sm:w-48"
        >
          <option value="all">{tr('all')}</option>
          {ALL_CATEGORIES.map((c) => (
            <option key={c} value={c}>{tr(c)}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-[#9a8fa8]">
          <input type="checkbox" checked={featuredOnly} onChange={(e) => setFeaturedOnly(e.target.checked)}
            className="rounded border-[#c9a962]/30" />
          {tr('featured')}
        </label>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-12 text-center text-[#9a8fa8]">{tr('noSalonsFound')}</p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((salon) => (
            <SalonCard key={salon.id} salon={salon} />
          ))}
        </div>
      )}
    </div>
  );
}
