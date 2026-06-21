import { Ionicons } from '@expo/vector-icons';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { PetHealthSummary } from '@/components/pets/PetHealthSummary';
import { PetMap } from '@/components/pets/PetMap';
import { BackButton } from '@/components/ui/BackButton';
import { getUserProfile } from '@/lib/firebase/auth';
import { getPetById } from '@/lib/firebase/pets';
import type { AppUser, Pet } from '@/types/domain';

function firstPhotoUrl(photoUrls?: string[]) {
  return photoUrls?.find((url) => url.trim().length > 0);
}

function PhotoPreviewModal({
  photos,
  index,
  onClose,
  onChange,
}: {
  photos: string[];
  index: number | null;
  onClose: () => void;
  onChange: (next: number) => void;
}) {
  const visible = index !== null && index >= 0 && index < photos.length;
  if (!visible) return null;

  const current = photos[index];
  const screen = Dimensions.get('window');

  function prev() {
    if (index !== null && index > 0) onChange(index - 1);
  }
  function next() {
    if (index !== null && index < photos.length - 1) onChange(index + 1);
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={modalStyles.backdrop}>
        <Pressable style={modalStyles.closeBtn} onPress={onClose} accessibilityRole="button">
          <Ionicons name="close" size={28} color="#ffffff" />
        </Pressable>

        <Pressable style={modalStyles.imageWrap} onPress={onClose}>
          <Image
            source={{ uri: current }}
            style={{ width: screen.width, height: screen.height * 0.8 }}
            resizeMode="contain"
          />
        </Pressable>

        {photos.length > 1 ? (
          <View style={modalStyles.footer}>
            <Pressable
              style={[modalStyles.navBtn, index === 0 && modalStyles.navBtnDisabled]}
              onPress={prev}
              disabled={index === 0}
            >
              <Ionicons name="chevron-back" size={24} color="#ffffff" />
            </Pressable>
            <Text style={modalStyles.counter}>
              {(index ?? 0) + 1} / {photos.length}
            </Text>
            <Pressable
              style={[modalStyles.navBtn, index === photos.length - 1 && modalStyles.navBtnDisabled]}
              onPress={next}
              disabled={index === photos.length - 1}
            >
              <Ionicons name="chevron-forward" size={24} color="#ffffff" />
            </Pressable>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

export default function PetDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const petId = Array.isArray(id) ? id[0] : id;
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [heroImageError, setHeroImageError] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [owner, setOwner] = useState<AppUser | null>(null);

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

  useEffect(() => {
    if (!pet?.ownerId) {
      setOwner(null);
      return;
    }
    let active = true;
    void getUserProfile(pet.ownerId)
      .then((data) => {
        if (active) setOwner(data);
      })
      .catch(() => {
        if (active) setOwner(null);
      });
    return () => {
      active = false;
    };
  }, [pet?.ownerId]);

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

  const photos = (pet.photoUrls ?? []).filter((url) => url.trim().length > 0);
  const imageUri = firstPhotoUrl(pet.photoUrls);
  const shouldShowHeroImage = imageUri && !heroImageError;
  const breedLine = [pet.species, pet.estimatedBreed].filter(Boolean).join(' / ');

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <BackButton />
      {shouldShowHeroImage ? (
        <Pressable onPress={() => setPreviewIndex(0)} accessibilityRole="button">
          <Image source={{ uri: imageUri }} style={styles.heroImage} resizeMode="cover" onError={() => setHeroImageError(true)} />
          <View style={styles.heroBadge}>
            <Ionicons name="expand-outline" size={14} color="#ffffff" />
            <Text style={styles.heroBadgeText}>Lihat foto</Text>
          </View>
        </Pressable>
      ) : (
        <View style={styles.heroPlaceholder}>
          <Text style={styles.placeholderText}>Foto belum tersedia</Text>
        </View>
      )}

      {photos.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbnailRow}>
          {photos.map((url, index) => (
            <Pressable key={`${url}-${index}`} onPress={() => setPreviewIndex(index)}>
              <Image source={{ uri: url }} style={styles.thumbnail} resizeMode="cover" />
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      <PhotoPreviewModal
        photos={photos}
        index={previewIndex}
        onClose={() => setPreviewIndex(null)}
        onChange={setPreviewIndex}
      />


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

      {owner ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Diupload oleh</Text>
          <Pressable
            style={({ pressed }) => [styles.ownerCard, pressed && styles.ownerCardPressed]}
            onPress={() => router.push(`/(adopter)/owners/${pet.ownerId}`)}
          >
            <View style={styles.ownerAvatar}>
              <Text style={styles.ownerAvatarText}>
                {(owner.name || owner.email || '?').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.ownerInfo}>
              <Text style={styles.ownerName}>{owner.name || 'Pelepas Hewan'}</Text>
              <Text style={styles.ownerHint}>Lihat profil & hewan lainnya</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#475569" />
          </Pressable>
        </View>
      ) : null}

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
  heroBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(15,23,42,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  heroBadgeText: { color: '#ffffff', fontSize: 11, fontWeight: '700' },
  thumbnailRow: { gap: 8, paddingVertical: 2 },
  thumbnail: { width: 64, height: 64, borderRadius: 8, backgroundColor: '#e2e8f0' },
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
  ownerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    padding: 14,
  },
  ownerCardPressed: { opacity: 0.6 },
  ownerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0f766e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerAvatarText: { color: '#ffffff', fontSize: 20, fontWeight: '800' },
  ownerInfo: { flex: 1, gap: 2 },
  ownerName: { color: '#0f172a', fontSize: 16, fontWeight: '800' },
  ownerHint: { color: '#475569', fontSize: 12, fontWeight: '600' },
});

const modalStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  closeBtn: {
    position: 'absolute',
    top: 44,
    right: 18,
    zIndex: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 8,
  },
  imageWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  footer: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  navBtn: { padding: 4 },
  navBtnDisabled: { opacity: 0.3 },
  counter: { color: '#ffffff', fontSize: 14, fontWeight: '700', minWidth: 50, textAlign: 'center' },
});
