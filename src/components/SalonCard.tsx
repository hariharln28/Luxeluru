import { Star, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Salon } from '../types';
import { useT } from '../hooks/useT';

interface SalonCardProps {
  salon: Salon;
  distance?: number;
}

export function SalonCard({ salon, distance }: SalonCardProps) {
  const tr = useT();

  return (
    <Link
      to={`/salons/${salon.id}`}
      className="luxe-card group overflow-hidden transition hover:border-[#c9a962]/40 hover:shadow-lg hover:shadow-[#c9a962]/5 active:scale-[0.98]"
      style={{ touchAction: 'manipulation', display: 'block' }}
    >
      <div className="relative h-44 overflow-hidden">
        <img
          src={salon.image}
          alt={salon.name}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        {salon.featured && (
          <span className="absolute left-3 top-3 rounded-full bg-[#c9a962] px-2.5 py-0.5 text-xs font-semibold text-[#0f0d12]">
            {tr('featured')}
          </span>
        )}
        {distance !== undefined && (
          <span className="absolute right-3 top-3 rounded-full bg-black/60 px-2.5 py-0.5 text-xs backdrop-blur">
            {distance.toFixed(1)} {tr('km')}
          </span>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-lg leading-tight text-[#e8d5a3] group-hover:text-[#c9a962]">{salon.name}</h3>
          <span className="shrink-0 rounded bg-[#c9a962]/10 px-1.5 py-0.5 text-[10px] font-mono text-[#c9a962]">
            {salon.id}
          </span>
        </div>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-[#9a8fa8]">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{salon.area}</span>
        </p>
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-[#c9a962] text-[#c9a962]" />
            <span className="text-sm font-medium">{salon.rating}</span>
            <span className="text-xs text-[#9a8fa8]">({salon.reviewCount})</span>
          </div>
          <span className="text-xs font-medium text-[#c9a962]">{tr('viewDetails')} →</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {salon.categories.slice(0, 3).map((cat) => (
            <span key={cat} className="rounded-full bg-[#c9a962]/10 px-2 py-0.5 text-[10px] text-[#c9a962]">
              {tr(cat)}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
