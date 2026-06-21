import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DropdownField } from '@/components/forms/DropdownField';
import { LocationPicker } from '@/components/forms/LocationPicker';
import { PhotoPicker } from '@/components/forms/PhotoPicker';
import { SelectField } from '@/components/forms/SelectField';
import { TextField } from '@/components/forms/TextField';
import { BackButton } from '@/components/ui/BackButton';
import { useAuth } from '@/contexts/auth-context';
import { analyzePetForForm } from '@/lib/ai/analyze-for-form';
import { createPet } from '@/lib/firebase/pets';
import { uploadImageAsync } from '@/lib/firebase/storage';
import { useBreedsBySpecies, usePetVocab } from '@/lib/hooks/use-pet-vocab';
import type { Coordinates, HealthStatus, Pet, PetSex } from '@/types/domain';

const healthOptions: { label: string; value: HealthStatus }[] = [
  { label: 'Ya', value: 'yes' },
  { label: 'Tidak', value: 'no' },
  { label: 'Belum tahu', value: 'unknown' },
];

const sexOptions: { label: string; value: PetSex }[] = [
  { label: 'Jantan', value: 'male' },
  { label: 'Betina', value: 'female' },
  { label: 'Belum tahu', value: 'unknown' },
];

async function uploadSelectedImages(uid: string, folder: string, uris: string[]) {
  return Promise.all(
    uris.map((uri, index) =>
      uploadImageAsync(uri, `pets/${uid}/${folder}/${Date.now()}-${index}.jpg`),
    ),
  );
}

