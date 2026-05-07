import { StyleSheet, Text, View } from 'react-native';

export default function AdopterHomeScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Adopter Area</Text>
      <Text style={styles.body}>Halaman sementara untuk alur calon pengadopsi.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, gap: 8, padding: 24, backgroundColor: '#f8fafc' },
  title: { color: '#0f766e', fontSize: 28, fontWeight: '800' },
  body: { color: '#475569', fontSize: 16 },
});
