import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { PetCard } from '@/components/pets/PetCard';
import { BackButton } from '@/components/ui/BackButton';
import { getUserProfile } from '@/lib/firebase/auth';
import { listAvailablePetsByOwner } from '@/lib/firebase/pets';
import type { AppUser, Pet } from '@/types/domain';

export default function OwnerProfileScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const ownerId = Array.isArray(id) ? id[0] : id;

  const [owner, setOwner] = useState<AppUser | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!ownerId) return;
    setLoading(true);
    setError(null);
    try {
      const [profile, ownerPets] = await Promise.all([
        getUserProfile(ownerId),
        listAvailablePetsByOwner(ownerId),
      ]);
      setOwner(profile);
      setPets(ownerPets);
    } catch {
      setError('Gagal memuat profil pelepas hewan.');
      setOwner(null);
      setPets([]);
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#0f766e" />
        <Text style={styles.stateText}>Memuat profil...</Text>
      </View>
    );
  }

  if (error || !owner) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Profil tidak ditemukan</Text>
        <Text style={styles.emptyBody}>{error ?? 'Data pelepas hewan tidak tersedia.'}</Text>
        <Pressable style={styles.retryButton} onPress={load}>
          <Text style={styles.retryButtonText}>Coba lagi</Text>
        </Pressable>
      </View>
    );
  }

  const initial = (owner.name || owner.email || '?').charAt(0).toUpperCase();

  return (
    <FlatList
      data={pets}
      keyExtractor={(item) => item.id}
      style={styles.screen}
      contentContainerStyle={pets.length === 0 ? styles.emptyContent : styles.content}
      ListHeaderComponent={
        <View style={styles.headerGroup}>
          <BackButton />
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.name}>{owner.name || 'Tanpa nama'}</Text>
              <Text style={styles.role}>Pelepas Hewan</Text>
              {owner.phoneNumber ? (
                <View style={styles.row}>
                  <Ionicons name="call-outline" size={14} color="#475569" />
                  <Text style={styles.rowText}>{owner.phoneNumber}</Text>
                </View>
              ) : null}
              {owner.fullAddress ? (
                <View style={styles.row}>
                  <Ionicons name="location-outline" size={14} color="#475569" />
                  <Text style={styles.rowText}>{owner.fullAddress}</Text>
                </View>
              ) : null}
            </View>
          </View>
          <Text style={styles.sectionTitle}>Hewan tersedia ({pets.length})</Text>
        </View>
      }
      renderItem={({ item }) => (
        <PetCard pet={item} onPress={() => router.push(`/(adopter)/pets/${item.id}`)} />
      )}
      ListEmptyComponent={
        <View style={styles.emptyInline}>
          <Text style={styles.emptyTitle}>Belum ada hewan tersedia</Text>
          <Text style={styles.emptyBody}>Pemilik ini belum memiliki hewan dengan status tersedia.</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  content: { gap: 12, padding: 20, paddingBottom: 32 },
  emptyContent: { flexGrow: 1, gap: 16, padding: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, backgroundColor: '#f8fafc' },
  stateText: { color: '#475569', fontSize: 15, fontWeight: '600' },
  headerGroup: { gap: 16, marginBottom: 4 },
  profileCard: {
    flexDirection: 'row',
    gap: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    padding: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0f766e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#ffffff', fontSize: 28, fontWeight: '800' },
  profileInfo: { flex: 1, gap: 4 },
  name: { color: '#0f172a', fontSize: 18, fontWeight: '800' },
  role: { color: '#0f766e', fontSize: 12, fontWeight: '800', marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowText: { flex: 1, color: '#475569', fontSize: 13 },
  sectionTitle: { color: '#0f172a', fontSize: 16, fontWeight: '800' },
  emptyInline: { alignItems: 'center', gap: 6, paddingVertical: 20 },
  emptyTitle: { color: '#0f172a', fontSize: 18, fontWeight: '800', textAlign: 'center' },
  emptyBody: { color: '#64748b', fontSize: 14, lineHeight: 21, textAlign: 'center' },
  retryButton: { borderRadius: 8, backgroundColor: '#0f766e', paddingHorizontal: 18, paddingVertical: 12 },
  retryButtonText: { color: '#ffffff', fontWeight: '800' },
});
