import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PhotoPicker } from '@/components/forms/PhotoPicker';
import { SelectField } from '@/components/forms/SelectField';
import { TextField } from '@/components/forms/TextField';
import { useAuth } from '@/contexts/auth-context';
import { createPet } from '@/lib/firebase/pets';
import { uploadImageAsync } from '@/lib/firebase/storage';
import type { HealthStatus, Pet, PetSex } from '@/types/domain';

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
  const [saving, setSaving] = useState(false);

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
        fullAddress: profile.fullAddress,
        ...(profile.coordinates ? { coordinates: profile.coordinates } : {}),
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
      <View style={styles.header}>
        <Text style={styles.title}>Tambah Hewan</Text>
        <Text style={styles.subtitle}>Lokasi memakai alamat profil: {profile?.fullAddress || 'belum diisi'}.</Text>
      </View>

      <PhotoPicker label="Foto hewan" value={photoUris} onChange={setPhotoUris} buttonLabel="Pilih foto hewan" />
      <PhotoPicker
        label="Bukti kesehatan"
        value={healthProofUris}
        onChange={setHealthProofUris}
        buttonLabel="Pilih bukti kesehatan"
      />

      <TextField label="Nama" value={name} onChangeText={setName} />
      <TextField label="Jenis hewan" value={species} onChangeText={setSpecies} placeholder="Kucing, anjing, kelinci..." />
      <TextField label="Perkiraan ras" value={estimatedBreed} onChangeText={setEstimatedBreed} />
      <TextField label="Warna utama" value={primaryColor} onChangeText={setPrimaryColor} />
      <TextField label="Warna tambahan" value={secondaryColor} onChangeText={setSecondaryColor} />
      <TextField label="Pola bulu" value={furPattern} onChangeText={setFurPattern} placeholder="Polos, belang, calico..." />
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
  title: { color: '#0f766e', fontSize: 28, fontWeight: '800' },
  subtitle: { color: '#475569', fontSize: 14, lineHeight: 20 },
  multiline: { minHeight: 96, paddingTop: 12, textAlignVertical: 'top' },
  button: { alignItems: 'center', borderRadius: 8, backgroundColor: '#0f766e', paddingVertical: 15 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#ffffff', fontWeight: '800' },
});
