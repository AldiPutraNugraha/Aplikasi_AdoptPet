import {
  MAX_SEARCH_IMAGE_BYTES,
  canUseAiSearchQuota,
  getDailyAiSearchUsageId,
  isAllowedSearchImageMetadata,
  normalizeSearchImagePath,
} from '../ai-safety';

it('accepts search image paths owned by the authenticated user', () => {
  expect(normalizeSearchImagePath(' search/user-123/1715123456789.jpg ', 'user-123')).toBe(
    'search/user-123/1715123456789.jpg',
  );
});

it('rejects search image paths outside the authenticated user folder', () => {
  expect(() => normalizeSearchImagePath('https://example.com/cat.jpg', 'user-123')).toThrow('owned search image path');
  expect(() => normalizeSearchImagePath('search/other-user/cat.jpg', 'user-123')).toThrow('owned search image path');
  expect(() => normalizeSearchImagePath('search/user-123/../cat.jpg', 'user-123')).toThrow('owned search image path');
});

it('builds stable daily usage ids', () => {
  expect(getDailyAiSearchUsageId('user-123', new Date('2026-05-08T18:30:00.000Z'))).toBe(
    'user-123_2026-05-08',
  );
});

it('allows requests below quota and rejects requests at quota', () => {
  expect(canUseAiSearchQuota(0, 10)).toBe(true);
  expect(canUseAiSearchQuota(9, 10)).toBe(true);
  expect(canUseAiSearchQuota(10, 10)).toBe(false);
});

it('accepts image metadata within the visual search upload limit', () => {
  expect(isAllowedSearchImageMetadata({ contentType: 'image/jpeg', size: MAX_SEARCH_IMAGE_BYTES })).toBe(true);
});

it('rejects non-image or oversized search uploads', () => {
  expect(isAllowedSearchImageMetadata({ contentType: 'application/pdf', size: 1200 })).toBe(false);
  expect(isAllowedSearchImageMetadata({ contentType: 'image/png', size: MAX_SEARCH_IMAGE_BYTES + 1 })).toBe(false);
  expect(isAllowedSearchImageMetadata({ contentType: 'image/png', size: 0 })).toBe(false);
});
