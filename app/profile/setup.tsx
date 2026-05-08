import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { TextField } from '@/components/forms/TextField';
import { useAuth } from '@/contexts/auth-context';
import { validateProfileDetails } from '@/lib/domain/profile';
import { updateProfileDetails } from '@/lib/firebase/auth';
import type { Coordinates } from '@/types/domain';

export default function ProfileSetupScreen() {
  const { firebaseUser, profile, refreshProfile } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState(profile?.phoneNumber ?? '');
  const [fullAddress, setFullAddress] = useState(profile?.fullAddress ?? '');
  const [coordinates, setCoordinates] = useState<Coordinates | undefined>(profile?.coordinates);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;

    setPhoneNumber((current) => current || profile.phoneNumber || '');
    setFullAddress((current) => current || profile.fullAddress || '');
    setCoordinates((current) => current ?? profile.coordinates);
  }, [profile]);

  async function useCurrentLocation() {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Lokasi ditolak', 'Alamat tetap bisa diisi manual.');
      return;
    }

    const current = await Location.getCurrentPositionAsync({});
    setCoordinates({
      latitude: current.coords.latitude,
      longitude: current.coords.longitude,
    });
  }

  async function onSubmit() {
    if (!firebaseUser) {
      Alert.alert('Sesi tidak aktif', 'Silakan masuk kembali untuk melengkapi profil.');
      return;
    }

    if (!profile) {
      Alert.alert('Profil sedang dimuat', 'Tunggu sebentar, lalu coba simpan kembali.');
      return;
    }

    const validation = validateProfileDetails({ phoneNumber, fullAddress, coordinates });
    if (!validation.valid) {
      Alert.alert(
        'Profil belum lengkap',
        validation.errors.phoneNumber ?? validation.errors.fullAddress ?? 'Periksa kembali profil.',
      );
      return;
    }

    setSaving(true);
    try {
      await updateProfileDetails(firebaseUser.uid, validation.details);
      await refreshProfile();
      router.replace(profile.role === 'owner' ? '/(owner)' : '/(adopter)');
    } catch (error) {
      Alert.alert('Profil gagal disimpan', error instanceof Error ? error.message : 'Coba lagi.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Lengkapi Profil</Text>
      <TextField
        label="Nomor WhatsApp"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
      />
      <TextField label="Alamat lengkap" value={fullAddress} onChangeText={setFullAddress} multiline />
      <Pressable style={styles.secondaryButton} onPress={useCurrentLocation}>
        <Text style={styles.secondaryButtonText}>
          {coordinates ? 'Koordinat tersimpan' : 'Ambil Lokasi Saat Ini'}
        </Text>
      </Pressable>
      <Pressable style={styles.button} onPress={onSubmit} disabled={saving}>
        <Text style={styles.buttonText}>{saving ? 'Menyimpan...' : 'Simpan Profil'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, gap: 16, padding: 24, backgroundColor: '#f8fafc' },
  title: { color: '#0f766e', fontSize: 28, fontWeight: '800' },
  button: { alignItems: 'center', borderRadius: 8, backgroundColor: '#0f766e', paddingVertical: 14 },
  buttonText: { color: '#ffffff', fontWeight: '700' },
  secondaryButton: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0f766e',
    borderRadius: 8,
    paddingVertical: 14,
  },
  secondaryButtonText: { color: '#0f766e', fontWeight: '700' },
});
