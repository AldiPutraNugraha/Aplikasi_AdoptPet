import type { Coordinates } from '@/types/domain';

const DISTANCE_MATRIX_ENDPOINT = 'https://maps.googleapis.com/maps/api/distancematrix/json';
const MAX_DESTINATIONS_PER_REQUEST = 25;

type DistanceMatrixElement = {
  status: string;
  distance?: { value: number; text: string };
  duration?: { value: number; text: string };
};

type DistanceMatrixResponse = {
  status: string;
  rows: { elements: DistanceMatrixElement[] }[];
  error_message?: string;
};

function getApiKey() {
  return process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
}

function formatCoordinate(coord: Coordinates) {
  return `${coord.latitude},${coord.longitude}`;
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export async function fetchDrivingDistancesKm(
  origin: Coordinates,
  destinations: Coordinates[],
): Promise<(number | undefined)[]> {
  if (destinations.length === 0) return [];

  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('EXPO_PUBLIC_GOOGLE_MAPS_API_KEY is not set; skipping Distance Matrix.');
    return destinations.map(() => undefined);
  }

  const originParam = formatCoordinate(origin);
  const results: (number | undefined)[] = [];

  for (const batch of chunk(destinations, MAX_DESTINATIONS_PER_REQUEST)) {
    const destinationsParam = batch.map(formatCoordinate).join('|');
    const url = `${DISTANCE_MATRIX_ENDPOINT}?origins=${encodeURIComponent(originParam)}&destinations=${encodeURIComponent(destinationsParam)}&mode=driving&units=metric&key=${apiKey}`;

    try {
      const response = await fetch(url);
      const data = (await response.json()) as DistanceMatrixResponse;

      if (data.status !== 'OK') {
        console.warn('Distance Matrix API error:', data.status, data.error_message);
        results.push(...batch.map(() => undefined));
        continue;
      }

      const elements = data.rows[0]?.elements ?? [];
      results.push(
        ...batch.map((_, index) => {
          const element = elements[index];
          if (!element || element.status !== 'OK' || !element.distance) return undefined;
          return Number((element.distance.value / 1000).toFixed(2));
        }),
      );
    } catch (error) {
      console.warn('Distance Matrix request failed:', error);
      results.push(...batch.map(() => undefined));
    }
  }

  return results;
}

export async function sortByDrivingDistance<T extends { coordinates?: Coordinates }>(
  origin: Coordinates,
  items: T[],
): Promise<(T & { distanceKm?: number })[]> {
  const indexed = items.map((item, index) => ({ item, index }));
  const withCoords = indexed.filter((entry) => Boolean(entry.item.coordinates));

  const distances = await fetchDrivingDistancesKm(
    origin,
    withCoords.map((entry) => entry.item.coordinates as Coordinates),
  );

  const distanceByIndex = new Map<number, number | undefined>();
  withCoords.forEach((entry, i) => {
    distanceByIndex.set(entry.index, distances[i]);
  });

  const enriched = items.map((item, index) => {
    const distanceKm = distanceByIndex.get(index);
    return distanceKm !== undefined ? { ...item, distanceKm } : { ...item };
  });

  return enriched.sort((a, b) => {
    const aDistance = (a as { distanceKm?: number }).distanceKm;
    const bDistance = (b as { distanceKm?: number }).distanceKm;
    if (aDistance === undefined && bDistance === undefined) return 0;
    if (aDistance === undefined) return 1;
    if (bDistance === undefined) return -1;
    return aDistance - bDistance;
  });
}
