import type { Pet } from '@/types/domain';

export type PetVocabulary = {
  species: string[];
  primaryColors: string[];
  secondaryColors: string[];
  furPatterns: string[];
  breeds: string[];
};

function uniqueLower(values: (string | undefined)[]): string[] {
  const set = new Set<string>();
  for (const v of values) {
    const cleaned = v?.trim().toLowerCase();
    if (cleaned) set.add(cleaned);
  }
  return Array.from(set).sort();
}

export function buildPetVocabulary(pets: Pet[]): PetVocabulary {
  return {
    species: uniqueLower(pets.map((p) => p.species)),
    primaryColors: uniqueLower(pets.map((p) => p.primaryColor)),
    secondaryColors: uniqueLower(pets.map((p) => p.secondaryColor)),
    furPatterns: uniqueLower(pets.map((p) => p.furPattern)),
    breeds: uniqueLower(pets.map((p) => p.estimatedBreed)),
  };
}

export function vocabularyToPromptText(vocab: PetVocabulary): string {
  const lines: string[] = [];
  if (vocab.species.length) lines.push(`- species: ${vocab.species.join(', ')}`);
  if (vocab.primaryColors.length) lines.push(`- primaryColor: ${vocab.primaryColors.join(', ')}`);
  if (vocab.secondaryColors.length) lines.push(`- secondaryColor: ${vocab.secondaryColors.join(', ')}`);
  if (vocab.furPatterns.length) lines.push(`- furPattern: ${vocab.furPatterns.join(', ')}`);
  if (vocab.breeds.length) lines.push(`- estimatedBreed: ${vocab.breeds.join(', ')}`);
  return lines.join('\n');
}
