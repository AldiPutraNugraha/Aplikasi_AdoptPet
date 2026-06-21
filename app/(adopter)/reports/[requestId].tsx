import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PhotoPicker } from '@/components/forms/PhotoPicker';
import { TextField } from '@/components/forms/TextField';
import { BackButton } from '@/components/ui/BackButton';
import { useAuth } from '@/contexts/auth-context';
import { getReportForRequest, submitMonitoringReport } from '@/lib/firebase/reports';
import { uploadImageAsync } from '@/lib/firebase/storage';
import type { PostAdoptionReport } from '@/types/domain';

function formatDate(value: number) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));
}

export default function MonitoringReportScreen() {
  const { requestId: requestIdParam } = useLocalSearchParams<{ requestId?: string | string[] }>();
  const requestId = Array.isArray(requestIdParam) ? requestIdParam[0] : requestIdParam;
  const { firebaseUser, profile, loading: authLoading } = useAuth();
  const [report, setReport] = useState<PostAdoptionReport | null>(null);
  const [conditionPhotoUris, setConditionPhotoUris] = useState<string[]>([]);
  const [conditionNote, setConditionNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const loadReport = useCallback(async () => {
    if (!requestId || !firebaseUser || profile?.role !== 'adopter') {
      setReport(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      setReport(await getReportForRequest(requestId, firebaseUser.uid));
    } catch {
      setError('Gagal memuat laporan monitoring. Periksa koneksi lalu coba lagi.');
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [firebaseUser, profile?.role, requestId]);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  useEffect(() => {
    if (!submitted) return undefined;

    const timeoutId = setTimeout(() => router.replace('/(adopter)'), 1400);
    return () => clearTimeout(timeoutId);
  }, [submitted]);

  async function onSubmit() {
    if (!firebaseUser || !report) {
      setSubmitError('Data laporan belum siap. Muat ulang halaman lalu coba lagi.');
      return;
    }

    if (conditionPhotoUris.length === 0) {
      setSubmitError('Unggah minimal satu foto kondisi hewan.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const conditionPhotoPaths = await Promise.all(
        conditionPhotoUris.slice(0, 1).map(async (uri, index) => {
          const path = `reports/${firebaseUser.uid}/${report.id}/${Date.now()}-${index}.jpg`;
          await uploadImageAsync(uri, path);
          return path;
        }),
      );

      await submitMonitoringReport(report.id, { conditionPhotoPaths, conditionNote });
      setSubmitted(true);
    } catch (caughtError) {
      setSubmitError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Laporan belum terkirim. Periksa koneksi lalu coba lagi.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || loading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator color="#0f766e" />
        <Text style={styles.stateText}>Memuat laporan...</Text>
      </View>
    );
  }

  if (!firebaseUser || profile?.role !== 'adopter') {
    return (
      <View style={styles.centerState}>
        <Text style={styles.emptyTitle}>Masuk sebagai adopter</Text>
        <Text style={styles.emptyBody}>Gunakan akun adopter untuk mengirim laporan kondisi hewan.</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerState}>
        <Text style={styles.emptyTitle}>Laporan belum bisa dibuka</Text>
        <Text style={styles.emptyBody}>{error}</Text>
        <Pressable accessibilityRole="button" onPress={loadReport} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Coba lagi</Text>
        </Pressable>
      </View>
    );
  }

  if (!report) {
    return (
      <View style={styles.centerState}>
        <Text style={styles.emptyTitle}>Laporan tidak ditemukan</Text>
        <Text style={styles.emptyBody}>Laporan monitoring akan muncul setelah adopsi disetujui.</Text>
      </View>
    );
  }

  if (submitted || report.status === 'submitted') {
    return (
      <View style={styles.centerState}>
        <Text style={styles.successTitle}>Laporan terkirim</Text>
        <Text style={styles.emptyBody}>Pelepas hewan dapat melihat kondisi terbaru dari halaman monitoring.</Text>
      </View>
    );
  }

  const canSubmit = report.status === 'due' || report.status === 'late';

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <BackButton />
      <View style={styles.header}>
        <Text style={styles.title}>Laporan Kondisi</Text>
        <Text style={styles.subtitle}>Jatuh tempo: {formatDate(report.dueAt)}</Text>
      </View>

      {!canSubmit ? (
        <Text style={styles.notice}>Laporan dapat dikirim setelah status monitoring jatuh tempo.</Text>
      ) : null}

      <PhotoPicker
        label="Foto kondisi terkini"
        value={conditionPhotoUris}
        onChange={setConditionPhotoUris}
        buttonLabel="Tambah foto kondisi"
        selectionLimit={1}
      />
      <TextField
        label="Catatan kondisi"
        value={conditionNote}
        onChangeText={(value) => {
          setConditionNote(value);
          setSubmitError(null);
        }}
        multiline
        style={styles.multiline}
      />

      {submitError ? <Text style={styles.errorBanner}>{submitError}</Text> : null}

      <Pressable
        style={[styles.button, (!canSubmit || submitting) && styles.buttonDisabled]}
        onPress={onSubmit}
        disabled={!canSubmit || submitting}
      >
        <Text style={styles.buttonText}>{submitting ? 'Mengirim...' : 'Kirim Laporan'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  content: { gap: 16, padding: 20, paddingBottom: 32 },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#f8fafc', padding: 24 },
  stateText: { color: '#475569', fontSize: 15, fontWeight: '600' },
  header: { gap: 6 },
  title: { color: '#0f766e', fontSize: 28, fontWeight: '800' },
  subtitle: { color: '#475569', fontSize: 15, lineHeight: 22 },
  notice: {
    borderRadius: 8,
    backgroundColor: '#fef3c7',
    color: '#92400e',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    padding: 12,
  },
  multiline: { minHeight: 110, paddingTop: 12, textAlignVertical: 'top' },
  errorBanner: {
    borderRadius: 8,
    padding: 12,
    color: '#991b1b',
    backgroundColor: '#fee2e2',
    fontSize: 14,
    fontWeight: '700',
  },
  button: { alignItems: 'center', borderRadius: 8, backgroundColor: '#0f766e', paddingVertical: 15 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#ffffff', fontWeight: '800' },
  emptyTitle: { color: '#0f172a', fontSize: 20, fontWeight: '800', textAlign: 'center' },
  successTitle: { color: '#0f766e', fontSize: 22, fontWeight: '900', textAlign: 'center' },
  emptyBody: { color: '#64748b', fontSize: 15, lineHeight: 22, textAlign: 'center' },
  retryButton: {
    borderRadius: 8,
    backgroundColor: '#0f766e',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  retryButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
});
