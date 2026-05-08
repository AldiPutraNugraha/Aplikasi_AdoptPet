import type { AdoptionScreeningAnswers } from '@/types/domain';

export type ScreeningField = keyof AdoptionScreeningAnswers;

export const screeningFieldLabels: Record<ScreeningField, string> = {
  adoptionReason: 'Alasan mengadopsi',
  petCareExperience: 'Pengalaman merawat hewan',
  livingCondition: 'Kondisi tempat tinggal',
  dailyCareAvailability: 'Ketersediaan waktu merawat',
  whatsappContact: 'Nomor WhatsApp',
};

function normalizeText(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

export function normalizeScreeningAnswers(answers: AdoptionScreeningAnswers): AdoptionScreeningAnswers {
  return {
    adoptionReason: normalizeText(answers.adoptionReason),
    petCareExperience: normalizeText(answers.petCareExperience),
    livingCondition: normalizeText(answers.livingCondition),
    dailyCareAvailability: normalizeText(answers.dailyCareAvailability),
    whatsappContact: normalizeText(answers.whatsappContact),
  };
}

export function getMissingScreeningFields(answers: AdoptionScreeningAnswers): ScreeningField[] {
  const normalized = normalizeScreeningAnswers(answers);

  return (Object.keys(screeningFieldLabels) as ScreeningField[]).filter((field) => normalized[field].length === 0);
}

export function hasCompleteScreeningAnswers(answers: AdoptionScreeningAnswers) {
  return getMissingScreeningFields(answers).length === 0;
}
