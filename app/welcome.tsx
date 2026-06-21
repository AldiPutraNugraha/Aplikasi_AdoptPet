import { Redirect, router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/contexts/auth-context';

export default function WelcomeScreen() {
  const { firebaseUser, loading } = useAuth();

  if (loading) {
    return (
      <View style={[styles.screen, styles.loadingScreen]}>
        <ActivityIndicator color="#0f766e" size="large" />
      </View>
    );
  }

  if (firebaseUser) {
    return <Redirect href="/" />;
  }

  return (
    <View style={styles.screen}>
      <View style={styles.hero}>
        <Text style={styles.title}>AdoptPet</Text>
        <Text style={styles.subtitle}>
          Temukan hewan peliharaan baru atau salurkan hewan ke pemilik yang tepat.
        </Text>
      </View>
      <View style={styles.actions}>
        <Pressable style={styles.button} onPress={() => router.push('/auth/login')}>
          <Text style={styles.buttonText}>Masuk</Text>
        </Pressable>
        <Pressable
          style={[styles.button, styles.buttonOutline]}
          onPress={() => router.push('/auth/register')}
        >
          <Text style={[styles.buttonText, styles.buttonOutlineText]}>Daftar</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'space-between', padding: 24, backgroundColor: '#f8fafc' },
  loadingScreen: { alignItems: 'center', justifyContent: 'center' },
  hero: { flex: 1, justifyContent: 'center', gap: 16 },
  title: { color: '#0f766e', fontSize: 44, fontWeight: '800' },
  subtitle: { color: '#475569', fontSize: 18, lineHeight: 26 },
  actions: { gap: 12, paddingBottom: 16 },
  button: { alignItems: 'center', borderRadius: 8, backgroundColor: '#0f766e', paddingVertical: 16 },
  buttonOutline: { backgroundColor: 'transparent', borderWidth: 2, borderColor: '#0f766e' },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  buttonOutlineText: { color: '#0f766e' },
});
