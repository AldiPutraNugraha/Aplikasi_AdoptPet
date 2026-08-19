import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { listAvailablePets } from '@/lib/firebase/pets';
import type { Coordinates, Pet } from '@/types/domain';

function goBackHome() {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace('/(adopter)');
}

const FALLBACK_REGION = {
  latitude: -6.2,
  longitude: 106.816666,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

export default function AdopterMapScreen() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [origin, setOrigin] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);

  const loadPets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listAvailablePets();
      setPets(list);
    } catch {
      setError('Gagal memuat hewan. Periksa koneksi lalu coba lagi.');
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
        setOrigin({ latitude: current.coords.latitude, longitude: current.coords.longitude });
        setLocationDenied(false);
      } catch {
        setLocationDenied(true);
      }
    }
    void loadLocation();
  }, []);

  const petsWithCoords = useMemo(
    () => pets.filter((p): p is Pet & { coordinates: Coordinates } => Boolean(p.coordinates)),
    [pets],
  );

  const selectedPet = useMemo(
    () => petsWithCoords.find((p) => p.id === selectedPetId) ?? null,
    [petsWithCoords, selectedPetId],
  );

  const initialRegion = useMemo(() => {
    if (origin) {
      return { ...origin, latitudeDelta: 0.05, longitudeDelta: 0.05 };
    }
    if (petsWithCoords.length > 0) {
      const first = petsWithCoords[0].coordinates;
      return { ...first, latitudeDelta: 0.08, longitudeDelta: 0.08 };
    }
    return FALLBACK_REGION;
  }, [origin, petsWithCoords]);

  const backButton = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Kembali ke Cari Hewan"
      onPress={goBackHome}
      style={({ pressed }) => [styles.backBtn, pressed ? styles.backBtnPressed : null]}
    >
      <Ionicons name="arrow-back" size={20} color="#ffffff" />
      <Text style={styles.backBtnText}>Kembali</Text>
    </Pressable>
  );

  if (Platform.OS === 'web') {
    return (
      <View style={styles.centerState}>
        {backButton}
        <Text style={styles.emptyTitle}>Peta tidak tersedia di web</Text>
        <Text style={styles.emptyBody}>Buka aplikasi mobile untuk melihat lokasi hewan.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centerState}>
        {backButton}
        <ActivityIndicator color="#0f766e" />
        <Text style={styles.stateText}>Memuat peta hewan...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerState}>
        {backButton}
        <Text style={styles.emptyTitle}>Tidak bisa memuat peta</Text>
        <Text style={styles.emptyBody}>{error}</Text>
        <Pressable accessibilityRole="button" onPress={loadPets} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Coba lagi</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <MapView
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton
        onPress={() => setSelectedPetId(null)}
      >
        {petsWithCoords.map((pet) => (
          <Marker
            key={pet.id}
            coordinate={pet.coordinates}
            pinColor="#6366f1"
            onPress={(e) => {
              e.stopPropagation();
              setSelectedPetId(pet.id);
            }}
          />
        ))}
      </MapView>
      {selectedPet ? (
        <View style={styles.petCard}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tutup"
            onPress={() => setSelectedPetId(null)}
            style={styles.petCardClose}
            hitSlop={8}
          >
            <Ionicons name="close" size={18} color="#475569" />
          </Pressable>
          <View style={styles.petCardRow}>
            {selectedPet.photoUrls?.[0] ? (
              <Image
                source={{ uri: selectedPet.photoUrls[0] }}
                style={styles.petCardImage}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.petCardImage, styles.petCardImagePlaceholder]}>
                <Ionicons name="paw" size={28} color="#94a3b8" />
              </View>
            )}
            <View style={styles.petCardBody}>
              <Text style={styles.petCardName} numberOfLines={1}>
                {selectedPet.name}
              </Text>
              <Text style={styles.petCardMeta} numberOfLines={1}>
                {selectedPet.species} • {selectedPet.primaryColor}
              </Text>
              {selectedPet.fullAddress ? (
                <Text style={styles.petCardAddress} numberOfLines={2}>
                  {selectedPet.fullAddress}
                </Text>
              ) : null}
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push(`/(adopter)/pets/${selectedPet.id}?from=map`)}
            style={({ pressed }) => [styles.petCardBtn, pressed ? styles.petCardBtnPressed : null]}
          >
            <Text style={styles.petCardBtnText}>Lihat detail informasi</Text>
          </Pressable>
        </View>
      ) : null}
      <View style={styles.topBar} pointerEvents="box-none">
        {backButton}
        <View style={styles.overlay} pointerEvents="none">
          <Text style={styles.overlayText}>
            {petsWithCoords.length} hewan tersedia di peta
            {pets.length - petsWithCoords.length > 0
              ? ` (${pets.length - petsWithCoords.length} tanpa lokasi)`
              : ''}
          </Text>
        </View>
      </View>
      {locationDenied ? (
        <View style={styles.locationNotice} pointerEvents="none">
          <Text style={styles.locationNoticeText}>
            Izin lokasi tidak aktif. Peta tetap menampilkan lokasi hewan, tetapi
            posisi pengguna tidak ditampilkan.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  map: { flex: 1 },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  stateText: { color: '#475569', fontSize: 15, fontWeight: '600' },
  emptyTitle: { color: '#0f172a', fontSize: 18, fontWeight: '800', textAlign: 'center' },
  emptyBody: { color: '#64748b', fontSize: 15, lineHeight: 22, textAlign: 'center' },
  retryButton: {
    borderRadius: 8,
    backgroundColor: '#0f766e',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  retryButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
  topBar: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  overlay: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: 'rgba(15,118,110,0.92)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  overlayText: { color: '#ffffff', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  locationNotice: {
    position: 'absolute',
    top: 58,
    left: 12,
    right: 12,
    borderRadius: 8,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  locationNoticeText: {
    color: '#92400e',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
    textAlign: 'center',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    backgroundColor: '#0f766e',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  backBtnPressed: { opacity: 0.85 },
  backBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
  petCard: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 16,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    padding: 14,
    gap: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  petCardClose: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  petCardRow: { flexDirection: 'row', gap: 12, paddingRight: 28 },
  petCardImage: { width: 72, height: 72, borderRadius: 10, backgroundColor: '#e2e8f0' },
  petCardImagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  petCardBody: { flex: 1, gap: 2, justifyContent: 'center' },
  petCardName: { color: '#0f172a', fontSize: 17, fontWeight: '800' },
  petCardMeta: { color: '#0f766e', fontSize: 13, fontWeight: '700' },
  petCardAddress: { color: '#64748b', fontSize: 12, marginTop: 2 },
  petCardBtn: {
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#0f766e',
    paddingVertical: 11,
  },
  petCardBtnPressed: { opacity: 0.85 },
  petCardBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
});
