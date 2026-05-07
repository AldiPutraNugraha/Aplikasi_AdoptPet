import { StyleSheet, Text, View } from 'react-native';

export default function OwnerMonitoringScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Monitoring</Text>
      <Text style={styles.body}>Laporan pasca-adopsi akan tampil di sini.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, gap: 8, padding: 24, backgroundColor: '#f8fafc' },
  title: { color: '#0f766e', fontSize: 28, fontWeight: '800' },
  body: { color: '#475569', fontSize: 16 },
});
