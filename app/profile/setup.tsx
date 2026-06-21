import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { TextField } from '@/components/forms/TextField';
import { BackButton } from '@/components/ui/BackButton';
import { useAuth } from '@/contexts/auth-context';
import { validateProfileDetails } from '@/lib/domain/profile';
import { updateProfileDetails } from '@/lib/firebase/auth';

export default function ProfileSetupScreen() {
  const { firebaseUser, profile, refreshProfile } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState(profile?.phoneNumber ?? '');
  const [fullAddress, setFullAddress] = useState(profile?.fullAddress ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;

    setPhoneNumber((current) => current || profile.phoneNumber || '');
    setFullAddress((current) => current || profile.fullAddress || '');
  }, [profile]);

  async function onSubmit() {
    if (!firebaseUser) {
      Alert.alert('Sesi tidak aktif', 'Silakan masuk kembali untuk melengkapi profil.');
      return;
    }

    if (!profile) {
      Alert.alert('Profil sedang dimuat', 'Tunggu sebentar, lalu coba simpan kembali.');
      return;
    }

    const validation = validateProfileDetails({ phoneNumber, fullAddress });
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
      <BackButton />
      <Text style={styles.title}>Lengkapi Profil</Text>
      <TextField
        label="Nomor WhatsApp"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
      />
      <TextField label="Alamat lengkap" value={fullAddress} onChangeText={setFullAddress} multiline />
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
});
