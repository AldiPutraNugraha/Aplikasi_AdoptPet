import type { Coordinates } from '@/types/domain';

export type ProfileDetailsInput = {
  phoneNumber: string;
  fullAddress: string;
  coordinates?: Coordinates;
};

export type ProfileValidationResult =
  | {
      valid: true;
      details: ProfileDetailsInput;
      errors: Partial<Record<keyof ProfileDetailsInput, string>>;
    }
  | {
      valid: false;
      errors: Partial<Record<keyof ProfileDetailsInput, string>>;
    };

function normalizeText(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

export function normalizeProfileDetails(input: ProfileDetailsInput): ProfileDetailsInput {
  const details: ProfileDetailsInput = {
    phoneNumber: normalizeText(input.phoneNumber),
    fullAddress: normalizeText(input.fullAddress),
  };

  if (input.coordinates) {
    details.coordinates = input.coordinates;
  }

  return details;
}

export function validateProfileDetails(input: ProfileDetailsInput): ProfileValidationResult {
  const details = normalizeProfileDetails(input);
  const errors: Partial<Record<keyof ProfileDetailsInput, string>> = {};

  if (!/\d/.test(details.phoneNumber)) {
    errors.phoneNumber = 'Masukkan nomor WhatsApp aktif.';
  }

  if (!/[A-Za-z0-9]/.test(details.fullAddress)) {
    errors.fullAddress = 'Masukkan alamat lengkap.';
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, details, errors };
}
