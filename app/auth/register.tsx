import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { SelectField } from '@/components/forms/SelectField';
import { TextField } from '@/components/forms/TextField';
import { registerWithRole } from '@/lib/firebase/auth';
import type { UserRole } from '@/types/domain';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('adopter');
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setLoading(true);
    try {
      await registerWithRole({ name: name.trim(), email: email.trim(), password, role });
      router.replace('/profile/setup');
    } catch (error) {
      Alert.alert(
        'Registrasi gagal',
        error instanceof Error ? error.message : 'Periksa data registrasi.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Buat Akun</Text>
      <TextField label="Nama lengkap" value={name} onChangeText={setName} />
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextField label="Password" value={password} onChangeText={setPassword} secureTextEntry />
      <SelectField
        label="Pilih role"
        value={role}
        onChange={setRole}
        options={[
          { label: 'Calon Pengadopsi', value: 'adopter' },
          { label: 'Pelepas Hewan', value: 'owner' },
        ]}
      />
      <Pressable style={styles.button} onPress={onSubmit} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Memproses...' : 'Daftar'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'center', gap: 16, padding: 24, backgroundColor: '#f8fafc' },
  title: { color: '#0f766e', fontSize: 30, fontWeight: '800' },
  button: { alignItems: 'center', borderRadius: 8, backgroundColor: '#0f766e', paddingVertical: 14 },
  buttonText: { color: '#ffffff', fontWeight: '700' },
});
