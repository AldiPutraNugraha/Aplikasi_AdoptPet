import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/contexts/auth-context';
import { listOwnerPets } from '@/lib/firebase/pets';
import type { Pet } from '@/types/domain';

export default function OwnerHomeScreen() {
  const { firebaseUser } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadPets() {
        if (!firebaseUser) {
          setPets([]);
          setLoading(false);
          return;
        }

        setLoading(true);
        try {
          const ownerPets = await listOwnerPets(firebaseUser.uid);
          if (active) {
            setPets(ownerPets);
          }
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      }

      loadPets();

      return () => {
        active = false;
      };
    }, [firebaseUser]),
  );

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>Pelepas Hewan</Text>
          <Text style={styles.title}>Hewan Saya</Text>
        </View>
        <Pressable style={styles.addButton} onPress={() => router.push('/(owner)/pets/new')}>
          <Text style={styles.addButtonText}>Tambah</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.state}>
          <ActivityIndicator color="#0f766e" />
          <Text style={styles.stateText}>Memuat daftar hewan...</Text>
        </View>
      ) : pets.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Belum ada hewan</Text>
          <Text style={styles.emptyText}>Tambahkan hewan pertama agar calon pengadopsi bisa melihat profilnya.</Text>
          <Pressable style={styles.emptyButton} onPress={() => router.push('/(owner)/pets/new')}>
            <Text style={styles.emptyButtonText}>Tambah Hewan</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={pets}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => router.push(`/(owner)/pets/${item.id}`)}
            >
              {item.photoUrls[0] ? (
                <Image source={{ uri: item.photoUrls[0] }} style={styles.petImage} contentFit="cover" />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Text style={styles.imagePlaceholderText}>Foto</Text>
                </View>
              )}
              <View style={styles.cardBody}>
                <View style={styles.cardHeader}>
                  <Text style={styles.petName}>{item.name}</Text>
                  <Text style={styles.status}>{item.status}</Text>
                </View>
                <Text style={styles.petMeta}>
                  {item.species} - {item.sex} - {item.age}
                </Text>
                <Text style={styles.petDescription} numberOfLines={2}>
                  {item.description}
                </Text>
                <Text style={styles.editHint}>Ketuk untuk edit / hapus</Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, gap: 18, padding: 20, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14 },
  headerText: { flex: 1, gap: 2 },
  eyebrow: { color: '#64748b', fontSize: 13, fontWeight: '700', textTransform: 'uppercase' },
  title: { color: '#0f766e', fontSize: 28, fontWeight: '800' },
  addButton: { borderRadius: 8, backgroundColor: '#0f766e', paddingHorizontal: 16, paddingVertical: 11 },
  addButtonText: { color: '#ffffff', fontWeight: '800' },
  state: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  stateText: { color: '#475569', fontSize: 15 },
  emptyState: {
    gap: 12,
    borderWidth: 1,
    borderColor: '#dbeafe',
    borderRadius: 8,
    padding: 18,
    backgroundColor: '#ffffff',
  },
  emptyTitle: { color: '#0f172a', fontSize: 18, fontWeight: '800' },
  emptyText: { color: '#475569', fontSize: 15, lineHeight: 22 },
  emptyButton: { alignItems: 'center', borderRadius: 8, backgroundColor: '#0f766e', paddingVertical: 13 },
  emptyButtonText: { color: '#ffffff', fontWeight: '800' },
  list: { gap: 12, paddingBottom: 24 },
  card: {
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#ffffff',
  },
  petImage: { width: 84, height: 84, borderRadius: 8, backgroundColor: '#e2e8f0' },
  imagePlaceholder: {
    width: 84,
    height: 84,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
  },
  imagePlaceholderText: { color: '#64748b', fontWeight: '700' },
  cardBody: { flex: 1, gap: 6 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  petName: { flex: 1, color: '#0f172a', fontSize: 17, fontWeight: '800' },
  status: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    color: '#0f766e',
    backgroundColor: '#ccfbf1',
    fontSize: 12,
    fontWeight: '800',
  },
  petMeta: { color: '#334155', fontSize: 13, fontWeight: '600' },
  petDescription: { color: '#64748b', fontSize: 13, lineHeight: 18 },
  cardPressed: { opacity: 0.6 },
  editHint: { color: '#0f766e', fontSize: 12, fontWeight: '700', marginTop: 4 },
});
