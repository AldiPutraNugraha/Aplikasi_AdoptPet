import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { TextField } from '@/components/forms/TextField';
import { useAuth } from '@/contexts/auth-context';
import { validateProfileDetails } from '@/lib/domain/profile';
import { logout, updateProfileDetails } from '@/lib/firebase/auth';

export default function ProfileScreen() {
  const { firebaseUser, profile, refreshProfile, loading } = useAuth();
  const [editing, setEditing] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setPhoneNumber(profile.phoneNumber ?? '');
    setFullAddress(profile.fullAddress ?? '');
  }, [profile]);

  async function onSave() {
    if (!firebaseUser || !profile) return;

    const validation = validateProfileDetails({ phoneNumber, fullAddress });
    if (!validation.valid) {
      Alert.alert(
        'Data belum lengkap',
        validation.errors.phoneNumber ?? validation.errors.fullAddress ?? 'Periksa kembali.',
      );
      return;
    }

    setSaving(true);
    try {
      await updateProfileDetails(firebaseUser.uid, validation.details);
      await refreshProfile();
      setEditing(false);
      Alert.alert('Berhasil', 'Profil berhasil diperbarui.');
    } catch (error) {
      Alert.alert('Gagal menyimpan', error instanceof Error ? error.message : 'Coba lagi.');
    } finally {
      setSaving(false);
    }
  }

  function onCancel() {
    if (profile) {
      setPhoneNumber(profile.phoneNumber ?? '');
      setFullAddress(profile.fullAddress ?? '');
    }
    setEditing(false);
  }

  async function onLogout() {
    Alert.alert('Keluar', 'Yakin ingin keluar?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/welcome');
        },
      },
    ]);
  }

  if (loading || !profile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#0f766e" />
      </View>
    );
  }

  const initial = (profile.name || profile.email || '?').charAt(0).toUpperCase();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.avatarBox}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <Text style={styles.name}>{profile.name || 'Tanpa nama'}</Text>
        <Text style={styles.role}>{profile.role === 'owner' ? 'Pelepas Hewan' : 'Calon Pengadopsi'}</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Informasi Akun</Text>
          {!editing ? (
            <Pressable style={styles.editButton} onPress={() => setEditing(true)}>
              <Ionicons name="create-outline" size={16} color="#0f766e" />
              <Text style={styles.editButtonText}>Edit</Text>
            </Pressable>
          ) : null}
        </View>

        <InfoRow icon="mail-outline" label="Email" value={profile.email} />

        {editing ? (
          <>
            <TextField
              label="Nomor WhatsApp"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              placeholder="08xxxxxxxxxx"
            />
            <TextField
              label="Alamat lengkap"
              value={fullAddress}
              onChangeText={setFullAddress}
              placeholder="Jl..., RT/RW, Kelurahan, Kota"
              multiline
            />
            <View style={styles.actions}>
              <Pressable
                style={[styles.button, styles.buttonSecondary]}
                onPress={onCancel}
                disabled={saving}
              >
                <Text style={styles.buttonSecondaryText}>Batal</Text>
              </Pressable>
              <Pressable
                style={[styles.button, styles.buttonPrimary, saving ? styles.buttonDisabled : null]}
                onPress={onSave}
                disabled={saving}
              >
                <Text style={styles.buttonPrimaryText}>{saving ? 'Menyimpan...' : 'Simpan'}</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <InfoRow
              icon="call-outline"
              label="Nomor WhatsApp"
              value={profile.phoneNumber || '-'}
            />
            <InfoRow
              icon="location-outline"
              label="Alamat"
              value={profile.fullAddress || '-'}
              multiline
            />
          </>
        )}
      </View>

      <Pressable style={styles.logoutButton} onPress={onLogout}>
        <Ionicons name="log-out-outline" size={18} color="#b91c1c" />
        <Text style={styles.logoutText}>Keluar</Text>
      </Pressable>
    </ScrollView>
  );
}

function InfoRow({
  icon,
  label,
  value,
  multiline,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={20} color="#0f766e" style={styles.rowIcon} />
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={[styles.rowValue, multiline ? styles.rowValueMultiline : null]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20, gap: 18, paddingBottom: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
  avatarBox: { alignItems: 'center', gap: 8, paddingVertical: 14 },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#0f766e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#ffffff', fontSize: 36, fontWeight: '800' },
  name: { color: '#0f172a', fontSize: 22, fontWeight: '800' },
  role: { color: '#475569', fontSize: 14, fontWeight: '700' },
  section: {
    gap: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    padding: 16,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: '#0f172a', fontSize: 16, fontWeight: '800' },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#0f766e',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  editButtonText: { color: '#0f766e', fontSize: 13, fontWeight: '800' },
  row: { flexDirection: 'row', gap: 12, paddingVertical: 8 },
  rowIcon: { marginTop: 2 },
  rowText: { flex: 1, gap: 2 },
  rowLabel: { color: '#64748b', fontSize: 12, fontWeight: '700' },
  rowValue: { color: '#0f172a', fontSize: 15 },
  rowValueMultiline: { lineHeight: 21 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  button: { flex: 1, alignItems: 'center', borderRadius: 8, paddingVertical: 12 },
  buttonPrimary: { backgroundColor: '#0f766e' },
  buttonPrimaryText: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
  buttonSecondary: { borderWidth: 1, borderColor: '#cbd5e1' },
  buttonSecondaryText: { color: '#475569', fontSize: 15, fontWeight: '800' },
  buttonDisabled: { opacity: 0.6 },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    paddingVertical: 13,
    backgroundColor: '#fef2f2',
  },
  logoutText: { color: '#b91c1c', fontSize: 15, fontWeight: '800' },
});
