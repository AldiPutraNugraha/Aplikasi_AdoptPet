import { useEffect, useState } from 'react';

import { getBreedsBySpecies, getVocabulary } from '@/lib/firebase/vocabularies';

export type PetVocab = {
  species: string[];
  primaryColors: string[];
  secondaryColors: string[];
  furPatterns: string[];
};

export function usePetVocab() {
  const [vocab, setVocab] = useState<PetVocab>({
    species: [],
    primaryColors: [],
    secondaryColors: [],
    furPatterns: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [species, primaryColors, secondaryColors, furPatterns] = await Promise.all([
          getVocabulary('species'),
          getVocabulary('primaryColors'),
          getVocabulary('secondaryColors'),
          getVocabulary('furPatterns'),
        ]);
        if (active) setVocab({ species, primaryColors, secondaryColors, furPatterns });
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return { vocab, loading };
}

export function useBreedsBySpecies(species: string) {
  const [breeds, setBreeds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    if (!species.trim()) {
      setBreeds([]);
      return;
    }
    setLoading(true);
    getBreedsBySpecies(species)
      .then((items) => {
        if (active) setBreeds(items);
      })
      .catch(() => {
        if (active) setBreeds([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [species]);

  return { breeds, loading };
}
