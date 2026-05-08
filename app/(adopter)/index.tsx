import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { PetCard } from '@/components/pets/PetCard';
import { useAuth } from '@/contexts/auth-context';
import { logout } from '@/lib/firebase/auth';
import { listAvailablePets } from '@/lib/firebase/pets';
import { listReportsForAdopter } from '@/lib/firebase/reports';
import type { MonitoringReportStatus, Pet, PostAdoptionReport } from '@/types/domain';

const monitoringStatusLabels: Record<MonitoringReportStatus, string> = {
  scheduled: 'Terjadwal',
  due: 'Jatuh tempo',
  submitted: 'Terkirim',
  late: 'Terlambat',
};

function formatDate(value?: number) {
  if (!value) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export default function AdopterHomeScreen() {
  const { firebaseUser } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [reports, setReports] = useState<PostAdoptionReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [availablePets, adopterReports] = await Promise.all([
        listAvailablePets(),
        firebaseUser ? listReportsForAdopter(firebaseUser.uid) : Promise.resolve([]),
      ]);
      setPets(availablePets);
      setReports(adopterReports);
    } catch {
      setError('Gagal memuat hewan tersedia. Periksa koneksi lalu coba lagi.');
      setPets([]);
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [firebaseUser]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const activeReports = reports.filter((report) => report.status !== 'submitted');

  if (loading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator color="#0f766e" />
        <Text style={styles.stateText}>Memuat hewan tersedia...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerState}>
        <Text style={styles.emptyTitle}>Tidak bisa memuat hewan</Text>
        <Text style={styles.emptyBody}>{error}</Text>
        <Pressable accessibilityRole="button" onPress={loadDashboard} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Coba lagi</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      data={pets}
      keyExtractor={(item) => item.id}
      style={styles.screen}
      contentContainerStyle={pets.length === 0 ? styles.emptyContent : styles.content}
      renderItem={({ item }) => (
        <PetCard pet={item} onPress={() => router.push(`/(adopter)/pets/${item.id}`)} />
      )}
      ListHeaderComponent={
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerText}>
              <Text style={styles.title}>Cari Hewan</Text>
              <Text style={styles.body}>Temukan hewan yang sedang siap diadopsi.</Text>
            </View>
            <Pressable style={styles.logoutButton} onPress={logout}>
              <Text style={styles.logoutText}>Keluar</Text>
            </Pressable>
          </View>
          {activeReports.length > 0 ? (
            <View style={styles.monitoringPanel}>
              <Text style={styles.sectionTitle}>Monitoring adopsi</Text>
              {activeReports.map((report) => (
                <Pressable
                  key={report.id}
                  accessibilityRole="button"
                  style={styles.reportItem}
                  onPress={() => router.push(`/(adopter)/reports/${report.requestId}`)}
                >
                  <View style={styles.reportTextGroup}>
                    <Text style={styles.reportTitle}>Laporan #{report.id.slice(0, 6)}</Text>
                    <Text style={styles.reportMeta}>Jatuh tempo: {formatDate(report.dueAt)}</Text>
                  </View>
                  <Text style={[styles.reportStatus, styles[`reportStatus_${report.status}`]]}>
                    {monitoringStatusLabels[report.status]}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      }
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Belum ada hewan tersedia</Text>
          <Text style={styles.emptyBody}>Cek lagi nanti saat pemilik menambahkan hewan untuk diadopsi.</Text>
        </View>
      }
      onRefresh={loadDashboard}
      refreshing={loading}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  content: { gap: 12, padding: 20, paddingBottom: 32 },
  emptyContent: { flexGrow: 1, gap: 20, padding: 20 },
  header: { gap: 6, marginBottom: 4 },
  headerTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  headerText: { flex: 1, gap: 6 },
  title: { color: '#0f766e', fontSize: 28, fontWeight: '800' },
  body: { color: '#475569', fontSize: 16 },
  logoutButton: {
    borderWidth: 1,
    borderColor: '#0f766e',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  logoutText: { color: '#0f766e', fontWeight: '800' },
  sectionTitle: { color: '#0f172a', fontSize: 17, fontWeight: '800' },
  monitoringPanel: { gap: 10, marginTop: 10 },
  reportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderWidth: 1,
    borderColor: '#ccfbf1',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    padding: 12,
  },
  reportTextGroup: { flex: 1, gap: 3 },
  reportTitle: { color: '#0f172a', fontSize: 14, fontWeight: '800' },
  reportMeta: { color: '#64748b', fontSize: 12 },
  reportStatus: {
    overflow: 'hidden',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
    fontWeight: '800',
  },
  reportStatus_scheduled: { color: '#475569', backgroundColor: '#e2e8f0' },
  reportStatus_due: { color: '#854d0e', backgroundColor: '#fef3c7' },
  reportStatus_submitted: { color: '#0f766e', backgroundColor: '#ccfbf1' },
  reportStatus_late: { color: '#991b1b', backgroundColor: '#fee2e2' },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#f8fafc' },
  stateText: { color: '#475569', fontSize: 15, fontWeight: '600' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 24 },
  emptyTitle: { color: '#0f172a', fontSize: 18, fontWeight: '800', textAlign: 'center' },
  emptyBody: { color: '#64748b', fontSize: 15, lineHeight: 22, textAlign: 'center' },
  retryButton: {
    borderRadius: 8,
    backgroundColor: '#0f766e',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  retryButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
});
