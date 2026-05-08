import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { TextField } from '@/components/forms/TextField';
import { useAuth } from '@/contexts/auth-context';
import {
  canDecideAdoptionRequest,
  listOwnerRequests,
  updateRequestDecision,
} from '@/lib/firebase/adoption';
import type { AdoptionRequest, AdoptionRequestStatus } from '@/types/domain';

const statusLabels: Record<AdoptionRequestStatus, string> = {
  pending: 'Menunggu',
  accepted: 'Diterima',
  rejected: 'Ditolak',
  cancelled: 'Dibatalkan',
};

const answerLabels = [
  ['adoptionReason', 'Alasan adopsi'],
  ['petCareExperience', 'Pengalaman merawat'],
  ['livingCondition', 'Kondisi tempat tinggal'],
  ['dailyCareAvailability', 'Perawatan harian'],
  ['whatsappContact', 'WhatsApp'],
] as const;

function formatDate(value?: number) {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export default function OwnerRequestsScreen() {
  const { firebaseUser, profile, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState<AdoptionRequest[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [decidingId, setDecidingId] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    if (!firebaseUser || profile?.role !== 'owner') {
      setRequests([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setError(null);
    try {
      const ownerRequests = await listOwnerRequests(firebaseUser.uid);
      const sortedRequests = [...ownerRequests].sort((left, right) => right.requestedAt - left.requestedAt);
      setRequests(sortedRequests);
      setNotes((current) => {
        const next: Record<string, string> = {};
        sortedRequests.forEach((request) => {
          next[request.id] = current[request.id] ?? request.ownerNote ?? '';
        });
        return next;
      });
    } catch {
      setError('Gagal memuat pengajuan. Periksa koneksi lalu coba lagi.');
      setRequests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [firebaseUser, profile?.role]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void loadRequests();
    }, [loadRequests]),
  );

  function refreshRequests() {
    setRefreshing(true);
    void loadRequests();
  }

  async function decideRequest(request: AdoptionRequest, status: 'accepted' | 'rejected') {
    if (!canDecideAdoptionRequest(request.status)) {
      return;
    }

    setDecidingId(request.id);
    setDecisionError(null);
    try {
      await updateRequestDecision({
        requestId: request.id,
        currentStatus: request.status,
        status,
        ownerNote: notes[request.id]?.trim() ?? '',
      });
      await loadRequests();
    } catch {
      setDecisionError('Keputusan belum tersimpan. Periksa koneksi lalu coba lagi.');
    } finally {
      setDecidingId(null);
    }
  }

  function renderRequest({ item }: { item: AdoptionRequest }) {
    const canDecide = canDecideAdoptionRequest(item.status);
    const isDeciding = decidingId === item.id;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleGroup}>
            <Text style={styles.requestTitle}>Pengajuan #{item.id.slice(0, 6)}</Text>
            <Text style={styles.requestMeta}>Adopter: {item.adopterId}</Text>
          </View>
          <Text style={[styles.status, styles[`status_${item.status}`]]}>{statusLabels[item.status]}</Text>
        </View>

        <View style={styles.dateGrid}>
          <Text style={styles.dateText}>Diajukan: {formatDate(item.requestedAt)}</Text>
          {item.decidedAt ? <Text style={styles.dateText}>Diputuskan: {formatDate(item.decidedAt)}</Text> : null}
        </View>

        <View style={styles.answers}>
          {answerLabels.map(([field, label]) => (
            <View key={field} style={styles.answerRow}>
              <Text style={styles.answerLabel}>{label}</Text>
              <Text style={styles.answerText}>{item.screeningAnswers[field] || '-'}</Text>
            </View>
          ))}
        </View>

        {canDecide ? (
          <View style={styles.decisionBlock}>
            <TextField
              label="Catatan untuk adopter"
              value={notes[item.id] ?? ''}
              onChangeText={(value) => setNotes((current) => ({ ...current, [item.id]: value }))}
              editable={!isDeciding}
              multiline
              style={styles.noteInput}
            />
            <View style={styles.actions}>
              <Pressable
                style={[styles.secondaryButton, isDeciding && styles.buttonDisabled]}
                onPress={() => void decideRequest(item, 'rejected')}
                disabled={isDeciding}
              >
                <Text style={styles.secondaryButtonText}>{isDeciding ? 'Menyimpan...' : 'Tolak'}</Text>
              </Pressable>
              <Pressable
                style={[styles.primaryButton, isDeciding && styles.buttonDisabled]}
                onPress={() => void decideRequest(item, 'accepted')}
                disabled={isDeciding}
              >
                <Text style={styles.primaryButtonText}>{isDeciding ? 'Menyimpan...' : 'Terima'}</Text>
              </Pressable>
            </View>
          </View>
        ) : item.ownerNote ? (
          <View style={styles.finalNote}>
            <Text style={styles.finalNoteLabel}>Catatan keputusan</Text>
            <Text style={styles.finalNoteText}>{item.ownerNote}</Text>
          </View>
        ) : null}
      </View>
    );
  }

  if (authLoading || loading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator color="#0f766e" />
        <Text style={styles.stateText}>Memuat pengajuan...</Text>
      </View>
    );
  }

  if (!firebaseUser || profile?.role !== 'owner') {
    return (
      <View style={styles.centerState}>
        <Text style={styles.emptyTitle}>Masuk sebagai pemilik</Text>
        <Text style={styles.emptyBody}>Gunakan akun owner untuk meninjau pengajuan adopsi.</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerState}>
        <Text style={styles.emptyTitle}>Tidak bisa memuat pengajuan</Text>
        <Text style={styles.emptyBody}>{error}</Text>
        <Pressable accessibilityRole="button" onPress={refreshRequests} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Coba lagi</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      data={requests}
      keyExtractor={(item) => item.id}
      style={styles.screen}
      contentContainerStyle={requests.length === 0 ? styles.emptyContent : styles.content}
      renderItem={renderRequest}
      onRefresh={refreshRequests}
      refreshing={refreshing}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>Pengajuan</Text>
          <Text style={styles.body}>Tinjau jawaban screening sebelum menerima atau menolak adopsi.</Text>
          {decisionError ? <Text style={styles.errorBanner}>{decisionError}</Text> : null}
        </View>
      }
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Belum ada pengajuan</Text>
          <Text style={styles.emptyBody}>Pengajuan calon adopter akan muncul di sini.</Text>
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
    gap: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 14,
    backgroundColor: '#ffffff',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  cardTitleGroup: { flex: 1, gap: 4 },
  requestTitle: { color: '#0f172a', fontSize: 17, fontWeight: '800' },
  requestMeta: { color: '#64748b', fontSize: 12, lineHeight: 17 },
  status: {
    overflow: 'hidden',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
    fontWeight: '800',
  },
  status_pending: { color: '#854d0e', backgroundColor: '#fef3c7' },
  status_accepted: { color: '#0f766e', backgroundColor: '#ccfbf1' },
  status_rejected: { color: '#991b1b', backgroundColor: '#fee2e2' },
  status_cancelled: { color: '#475569', backgroundColor: '#e2e8f0' },
  dateGrid: { gap: 4 },
  dateText: { color: '#64748b', fontSize: 12, lineHeight: 17 },
  answers: { gap: 10 },
  answerRow: { gap: 3 },
  answerLabel: { color: '#334155', fontSize: 13, fontWeight: '800' },
  answerText: { color: '#475569', fontSize: 14, lineHeight: 20 },
  decisionBlock: { gap: 10 },
  noteInput: { minHeight: 78, paddingTop: 12, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', gap: 10 },
  primaryButton: { flex: 1, alignItems: 'center', borderRadius: 8, backgroundColor: '#0f766e', paddingVertical: 13 },
  primaryButtonText: { color: '#ffffff', fontWeight: '800' },
  secondaryButton: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    paddingVertical: 13,
  },
  secondaryButtonText: { color: '#b91c1c', fontWeight: '800' },
  buttonDisabled: { opacity: 0.6 },
  finalNote: { gap: 4, borderRadius: 8, padding: 12, backgroundColor: '#f8fafc' },
  finalNoteLabel: { color: '#334155', fontSize: 12, fontWeight: '800' },
  finalNoteText: { color: '#475569', fontSize: 14, lineHeight: 20 },
  errorBanner: {
    borderRadius: 8,
    padding: 12,
    color: '#991b1b',
    backgroundColor: '#fee2e2',
    fontSize: 14,
    fontWeight: '700',
  },
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
