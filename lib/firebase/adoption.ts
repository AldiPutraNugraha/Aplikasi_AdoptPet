import { collection, doc, getDocs, query, runTransaction, serverTimestamp, where } from 'firebase/firestore';

import {
  getMissingScreeningFields,
  normalizeScreeningAnswers,
  type ScreeningField,
} from '@/lib/domain/adoption-screening';
import { canOwnerDecideRequest } from '@/lib/domain/status';
import { firestore } from '@/lib/firebase/client';
import type { AdoptionRequest, AdoptionRequestStatus, AdoptionScreeningAnswers, Pet } from '@/types/domain';

type FirestoreTimestampLike = {
  toMillis: () => number;
};

export type AdoptionScreeningValidationResult =
  | {
      valid: true;
      answers: AdoptionScreeningAnswers;
      errors: Partial<Record<keyof AdoptionScreeningAnswers, string>>;
    }
  | {
      valid: false;
      errors: Partial<Record<keyof AdoptionScreeningAnswers, string>>;
    };

const screeningFieldMessages: Record<ScreeningField, string> = {
  adoptionReason: 'Ceritakan alasan adopsi.',
  petCareExperience: 'Ceritakan pengalaman merawat hewan.',
  livingCondition: 'Jelaskan kondisi tempat tinggal.',
  dailyCareAvailability: 'Jelaskan ketersediaan perawatan harian.',
  whatsappContact: 'Masukkan kontak WhatsApp aktif.',
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

export function validateAdoptionScreeningAnswers(
  input: AdoptionScreeningAnswers,
): AdoptionScreeningValidationResult {
  const answers = normalizeScreeningAnswers(input);
  const errors: Partial<Record<keyof AdoptionScreeningAnswers, string>> = {};

  getMissingScreeningFields(answers).forEach((field) => {
    errors[field] = screeningFieldMessages[field];
  });

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, answers, errors };
}

export function canDecideAdoptionRequest(status: AdoptionRequestStatus) {
  return canOwnerDecideRequest(status);
}

export async function submitAdoptionRequest(input: {
  petId: string;
  ownerId: string;
  adopterId: string;
  screeningAnswers: AdoptionScreeningAnswers;
}) {
  const validation = validateAdoptionScreeningAnswers(input.screeningAnswers);
  if (!validation.valid) {
    throw new Error('Jawaban screening belum lengkap.');
  }

  return runTransaction(firestore, async (transaction) => {
    const petRef = doc(firestore, 'pets', input.petId);
    const petSnapshot = await transaction.get(petRef);

    if (!petSnapshot.exists()) {
      throw new Error('Hewan tidak ditemukan.');
    }

    const pet = petSnapshot.data() as Partial<Pet>;
    if (pet.ownerId !== input.ownerId || pet.status !== 'available') {
      throw new Error('Hewan ini tidak tersedia untuk pengajuan adopsi.');
    }

    const requestRef = doc(collection(firestore, 'adoptionRequests'));
    transaction.set(requestRef, {
      petId: input.petId,
      ownerId: input.ownerId,
      adopterId: input.adopterId,
      screeningAnswers: validation.answers,
      status: 'pending',
      requestedAt: serverTimestamp(),
    });

    return requestRef.id;
  });
}

export async function listOwnerRequests(ownerId: string) {
  const snapshot = await getDocs(query(collection(firestore, 'adoptionRequests'), where('ownerId', '==', ownerId)));
  return snapshot.docs
    .map((item) => toAdoptionRequest(item.id, item.data()))
    .sort((left, right) => right.requestedAt - left.requestedAt);
}

export async function updateRequestDecision(input: {
  requestId: string;
  currentStatus: AdoptionRequestStatus;
  status: 'accepted' | 'rejected';
  ownerNote: string;
}) {
  return runTransaction(firestore, async (transaction) => {
    const requestRef = doc(firestore, 'adoptionRequests', input.requestId);
    const requestSnapshot = await transaction.get(requestRef);

    if (!requestSnapshot.exists()) {
      throw new Error('Pengajuan tidak ditemukan.');
    }

    const request = requestSnapshot.data() as Partial<AdoptionRequest>;
    if (!canDecideAdoptionRequest(request.status as AdoptionRequestStatus)) {
      throw new Error('Pengajuan ini sudah memiliki keputusan.');
    }

    transaction.update(requestRef, {
      status: input.status,
      ownerNote: input.ownerNote.trim(),
      decidedAt: serverTimestamp(),
    });
  });
}
