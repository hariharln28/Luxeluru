import { useEffect, useRef, useState, useCallback } from 'react';
import { Search, MapPin, Loader2, CheckCircle } from 'lucide-react';

interface LocationResult {
  address: string;
  lat: number;
  lng: number;
}

interface Props {
  initialLat?: number;
  initialLng?: number;
  initialAddress?: string;
  onLocationSelect: (result: LocationResult) => void;
}

// Nominatim reverse-geocode: lat/lng → address
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  } catch {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
}

// Nominatim forward geocode: address string → results
async function searchAddress(query: string): Promise<Array<{ display_name: string; lat: string; lon: string }>> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    return await res.json();
  } catch {
    return [];
  }
}

export function SalonLocationPicker({ initialLat, initialLng, initialAddress, onLocationSelect }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const DEFAULT_LAT = initialLat && initialLat !== 0 ? initialLat : 12.9716;
  const DEFAULT_LNG = initialLng && initialLng !== 0 ? initialLng : 77.5946;

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ display_name: string; lat: string; lon: string }>>([]);
  const [searching, setSearching] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationResult | null>(
    initialLat && initialLng && initialLat !== 0
      ? { lat: initialLat, lng: initialLng, address: initialAddress || '' }
      : null
  );
  const [reverseGeocoding, setReverseGeocoding] = useState(false);

  const updateMarker = useCallback((lat: number, lng: number) => {
    if (!leafletMapRef.current) return;
    const L = (window as any).L;
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = L.marker([lat, lng], {
        draggable: true,
        icon: L.divIcon({
          className: '',
          html: `<div style="
            width:32px;height:32px;
            background:linear-gradient(135deg,#c9a962,#a8893f);
            border-radius:50% 50% 50% 0;
            transform:rotate(-45deg);
            border:3px solid #fff;
            box-shadow:0 4px 12px rgba(201,169,98,0.5)
          "></div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        }),
      }).addTo(leafletMapRef.current);

      markerRef.current.on('dragend', async (e: any) => {
        const pos = e.target.getLatLng();
        setReverseGeocoding(true);
        const address = await reverseGeocode(pos.lat, pos.lng);
        const result = { lat: pos.lat, lng: pos.lng, address };
        setSelectedLocation(result);
        setReverseGeocoding(false);
      });
    }
    leafletMapRef.current.setView([lat, lng], 16);
  }, []);

  // Initialise Leaflet once
  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    // Load Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Load Leaflet JS
    const loadLeaflet = () => {
      const L = (window as any).L;
      if (!L) return;

      const map = L.map(mapRef.current!, { zoomControl: true, attributionControl: true });
      leafletMapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Click to place marker
      map.on('click', async (e: any) => {
        const { lat, lng } = e.latlng;
        updateMarker(lat, lng);
        setReverseGeocoding(true);
        const address = await reverseGeocode(lat, lng);
        const result = { lat, lng, address };
        setSelectedLocation(result);
        setReverseGeocoding(false);
      });

      // Place initial marker if coords exist
      if (DEFAULT_LAT && DEFAULT_LNG) {
        map.setView([DEFAULT_LAT, DEFAULT_LNG], 15);
        if (initialLat && initialLat !== 0) {
          updateMarker(DEFAULT_LAT, DEFAULT_LNG);
        }
      }
    };

    if ((window as any).L) {
      loadLeaflet();
    } else {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = loadLeaflet;
      document.head.appendChild(script);
    }

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        markerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Search handler
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchResults([]);
    const results = await searchAddress(searchQuery + ' Bengaluru');
    setSearchResults(results);
    setSearching(false);
  };

  const handleResultClick = (result: { display_name: string; lat: string; lon: string }) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    updateMarker(lat, lng);
    const loc = { lat, lng, address: result.display_name };
    setSelectedLocation(loc);
    setSearchResults([]);
    setSearchQuery(result.display_name.split(',')[0]);
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation);
    }
  };

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="relative">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search address or area (e.g. Indiranagar, Bengaluru)…"
            className="luxe-input text-sm flex-1"
            style={{ fontSize: '16px' }}
          />
          <button
            onClick={handleSearch}
            disabled={searching}
            className="luxe-btn px-4 py-2 text-sm shrink-0"
            style={{ touchAction: 'manipulation' }}
          >
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </button>
        </div>

        {/* Search results dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-[500] mt-1 rounded-xl border border-[#c9a962]/20 bg-[#1a1520] shadow-2xl overflow-hidden">
            {searchResults.map((r, i) => (
              <button
                key={i}
                onClick={() => handleResultClick(r)}
                className="w-full text-left px-4 py-3 text-sm text-[#e8d5a3] hover:bg-[#c9a962]/10 border-b border-[#3d3347]/30 last:border-0 transition-colors"
                style={{ touchAction: 'manipulation' }}
              >
                <MapPin className="inline h-3 w-3 text-[#c9a962] mr-1.5 shrink-0" />
                {r.display_name}
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-[#9a8fa8]">
        📍 Tap on the map to drop a pin, or drag the pin to your exact location.
      </p>

      {/* Map container */}
      <div
        ref={mapRef}
        className="w-full rounded-xl overflow-hidden border border-[#c9a962]/20"
        style={{ height: '320px', zIndex: 0 }}
      />

      {/* Selected location display */}
      {selectedLocation && (
        <div className="rounded-xl border border-[#c9a962]/30 bg-[#0f0d12]/60 p-3 space-y-1">
          {reverseGeocoding ? (
            <div className="flex items-center gap-2 text-sm text-[#9a8fa8]">
              <Loader2 className="h-4 w-4 animate-spin text-[#c9a962]" />
              Getting address…
            </div>
          ) : (
            <>
              <p className="text-xs text-[#9a8fa8] font-semibold">Selected Location</p>
              <p className="text-sm text-[#e8d5a3] leading-snug">{selectedLocation.address}</p>
              <p className="text-xs text-[#6b6175] font-mono">
                {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
              </p>
            </>
          )}
        </div>
      )}

      {/* Confirm button */}
      <button
        onClick={handleConfirm}
        disabled={!selectedLocation || reverseGeocoding}
        className="luxe-btn w-full py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ touchAction: 'manipulation' }}
      >
        <CheckCircle className="h-4 w-4" />
        Set This Location
      </button>
    </div>
  );
}
