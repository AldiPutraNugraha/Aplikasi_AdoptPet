import { fetchDrivingDistancesKm, sortByDrivingDistance } from '@/lib/domain/distance';
import type { Coordinates } from '@/types/domain';

const origin: Coordinates = { latitude: -6.9175, longitude: 107.6191 };
const cimahi: Coordinates = { latitude: -6.8722, longitude: 107.5425 };
const jakarta: Coordinates = { latitude: -6.2088, longitude: 106.8456 };

const originalFetch = global.fetch;
const originalKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

beforeAll(() => {
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-key';
});

afterAll(() => {
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY = originalKey;
  global.fetch = originalFetch;
});

function mockDistanceMatrix(distancesMeters: (number | null)[]) {
  global.fetch = jest.fn(async () => ({
    json: async () => ({
      status: 'OK',
      rows: [
        {
          elements: distancesMeters.map((value) =>
            value === null
              ? { status: 'ZERO_RESULTS' }
              : {
                  status: 'OK',
                  distance: { value, text: `${(value / 1000).toFixed(1)} km` },
                  duration: { value: 0, text: '0 mins' },
                },
          ),
        },
      ],
    }),
  })) as unknown as typeof fetch;
}

describe('fetchDrivingDistancesKm', () => {
  it('returns empty array when no destinations', async () => {
    expect(await fetchDrivingDistancesKm(origin, [])).toEqual([]);
  });

  it('parses driving distances from Distance Matrix API response', async () => {
    mockDistanceMatrix([9500, 152000]);
    const result = await fetchDrivingDistancesKm(origin, [cimahi, jakarta]);
    expect(result).toEqual([9.5, 152]);
  });

  it('returns undefined for elements with non-OK status', async () => {
    mockDistanceMatrix([12000, null]);
    const result = await fetchDrivingDistancesKm(origin, [cimahi, jakarta]);
    expect(result[0]).toBe(12);
    expect(result[1]).toBeUndefined();
  });
});

describe('sortByDrivingDistance', () => {
  it('sorts pets by nearest driving distance', async () => {
    // Input order: jakarta first, cimahi second. Mock returns 152km for jakarta, 9.5km for cimahi.
    mockDistanceMatrix([152000, 9500]);
    const result = await sortByDrivingDistance(origin, [
      { id: 'jakarta', coordinates: jakarta },
      { id: 'cimahi', coordinates: cimahi },
    ]);

    expect(result.map((item) => item.id)).toEqual(['cimahi', 'jakarta']);
    expect(result[0].distanceKm).toBe(9.5);
    expect(result[1].distanceKm).toBe(152);
  });

  it('keeps items without coordinates after items with distances', async () => {
    mockDistanceMatrix([9500]);
    const pets: { id: string; coordinates?: Coordinates }[] = [
      { id: 'unknown' },
      { id: 'cimahi', coordinates: cimahi },
    ];
    const result = await sortByDrivingDistance(origin, pets);

    expect(result.map((item) => item.id)).toEqual(['cimahi', 'unknown']);
    expect(result[0].distanceKm).toBe(9.5);
    expect(result[1].distanceKm).toBeUndefined();
  });

  it('preserves order when all destinations have no distance', async () => {
    global.fetch = jest.fn(async () => ({
      json: async () => ({ status: 'OK', rows: [{ elements: [] }] }),
    })) as unknown as typeof fetch;

    const pets: { id: string; coordinates?: Coordinates }[] = [
      { id: 'first' },
      { id: 'second' },
      { id: 'third' },
    ];
    const result = await sortByDrivingDistance(origin, pets);
    expect(result.map((item) => item.id)).toEqual(['first', 'second', 'third']);
  });
});
