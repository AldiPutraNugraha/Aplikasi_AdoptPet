import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, View } from 'react-native';

import { PetCard } from '@/components/pets/PetCard';
import { sortByDistance } from '@/lib/domain/distance';
import { listAvailablePets } from '@/lib/firebase/pets';
import type { Coordinates, Pet } from '@/types/domain';

type PetWithDistance = Pet & { distanceKm?: number };

function includesFilter(value: string, filter: string) {
  return value.toLowerCase().includes(filter.trim().toLowerCase());
}

export default function SearchScreen() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [origin, setOrigin] = useState<Coordinates | null>(null);
  const [species, setSpecies] = useState('');
  const [primaryColor, setPrimaryColor] = useState('');
  const [loading, setLoading] = useState(true);
  const [locationDenied, setLocationDenied] = useState(false);

  const loadPets = useCallback(async () => {
    setLoading(true);
    try {
      setPets(await listAvailablePets());
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

  if (loading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator color="#0f766e" />
        <Text style={styles.stateText}>Memuat pencarian...</Text>
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
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#f8fafc' },
  stateText: { color: '#475569', fontSize: 15, fontWeight: '600' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 24 },
  emptyTitle: { color: '#0f172a', fontSize: 18, fontWeight: '800', textAlign: 'center' },
  emptyBody: { color: '#64748b', fontSize: 15, lineHeight: 22, textAlign: 'center' },
});
