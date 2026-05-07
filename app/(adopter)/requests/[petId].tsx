import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function AdoptionRequestPlaceholderScreen() {
  const { petId } = useLocalSearchParams<{ petId?: string }>();

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Form Adopsi</Text>
      <Text style={styles.body}>
        Form pengajuan adopsi untuk hewan {petId ?? 'ini'} akan tersedia pada tahap berikutnya.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'center', gap: 10, backgroundColor: '#f8fafc', padding: 24 },
  title: { color: '#0f766e', fontSize: 26, fontWeight: '800', textAlign: 'center' },
  body: { color: '#475569', fontSize: 15, lineHeight: 22, textAlign: 'center' },
});
