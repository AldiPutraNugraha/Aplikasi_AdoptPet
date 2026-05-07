import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

import { storage } from '@/lib/firebase/client';

export async function uploadImageAsync(uri: string, path: string) {
  const response = await fetch(uri);
  const blob = await response.blob();
  const imageRef = ref(storage, path);

  await uploadBytes(imageRef, blob);
  return getDownloadURL(imageRef);
}
