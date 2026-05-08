import * as admin from 'firebase-admin';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

import {
  AI_SEARCH_DAILY_LIMIT,
  canUseAiSearchQuota,
  getDailyAiSearchUsageId,
  isAllowedSearchImageMetadata,
  normalizeSearchImagePath,
} from './ai-safety';
import { analyzeImageWithOpenRouter } from './openrouter';

admin.initializeApp();

const MODEL = 'google/gemini-2.5-flash';

async function writeAiSearchLog(data: Record<string, unknown>) {
  await admin.firestore().collection('aiSearchLogs').add({
    ...data,
    model: MODEL,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

async function getSignedImageUrl(imagePath: string) {
  const file = admin.storage().bucket().file(imagePath);
  const [exists] = await file.exists();

  if (!exists) {
    throw new HttpsError('not-found', 'Foto referensi tidak ditemukan. Pilih ulang foto lalu coba lagi.');
  }

  const [metadata] = await file.getMetadata();
  if (!isAllowedSearchImageMetadata(metadata)) {
    throw new HttpsError('invalid-argument', 'Foto referensi harus berupa gambar dengan ukuran maksimal 8 MB.');
  }

  const [signedUrl] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + 10 * 60 * 1000,
  });

  return signedUrl;
}

async function reserveAiSearchQuota(userId: string) {
  const usageId = getDailyAiSearchUsageId(userId);
  const usageRef = admin.firestore().collection('aiSearchUsage').doc(usageId);

  return admin.firestore().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(usageRef);
    const currentCount = snapshot.exists ? Number(snapshot.get('count') ?? 0) : 0;

    if (!canUseAiSearchQuota(currentCount, AI_SEARCH_DAILY_LIMIT)) {
      throw new HttpsError(
        'resource-exhausted',
        'Batas pencarian visual harian sudah tercapai. Coba lagi besok.',
      );
    }

    const nextCount = currentCount + 1;
    transaction.set(
      usageRef,
      {
        userId,
        count: nextCount,
        limit: AI_SEARCH_DAILY_LIMIT,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return { usageId, count: nextCount };
  });
}

export const analyzePetImage = onCall({ region: 'asia-southeast2' }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Login diperlukan untuk pencarian visual.');
  }

  let imagePath: string;
  try {
    imagePath = normalizeSearchImagePath(request.data?.imagePath, request.auth.uid);
  } catch {
    throw new HttpsError('invalid-argument', 'Foto referensi belum valid.');
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new HttpsError('failed-precondition', 'OpenRouter API key belum dikonfigurasi.');
  }

  const signedImageUrl = await getSignedImageUrl(imagePath);
  const usage = await reserveAiSearchQuota(request.auth.uid);

  try {
    const result = await analyzeImageWithOpenRouter({
      apiKey,
      imageUrl: signedImageUrl,
    });

    await writeAiSearchLog({
      userId: request.auth.uid,
      inputImagePath: imagePath,
      usageId: usage.usageId,
      usageCount: usage.count,
      status: 'success',
      resultJson: result,
      confidence: result.confidence,
    });

    return result;
  } catch (error) {
    await writeAiSearchLog({
      userId: request.auth.uid,
      inputImagePath: imagePath,
      usageId: usage.usageId,
      usageCount: usage.count,
      status: 'failure',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });

    throw new HttpsError('internal', 'Analisis gambar gagal. Gunakan filter manual atau coba foto lain.');
  }
});
