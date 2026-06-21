import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DropdownField } from '@/components/forms/DropdownField';
import { LocationPicker } from '@/components/forms/LocationPicker';
import { BackButton } from '@/components/ui/BackButton';
import { useBreedsBySpecies, usePetVocab } from '@/lib/hooks/use-pet-vocab';
import { PhotoPicker } from '@/components/forms/PhotoPicker';
import { SelectField } from '@/components/forms/SelectField';
import { TextField } from '@/components/forms/TextField';
import { useAuth } from '@/contexts/auth-context';
import { deletePet, getPetById, updatePet } from '@/lib/firebase/pets';
import { uploadImageAsync } from '@/lib/firebase/storage';
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

async function uploadImagesIfLocal(uid: string, folder: string, uris: string[]) {
  return Promise.all(
    uris.map(async (uri, index) => {
      if (uri.startsWith('http')) return uri;
      return uploadImageAsync(uri, `pets/${uid}/${folder}/${Date.now()}-${index}.jpg`);
    }),
  );
}

export default function EditPetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { firebaseUser } = useAuth();

  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const { vocab, loading: vocabLoading } = usePetVocab();
  const { breeds, loading: breedsLoading } = useBreedsBySpecies(species);

  useEffect(() => {
    let active = true;
    if (!id) return;

    (async () => {
      setLoading(true);
      try {
        const data = await getPetById(id);
        if (!active) return;
        if (!data) {
          Alert.alert('Hewan tidak ditemukan');
          router.back();
          return;
        }
        setPet(data);
        setPhotoUris(data.photoUrls ?? []);
        setHealthProofUris(data.healthProofUrls ?? []);
        setName(data.name);
        setSpecies(data.species);
        setEstimatedBreed(data.estimatedBreed ?? '');
        setPrimaryColor(data.primaryColor);
        setSecondaryColor(data.secondaryColor ?? '');
        setFurPattern(data.furPattern);
        setAge(data.age);
        setSex(data.sex);
        setVaccinationStatus(
          data.vaccinationStatus === 'vaccinated' ? 'yes' : (data.vaccinationStatus as HealthStatus),
        );
        setSterilizationStatus(data.sterilizationStatus);
        setMedicalHistory(data.medicalHistory ?? '');
        setDescription(data.description ?? '');
        setPetAddress(data.fullAddress);
        setPetCoordinates(data.coordinates);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [id]);

  async function onSave() {
    if (!firebaseUser || !pet) return;

    if (pet.ownerId !== firebaseUser.uid) {
      Alert.alert('Tidak diizinkan', 'Anda bukan pemilik hewan ini.');
      return;
    }

    if (!name.trim() || !species.trim() || !primaryColor.trim() || !furPattern.trim() || !age.trim()) {
      Alert.alert('Data belum lengkap', 'Nama, jenis hewan, warna utama, pola bulu, dan umur perlu diisi.');
      return;
    }

    if (photoUris.length === 0) {
      Alert.alert('Foto hewan belum ada', 'Tambahkan minimal satu foto hewan.');
      return;
    }

    if (!petAddress.trim()) {
      Alert.alert('Alamat hewan belum ada');
      return;
    }

    if (!petCoordinates) {
      Alert.alert('Titik lokasi belum ada', 'Tandai titik hewan di peta.');
      return;
    }

    setSaving(true);
    try {
      const [photoUrls, healthProofUrls] = await Promise.all([
        uploadImagesIfLocal(firebaseUser.uid, 'photos', photoUris),
        uploadImagesIfLocal(firebaseUser.uid, 'health-proofs', healthProofUris),
      ]);

      await updatePet(pet.id, {
        name: name.trim(),
        species: species.trim(),
        ...(estimatedBreed.trim() ? { estimatedBreed: estimatedBreed.trim() } : { estimatedBreed: '' }),
        primaryColor: primaryColor.trim(),
        ...(secondaryColor.trim() ? { secondaryColor: secondaryColor.trim() } : { secondaryColor: '' }),
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
      });

      Alert.alert('Berhasil', 'Data hewan diperbarui.');
      router.replace('/(owner)');
    } catch (error) {
      Alert.alert('Gagal menyimpan', error instanceof Error ? error.message : 'Coba lagi.');
    } finally {
      setSaving(false);
    }
  }

  function onDelete() {
    if (!pet) return;

    Alert.alert(
      'Hapus hewan?',
      `Yakin ingin menghapus "${pet.name}"? Tindakan ini tidak bisa dibatalkan.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deletePet(pet.id);
              Alert.alert('Berhasil', 'Hewan dihapus.');
              router.replace('/(owner)');
            } catch (error) {
              Alert.alert('Gagal menghapus', error instanceof Error ? error.message : 'Coba lagi.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#0f766e" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <BackButton />
      <View style={styles.header}>
        <Text style={styles.title}>Edit Hewan</Text>
        <Text style={styles.subtitle}>Perbarui detail hewan atau hapus dari daftar.</Text>
      </View>

      <PhotoPicker label="Foto hewan" value={photoUris} onChange={setPhotoUris} buttonLabel="Pilih foto hewan" />
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
        loading={vocabLoading}
        onChange={(next) => {
          setSpecies(next);
          setEstimatedBreed('');
        }}
      />
      <DropdownField
        label="Perkiraan ras"
        value={estimatedBreed}
        options={breeds}
        loading={breedsLoading}
        onChange={setEstimatedBreed}
        placeholder={species ? 'Pilih ras...' : 'Pilih jenis hewan dulu'}
      />
      <DropdownField
        label="Warna utama"
        value={primaryColor}
        options={vocab.primaryColors}
        loading={vocabLoading}
        onChange={setPrimaryColor}
      />
      <DropdownField
        label="Warna tambahan"
        value={secondaryColor}
        options={vocab.secondaryColors}
        loading={vocabLoading}
        onChange={setSecondaryColor}
      />
      <DropdownField
        label="Pola bulu"
        value={furPattern}
        options={vocab.furPatterns}
        loading={vocabLoading}
        onChange={setFurPattern}
      />
      <TextField label="Umur" value={age} onChangeText={setAge} />

      <SelectField label="Jenis kelamin" value={sex} options={sexOptions} onChange={setSex} />
      <SelectField label="Sudah vaksin?" value={vaccinationStatus} options={healthOptions} onChange={setVaccinationStatus} />
      <SelectField label="Sudah steril?" value={sterilizationStatus} options={healthOptions} onChange={setSterilizationStatus} />

      <TextField label="Riwayat medis" value={medicalHistory} onChangeText={setMedicalHistory} multiline style={styles.multiline} />
      <TextField label="Deskripsi" value={description} onChangeText={setDescription} multiline style={styles.multiline} />

      <LocationPicker
        label="Lokasi hewan"
        address={petAddress}
        coordinates={petCoordinates}
        onAddressChange={setPetAddress}
        onCoordinatesChange={setPetCoordinates}
      />

      <Pressable style={[styles.button, saving && styles.buttonDisabled]} onPress={onSave} disabled={saving || deleting}>
        <Text style={styles.buttonText}>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</Text>
      </Pressable>

      <Pressable
        style={[styles.deleteButton, deleting && styles.buttonDisabled]}
        onPress={onDelete}
        disabled={saving || deleting}
      >
        <Text style={styles.deleteButtonText}>{deleting ? 'Menghapus...' : 'Hapus Hewan'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  content: { gap: 16, padding: 20, paddingBottom: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
  header: { gap: 6 },
  title: { color: '#0f766e', fontSize: 28, fontWeight: '800' },
  subtitle: { color: '#475569', fontSize: 14, lineHeight: 20 },
  multiline: { minHeight: 96, paddingTop: 12, textAlignVertical: 'top' },
  button: { alignItems: 'center', borderRadius: 8, backgroundColor: '#0f766e', paddingVertical: 15 },
  buttonText: { color: '#ffffff', fontWeight: '800' },
  buttonDisabled: { opacity: 0.6 },
  deleteButton: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
    paddingVertical: 14,
  },
  deleteButtonText: { color: '#b91c1c', fontWeight: '800' },
});
