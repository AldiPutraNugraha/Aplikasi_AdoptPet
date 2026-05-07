import { Platform, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import type { Coordinates } from '@/types/domain';

type Props = {
  coordinates?: Coordinates;
  title?: string;
};

export function PetMap({ coordinates, title = 'Lokasi hewan' }: Props) {
  if (!coordinates) {
    return (
      <View style={[styles.map, styles.unavailable]}>
        <Text style={styles.unavailableTitle}>Lokasi belum tersedia</Text>
        <Text style={styles.unavailableBody}>Pemilik belum menambahkan titik peta untuk hewan ini.</Text>
      </View>
    );
  }

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.map, styles.unavailable]}>
        <Text style={styles.unavailableTitle}>Peta tidak tersedia di web</Text>
        <Text style={styles.unavailableBody}>Buka aplikasi mobile untuk melihat titik lokasi hewan.</Text>
      </View>
    );
  }

  return (
    <MapView
      style={styles.map}
      initialRegion={{
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }}>
      <Marker coordinate={coordinates} title={title} />
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: 220,
    overflow: 'hidden',
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
  },
  unavailable: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#dbe4ea',
    padding: 20,
  },
  unavailableTitle: { color: '#334155', fontSize: 16, fontWeight: '800', textAlign: 'center' },
  unavailableBody: { color: '#64748b', fontSize: 14, lineHeight: 20, textAlign: 'center' },
});
