import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { TextField } from '@/components/forms/TextField';
import { BackButton } from '@/components/ui/BackButton';
import { useAuth } from '@/contexts/auth-context';
import {
  submitAdoptionRequest,
  validateAdoptionScreeningAnswers,
} from '@/lib/firebase/adoption';
import { getPetById } from '@/lib/firebase/pets';
import type { AdoptionScreeningAnswers, Pet } from '@/types/domain';

const emptyAnswers: AdoptionScreeningAnswers = {
  adoptionReason: '',
  petCareExperience: '',
  livingCondition: '',
  dailyCareAvailability: '',
  whatsappContact: '',
};

export default function AdoptionRequestScreen() {
  const { petId: petIdParam } = useLocalSearchParams<{ petId?: string | string[] }>();
  const petId = Array.isArray(petIdParam) ? petIdParam[0] : petIdParam;
  const { firebaseUser, profile, loading: authLoading } = useAuth();
  const [pet, setPet] = useState<Pet | null>(null);
  const [answers, setAnswers] = useState<AdoptionScreeningAnswers>(emptyAnswers);
  const [errors, setErrors] = useState<Partial<Record<keyof AdoptionScreeningAnswers, string>>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const loadPet = useCallback(async () => {
    if (!petId) {
      setPet(null);
      setLoadError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);
    try {
      setPet(await getPetById(petId));
    } catch {
      setPet(null);
      setLoadError('Gagal memuat data hewan. Periksa koneksi lalu coba lagi.');
    } finally {
      setLoading(false);
    }
  }, [petId]);

  useEffect(() => {
    void loadPet();
  }, [loadPet]);

  useEffect(() => {
    if (!profile?.phoneNumber) {
      return;
    }

    setAnswers((current) =>
      current.whatsappContact.trim().length > 0 ? current : { ...current, whatsappContact: profile.phoneNumber },
    );
  }, [profile?.phoneNumber]);

  useEffect(() => {
    if (!submitted) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      router.replace(pet ? `/(adopter)/pets/${pet.id}` : '/(adopter)');
    }, 1400);

    return () => clearTimeout(timeoutId);
  }, [pet, submitted]);

  function updateAnswer(field: keyof AdoptionScreeningAnswers, value: string) {
    setAnswers((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitError(null);
  }

  async function onSubmit() {
    if (!firebaseUser || profile?.role !== 'adopter') {
      setSubmitError('Masuk sebagai adopter dulu untuk mengajukan adopsi.');
      return;
    }

    if (!pet || !petId) {
      setSubmitError('Data hewan belum siap. Muat ulang halaman lalu coba lagi.');
      return;
    }

    const validation = validateAdoptionScreeningAnswers(answers);

    if (!validation.valid) {
      setErrors(validation.errors);
      setSubmitError('Lengkapi semua pertanyaan screening sebelum mengirim.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      await submitAdoptionRequest({
        petId,
        ownerId: pet.ownerId,
        adopterId: firebaseUser.uid,
        screeningAnswers: validation.answers,
      });
      setSubmitted(true);
    } catch {
      setSubmitError('Pengajuan belum berhasil dikirim. Periksa koneksi lalu coba lagi.');
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || loading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator color="#0f766e" />
        <Text style={styles.stateText}>Menyiapkan form adopsi...</Text>
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={styles.centerState}>
        <Text style={styles.emptyTitle}>Form belum bisa dibuka</Text>
        <Text style={styles.emptyBody}>{loadError}</Text>
        <Pressable accessibilityRole="button" onPress={loadPet} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Coba lagi</Text>
        </Pressable>
      </View>
    );
  }

  if (!firebaseUser || profile?.role !== 'adopter') {
    return (
      <View style={styles.centerState}>
        <Text style={styles.emptyTitle}>Masuk sebagai adopter</Text>
        <Text style={styles.emptyBody}>Gunakan akun adopter untuk mengirim pengajuan adopsi.</Text>
      </View>
    );
  }

  if (!pet) {
    return (
      <View style={styles.centerState}>
        <Text style={styles.emptyTitle}>Hewan tidak ditemukan</Text>
        <Text style={styles.emptyBody}>Data hewan mungkin sudah tidak tersedia.</Text>
      </View>
    );
  }

  if (pet.status !== 'available') {
    return (
      <View style={styles.centerState}>
        <Text style={styles.emptyTitle}>Pengajuan belum tersedia</Text>
        <Text style={styles.emptyBody}>Hewan ini sedang dalam proses adopsi atau sudah diadopsi.</Text>
      </View>
    );
  }

  if (submitted) {
    return (
      <View style={styles.centerState}>
        <Text style={styles.successTitle}>Pengajuan terkirim</Text>
        <Text style={styles.emptyBody}>
          Terima kasih. Pemilik {pet.name} bisa meninjau jawaban screening kamu sekarang.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <BackButton />
      <View style={styles.header}>
        <Text style={styles.title}>Form Adopsi</Text>
        <Text style={styles.subtitle}>
          Jawaban ini membantu pemilik memastikan {pet.name} pindah ke rumah yang tepat.
        </Text>
      </View>

      <View style={styles.petSummary}>
        <Text style={styles.petName}>{pet.name}</Text>
        <Text style={styles.petMeta}>
          {pet.species} / {pet.age} / {pet.fullAddress || 'Lokasi belum tersedia'}
        </Text>
      </View>

      <TextField
        label="Alasan ingin mengadopsi"
        value={answers.adoptionReason}
        onChangeText={(value) => updateAnswer('adoptionReason', value)}
        error={errors.adoptionReason}
        multiline
        style={styles.multiline}
      />
      <TextField
        label="Pengalaman merawat hewan"
        value={answers.petCareExperience}
        onChangeText={(value) => updateAnswer('petCareExperience', value)}
        error={errors.petCareExperience}
        multiline
        style={styles.multiline}
      />
      <TextField
        label="Kondisi tempat tinggal"
        value={answers.livingCondition}
        onChangeText={(value) => updateAnswer('livingCondition', value)}
        error={errors.livingCondition}
        multiline
        style={styles.multiline}
      />
      <TextField
        label="Ketersediaan perawatan harian"
        value={answers.dailyCareAvailability}
        onChangeText={(value) => updateAnswer('dailyCareAvailability', value)}
        error={errors.dailyCareAvailability}
        multiline
        style={styles.multiline}
      />
      <TextField
        label="Kontak WhatsApp"
        value={answers.whatsappContact}
        onChangeText={(value) => updateAnswer('whatsappContact', value)}
        error={errors.whatsappContact}
        keyboardType="phone-pad"
        placeholder="08..."
      />

      {submitError ? <Text style={styles.errorBanner}>{submitError}</Text> : null}

      <Pressable style={[styles.button, submitting && styles.buttonDisabled]} onPress={onSubmit} disabled={submitting}>
        <Text style={styles.buttonText}>{submitting ? 'Mengirim...' : 'Kirim Pengajuan'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  content: { gap: 16, padding: 20, paddingBottom: 32 },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#f8fafc', padding: 24 },
  stateText: { color: '#475569', fontSize: 15, fontWeight: '600' },
  header: { gap: 6 },
  title: { color: '#0f766e', fontSize: 28, fontWeight: '800' },
  subtitle: { color: '#475569', fontSize: 15, lineHeight: 22 },
  petSummary: {
    gap: 6,
    borderWidth: 1,
    borderColor: '#ccfbf1',
    borderRadius: 8,
    padding: 14,
    backgroundColor: '#ffffff',
  },
  petName: { color: '#0f172a', fontSize: 18, fontWeight: '800' },
  petMeta: { color: '#475569', fontSize: 14, lineHeight: 20 },
  multiline: { minHeight: 96, paddingTop: 12, textAlignVertical: 'top' },
  errorBanner: {
    borderRadius: 8,
    padding: 12,
    color: '#991b1b',
    backgroundColor: '#fee2e2',
    fontSize: 14,
    fontWeight: '700',
  },
  button: { alignItems: 'center', borderRadius: 8, backgroundColor: '#0f766e', paddingVertical: 15 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#ffffff', fontWeight: '800' },
  emptyTitle: { color: '#0f172a', fontSize: 20, fontWeight: '800', textAlign: 'center' },
  successTitle: { color: '#0f766e', fontSize: 22, fontWeight: '900', textAlign: 'center' },
  emptyBody: { color: '#64748b', fontSize: 15, lineHeight: 22, textAlign: 'center' },
  retryButton: {
    borderRadius: 8,
    backgroundColor: '#0f766e',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  retryButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
});
