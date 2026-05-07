import { scorePetVisualMatch } from '@/lib/domain/visual-match';
import type { Pet, VisualAttributes } from '@/types/domain';

const pet: Pet = {
  id: 'pet-1',
  ownerId: 'owner-1',
  name: 'Milo',
  species: 'cat',
  estimatedBreed: 'domestic shorthair',
  primaryColor: 'white',
  secondaryColor: 'orange',
  furPattern: 'bicolor',
  age: '2 tahun',
  sex: 'male',
  description: 'Friendly cat',
  photoUrls: [],
  vaccinationStatus: 'vaccinated',
  sterilizationStatus: 'unknown',
  medicalHistory: '',
  healthProofUrls: [],
  fullAddress: 'Bandung',
  coordinates: { latitude: -6.9175, longitude: 107.6191 },
  status: 'available',
  createdAt: 0,
  updatedAt: 0,
};

it('scores exact visual matches higher than partial matches', () => {
  const exact: VisualAttributes = {
    species: 'cat',
    primaryColor: 'white',
    secondaryColor: 'orange',
    furPattern: 'bicolor',
    estimatedBreed: 'domestic shorthair',
    confidence: 0.8,
  };

  const partial: VisualAttributes = {
    species: 'cat',
    primaryColor: 'black',
    secondaryColor: 'white',
    furPattern: 'solid',
    estimatedBreed: 'persian',
    confidence: 0.8,
  };

  expect(scorePetVisualMatch(pet, exact)).toBeGreaterThan(scorePetVisualMatch(pet, partial));
});

it('does not score species for arbitrary substring matches', () => {
  const cattlePet: Pet = {
    ...pet,
    id: 'pet-2',
    species: 'cattle',
    primaryColor: 'black',
    secondaryColor: 'brown',
    furPattern: 'solid',
    estimatedBreed: 'limousin',
  };

  const visual: VisualAttributes = {
    species: 'cat',
    primaryColor: 'white',
    secondaryColor: 'orange',
    furPattern: 'bicolor',
    estimatedBreed: 'domestic shorthair',
    confidence: 1,
  };

  expect(scorePetVisualMatch(cattlePet, visual)).toBe(0);
});
