import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { PhotoPicker } from '@/components/forms/PhotoPicker';
import { PetCard } from '@/components/pets/PetCard';
import { useAuth } from '@/contexts/auth-context';
import { analyzePetImage, NotAPetImageError } from '@/lib/ai/openrouter-client';
import { buildPetVocabulary } from '@/lib/ai/pet-vocabulary';
import { sortPetsByVisualMatch } from '@/lib/domain/visual-match';
import { listAvailablePets } from '@/lib/firebase/pets';
import { uploadImageAsync } from '@/lib/firebase/storage';
import type { Pet, VisualAttributes } from '@/types/domain';

type PetWithVisualScore = Pet & { visualScore?: number };

const visualSearchCache: {
  attributes: VisualAttributes | null;
  results: PetWithVisualScore[];
  modalOpen: boolean;
} = { attributes: null, results: [], modalOpen: false };

export default function SearchScreen() {
  const { firebaseUser } = useAuth();
  const [species, setSpecies] = useState('');
  const [primaryColor, setPrimaryColor] = useState('');
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [visualAttributes, setVisualAttributes] = useState<VisualAttributes | null>(visualSearchCache.attributes);
  const [visualResults, setVisualResults] = useState<PetWithVisualScore[]>(visualSearchCache.results);
  const [showVisualModal, setShowVisualModal] = useState(visualSearchCache.modalOpen);

  useEffect(() => {
    visualSearchCache.attributes = visualAttributes;
    visualSearchCache.results = visualResults;
    visualSearchCache.modalOpen = showVisualModal;
  }, [visualAttributes, visualResults, showVisualModal]);

  function runManualSearch() {
    router.push({
      pathname: '/(adopter)',
      params: {
        species: species.trim(),
        primaryColor: primaryColor.trim(),
      },
    });
  }

  async function runVisualSearch() {
    if (!firebaseUser) {
      Alert.alert('Login diperlukan', 'Masuk terlebih dahulu untuk memakai pencarian visual.');
      return;
    }

    if (imageUris.length === 0) {
      Alert.alert('Pilih foto dulu', 'Tambahkan satu foto referensi hewan untuk dianalisis.');
      return;
    }

    setAiLoading(true);

    try {
      const pets = await listAvailablePets();
      const imagePath = `search/${firebaseUser.uid}/${Date.now()}.jpg`;
      const imageUrl = await uploadImageAsync(imageUris[0], imagePath);
      const vocabulary = buildPetVocabulary(pets);
      const attributes = await analyzePetImage(imageUrl, vocabulary);
      setVisualAttributes(attributes);
      setVisualResults(sortPetsByVisualMatch(pets, attributes).filter((p) => (p.visualScore ?? 0) > 0));
      setShowVisualModal(true);
    } catch (caughtError) {
      if (caughtError instanceof NotAPetImageError) {
        Alert.alert('Gambar bukan hewan', caughtError.message);
        setImageUris([]);
      } else {
        Alert.alert(
          'Pencarian visual gagal',
          caughtError instanceof Error ? caughtError.message : 'Gunakan pencarian manual atau coba foto lain.',
        );
      }
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Pencarian</Text>
          <Text style={styles.body}>
            Cari hewan berdasarkan jenis & warna, atau gunakan pencarian visual dari foto.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pencarian manual</Text>
          <View style={styles.field}>
            <Text style={styles.label}>Jenis hewan</Text>
            <TextInput
              value={species}
              onChangeText={setSpecies}
              placeholder="Kucing, anjing..."
              style={styles.input}
              autoCapitalize="none"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Warna utama</Text>
            <TextInput
              value={primaryColor}
              onChangeText={setPrimaryColor}
              placeholder="Putih, hitam..."
              style={styles.input}
              autoCapitalize="none"
            />
          </View>
          <Pressable accessibilityRole="button" style={styles.button} onPress={runManualSearch}>
            <Text style={styles.buttonText}>Cari</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pencarian visual</Text>
          <PhotoPicker
            label="Foto referensi"
            value={imageUris}
            onChange={setImageUris}
            buttonLabel="Pilih foto referensi"
            selectionLimit={1}
          />
          <Pressable
            accessibilityRole="button"
            style={[styles.button, aiLoading ? styles.buttonDisabled : null]}
            onPress={runVisualSearch}
            disabled={aiLoading}
          >
            <Text style={styles.buttonText}>{aiLoading ? 'Menganalisis...' : 'Cari dari Gambar'}</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal
        visible={showVisualModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowVisualModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Hasil Pencarian Visual</Text>
            </View>

            {visualAttributes ? (
              <View style={styles.modalAttributes}>
                <Text style={styles.modalAttrLabel}>Perkiraan AI:</Text>
                <Text style={styles.modalAttrText}>
                  {visualAttributes.species}, {visualAttributes.primaryColor}, {visualAttributes.furPattern}
                  {visualAttributes.estimatedBreed ? `, ${visualAttributes.estimatedBreed}` : ''}
                </Text>
                <Text style={styles.modalConfidence}>
                  Akurasi: {Math.round(visualAttributes.confidence * 100)}%
                </Text>
              </View>
            ) : null}

            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
              {visualResults.length === 0 ? (
                <View style={styles.modalEmpty}>
                  <Text style={styles.modalEmptyText}>Tidak ada hewan yang cocok ditemukan.</Text>
                </View>
              ) : (
                visualResults.map((pet) => (
                  <View key={pet.id} style={styles.modalResultItem}>
                    <Text style={styles.modalScoreText}>Skor visual: {pet.visualScore ?? 0}</Text>
                    <PetCard
                      pet={pet}
                      hideMeta
                      showDetailButton
                      onDetailPress={() => {
                        router.push(`/(adopter)/pets/${pet.id}?from=search`);
                      }}
                    />
                  </View>
                ))
              )}
            </ScrollView>

            <Pressable
              accessibilityRole="button"
              style={styles.modalDoneBtn}
              onPress={() => setShowVisualModal(false)}
            >
              <Text style={styles.modalDoneText}>Tutup</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  content: { gap: 16, padding: 20, paddingBottom: 32 },
  header: { gap: 6, marginBottom: 4 },
  title: { color: '#0f766e', fontSize: 28, fontWeight: '800' },
  body: { color: '#475569', fontSize: 15, lineHeight: 22 },
  section: {
    gap: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    padding: 16,
  },
  sectionTitle: { color: '#0f172a', fontSize: 17, fontWeight: '800' },
  field: { gap: 6 },
  label: { color: '#1f2937', fontSize: 14, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    color: '#0f172a',
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  button: {
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#0f766e',
    paddingVertical: 13,
  },
  buttonDisabled: { opacity: 0.65 },
  buttonText: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 12,
  },
  modalTitle: { color: '#0f766e', fontSize: 20, fontWeight: '800', flex: 1 },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: { color: '#475569', fontSize: 16, fontWeight: '700' },
  modalAttributes: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: '#ecfdf5',
    padding: 12,
    gap: 4,
  },
  modalAttrLabel: { color: '#065f46', fontSize: 13, fontWeight: '800' },
  modalAttrText: { color: '#065f46', fontSize: 14, fontWeight: '600' },
  modalConfidence: { color: '#065f46', fontSize: 12, fontWeight: '700', marginTop: 2 },
  modalScroll: { flexGrow: 0 },
  modalScrollContent: { paddingHorizontal: 20, gap: 10 },
  modalEmpty: { alignItems: 'center', paddingVertical: 32 },
  modalEmptyText: { color: '#64748b', fontSize: 14, fontWeight: '600' },
  modalResultItem: { gap: 6 },
  modalScoreText: { color: '#0f766e', fontSize: 13, fontWeight: '800' },
  modalDoneBtn: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 8,
    backgroundColor: '#0f766e',
    paddingVertical: 13,
    alignItems: 'center',
  },
  modalDoneText: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
});