export default function NewPetScreen() {
  const { firebaseUser, profile } = useAuth();
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [healthProofUris, setHealthProofUris] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [estimatedBreed, setEstimatedBreed] = useState('');
  const [primaryColor, setPrimaryColor] = useState('');
  const [secondaryColor, setSecondaryColor] = useState('');
  const [furPattern, setFurPattern] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState<PetSex>('unknown');
  const [vaccinationStatus, setVaccinationStatus] = useState<HealthStatus>('unknown');
  const [sterilizationStatus, setSterilizationStatus] = useState<HealthStatus>('unknown');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [description, setDescription] = useState('');
  const [petAddress, setPetAddress] = useState('');
  const [petCoordinates, setPetCoordinates] = useState<Coordinates | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [autoFilling, setAutoFilling] = useState(false);
  const [autoFilledFrom, setAutoFilledFrom] = useState<string | null>(null);
  const { vocab, loading: vocabLoading } = usePetVocab();
  const { breeds, loading: breedsLoading } = useBreedsBySpecies(species);

  function resetForm() {
    Alert.alert(
      'Reset form?',
      'Semua field dan foto yang sudah diisi akan dihapus. Yakin?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setPhotoUris([]);
            setHealthProofUris([]);
            setName('');
            setSpecies('');
            setEstimatedBreed('');
            setPrimaryColor('');
            setSecondaryColor('');
            setFurPattern('');
            setAge('');
            setSex('unknown');
            setVaccinationStatus('unknown');
            setSterilizationStatus('unknown');
            setMedicalHistory('');
            setDescription('');
            setPetAddress('');
            setPetCoordinates(undefined);
            setAutoFilledFrom(null);
          },
        },
      ],
    );
  }

  async function handlePhotosChange(next: string[]) {
    setPhotoUris(next);

    if (next.length === 0 || !firebaseUser) return;

    const firstPhoto = next[0];
    if (autoFilledFrom === firstPhoto || autoFilling) return;

    setAutoFilling(true);
    try {
      const uploadPath = `pets/${firebaseUser.uid}/ai-preview/${Date.now()}.jpg`;
      const downloadUrl = await uploadImageAsync(firstPhoto, uploadPath);
      const suggestion = await analyzePetForForm(downloadUrl);

      setSpecies((prev) => prev || suggestion.species);
      setEstimatedBreed((prev) => prev || suggestion.estimatedBreed);
      setPrimaryColor((prev) => prev || suggestion.primaryColor);
      setSecondaryColor((prev) => prev || suggestion.secondaryColor);
      setFurPattern((prev) => prev || suggestion.furPattern);
      setAutoFilledFrom(firstPhoto);

      Alert.alert(
        'Auto-isi selesai',
        `AI menebak: ${suggestion.species} / ${suggestion.estimatedBreed} / ${suggestion.primaryColor}. Periksa & ubah jika perlu.`,
      );
    } catch (error) {
      console.warn('[NewPet] auto-fill failed', error);
      Alert.alert(
        'Auto-isi gagal',
        error instanceof Error ? error.message : 'Isi manual jenis, ras, warna, dan pola bulu.',
      );
    } finally {
      setAutoFilling(false);
    }
  }

  async function onSubmit() {
    if (!firebaseUser || !profile) {
      Alert.alert('Profil belum siap', 'Masuk dan lengkapi profil dulu sebelum menambahkan hewan.');
      return;
    }

    if (!name.trim() || !species.trim() || !primaryColor.trim() || !furPattern.trim() || !age.trim()) {
      Alert.alert('Data belum lengkap', 'Nama, jenis hewan, warna utama, pola bulu, dan umur perlu diisi.');
      return;
    }

    if (photoUris.length === 0) {
      Alert.alert('Foto hewan belum ada', 'Tambahkan minimal satu foto hewan agar calon adopter bisa melihatnya.');
      return;
    }

    if (!petAddress.trim()) {
      Alert.alert('Alamat hewan belum ada', 'Isi alamat lokasi hewan agar calon adopter tahu posisinya.');
      return;
    }

    if (!petCoordinates) {
      Alert.alert('Titik lokasi belum ada', 'Ambil lokasi GPS atau tandai titik hewan di peta.');
      return;
    }

    setSaving(true);
    try {
      const [photoUrls, healthProofUrls] = await Promise.all([
        uploadSelectedImages(firebaseUser.uid, 'photos', photoUris),
        uploadSelectedImages(firebaseUser.uid, 'health-proofs', healthProofUris),
      ]);

      const petPayload: Omit<Pet, 'id' | 'createdAt' | 'updatedAt'> = {
        ownerId: firebaseUser.uid,
        name: name.trim(),
        species: species.trim(),
        ...(estimatedBreed.trim() ? { estimatedBreed: estimatedBreed.trim() } : {}),
        primaryColor: primaryColor.trim(),
        ...(secondaryColor.trim() ? { secondaryColor: secondaryColor.trim() } : {}),
        furPattern: furPattern.trim(),
        age: age.trim(),
        sex,
        description: description.trim(),
        photoUrls,
        vaccinationStatus,
        sterilizationStatus,
        medicalHistory: medicalHistory.trim(),
        healthProofUrls,
        fullAddress: petAddress.trim(),
        coordinates: petCoordinates,
        status: 'available',
      };

      await createPet(petPayload);

      router.replace('/(owner)');
    } catch (error) {
      Alert.alert('Hewan gagal disimpan', error instanceof Error ? error.message : 'Coba lagi sebentar lagi.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <BackButton />
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Tambah Hewan</Text>
          <Text style={styles.subtitle}>Tandai lokasi hewan di peta agar calon adopter terdekat bisa menemukannya.</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.resetButton, pressed && styles.resetButtonPressed]}
          onPress={resetForm}
          disabled={autoFilling || saving}
          accessibilityRole="button"
          accessibilityLabel="Reset form"
        >
          <Ionicons name="refresh" size={18} color="#b91c1c" />
          <Text style={styles.resetButtonText}>Reset</Text>
        </Pressable>
      </View>

      <PhotoPicker label="Foto hewan" value={photoUris} onChange={handlePhotosChange} buttonLabel="Pilih foto hewan" />
      {autoFilling ? (
        <Text style={styles.aiHint}>AI sedang menganalisis foto untuk mengisi otomatis...</Text>
      ) : null}
      <PhotoPicker
        label="Bukti kesehatan"
        value={healthProofUris}
        onChange={setHealthProofUris}
        buttonLabel="Pilih bukti kesehatan"
      />

      <TextField label="Nama" value={name} onChangeText={setName} />
      <DropdownField
        label="Jenis hewan"
        value={species}
        options={vocab.species}
        loading={vocabLoading || autoFilling}
        onChange={(next) => {
          setSpecies(next);
          setEstimatedBreed('');
        }}
        placeholder="Pilih jenis hewan..."
      />
      <DropdownField
        label="Perkiraan ras"
        value={estimatedBreed}
        options={breeds}
        loading={breedsLoading || autoFilling}
        onChange={setEstimatedBreed}
        placeholder={species ? 'Pilih ras...' : 'Pilih jenis hewan dulu'}
      />
      <DropdownField
        label="Warna utama"
        value={primaryColor}
        options={vocab.primaryColors}
        loading={vocabLoading || autoFilling}
        onChange={setPrimaryColor}
        placeholder="Pilih warna utama..."
      />
      <DropdownField
        label="Warna tambahan"
        value={secondaryColor}
        options={vocab.secondaryColors}
        loading={vocabLoading || autoFilling}
        onChange={setSecondaryColor}
        placeholder="Pilih warna tambahan..."
      />
      <DropdownField
        label="Pola bulu"
        value={furPattern}
        options={vocab.furPatterns}
        loading={vocabLoading || autoFilling}
        onChange={setFurPattern}
        placeholder="Pilih pola bulu..."
      />
      <TextField label="Umur" value={age} onChangeText={setAge} placeholder="2 tahun, 6 bulan..." />

      <SelectField label="Jenis kelamin" value={sex} options={sexOptions} onChange={setSex} />
      <SelectField
        label="Sudah vaksin?"
        value={vaccinationStatus}
        options={healthOptions}
        onChange={setVaccinationStatus}
      />
      <SelectField
        label="Sudah steril?"
        value={sterilizationStatus}
        options={healthOptions}
        onChange={setSterilizationStatus}
      />

      <TextField
        label="Riwayat medis"
        value={medicalHistory}
        onChangeText={setMedicalHistory}
        multiline
        style={styles.multiline}
      />
      <TextField
        label="Deskripsi"
        value={description}
        onChangeText={setDescription}
        multiline
        style={styles.multiline}
      />

      <LocationPicker
        label="Lokasi hewan"
        address={petAddress}
        coordinates={petCoordinates}
        onAddressChange={setPetAddress}
        onCoordinatesChange={setPetCoordinates}
      />

      <Pressable style={[styles.button, saving && styles.buttonDisabled]} onPress={onSubmit} disabled={saving}>
        <Text style={styles.buttonText}>{saving ? 'Menyimpan...' : 'Simpan Hewan'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  content: { gap: 16, padding: 20, paddingBottom: 32 },
  header: { gap: 6 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  headerText: { flex: 1, gap: 6 },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 999,
    paddingLeft: 10,
    paddingRight: 14,
    paddingVertical: 8,
    backgroundColor: '#fef2f2',
  },
  resetButtonPressed: { opacity: 0.6 },
  resetButtonText: { color: '#b91c1c', fontSize: 13, fontWeight: '800' },
  title: { color: '#0f766e', fontSize: 28, fontWeight: '800' },
  subtitle: { color: '#475569', fontSize: 14, lineHeight: 20 },
  multiline: { minHeight: 96, paddingTop: 12, textAlignVertical: 'top' },
  button: { alignItems: 'center', borderRadius: 8, backgroundColor: '#0f766e', paddingVertical: 15 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#ffffff', fontWeight: '800' },
  aiHint: {
    borderRadius: 8,
    backgroundColor: '#ecfdf5',
    color: '#065f46',
    fontSize: 13,
    fontWeight: '700',
    padding: 10,
  },
});
