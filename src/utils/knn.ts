const EARTH_RADIUS_KM = 6371;

export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface RankedSalon<T> {
  item: T;
  distance: number;
}

export function knnRank<T extends { lat: number; lng: number }>(
  items: T[],
  userLat: number,
  userLng: number,
  k = 5
): RankedSalon<T>[] {
  return items
    .map((item) => ({
      item,
      distance: haversineDistance(userLat, userLng, item.lat, item.lng),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, k);
}

export const BENGALURU_CENTER = { lat: 12.9716, lng: 77.5946 };

export function getGoogleMapsUrl(lat: number, lng: number, label?: string): string {
  const q = label ? encodeURIComponent(label) : `${lat},${lng}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${q}`;
}

export function getGoogleMapsNavigateUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}
