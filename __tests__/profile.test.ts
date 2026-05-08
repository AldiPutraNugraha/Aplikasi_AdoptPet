import { normalizeProfileDetails, validateProfileDetails } from '@/lib/domain/profile';

it('normalizes profile details without writing undefined coordinates', () => {
  expect(
    normalizeProfileDetails({
      phoneNumber: '  0812 3456  ',
      fullAddress: '  Jalan Mawar 1, Bandung  ',
      coordinates: undefined,
    }),
  ).toEqual({
    phoneNumber: '0812 3456',
    fullAddress: 'Jalan Mawar 1, Bandung',
  });
});

it('requires meaningful phone number and full address', () => {
  expect(validateProfileDetails({ phoneNumber: '   ', fullAddress: 'Jalan Mawar 1' })).toEqual({
    valid: false,
    errors: { phoneNumber: 'Masukkan nomor WhatsApp aktif.' },
  });

  expect(validateProfileDetails({ phoneNumber: '0812', fullAddress: '   ' })).toEqual({
    valid: false,
    errors: { fullAddress: 'Masukkan alamat lengkap.' },
  });
});
