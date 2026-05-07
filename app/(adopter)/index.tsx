import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';

import { PetCard } from '@/components/pets/PetCard';
import { listAvailablePets } from '@/lib/firebase/pets';
import type { Pet } from '@/types/domain';

export default function AdopterHomeScreen() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator color="#0f766e" />
        <Text style={styles.stateText}>Memuat hewan tersedia...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={pets}
      keyExtractor={(item) => item.id}
      style={styles.screen}
      contentContainerStyle={pets.length === 0 ? styles.emptyContent : styles.content}
      renderItem={({ item }) => (
        <PetCard pet={item} onPress={() => router.push(`/(adopter)/pets/${item.id}`)} />
      )}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>Cari Hewan</Text>
          <Text style={styles.body}>Temukan hewan yang sedang siap diadopsi.</Text>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Belum ada hewan tersedia</Text>
          <Text style={styles.emptyBody}>Cek lagi nanti saat pemilik menambahkan hewan untuk diadopsi.</Text>
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
  header: { gap: 6, marginBottom: 4 },
  title: { color: '#0f766e', fontSize: 28, fontWeight: '800' },
  body: { color: '#475569', fontSize: 16 },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#f8fafc' },
  stateText: { color: '#475569', fontSize: 15, fontWeight: '600' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 24 },
  emptyTitle: { color: '#0f172a', fontSize: 18, fontWeight: '800', textAlign: 'center' },
  emptyBody: { color: '#64748b', fontSize: 15, lineHeight: 22, textAlign: 'center' },
});
