import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/contexts/auth-context';

export default function IndexScreen() {
  const { firebaseUser, loading, profile } = useAuth();

  if (loading) {
    return (
      <View style={styles.screen}>
        <ActivityIndicator color="#0f766e" size="large" />
        <Text style={styles.text}>Memuat sesi...</Text>
      </View>
    );
  }

  if (!firebaseUser) {
    return <Redirect href="/welcome" />;
  }

  if (!profile?.phoneNumber.trim() || !profile.fullAddress.trim()) {
    return <Redirect href="/profile/setup" />;
  }

  return <Redirect href={profile.role === 'owner' ? '/(owner)' : '/(adopter)'} />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    gap: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  text: { color: '#475569', fontSize: 14, fontWeight: '600' },
});
