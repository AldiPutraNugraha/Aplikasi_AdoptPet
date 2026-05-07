import { collection, doc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';

import { firestore } from '@/lib/firebase/client';
import type { PostAdoptionReport } from '@/types/domain';

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
  return {
    ...(data as Omit<PostAdoptionReport, 'id'>),
    id,
    dueAt: toMillis(data.dueAt) ?? Date.now(),
    submittedAt: toMillis(data.submittedAt),
    createdAt: toMillis(data.createdAt) ?? Date.now(),
  };
}

export async function listReportsForAdopter(adopterId: string) {
  const snapshot = await getDocs(
    query(collection(firestore, 'postAdoptionReports'), where('adopterId', '==', adopterId)),
  );
  return snapshot.docs.map((item) => toPostAdoptionReport(item.id, item.data()));
}

export async function listReportsForOwner(ownerId: string) {
  const snapshot = await getDocs(query(collection(firestore, 'postAdoptionReports'), where('ownerId', '==', ownerId)));
  return snapshot.docs.map((item) => toPostAdoptionReport(item.id, item.data()));
}

export function submitMonitoringReport(reportId: string, input: { conditionPhotoUrls: string[]; conditionNote: string }) {
  return updateDoc(doc(firestore, 'postAdoptionReports', reportId), {
    ...input,
    status: 'submitted',
    submittedAt: serverTimestamp(),
  });
}
