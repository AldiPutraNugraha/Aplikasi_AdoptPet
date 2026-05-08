import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

import { storage } from '@/lib/firebase/client';

function inferImageContentType(uri: string) {
  const path = uri.split('?')[0].toLowerCase();

  if (path.endsWith('.png')) return 'image/png';
  if (path.endsWith('.webp')) return 'image/webp';
  if (path.endsWith('.gif')) return 'image/gif';

  return 'image/jpeg';
}

export async function uploadImageAsync(uri: string, path: string) {
  const response = await fetch(uri);
  const blob = await response.blob();
  const imageRef = ref(storage, path);

  await uploadBytes(imageRef, blob, {
    contentType: blob.type || inferImageContentType(uri),
  });
  return getDownloadURL(imageRef);
}
