import { collection, doc, getDocs, query, runTransaction, serverTimestamp, where } from 'firebase/firestore';
import { getDownloadURL, ref } from 'firebase/storage';

import {
  hasRequiredMonitoringReportInput,
  normalizeMonitoringReportInput,
} from '@/lib/domain/monitoring-report';
import { firestore, storage } from '@/lib/firebase/client';
import type { MonitoringReportStatus, PostAdoptionReport } from '@/types/domain';

type FirestoreTimestampLike = {
  toMillis: () => number;
};

function toMillis(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return value;
  }

  if (value && typeof value === 'object' && 'toMillis' in value) {
    return (value as FirestoreTimestampLike).toMillis();
  }

  return undefined;
}

function toPostAdoptionReport(id: string, data: Record<string, unknown>): PostAdoptionReport {
  const conditionPhotoPaths = Array.isArray(data.conditionPhotoPaths)
    ? (data.conditionPhotoPaths as string[])
    : [];

  return {
    ...(data as Omit<PostAdoptionReport, 'id'>),
    id,
    dueAt: toMillis(data.dueAt) ?? Date.now(),
    submittedAt: toMillis(data.submittedAt),
    createdAt: toMillis(data.createdAt) ?? Date.now(),
    conditionPhotoPaths,
    conditionPhotoUrls: [],
  };
}

async function withResolvedConditionPhotos(report: PostAdoptionReport): Promise<PostAdoptionReport> {
  const conditionPhotoUrls = await Promise.all(
    report.conditionPhotoPaths.map(async (path) => {
      try {
        return await getDownloadURL(ref(storage, path));
      } catch {
        return null;
      }
    }),
  );

  return {
    ...report,
    conditionPhotoUrls: conditionPhotoUrls.filter((url): url is string => Boolean(url)),
  };
}

export async function listReportsForAdopter(adopterId: string) {
  const snapshot = await getDocs(
    query(collection(firestore, 'postAdoptionReports'), where('adopterId', '==', adopterId)),
  );
  const reports = snapshot.docs
    .map((item) => toPostAdoptionReport(item.id, item.data()))
    .sort((left, right) => right.dueAt - left.dueAt);

  return Promise.all(reports.map(withResolvedConditionPhotos));
}

export async function listReportsForOwner(ownerId: string) {
  const snapshot = await getDocs(query(collection(firestore, 'postAdoptionReports'), where('ownerId', '==', ownerId)));
  const reports = snapshot.docs
    .map((item) => toPostAdoptionReport(item.id, item.data()))
    .sort((left, right) => right.dueAt - left.dueAt);

  return Promise.all(reports.map(withResolvedConditionPhotos));
}

export async function getReportForRequest(requestId: string, adopterId: string) {
  const snapshot = await getDocs(
    query(
      collection(firestore, 'postAdoptionReports'),
      where('requestId', '==', requestId),
      where('adopterId', '==', adopterId),
    ),
  );

  const report = snapshot.docs[0];
  return report ? withResolvedConditionPhotos(toPostAdoptionReport(report.id, report.data())) : null;
}

export async function submitMonitoringReport(
  reportId: string,
  input: { conditionPhotoPaths: string[]; conditionNote: string },
) {
  const normalized = normalizeMonitoringReportInput(input);

  if (!hasRequiredMonitoringReportInput(normalized)) {
    throw new Error('Unggah minimal satu foto kondisi hewan.');
  }

  return runTransaction(firestore, async (transaction) => {
    const reportRef = doc(firestore, 'postAdoptionReports', reportId);
    const reportSnapshot = await transaction.get(reportRef);

    if (!reportSnapshot.exists()) {
      throw new Error('Laporan monitoring tidak ditemukan.');
    }

    const report = reportSnapshot.data() as Partial<PostAdoptionReport>;
    const status = report.status as MonitoringReportStatus | undefined;

    if (status === 'submitted') {
      throw new Error('Laporan ini sudah dikirim.');
    }

    if (status !== 'due' && status !== 'late') {
      throw new Error('Laporan belum jatuh tempo.');
    }

    transaction.update(reportRef, {
      conditionPhotoPaths: normalized.conditionPhotoPaths,
      conditionNote: normalized.conditionNote,
      status: 'submitted',
      submittedAt: serverTimestamp(),
    });
  });
}
