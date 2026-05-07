import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

import { firebaseAuth, firestore } from '@/lib/firebase/client';
import type { AppUser, Coordinates, UserRole } from '@/types/domain';

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

function toAppUser(id: string, data: Record<string, unknown>): AppUser {
  return {
    ...(data as Omit<AppUser, 'id'>),
    id,
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt),
  };
}

export async function registerWithRole(input: {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}) {
  const credential = await createUserWithEmailAndPassword(firebaseAuth, input.email, input.password);
  const now = Date.now();

  const profile: AppUser = {
    id: credential.user.uid,
    name: input.name,
    email: input.email,
    role: input.role,
    phoneNumber: '',
    fullAddress: '',
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(doc(firestore, 'users', credential.user.uid), {
    ...profile,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return profile;
}

export function login(email: string, password: string) {
  return signInWithEmailAndPassword(firebaseAuth, email, password);
}

export function logout() {
  return signOut(firebaseAuth);
}

export async function getUserProfile(userId: string) {
  const snapshot = await getDoc(doc(firestore, 'users', userId));
  return snapshot.exists() ? toAppUser(snapshot.id, snapshot.data()) : null;
}

export function updateProfileDetails(
  userId: string,
  input: { phoneNumber: string; fullAddress: string; coordinates?: Coordinates },
) {
  return updateDoc(doc(firestore, 'users', userId), {
    ...input,
    updatedAt: serverTimestamp(),
  });
}
