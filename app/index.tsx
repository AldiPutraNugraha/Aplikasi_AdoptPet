import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAuth } from '@/contexts/auth-context';

export default function IndexScreen() {
  const { firebaseUser, loading, profile } = useAuth();

  if (loading) {
    return (
      <View style={styles.screen}>
        <ActivityIndicator color="#0f766e" />
      </View>
    );
  }

  if (!firebaseUser) {
    return <Redirect href="/auth/login" />;
  }

  if (!profile?.phoneNumber || !profile.fullAddress) {
    return <Redirect href="/profile/setup" />;
  }

  return <Redirect href={profile.role === 'owner' ? '/(owner)' : '/(adopter)'} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
});
