import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { PhotoPicker } from '@/components/forms/PhotoPicker';
import { PetCard } from '@/components/pets/PetCard';
import { useAuth } from '@/contexts/auth-context';
import { analyzePetImage } from '@/lib/ai/openrouter-client';
import { sortByDistance } from '@/lib/domain/distance';
import { sortPetsByVisualMatch } from '@/lib/domain/visual-match';
import { listAvailablePets } from '@/lib/firebase/pets';
import { uploadImageAsync } from '@/lib/firebase/storage';
import type { Coordinates, Pet, VisualAttributes } from '@/types/domain';

type PetWithDistance = Pet & { distanceKm?: number };
type PetWithVisualScore = Pet & { visualScore?: number };

function includesFilter(value: string, filter: string) {
  return value.toLowerCase().includes(filter.trim().toLowerCase());
}

export default function SearchScreen() {
  const { firebaseUser } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [origin, setOrigin] = useState<Coordinates | null>(null);
  const [species, setSpecies] = useState('');
  const [primaryColor, setPrimaryColor] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [visualAttributes, setVisualAttributes] = useState<VisualAttributes | null>(null);
  const [visualResults, setVisualResults] = useState<PetWithVisualScore[]>([]);

  const loadPets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPets(await listAvailablePets());
    } catch {
      setError('Gagal memuat hasil pencarian. Periksa koneksi lalu coba lagi.');
      setPets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPets();
  }, [loadPets]);

  useEffect(() => {
    async function loadLocation() {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== Location.PermissionStatus.GRANTED) {
          setLocationDenied(true);
          return;
        }

        const current = await Location.getCurrentPositionAsync({});
        setOrigin({
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
        });
      } catch {
        setLocationDenied(true);
      }
    }

    void loadLocation();
  }, []);

  const results = useMemo<PetWithDistance[]>(() => {
    const filtered = pets.filter((pet) => {
      const matchesSpecies = species.trim() ? includesFilter(pet.species, species) : true;
      const matchesColor = primaryColor.trim() ? includesFilter(pet.primaryColor, primaryColor) : true;
      return matchesSpecies && matchesColor;
    });

    return origin ? sortByDistance(origin, filtered) : filtered;
  }, [origin, pets, primaryColor, species]);

  async function runVisualSearch() {
    if (!firebaseUser) {
      Alert.alert('Login diperlukan', 'Masuk terlebih dahulu untuk memakai pencarian visual.');
      return;
    }

    if (imageUris.length === 0) {
      Alert.alert('Pilih foto dulu', 'Tambahkan satu foto referensi hewan untuk dianalisis.');
      return;
    }

    setAiLoading(true);

    try {
      const imagePath = `search/${firebaseUser.uid}/${Date.now()}.jpg`;
      await uploadImageAsync(imageUris[0], imagePath);
      const attributes = await analyzePetImage(imagePath);
      setVisualAttributes(attributes);
      setVisualResults(sortPetsByVisualMatch(pets, attributes));
    } catch (caughtError) {
      Alert.alert(
        'Pencarian visual gagal',
        caughtError instanceof Error ? caughtError.message : 'Gunakan pencarian manual atau coba foto lain.',
      );
    } finally {
      setAiLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator color="#0f766e" />
        <Text style={styles.stateText}>Memuat pencarian...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerState}>
        <Text style={styles.emptyTitle}>Tidak bisa memuat pencarian</Text>
        <Text style={styles.emptyBody}>{error}</Text>
        {locationDenied ? (
          <Text style={styles.notice}>Izin lokasi tidak aktif. Hasil tetap ditampilkan tanpa urutan jarak.</Text>
        ) : null}
        <Pressable accessibilityRole="button" onPress={loadPets} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Coba lagi</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      data={results}
      keyExtractor={(item) => item.id}
      style={styles.screen}
      contentContainerStyle={results.length === 0 ? styles.emptyContent : styles.content}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>Pencarian</Text>
          <Text style={styles.body}>Saring manual berdasarkan jenis hewan dan warna utama.</Text>
          {locationDenied ? (
            <Text style={styles.notice}>Izin lokasi tidak aktif. Hasil tetap ditampilkan tanpa urutan jarak.</Text>
          ) : null}
          <View style={styles.filters}>
            <View style={styles.field}>
              <Text style={styles.label}>Jenis hewan</Text>
              <TextInput
                value={species}
                onChangeText={setSpecies}
                placeholder="Kucing, anjing..."
                style={styles.input}
                autoCapitalize="none"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Warna utama</Text>
              <TextInput
                value={primaryColor}
                onChangeText={setPrimaryColor}
                placeholder="Putih, hitam..."
                style={styles.input}
                autoCapitalize="none"
              />
            </View>
          </View>
          <View style={styles.visualSearch}>
            <Text style={styles.sectionTitle}>Pencarian visual</Text>
            <PhotoPicker
              label="Foto referensi"
              value={imageUris}
              onChange={setImageUris}
              buttonLabel="Pilih foto referensi"
              selectionLimit={1}
            />
            <Pressable
              accessibilityRole="button"
              style={[styles.button, aiLoading ? styles.buttonDisabled : null]}
              onPress={runVisualSearch}
              disabled={aiLoading}
            >
              <Text style={styles.buttonText}>{aiLoading ? 'Menganalisis...' : 'Cari dari Gambar'}</Text>
            </Pressable>
            {visualAttributes ? (
              <Text style={styles.aiText}>
                Perkiraan: {visualAttributes.species}, {visualAttributes.primaryColor}, {visualAttributes.furPattern}
                {visualAttributes.estimatedBreed ? `, ${visualAttributes.estimatedBreed}` : ''} (
                {Math.round(visualAttributes.confidence * 100)}%)
              </Text>
            ) : null}
            {visualResults.length > 0 ? (
              <View style={styles.visualResults}>
                <Text style={styles.sectionTitle}>Hasil visual</Text>
                {visualResults.map((pet) => (
                  <View key={pet.id} style={styles.visualResultItem}>
                    <Text style={styles.scoreText}>Skor visual: {pet.visualScore ?? 0}</Text>
                    <PetCard pet={pet} onPress={() => router.push(`/(adopter)/pets/${pet.id}`)} />
                  </View>
                ))}
              </View>
            ) : null}
          </View>
          <Text style={styles.sectionTitle}>Hasil manual</Text>
        </View>
      }
      renderItem={({ item }) => (
        <PetCard pet={item} onPress={() => router.push(`/(adopter)/pets/${item.id}`)} />
      )}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Tidak ada hasil</Text>
          <Text style={styles.emptyBody}>Coba longgarkan jenis hewan atau warna utama.</Text>
        </View>
      }
      onRefresh={loadPets}
      refreshing={loading}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  content: { gap: 12, padding: 20, paddingBottom: 32 },
  emptyContent: { flexGrow: 1, gap: 20, padding: 20 },
  header: { gap: 12, marginBottom: 4 },
  title: { color: '#0f766e', fontSize: 28, fontWeight: '800' },
  body: { color: '#475569', fontSize: 15, lineHeight: 22 },
  notice: {
    borderRadius: 8,
    backgroundColor: '#fef3c7',
    color: '#92400e',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
    padding: 12,
  },
  filters: { gap: 12 },
  field: { gap: 6 },
  label: { color: '#1f2937', fontSize: 14, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    color: '#0f172a',
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  visualSearch: {
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    marginTop: 6,
    paddingTop: 16,
  },
  sectionTitle: { color: '#0f172a', fontSize: 17, fontWeight: '800' },
  button: {
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#0f766e',
    paddingVertical: 13,
  },
  buttonDisabled: { opacity: 0.65 },
  buttonText: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
  aiText: {
    borderRadius: 8,
    backgroundColor: '#ecfdf5',
    color: '#065f46',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    padding: 12,
  },
  visualResults: { gap: 10 },
  visualResultItem: { gap: 6 },
  scoreText: { color: '#0f766e', fontSize: 13, fontWeight: '800' },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#f8fafc' },
  stateText: { color: '#475569', fontSize: 15, fontWeight: '600' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 24 },
  emptyTitle: { color: '#0f172a', fontSize: 18, fontWeight: '800', textAlign: 'center' },
  emptyBody: { color: '#64748b', fontSize: 15, lineHeight: 22, textAlign: 'center' },
  retryButton: {
    borderRadius: 8,
    backgroundColor: '#0f766e',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  retryButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
});
