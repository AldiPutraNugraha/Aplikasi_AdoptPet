import {
  getMissingScreeningFields,
  hasCompleteScreeningAnswers,
  normalizeScreeningAnswers,
} from '@/lib/domain/adoption-screening';
import type { AdoptionScreeningAnswers } from '@/types/domain';

const completeAnswers: AdoptionScreeningAnswers = {
  adoptionReason: 'Ingin memberi rumah aman',
  petCareExperience: 'Pernah merawat kucing 3 tahun',
  livingCondition: 'Rumah sendiri, pagar aman',
  dailyCareAvailability: 'Pagi dan malam tersedia',
  whatsappContact: '081234567890',
};

it('normalizes screening answer whitespace', () => {
  expect(
    normalizeScreeningAnswers({
      adoptionReason: '  Ingin adopsi\nkucing  ',
      petCareExperience: '  Pernah merawat  ',
      livingCondition: ' Rumah keluarga ',
      dailyCareAvailability: ' Setiap hari ',
      whatsappContact: '  0812 3456 7890 ',
    }),
  ).toEqual({
    adoptionReason: 'Ingin adopsi kucing',
    petCareExperience: 'Pernah merawat',
    livingCondition: 'Rumah keluarga',
    dailyCareAvailability: 'Setiap hari',
    whatsappContact: '0812 3456 7890',
  });
});

it('detects incomplete required screening answers', () => {
  const missing = getMissingScreeningFields({
    ...completeAnswers,
    petCareExperience: ' ',
    whatsappContact: '',
  });

  expect(missing).toEqual(['petCareExperience', 'whatsappContact']);
  expect(hasCompleteScreeningAnswers({ ...completeAnswers, whatsappContact: '' })).toBe(false);
});

it('accepts complete screening answers after trimming', () => {
  expect(hasCompleteScreeningAnswers(completeAnswers)).toBe(true);
});
