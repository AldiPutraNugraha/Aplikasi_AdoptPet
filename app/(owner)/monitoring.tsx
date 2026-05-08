import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/contexts/auth-context';
import { listReportsForOwner } from '@/lib/firebase/reports';
import type { MonitoringReportStatus, PostAdoptionReport } from '@/types/domain';

const statusLabels: Record<MonitoringReportStatus, string> = {
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

export default function OwnerMonitoringScreen() {
  const { firebaseUser, profile, loading: authLoading } = useAuth();
  const [reports, setReports] = useState<PostAdoptionReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    if (!firebaseUser || profile?.role !== 'owner') {
      setReports([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setError(null);
    try {
      setReports(await listReportsForOwner(firebaseUser.uid));
    } catch {
      setError('Gagal memuat monitoring. Periksa koneksi lalu coba lagi.');
      setReports([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [firebaseUser, profile?.role]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void loadReports();
    }, [loadReports]),
  );

  function refreshReports() {
    setRefreshing(true);
    void loadReports();
  }

  function renderReport({ item }: { item: PostAdoptionReport }) {
    const firstPhoto = item.conditionPhotoUrls?.find((url) => url.trim().length > 0);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleGroup}>
            <Text style={styles.cardTitle}>Laporan #{item.id.slice(0, 6)}</Text>
            <Text style={styles.meta}>Jatuh tempo: {formatDate(item.dueAt)}</Text>
            {item.submittedAt ? <Text style={styles.meta}>Dikirim: {formatDate(item.submittedAt)}</Text> : null}
          </View>
          <Text style={[styles.status, styles[`status_${item.status}`]]}>{statusLabels[item.status]}</Text>
        </View>

        {firstPhoto ? (
          <Image source={{ uri: firstPhoto }} style={styles.photo} resizeMode="cover" />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={styles.placeholderText}>Foto belum dikirim</Text>
          </View>
        )}

        <View style={styles.noteBox}>
          <Text style={styles.noteLabel}>Catatan kondisi</Text>
          <Text style={styles.noteText}>{item.conditionNote?.trim() || '-'}</Text>
        </View>
      </View>
    );
  }

  if (authLoading || loading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator color="#0f766e" />
        <Text style={styles.stateText}>Memuat monitoring...</Text>
      </View>
    );
  }

  if (!firebaseUser || profile?.role !== 'owner') {
    return (
      <View style={styles.centerState}>
        <Text style={styles.emptyTitle}>Masuk sebagai pemilik</Text>
        <Text style={styles.emptyBody}>Gunakan akun owner untuk melihat monitoring pasca-adopsi.</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerState}>
        <Text style={styles.emptyTitle}>Tidak bisa memuat monitoring</Text>
        <Text style={styles.emptyBody}>{error}</Text>
        <Pressable accessibilityRole="button" onPress={refreshReports} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Coba lagi</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      data={reports}
      keyExtractor={(item) => item.id}
      style={styles.screen}
      contentContainerStyle={reports.length === 0 ? styles.emptyContent : styles.content}
      renderItem={renderReport}
      onRefresh={refreshReports}
      refreshing={refreshing}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>Monitoring</Text>
          <Text style={styles.body}>Pantau laporan kondisi hewan satu bulan setelah adopsi diterima.</Text>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Belum ada monitoring</Text>
          <Text style={styles.emptyBody}>Laporan akan muncul setelah pengajuan adopsi diterima.</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  content: { gap: 14, padding: 20, paddingBottom: 32 },
  emptyContent: { flexGrow: 1, gap: 20, padding: 20 },
  header: { gap: 6 },
  title: { color: '#0f766e', fontSize: 28, fontWeight: '800' },
  body: { color: '#475569', fontSize: 16, lineHeight: 22 },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#f8fafc', padding: 24 },
  stateText: { color: '#475569', fontSize: 15, fontWeight: '600' },
  card: {
    gap: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 14,
    backgroundColor: '#ffffff',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  cardTitleGroup: { flex: 1, gap: 4 },
  cardTitle: { color: '#0f172a', fontSize: 17, fontWeight: '800' },
  meta: { color: '#64748b', fontSize: 12, lineHeight: 17 },
  status: {
    overflow: 'hidden',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
    fontWeight: '800',
  },
  status_scheduled: { color: '#475569', backgroundColor: '#e2e8f0' },
  status_due: { color: '#854d0e', backgroundColor: '#fef3c7' },
  status_submitted: { color: '#0f766e', backgroundColor: '#ccfbf1' },
  status_late: { color: '#991b1b', backgroundColor: '#fee2e2' },
  photo: { width: '100%', height: 190, borderRadius: 8, backgroundColor: '#e2e8f0' },
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 140,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  placeholderText: { color: '#64748b', fontSize: 14, fontWeight: '800' },
  noteBox: { gap: 4 },
  noteLabel: { color: '#334155', fontSize: 13, fontWeight: '800' },
  noteText: { color: '#475569', fontSize: 14, lineHeight: 20 },
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
