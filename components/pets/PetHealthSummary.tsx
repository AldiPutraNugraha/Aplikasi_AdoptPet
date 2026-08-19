import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { Pet } from '@/types/domain';

type Props = {
  pet: Pick<
    Pet,
    'vaccinationStatus' | 'sterilizationStatus' | 'medicalHistory' | 'healthProofUrls'
  >;
};

const statusLabels: Record<string, string> = {
  yes: 'Ya',
  no: 'Tidak',
  unknown: 'Belum tahu',
  vaccinated: 'Sudah vaksin',
};

function labelForStatus(status: string) {
  return statusLabels[status] ?? status;
}

function ProofPreviewModal({
  photos,
  index,
  onClose,
  onChange,
}: {
  photos: string[];
  index: number | null;
  onClose: () => void;
  onChange: (next: number) => void;
}) {
  const visible = index !== null && index >= 0 && index < photos.length;
  if (!visible) return null;
  const screen = Dimensions.get('window');
  const current = photos[index];

  function prev() {
    if (index !== null && index > 0) onChange(index - 1);
  }
  function next() {
    if (index !== null && index < photos.length - 1) onChange(index + 1);
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={modalStyles.backdrop}>
        <Pressable style={modalStyles.closeBtn} onPress={onClose} accessibilityRole="button">
          <Ionicons name="close" size={28} color="#ffffff" />
        </Pressable>
        <Pressable style={modalStyles.imageWrap} onPress={onClose}>
          <Image
            source={{ uri: current }}
            style={{ width: screen.width, height: screen.height * 0.8 }}
            resizeMode="contain"
          />
        </Pressable>
        {photos.length > 1 ? (
          <View style={modalStyles.footer}>
            <Pressable
              style={[modalStyles.navBtn, index === 0 && modalStyles.navBtnDisabled]}
              onPress={prev}
              disabled={index === 0}
            >
              <Ionicons name="chevron-back" size={24} color="#ffffff" />
            </Pressable>
            <Text style={modalStyles.counter}>
              {(index ?? 0) + 1} / {photos.length}
            </Text>
            <Pressable
              style={[modalStyles.navBtn, index === photos.length - 1 && modalStyles.navBtnDisabled]}
              onPress={next}
              disabled={index === photos.length - 1}
            >
              <Ionicons name="chevron-forward" size={24} color="#ffffff" />
            </Pressable>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

export function PetHealthSummary({ pet }: Props) {
  const medicalHistory = pet.medicalHistory?.trim() || 'Tidak ada riwayat medis yang dicatat.';
  const proofs = (pet.healthProofUrls ?? []).filter((url) => url.trim().length > 0);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Kesehatan</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Vaksinasi</Text>
        <Text style={styles.value}>{labelForStatus(pet.vaccinationStatus)}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Sterilisasi</Text>
        <Text style={styles.value}>{labelForStatus(pet.sterilizationStatus)}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Riwayat medis</Text>
        <Text style={styles.body}>{medicalHistory}</Text>
      </View>

      {proofs.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.proof}>{proofs.length} bukti kesehatan tersimpan</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.proofRow}>
            {proofs.map((url, i) => (
              <Pressable
                key={`${url}-${i}`}
                accessibilityRole="button"
                onPress={() => setPreviewIndex(i)}
              >
                <Image source={{ uri: url }} style={styles.proofThumb} resizeMode="cover" />
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : (
        <Text style={styles.proof}>0 bukti kesehatan tersimpan</Text>
      )}

      <ProofPreviewModal
        photos={proofs}
        index={previewIndex}
        onClose={() => setPreviewIndex(null)}
        onChange={setPreviewIndex}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 10,
    borderWidth: 1,
    borderColor: '#dbe4ea',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    padding: 16,
  },
  title: { color: '#0f172a', fontSize: 18, fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  section: { gap: 6 },
  label: { color: '#64748b', fontSize: 13, fontWeight: '700' },
  value: { color: '#0f172a', fontSize: 14, fontWeight: '700' },
  body: { color: '#334155', fontSize: 14, lineHeight: 20 },
  proof: { color: '#0f766e', fontSize: 13, fontWeight: '800' },
  proofRow: { gap: 8, paddingVertical: 4 },
  proofThumb: { width: 84, height: 84, borderRadius: 8, backgroundColor: '#e2e8f0' },
});

const modalStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  closeBtn: {
    position: 'absolute',
    top: 44,
    right: 18,
    zIndex: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 8,
  },
  imageWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  footer: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  navBtn: { padding: 4 },
  navBtnDisabled: { opacity: 0.3 },
  counter: { color: '#ffffff', fontSize: 14, fontWeight: '700', minWidth: 50, textAlign: 'center' },
});
