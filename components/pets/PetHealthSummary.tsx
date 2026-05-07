import { StyleSheet, Text, View } from 'react-native';

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

export function PetHealthSummary({ pet }: Props) {
  const medicalHistory = pet.medicalHistory?.trim() || 'Tidak ada riwayat medis yang dicatat.';
  const proofCount = pet.healthProofUrls?.filter((url) => url.trim().length > 0).length ?? 0;

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
      <Text style={styles.proof}>{proofCount} bukti kesehatan tersimpan</Text>
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
  section: { gap: 4 },
  label: { color: '#64748b', fontSize: 13, fontWeight: '700' },
  value: { color: '#0f172a', fontSize: 14, fontWeight: '700' },
  body: { color: '#334155', fontSize: 14, lineHeight: 20 },
  proof: { color: '#0f766e', fontSize: 13, fontWeight: '800' },
});
