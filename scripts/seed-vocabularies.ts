/**
 * Seed Firestore vocabularies & breeds.
 *
 * Run once:
 *   npx ts-node scripts/seed-vocabularies.ts
 *
 * Requires service account JSON. Set env var:
 *   GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
 *
 * Get service account key from:
 *   Firebase Console -> Project Settings -> Service accounts -> Generate new private key
 */
import { initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

initializeApp();
const db = getFirestore();

const VOCABULARIES: Record<string, string[]> = {
  species: ['kucing', 'anjing', 'kelinci', 'hamster', 'burung', 'ikan', 'reptil'],
  primaryColors: [
    'hitam',
    'putih',
    'abu-abu',
    'coklat',
    'oranye',
    'krem',
    'kuning',
    'belang',
    'tortie',
  ],
  secondaryColors: ['hitam', 'putih', 'abu-abu', 'coklat', 'oranye', 'krem'],
  furPatterns: [
    'polos',
    'belang',
    'calico',
    'tabby',
    'tortoiseshell',
    'bicolor',
    'tricolor',
    'pointed',
  ],
};

const BREEDS: Record<string, string[]> = {
  kucing: [
    'persia',
    'anggora',
    'maine coon',
    'ragdoll',
    'scottish fold',
    'british shorthair',
    'siamese',
    'bengal',
    'sphynx',
    'kampung (domestic shorthair)',
  ],
  anjing: [
    'golden retriever',
    'labrador',
    'husky',
    'pomeranian',
    'shih tzu',
    'bulldog',
    'chihuahua',
    'poodle',
    'german shepherd',
    'kampung',
  ],
  kelinci: ['holland lop', 'netherland dwarf', 'anggora', 'rex', 'flemish giant', 'lokal'],
  hamster: ['syrian', 'campbell', 'roborovski', 'winter white'],
  burung: ['lovebird', 'kenari', 'murai batu', 'parkit', 'kakatua'],
  ikan: ['cupang', 'koi', 'mas koki', 'guppy', 'arwana'],
  reptil: ['gecko', 'iguana', 'kura-kura', 'ular'],
};

async function seedVocabularies() {
  for (const [key, items] of Object.entries(VOCABULARIES)) {
    await db.collection('vocabularies').doc(key).set({ items, updatedAt: FieldValue.serverTimestamp() });
    console.log(`✓ vocabularies/${key} (${items.length} items)`);
  }
}

async function seedBreeds() {
  for (const [species, items] of Object.entries(BREEDS)) {
    await db.collection('breeds').doc(species).set({ items, updatedAt: FieldValue.serverTimestamp() });
    console.log(`✓ breeds/${species} (${items.length} items)`);
  }
}

(async () => {
  try {
    await seedVocabularies();
    await seedBreeds();
    console.log('\n✅ Seed selesai');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed gagal:', error);
    process.exit(1);
  }
})();
