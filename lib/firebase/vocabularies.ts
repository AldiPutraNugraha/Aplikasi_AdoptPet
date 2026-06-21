import { doc, getDoc } from 'firebase/firestore';

import { firestore } from '@/lib/firebase/client';

export type VocabularyKey = 'species' | 'primaryColors' | 'secondaryColors' | 'furPatterns';

async function fetchItems(collection: string, docId: string): Promise<string[]> {
  const snapshot = await getDoc(doc(firestore, collection, docId));
  if (!snapshot.exists()) return [];
  const data = snapshot.data() as { items?: unknown };
  if (!Array.isArray(data.items)) return [];
  return data.items.filter((item): item is string => typeof item === 'string');
}

export function getVocabulary(key: VocabularyKey) {
  return fetchItems('vocabularies', key);
}

export function getBreedsBySpecies(species: string) {
  const key = species.trim().toLowerCase();
  if (!key) return Promise.resolve<string[]>([]);
  return fetchItems('breeds', key);
}
