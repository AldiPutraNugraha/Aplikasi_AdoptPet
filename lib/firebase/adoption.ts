import { addDoc, collection, doc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';

import { firestore } from '@/lib/firebase/client';
import type { AdoptionRequest, AdoptionScreeningAnswers } from '@/types/domain';

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

function toAdoptionRequest(id: string, data: Record<string, unknown>): AdoptionRequest {
  return {
    ...(data as Omit<AdoptionRequest, 'id'>),
    id,
    requestedAt: toMillis(data.requestedAt) ?? Date.now(),
    decidedAt: toMillis(data.decidedAt),
  };
}

export function submitAdoptionRequest(input: {
  petId: string;
  ownerId: string;
  adopterId: string;
  screeningAnswers: AdoptionScreeningAnswers;
}) {
  return addDoc(collection(firestore, 'adoptionRequests'), {
    ...input,
    status: 'pending',
    requestedAt: serverTimestamp(),
  });
}

export async function listOwnerRequests(ownerId: string) {
  const snapshot = await getDocs(query(collection(firestore, 'adoptionRequests'), where('ownerId', '==', ownerId)));
  return snapshot.docs.map((item) => toAdoptionRequest(item.id, item.data()));
}

export function updateRequestDecision(requestId: string, status: 'accepted' | 'rejected', ownerNote: string) {
  return updateDoc(doc(firestore, 'adoptionRequests', requestId), {
    status,
    ownerNote,
    decidedAt: serverTimestamp(),
  });
}
