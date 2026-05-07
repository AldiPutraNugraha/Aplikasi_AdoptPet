import type { Coordinates } from '@/types/domain';

const EARTH_RADIUS_KM = 6371;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function calculateDistanceKm(from: Coordinates, to: Coordinates) {
  if (from.latitude === to.latitude && from.longitude === to.longitude) {
    return 0;
  }

  const dLat = toRadians(to.latitude - from.latitude);
  const dLon = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Number((EARTH_RADIUS_KM * c).toFixed(2));
}

export function sortByDistance<T extends { coordinates?: Coordinates }>(
  origin: Coordinates,
  items: T[],
) {
  return items
    .map((item) => ({
      ...item,
      ...(item.coordinates ? { distanceKm: calculateDistanceKm(origin, item.coordinates) } : {}),
    }))
    .sort((a, b) => {
      if (a.distanceKm === undefined && b.distanceKm === undefined) return 0;
      if (a.distanceKm === undefined) return 1;
      if (b.distanceKm === undefined) return -1;
      return a.distanceKm - b.distanceKm;
    });
}
