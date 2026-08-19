import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

import { firebaseAuth, storage } from '@/lib/firebase/client';

function inferImageContentType(uri: string) {
  const path = uri.split('?')[0].toLowerCase();

  if (path.endsWith('.png')) return 'image/png';
  if (path.endsWith('.webp')) return 'image/webp';
  if (path.endsWith('.gif')) return 'image/gif';

  return 'image/jpeg';
}

export async function uploadImageAsync(uri: string, path: string) {
  const currentUser = firebaseAuth.currentUser;
  console.log('[uploadImageAsync] start', {
    path,
    authUid: currentUser?.uid ?? 'NULL',
    signedIn: Boolean(currentUser),
  });

  if (!currentUser) {
    throw new Error('Sesi login tidak aktif. Silakan logout lalu login lagi.');
  }

  try {
    await currentUser.getIdToken(true);
  } catch (refreshError) {
    console.warn('[uploadImageAsync] token refresh failed', refreshError);
  }

  const response = await fetch(uri);
  const blob = await response.blob();
  const imageRef = ref(storage, path);

  const blobType = (blob.type ?? '').toString();
  const contentType = blobType.startsWith('image/') ? blobType : inferImageContentType(uri);

  console.log('[uploadImageAsync] uploading', { contentType, blobType, size: blob.size });

  await uploadBytes(imageRef, blob, {
    contentType,
    cacheControl: 'public, max-age=3600',
  });
  return getDownloadURL(imageRef);
}
