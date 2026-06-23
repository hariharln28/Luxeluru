import { Link } from 'react-router-dom';
import { useT } from '../hooks/useT';
import { useApp } from '../context/AppContext';
import { categoryMeta } from '../data/salons';
import type { SalonCategory } from '../types';

const CATEGORIES: SalonCategory[] = ['hair', 'skin', 'nails', 'spa', 'bridal', 'grooming', 'wellness'];

export function CategoriesPage() {
  const tr = useT();
  const { activeSalons } = useApp();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-3xl gold-gradient">{tr('categories')}</h1>
      <p className="mt-2 text-[#9a8fa8]">{tr('categoryDesc')}</p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((cat) => {
          const meta = categoryMeta[cat];
          const count = activeSalons.filter((s) => s.categories.includes(cat)).length;
          return (
            <Link
              key={cat}
              to={`/salons?category=${cat}`}
              className={`luxe-card group overflow-hidden bg-gradient-to-br ${meta.color} p-6 transition hover:border-[#c9a962]/40 active:scale-95 select-none`}
            >
              <span className="text-4xl">{meta.icon}</span>
              <h2 className="mt-4 font-display text-2xl text-[#e8d5a3] group-hover:text-[#c9a962]">
                {tr(cat)}
              </h2>
              <p className="mt-2 text-sm text-[#9a8fa8]">{count} salons available</p>
              <span className="mt-4 inline-block text-sm text-[#c9a962]">Explore →</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
