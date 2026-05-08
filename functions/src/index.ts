import * as admin from 'firebase-admin';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';

import {
  AI_SEARCH_DAILY_LIMIT,
  canUseAiSearchQuota,
  getDailyAiSearchUsageId,
  isAllowedSearchImageMetadata,
  normalizeSearchImagePath,
} from './ai-safety';
import { addOneMonth, isLate } from './monitoring';
import { sendPushToUser } from './notifications';
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

function toDate(value: unknown) {
  if (value instanceof Date) {
    return value;
  }

  if (value && typeof value === 'object' && 'toDate' in value) {
    const date = (value as { toDate: () => Date }).toDate();
    if (date instanceof Date) {
      return date;
    }
  }

  return undefined;
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

export const createAdoptionApproval = onDocumentUpdated(
  { region: 'asia-southeast2', document: 'adoptionRequests/{requestId}' },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();

    if (!before || !after || before.status === after.status || after.status !== 'accepted') {
      return;
    }

    const firestore = admin.firestore();
    const requestId = event.params.requestId;
    const approvedAt = toDate(after.decidedAt) ?? new Date();
    const dueAt = admin.firestore.Timestamp.fromDate(addOneMonth(approvedAt));

    await firestore.runTransaction(async (transaction) => {
      const reportRef = firestore.collection('postAdoptionReports').doc(requestId);
      const existingReport = await transaction.get(reportRef);
      const petRef = firestore.collection('pets').doc(after.petId);

      transaction.update(petRef, {
        status: 'adopted',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      if (!existingReport.exists) {
        transaction.set(reportRef, {
          requestId,
          petId: after.petId,
          ownerId: after.ownerId,
          adopterId: after.adopterId,
          dueAt,
          status: 'scheduled',
          conditionPhotoPaths: [],
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    });

    await sendPushToUser(
      after.adopterId,
      'Adopsi disetujui',
      'Laporan kondisi hewan wajib dikirim 1 bulan setelah adopsi.',
    );
  },
);

export const sendMonitoringReminder = onSchedule(
  { region: 'asia-southeast2', schedule: 'every day 09:00', timeZone: 'Asia/Jakarta' },
  async () => {
    const now = admin.firestore.Timestamp.now();
    const snapshot = await admin
      .firestore()
      .collection('postAdoptionReports')
      .where('status', '==', 'scheduled')
      .where('dueAt', '<=', now)
      .get();

    await Promise.all(
      snapshot.docs.map(async (docSnapshot) => {
        const data = docSnapshot.data();

        await docSnapshot.ref.update({
          status: 'due',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        await sendPushToUser(
          data.adopterId,
          'Laporan AdoptPet jatuh tempo',
          'Silakan unggah foto kondisi hewan terbaru.',
        );
      }),
    );
  },
);

export const markLateMonitoring = onSchedule(
  { region: 'asia-southeast2', schedule: 'every day 10:00', timeZone: 'Asia/Jakarta' },
  async () => {
    const snapshot = await admin
      .firestore()
      .collection('postAdoptionReports')
      .where('status', 'in', ['scheduled', 'due'])
      .get();

    await Promise.all(
      snapshot.docs.map(async (docSnapshot) => {
        const data = docSnapshot.data();
        const dueAt = toDate(data.dueAt);

        if (!(dueAt instanceof Date) || !isLate(dueAt, new Date())) {
          return;
        }

        await docSnapshot.ref.update({
          status: 'late',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        await admin.firestore().collection('pets').doc(data.petId).update({
          status: 'monitoring_late',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        await sendPushToUser(
          data.ownerId,
          'Laporan terlambat',
          'Pengadopsi belum mengirim laporan kondisi hewan.',
        );
      }),
    );
  },
);

export const notifyOwnerOnReport = onDocumentUpdated(
  { region: 'asia-southeast2', document: 'postAdoptionReports/{reportId}' },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();

    if (!before || !after || before.status === after.status || after.status !== 'submitted') {
      return;
    }

    await admin.firestore().collection('pets').doc(after.petId).update({
      status: 'monitoring_submitted',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    await sendPushToUser(after.ownerId, 'Laporan diterima', 'Pengadopsi telah mengirim laporan kondisi hewan.');
  },
);
