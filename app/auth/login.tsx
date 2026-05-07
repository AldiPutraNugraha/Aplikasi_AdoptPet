import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { TextField } from '@/components/forms/TextField';
import { login } from '@/lib/firebase/auth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace('/');
    } catch (error) {
      Alert.alert('Login gagal', error instanceof Error ? error.message : 'Periksa email dan password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>AdoptPet</Text>
      <Text style={styles.subtitle}>Masuk untuk melanjutkan proses adopsi.</Text>
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextField label="Password" value={password} onChangeText={setPassword} secureTextEntry />
      <Pressable style={styles.button} onPress={onSubmit} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Memproses...' : 'Masuk'}</Text>
      </Pressable>
      <Link href="/auth/register" style={styles.link}>
        Belum punya akun? Daftar
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'center', gap: 16, padding: 24, backgroundColor: '#f8fafc' },
  title: { color: '#0f766e', fontSize: 34, fontWeight: '800' },
  subtitle: { color: '#475569', fontSize: 16 },
  button: { alignItems: 'center', borderRadius: 8, backgroundColor: '#0f766e', paddingVertical: 14 },
  buttonText: { color: '#ffffff', fontWeight: '700' },
  link: { color: '#0f766e', fontWeight: '700', textAlign: 'center' },
});
