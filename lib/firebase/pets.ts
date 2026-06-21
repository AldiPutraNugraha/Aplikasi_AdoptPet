import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

import { firestore } from '@/lib/firebase/client';
import type { Pet } from '@/types/domain';

type FirestoreTimestampLike = {
  toMillis: () => number;
};

function toMillis(value: unknown): number {
  if (typeof value === 'number') {
    return value;
  }

  if (value && typeof value === 'object' && 'toMillis' in value) {
    return (value as FirestoreTimestampLike).toMillis();
  }

  return Date.now();
}

function toPet(id: string, data: Record<string, unknown>): Pet {
  return {
    ...(data as Omit<Pet, 'id'>),
    id,
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt),
  };
}

export async function createPet(input: Omit<Pet, 'id' | 'createdAt' | 'updatedAt'>) {
  const ref = await addDoc(collection(firestore, 'pets'), {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return ref.id;
}

export async function listAvailablePets() {
  const snapshot = await getDocs(query(collection(firestore, 'pets'), where('status', '==', 'available')));
  return snapshot.docs.map((item) => toPet(item.id, item.data()));
}

export async function listOwnerPets(ownerId: string) {
  const snapshot = await getDocs(query(collection(firestore, 'pets'), where('ownerId', '==', ownerId)));
  return snapshot.docs.map((item) => toPet(item.id, item.data()));
}

export async function listAvailablePetsByOwner(ownerId: string) {
  const snapshot = await getDocs(
    query(
      collection(firestore, 'pets'),
      where('ownerId', '==', ownerId),
      where('status', '==', 'available'),
    ),
  );
  return snapshot.docs.map((item) => toPet(item.id, item.data()));
}

export async function getPetById(id: string) {
  const snapshot = await getDoc(doc(firestore, 'pets', id));
  return snapshot.exists() ? toPet(snapshot.id, snapshot.data()) : null;
}

export async function updatePet(
  id: string,
  input: Partial<Omit<Pet, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>>,
) {
  await updateDoc(doc(firestore, 'pets', id), {
    ...input,
    updatedAt: serverTimestamp(),
  });
}

export async function deletePet(id: string) {
  await deleteDoc(doc(firestore, 'pets', id));
}
