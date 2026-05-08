import { addOneMonth, isLate } from '../monitoring';

describe('addOneMonth', () => {
  it('adds one calendar month for regular dates', () => {
    expect(addOneMonth(new Date('2026-05-08T10:15:00.000Z')).toISOString()).toBe(
      '2026-06-08T10:15:00.000Z',
    );
  });

  it('clamps to the last day of the next month when needed', () => {
    expect(addOneMonth(new Date('2026-01-31T00:00:00.000Z')).toISOString()).toBe(
      '2026-02-28T00:00:00.000Z',
    );
  });
});

describe('isLate', () => {
  it('returns false on the due date and exactly fourteen days later', () => {
    const dueAt = new Date('2026-05-08T00:00:00.000Z');

    expect(isLate(dueAt, new Date('2026-05-08T00:00:00.000Z'))).toBe(false);
    expect(isLate(dueAt, new Date('2026-05-22T00:00:00.000Z'))).toBe(false);
  });

  it('returns true more than fourteen days after the due date', () => {
    expect(isLate(new Date('2026-05-08T00:00:00.000Z'), new Date('2026-05-22T00:00:00.001Z'))).toBe(
      true,
    );
  });
});
