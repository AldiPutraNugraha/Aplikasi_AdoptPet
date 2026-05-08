import { httpsCallable } from 'firebase/functions';

import { functions } from '@/lib/firebase/client';
import type { VisualAttributes } from '@/types/domain';

export async function analyzePetImage(imagePath: string) {
  const callable = httpsCallable<{ imagePath: string }, VisualAttributes>(functions, 'analyzePetImage');
  const result = await callable({ imagePath });
  return result.data;
}
