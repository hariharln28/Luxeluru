import { MapPin, Phone, Navigation, X, Star } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useT } from '../hooks/useT';
import { knnRank, getGoogleMapsNavigateUrl } from '../utils/knn';

interface PanicModalProps {
  onClose: () => void;
}

export function PanicModal({ onClose }: PanicModalProps) {
  const { activeSalons, userLocation, requestLocation } = useApp();
  const tr = useT();

  const loc = userLocation ?? { lat: 12.9716, lng: 77.5946 };
  const nearest = knnRank(activeSalons, loc.lat, loc.lng, 3);
  const top = nearest[0];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="luxe-card w-full max-w-lg animate-fade-in p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="font-display text-2xl text-red-400">{tr('emergencyStyle')}</h2>
            <p className="mt-1 text-sm text-[#9a8fa8]">{tr('panicDesc')}</p>
          </div>
          <button onClick={onClose} className="text-[#9a8fa8] hover:text-white">
            <X className="h-6 w-6" />
          </button>
        </div>

        {top && (
          <div className="mb-4 rounded-xl border border-[#c9a962]/30 bg-[#c9a962]/5 p-4">
            <div className="flex gap-4">
              <img src={top.item.image} alt={top.item.name} className="h-20 w-20 rounded-lg object-cover" />
              <div>
                <h3 className="font-display text-xl text-[#c9a962]">{top.item.name}</h3>
                <p className="text-sm text-[#9a8fa8]">{top.item.area} · {top.distance.toFixed(1)} {tr('km')}</p>
                <div className="mt-1 flex items-center gap-1">
                  <Star className="h-4 w-4 fill-[#c9a962] text-[#c9a962]" />
                  <span className="text-sm">{top.item.rating}</span>
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <a href={getGoogleMapsNavigateUrl(top.item.lat, top.item.lng)} target="_blank" rel="noopener"
                className="luxe-btn flex items-center gap-2 text-sm">
                <Navigation className="h-4 w-4" /> {tr('navigate')}
              </a>
              <a href={`tel:${top.item.phone}`} className="luxe-btn-outline flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4" /> {tr('callSalon')}
              </a>
            </div>
          </div>
        )}

        <p className="mb-2 text-sm font-medium text-[#e8d5a3]">{tr('nearestSalons')}</p>
        <div className="space-y-2">
          {nearest.map(({ item, distance }) => (
            <div key={item.id} className="flex items-center justify-between rounded-lg bg-[#0f0d12]/60 px-3 py-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#c9a962]" />
                <span className="text-sm">{item.name}</span>
              </div>
              <span className="text-xs text-[#9a8fa8]">{distance.toFixed(1)} {tr('km')}</span>
            </div>
          ))}
        </div>

        <button onClick={requestLocation} className="mt-4 w-full text-center text-xs text-[#c9a962] hover:underline">
          {tr('shareLocation')}
        </button>
      </div>
    </div>
  );
}
