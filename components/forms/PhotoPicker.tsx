import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type Props = {
  label: string;
  value: string[];
  onChange: (uris: string[]) => void;
  buttonLabel?: string;
  selectionLimit?: number;
  hint?: string;
};

export function PhotoPicker({
  label,
  value,
  onChange,
  buttonLabel = 'Pilih foto',
  selectionLimit = 10,
  hint,
}: Props) {
  const [permissionMessage, setPermissionMessage] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);

  async function pickImages() {
    setPermissionMessage(null);
    setPicking(true);

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        setPermissionMessage('Izin galeri ditolak. Foto bisa ditambahkan setelah izin diberikan.');
        return;
      }

      const remaining = Math.max(1, selectionLimit - value.length);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: remaining,
        quality: 0.8,
      });

      if (result.canceled) {
        return;
      }

      const pickedUris = result.assets.map((asset) => asset.uri).filter(Boolean);
      const merged = [...value, ...pickedUris].slice(0, selectionLimit);
      onChange(merged);
    } catch {
      setPermissionMessage('Foto belum bisa dipilih. Coba lagi sebentar lagi.');
    } finally {
      setPicking(false);
    }
  }

  function removeImage(uri: string) {
    onChange(value.filter((item) => item !== uri));
  }

  const reachedLimit = value.length >= selectionLimit;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.count}>
          {value.length} / {selectionLimit} dipilih
        </Text>
      </View>

      {hint ? <Text style={styles.hint}>{hint}</Text> : null}

      <Pressable
        style={[styles.button, reachedLimit && styles.buttonDisabled]}
        onPress={pickImages}
        disabled={picking || reachedLimit}
      >
        <Text style={styles.buttonText}>
          {picking
            ? 'Membuka galeri...'
            : reachedLimit
            ? 'Batas foto tercapai'
            : value.length > 0
            ? 'Tambah foto lagi'
            : buttonLabel}
        </Text>
      </Pressable>

      {permissionMessage ? <Text style={styles.message}>{permissionMessage}</Text> : null}

      {value.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.previewList}>
          {value.map((uri) => (
            <View key={uri} style={styles.previewItem}>
              <Image source={{ uri }} style={styles.previewImage} contentFit="cover" />
              <Pressable style={styles.removeButton} onPress={() => removeImage(uri)}>
                <Text style={styles.removeText}>Hapus</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  label: { color: '#1f2937', fontSize: 14, fontWeight: '600' },
  count: { color: '#64748b', fontSize: 13 },
  button: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0f766e',
    borderRadius: 8,
    paddingVertical: 12,
    backgroundColor: '#f0fdfa',
  },
  buttonText: { color: '#0f766e', fontWeight: '700' },
  buttonDisabled: { opacity: 0.5 },
  hint: { color: '#475569', fontSize: 12, lineHeight: 17 },
  message: { color: '#b45309', fontSize: 13 },
  previewList: { gap: 10, paddingVertical: 2 },
  previewItem: { width: 104, gap: 6 },
  previewImage: { width: 104, height: 104, borderRadius: 8, backgroundColor: '#e2e8f0' },
  removeButton: {
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 7,
    backgroundColor: '#fee2e2',
  },
  removeText: { color: '#991b1b', fontSize: 12, fontWeight: '700' },
});
