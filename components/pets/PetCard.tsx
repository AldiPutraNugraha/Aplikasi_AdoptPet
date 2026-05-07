import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Pet } from '@/types/domain';

type Props = {
  pet: Pet & {
    distanceKm?: number;
    visualScore?: number;
  };
  onPress?: () => void;
};

function firstPhotoUrl(photoUrls?: string[]) {
  return photoUrls?.find((url) => url.trim().length > 0);
}

export function PetCard({ pet, onPress }: Props) {
  const imageUri = firstPhotoUrl(pet.photoUrls);
  const colorPattern = [pet.species, pet.primaryColor, pet.furPattern].filter(Boolean).join(' / ');

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && onPress ? styles.cardPressed : null]}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Foto belum tersedia</Text>
        </View>
      )}

      <View style={styles.body}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>
            {pet.name}
          </Text>
          {typeof pet.distanceKm === 'number' ? (
            <Text style={styles.badge}>{pet.distanceKm.toFixed(1)} km</Text>
          ) : null}
        </View>

        <Text style={styles.meta} numberOfLines={2}>
          {colorPattern}
        </Text>

        {typeof pet.visualScore === 'number' ? (
          <Text style={styles.score}>Kecocokan visual {Math.round(pet.visualScore)}%</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#dbe4ea',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    padding: 10,
  },
  cardPressed: { opacity: 0.78 },
  image: { width: 104, height: 104, borderRadius: 8, backgroundColor: '#e2e8f0' },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 104,
    height: 104,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
    padding: 8,
  },
  placeholderText: { color: '#64748b', fontSize: 12, fontWeight: '700', textAlign: 'center' },
  body: { flex: 1, justifyContent: 'center', gap: 8, minWidth: 0 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { flex: 1, color: '#0f172a', fontSize: 18, fontWeight: '800' },
  badge: {
    borderRadius: 999,
    backgroundColor: '#dcfce7',
    color: '#166534',
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  meta: { color: '#475569', fontSize: 14, lineHeight: 20 },
  score: { color: '#0f766e', fontSize: 13, fontWeight: '700' },
});
