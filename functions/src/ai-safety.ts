export const AI_SEARCH_DAILY_LIMIT = 10;
export const MAX_SEARCH_IMAGE_BYTES = 8 * 1024 * 1024;

export function normalizeSearchImagePath(input: unknown, userId: string) {
  if (typeof input !== 'string') {
    throw new Error('Image path must be an owned search image path.');
  }

  const path = input.trim().replace(/\\/g, '/');
  const prefix = `search/${userId}/`;
  const segments = path.split('/');
  const fileName = segments[segments.length - 1] ?? '';

  if (
    !path.startsWith(prefix) ||
    path.includes('..') ||
    path.includes('//') ||
    segments.length < 3 ||
    fileName.trim().length === 0
  ) {
    throw new Error('Image path must be an owned search image path.');
  }

  return path;
}

export function getDailyAiSearchUsageId(userId: string, date = new Date()) {
  return `${userId}_${date.toISOString().slice(0, 10)}`;
}

export function canUseAiSearchQuota(currentCount: number, limit = AI_SEARCH_DAILY_LIMIT) {
  return currentCount < limit;
}

export function isAllowedSearchImageMetadata(metadata: { contentType?: string; size?: string | number }) {
  const size = Number(metadata.size ?? 0);
  return (
    Number.isFinite(size) &&
    size > 0 &&
    size <= MAX_SEARCH_IMAGE_BYTES &&
    typeof metadata.contentType === 'string' &&
    metadata.contentType.startsWith('image/')
  );
}
