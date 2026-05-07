import { calculateDistanceKm, sortByDistance } from '@/lib/domain/distance';
import type { Coordinates } from '@/types/domain';

describe('calculateDistanceKm', () => {
  it('returns 0 for the same coordinate', () => {
    const point: Coordinates = { latitude: -6.9175, longitude: 107.6191 };
    expect(calculateDistanceKm(point, point)).toBe(0);
  });

  it('calculates distance between Bandung and Jakarta', () => {
    const bandung: Coordinates = { latitude: -6.9175, longitude: 107.6191 };
    const jakarta: Coordinates = { latitude: -6.2088, longitude: 106.8456 };
    expect(calculateDistanceKm(bandung, jakarta)).toBeGreaterThan(110);
    expect(calculateDistanceKm(bandung, jakarta)).toBeLessThan(130);
  });
});

describe('sortByDistance', () => {
  it('sorts pets by nearest coordinate', () => {
    const origin: Coordinates = { latitude: -6.9175, longitude: 107.6191 };
    const result = sortByDistance(origin, [
      { id: 'jakarta', coordinates: { latitude: -6.2088, longitude: 106.8456 } },
      { id: 'cimahi', coordinates: { latitude: -6.8722, longitude: 107.5425 } },
    ]);

    expect(result.map((item) => item.id)).toEqual(['cimahi', 'jakarta']);
    expect(result[0].distanceKm).toBeLessThan(result[1].distanceKm);
  });

  it('keeps items without coordinates after items with distances', () => {
    const origin: Coordinates = { latitude: -6.9175, longitude: 107.6191 };
    const result = sortByDistance(origin, [
      { id: 'unknown' },
      { id: 'cimahi', coordinates: { latitude: -6.8722, longitude: 107.5425 } },
    ]);

    expect(result.map((item) => item.id)).toEqual(['cimahi', 'unknown']);
    expect(result[0].distanceKm).toBeDefined();
    expect(result[1]).not.toHaveProperty('distanceKm');
  });

  it('treats two missing distances as equivalent in the comparator', () => {
    const origin: Coordinates = { latitude: -6.9175, longitude: 107.6191 };
    const originalSort = Array.prototype.sort;
    let comparator: Parameters<typeof originalSort>[0];

    const sortSpy = jest.spyOn(Array.prototype, 'sort').mockImplementation(function (compareFn) {
      comparator = compareFn;
      return originalSort.call(this, compareFn);
    });

    sortByDistance(origin, [{ id: 'first' }, { id: 'second' }]);

    const result = comparator?.({ id: 'first' }, { id: 'second' });
    sortSpy.mockRestore();

    expect(result).toBe(0);
  });
});
