import {
  canDecideAdoptionRequest,
  submitAdoptionRequest,
  updateRequestDecision,
  validateAdoptionScreeningAnswers,
} from '@/lib/firebase/adoption';
import { collection, doc, runTransaction, serverTimestamp } from 'firebase/firestore';

jest.mock('firebase/firestore', () => ({
  addDoc: jest.fn(),
  collection: jest.fn((_firestore, path: string) => ({ path })),
  doc: jest.fn((parent, ...segments: string[]) => {
    if (segments.length === 0) {
      return { id: 'generated-request', path: `${parent.path}/generated-request` };
    }

    return { id: segments[segments.length - 1], path: segments.join('/') };
  }),
  getDocs: jest.fn(),
  query: jest.fn(),
  runTransaction: jest.fn(),
  serverTimestamp: jest.fn(() => 'SERVER_TIME'),
  updateDoc: jest.fn(),
  where: jest.fn(),
}));

jest.mock('@/lib/firebase/client', () => ({
  firestore: {},
}));

describe('validateAdoptionScreeningAnswers', () => {
  it('requires every screening answer before submit', () => {
    const result = validateAdoptionScreeningAnswers({
      adoptionReason: ' ',
      petCareExperience: '',
      livingCondition: '',
      dailyCareAvailability: '',
      whatsappContact: '',
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual({
      adoptionReason: 'Ceritakan alasan adopsi.',
      petCareExperience: 'Ceritakan pengalaman merawat hewan.',
      livingCondition: 'Jelaskan kondisi tempat tinggal.',
      dailyCareAvailability: 'Jelaskan ketersediaan perawatan harian.',
      whatsappContact: 'Masukkan kontak WhatsApp aktif.',
    });
  });

  it('returns trimmed answers when all screening fields are filled', () => {
    const result = validateAdoptionScreeningAnswers({
      adoptionReason: '  Ingin memberi rumah aman  ',
      petCareExperience: ' Pernah merawat kucing ',
      livingCondition: ' Rumah berpagar ',
      dailyCareAvailability: ' Ada keluarga di rumah ',
      whatsappContact: ' 081234567890 ',
    });

    expect(result).toEqual({
      valid: true,
      answers: {
        adoptionReason: 'Ingin memberi rumah aman',
        petCareExperience: 'Pernah merawat kucing',
        livingCondition: 'Rumah berpagar',
        dailyCareAvailability: 'Ada keluarga di rumah',
        whatsappContact: '081234567890',
      },
      errors: {},
    });
  });
});

describe('canDecideAdoptionRequest', () => {
  it('allows owner decisions for pending requests only', () => {
    expect(canDecideAdoptionRequest('pending')).toBe(true);
    expect(canDecideAdoptionRequest('accepted')).toBe(false);
    expect(canDecideAdoptionRequest('rejected')).toBe(false);
    expect(canDecideAdoptionRequest('cancelled')).toBe(false);
  });
});

describe('updateRequestDecision', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('reads stored request status before writing an owner decision', async () => {
    const transaction = {
      get: jest.fn().mockResolvedValue({
        exists: () => true,
        data: () => ({ status: 'accepted' }),
      }),
      update: jest.fn(),
    };
    (runTransaction as jest.Mock).mockImplementation(async (_firestore, callback) => callback(transaction));

    await expect(
      updateRequestDecision({
        requestId: 'request-1',
        currentStatus: 'pending',
        status: 'rejected',
        ownerNote: 'Tidak jadi',
      }),
    ).rejects.toThrow('sudah memiliki keputusan');
    expect(transaction.update).not.toHaveBeenCalled();
  });

  it('writes owner decisions in the same transaction after confirming pending status', async () => {
    const transaction = {
      get: jest.fn().mockResolvedValue({
        exists: () => true,
        data: () => ({ status: 'pending' }),
      }),
      update: jest.fn(),
    };
    (runTransaction as jest.Mock).mockImplementation(async (_firestore, callback) => callback(transaction));

    await updateRequestDecision({
      requestId: 'request-1',
      currentStatus: 'pending',
      status: 'accepted',
      ownerNote: ' Silakan lanjut WhatsApp ',
    });

    expect(transaction.update).toHaveBeenCalledWith(
      { id: 'request-1', path: 'adoptionRequests/request-1' },
      {
        status: 'accepted',
        ownerNote: 'Silakan lanjut WhatsApp',
        decidedAt: 'SERVER_TIME',
      },
    );
  });
});

describe('submitAdoptionRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('checks the current pet before creating a request', async () => {
    const transaction = {
      get: jest.fn().mockResolvedValue({
        exists: () => true,
        data: () => ({ ownerId: 'owner-1', status: 'adopted' }),
      }),
      set: jest.fn(),
    };
    (runTransaction as jest.Mock).mockImplementation(async (_firestore, callback) => callback(transaction));

    await expect(
      submitAdoptionRequest({
        petId: 'pet-1',
        ownerId: 'owner-1',
        adopterId: 'adopter-1',
        screeningAnswers: {
          adoptionReason: 'Ingin merawat',
          petCareExperience: 'Pernah merawat',
          livingCondition: 'Rumah aman',
          dailyCareAvailability: 'Setiap hari',
          whatsappContact: '0812',
        },
      }),
    ).rejects.toThrow('tidak tersedia');
    expect(transaction.set).not.toHaveBeenCalled();
  });

  it('creates a pending request from a current available pet', async () => {
    const transaction = {
      get: jest.fn().mockResolvedValue({
        exists: () => true,
        data: () => ({ ownerId: 'owner-1', status: 'available' }),
      }),
      set: jest.fn(),
    };
    (runTransaction as jest.Mock).mockImplementation(async (_firestore, callback) => callback(transaction));

    await expect(
      submitAdoptionRequest({
        petId: 'pet-1',
        ownerId: 'owner-1',
        adopterId: 'adopter-1',
        screeningAnswers: {
          adoptionReason: ' Ingin merawat ',
          petCareExperience: 'Pernah merawat',
          livingCondition: 'Rumah aman',
          dailyCareAvailability: 'Setiap hari',
          whatsappContact: '0812',
        },
      }),
    ).resolves.toBe('generated-request');

    expect(collection).toHaveBeenCalledWith({}, 'adoptionRequests');
    expect(doc).toHaveBeenCalledWith({}, 'pets', 'pet-1');
    expect(transaction.set).toHaveBeenCalledWith(
      { id: 'generated-request', path: 'adoptionRequests/generated-request' },
      expect.objectContaining({
        petId: 'pet-1',
        ownerId: 'owner-1',
        adopterId: 'adopter-1',
        status: 'pending',
        requestedAt: serverTimestamp(),
        screeningAnswers: expect.objectContaining({ adoptionReason: 'Ingin merawat' }),
      }),
    );
  });
});
