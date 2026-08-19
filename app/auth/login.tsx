import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { TextField } from '@/components/forms/TextField';
import { login, sendPasswordReset } from '@/lib/firebase/auth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

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

  async function sendReset(target: string) {
    setResetLoading(true);
    try {
      await sendPasswordReset(target);
      Alert.alert(
        'Email reset terkirim',
        `Cek inbox ${target} untuk link reset password. Jangan lupa periksa folder spam.`,
      );
    } catch (error) {
      Alert.alert(
        'Gagal mengirim email reset',
        error instanceof Error ? error.message : 'Pastikan email benar dan coba lagi.',
      );
    } finally {
      setResetLoading(false);
    }
  }

  function onForgotPassword() {
    const target = email.trim();

    if (!target) {
      Alert.alert(
        'Isi email dulu',
        'Masukkan email akun Anda di kolom Email lalu tekan "Lupa password?" lagi untuk menerima link reset.',
      );
      return;
    }

    Alert.alert(
      'Reset password?',
      `Kirim link reset password ke ${target}?`,
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Kirim', onPress: () => sendReset(target) },
      ],
    );
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

      <Pressable
        accessibilityRole="button"
        onPress={onForgotPassword}
        disabled={resetLoading}
        style={({ pressed }) => [styles.forgotWrap, pressed && styles.pressed]}
      >
        <Text style={styles.forgotText}>
          {resetLoading ? 'Mengirim link reset...' : 'Lupa password?'}
        </Text>
      </Pressable>

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
  forgotWrap: { alignSelf: 'flex-end', marginTop: -8 },
  forgotText: { color: '#0f766e', fontSize: 13, fontWeight: '700' },
  pressed: { opacity: 0.6 },
});
