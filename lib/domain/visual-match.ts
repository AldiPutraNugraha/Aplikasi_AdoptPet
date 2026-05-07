import type { Pet, VisualAttributes } from '@/types/domain';

function normalize(value?: string) {
  return value?.trim().toLowerCase() ?? '';
}

function tokens(value: string) {
  return value.split(/[^a-z0-9]+/).filter((token) => token.length >= 3);
}

function includesEither(a?: string, b?: string) {
  const left = normalize(a);
  const right = normalize(b);

  if (!left || !right) {
    return false;
  }

  if (left === right) {
    return true;
  }

  const rightTokens = new Set(tokens(right));
  return tokens(left).some((token) => rightTokens.has(token));
}

export function scorePetVisualMatch(pet: Pet, visual: VisualAttributes) {
  let score = 0;

  if (includesEither(pet.species, visual.species)) score += 40;
  if (includesEither(pet.primaryColor, visual.primaryColor)) score += 24;
  if (includesEither(pet.secondaryColor, visual.secondaryColor)) score += 10;
  if (includesEither(pet.furPattern, visual.furPattern)) score += 16;
  if (includesEither(pet.estimatedBreed, visual.estimatedBreed)) score += 10;

  return Math.round(score * Math.max(0.2, visual.confidence));
}

export function sortPetsByVisualMatch(pets: Pet[], visual: VisualAttributes) {
  return pets
    .map((pet) => ({
      ...pet,
      visualScore: scorePetVisualMatch(pet, visual),
    }))
    .sort((a, b) => b.visualScore - a.visualScore);
}
