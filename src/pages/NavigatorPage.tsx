import { Navigation, MapPin, Phone, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useT } from '../hooks/useT';
import { knnRank, getGoogleMapsNavigateUrl, BENGALURU_CENTER } from '../utils/knn';
import { Star } from 'lucide-react';

export function NavigatorPage() {
  const { activeSalons, userLocation, requestLocation } = useApp();
  const tr = useT();

  const loc = userLocation ?? BENGALURU_CENTER;
  const ranked = knnRank(activeSalons, loc.lat, loc.lng, 15);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl gold-gradient">{tr('navigator')}</h1>
          <p className="mt-2 text-[#9a8fa8]">KNN-powered smart navigation — salons ranked by proximity</p>
        </div>
        <button onClick={requestLocation} className="luxe-btn-outline text-sm">
          {tr('shareLocation')}
        </button>
      </div>

      <div className="mt-6 luxe-card overflow-hidden">
        <div className="relative h-64 bg-[#1a1520] sm:h-80">
          <iframe
            title="Bengaluru Map"
            className="h-full w-full border-0 opacity-80"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${loc.lng - 0.15}%2C${loc.lat - 0.1}%2C${loc.lng + 0.15}%2C${loc.lat + 0.1}&layer=mapnik&marker=${loc.lat}%2C${loc.lng}`}
          />
          <div className="absolute bottom-3 left-3 rounded-lg bg-black/70 px-3 py-1.5 text-xs backdrop-blur">
            📍 Your location · KNN ranking active
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-3">
        {ranked.map(({ item, distance }, idx) => (
          <div key={item.id} className="luxe-card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#c9a962]/20 font-display text-lg text-[#c9a962]">
              {idx + 1}
            </div>
            <img src={item.image} alt={item.name} className="h-16 w-16 shrink-0 rounded-lg object-cover" />
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-lg text-[#e8d5a3]">{item.name}</h3>
              <p className="flex items-center gap-1 text-xs text-[#9a8fa8]">
                <MapPin className="h-3 w-3" /> {item.area} · {item.address}
              </p>
              <div className="mt-1 flex items-center gap-3">
                <span className="flex items-center gap-1 text-sm">
                  <Star className="h-3.5 w-3.5 fill-[#c9a962] text-[#c9a962]" /> {item.rating}
                </span>
                <span className="text-sm font-medium text-[#c9a962]">
                  {distance.toFixed(1)} {tr('km')}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href={getGoogleMapsNavigateUrl(item.lat, item.lng)}
                target="_blank"
                rel="noopener noreferrer"
                className="luxe-btn flex items-center gap-1.5 text-sm py-2 px-3"
              >
                <Navigation className="h-4 w-4" /> {tr('navigate')}
              </a>
              <a href={`tel:${item.phone}`} className="luxe-btn-outline flex items-center gap-1.5 text-sm py-2 px-3">
                <Phone className="h-4 w-4" /> {tr('callSalon')}
              </a>
              <Link to={`/salons/${item.id}`} className="luxe-btn-outline flex items-center gap-1.5 text-sm py-2 px-3">
                <ExternalLink className="h-4 w-4" /> {tr('bookNow')}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
