import { Link, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PetHealthSummary } from '@/components/pets/PetHealthSummary';
import { PetMap } from '@/components/pets/PetMap';
import { getPetById } from '@/lib/firebase/pets';
import type { Pet } from '@/types/domain';

function firstPhotoUrl(photoUrls?: string[]) {
  return photoUrls?.find((url) => url.trim().length > 0);
}

export default function PetDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const petId = Array.isArray(id) ? id[0] : id;
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [heroImageError, setHeroImageError] = useState(false);

  const loadPet = useCallback(async () => {
    if (!petId) {
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      setPet(await getPetById(petId));
    } catch {
      setError('Gagal memuat detail hewan. Periksa koneksi lalu coba lagi.');
      setPet(null);
    } finally {
      setLoading(false);
    }
  }, [petId]);

  useEffect(() => {
    void loadPet();
  }, [loadPet]);

  useEffect(() => {
    setHeroImageError(false);
  }, [pet?.id]);

  if (loading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator color="#0f766e" />
        <Text style={styles.stateText}>Memuat detail hewan...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerState}>
        <Text style={styles.emptyTitle}>Tidak bisa memuat detail</Text>
        <Text style={styles.emptyBody}>{error}</Text>
        <Pressable accessibilityRole="button" onPress={loadPet} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Coba lagi</Text>
        </Pressable>
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

  const imageUri = firstPhotoUrl(pet.photoUrls);
  const shouldShowHeroImage = imageUri && !heroImageError;
  const breedLine = [pet.species, pet.estimatedBreed].filter(Boolean).join(' / ');

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {shouldShowHeroImage ? (
        <Image source={{ uri: imageUri }} style={styles.heroImage} resizeMode="cover" onError={() => setHeroImageError(true)} />
      ) : (
        <View style={styles.heroPlaceholder}>
          <Text style={styles.placeholderText}>Foto belum tersedia</Text>
        </View>
      )}

      <View style={styles.header}>
        <Text style={styles.title}>{pet.name}</Text>
        <Text style={styles.meta}>{breedLine}</Text>
        <Text style={styles.meta}>
          {pet.primaryColor} / {pet.furPattern} / {pet.age}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tentang</Text>
        <Text style={styles.description}>
          {pet.description?.trim() || 'Pemilik belum menambahkan deskripsi untuk hewan ini.'}
        </Text>
      </View>

      <PetHealthSummary pet={pet} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lokasi</Text>
        <PetMap coordinates={pet.coordinates} title={pet.name} />
        <Text style={styles.address}>{pet.fullAddress || 'Alamat lengkap belum tersedia.'}</Text>
      </View>

      <Link href={`/(adopter)/requests/${pet.id}`} style={styles.button}>
        Ajukan Adopsi
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  content: { gap: 18, padding: 20, paddingBottom: 32 },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#f8fafc', padding: 24 },
  stateText: { color: '#475569', fontSize: 15, fontWeight: '600' },
  heroImage: { width: '100%', height: 280, borderRadius: 8, backgroundColor: '#e2e8f0' },
  heroPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 280,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
  },
  placeholderText: { color: '#64748b', fontSize: 16, fontWeight: '800' },
  header: { gap: 6 },
  title: { color: '#0f172a', fontSize: 30, fontWeight: '900' },
  meta: { color: '#475569', fontSize: 15, lineHeight: 22 },
  section: { gap: 10 },
  sectionTitle: { color: '#0f172a', fontSize: 18, fontWeight: '800' },
  description: { color: '#334155', fontSize: 15, lineHeight: 23 },
  address: { color: '#475569', fontSize: 14, lineHeight: 21 },
  button: {
    overflow: 'hidden',
    borderRadius: 8,
    backgroundColor: '#0f766e',
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    paddingVertical: 15,
    textAlign: 'center',
  },
  emptyTitle: { color: '#0f172a', fontSize: 20, fontWeight: '800', textAlign: 'center' },
  emptyBody: { color: '#64748b', fontSize: 15, lineHeight: 22, textAlign: 'center' },
  retryButton: {
    borderRadius: 8,
    backgroundColor: '#0f766e',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  retryButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
});
