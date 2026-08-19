import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { TextField } from '@/components/forms/TextField';
import type { Coordinates } from '@/types/domain';

type Props = {
  label: string;
  address: string;
  coordinates?: Coordinates;
  onAddressChange: (value: string) => void;
  onCoordinatesChange: (value: Coordinates) => void;
};

const DEFAULT_REGION = {
  latitude: -6.914744,
  longitude: 107.60981,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const GEOCODE_DEBOUNCE_MS = 900;
const MIN_ADDRESS_LENGTH = 8;

function formatGeocode(result: Location.LocationGeocodedAddress | undefined) {
  if (!result) return '';
  const parts = [
    result.name,
    result.street,
    result.district,
    result.subregion,
    result.city,
    result.region,
    result.postalCode,
  ].filter((part): part is string => Boolean(part && part.trim().length > 0));

  const seen = new Set<string>();
  return parts.filter((part) => (seen.has(part) ? false : seen.add(part) && true)).join(', ');
}

export function LocationPicker({
  label,
  address,
  coordinates,
  onAddressChange,
  onCoordinatesChange,
}: Props) {
  const mapRef = useRef<MapView | null>(null);
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const skipAddressGeocodeRef = useRef(false);
  const lastGeocodedAddressRef = useRef<string>('');

  function recenter(next: Coordinates) {
    mapRef.current?.animateToRegion(
      {
        latitude: next.latitude,
        longitude: next.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
      350,
    );
  }

  async function reverseGeocode(next: Coordinates) {
    setGeocoding(true);
    try {
      const results = await Location.reverseGeocodeAsync(next);
      const formatted = formatGeocode(results[0]);
      if (formatted) {
        skipAddressGeocodeRef.current = true;
        lastGeocodedAddressRef.current = formatted;
        onAddressChange(formatted);
      }
    } catch {
      // Silently ignore — user can type manually.
    } finally {
      setGeocoding(false);
    }
  }

  function updateCoordinatesFromGps(next: Coordinates) {
    onCoordinatesChange(next);
    void reverseGeocode(next);
  }

  async function useCurrentLocation() {
    setMessage(null);
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== Location.PermissionStatus.GRANTED) {
        setMessage('Izin lokasi ditolak. Aktifkan izin lokasi untuk menandai lokasi hewan.');
        return;
      }

      const current = await Location.getCurrentPositionAsync({});
      const next = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      };
      updateCoordinatesFromGps(next);
      recenter(next);
    } catch {
      setMessage('Gagal mengambil lokasi. Pastikan GPS aktif lalu coba lagi.');
    } finally {
      setLocating(false);
    }
  }

  useEffect(() => {
    if (skipAddressGeocodeRef.current) {
      skipAddressGeocodeRef.current = false;
      return;
    }
    const trimmed = address.trim();
    if (trimmed.length < MIN_ADDRESS_LENGTH) return;
    if (trimmed === lastGeocodedAddressRef.current) return;

    const handle = setTimeout(async () => {
      setGeocoding(true);
      try {
        const results = await Location.geocodeAsync(trimmed);
        const first = results[0];
        if (first) {
          const next = { latitude: first.latitude, longitude: first.longitude };
          lastGeocodedAddressRef.current = trimmed;
          onCoordinatesChange(next);
          recenter(next);
          setMessage(null);
        } else {
          setMessage('Alamat tidak ditemukan. Coba lengkapi alamat atau gunakan tombol GPS.');
        }
      } catch {
        setMessage('Gagal mencari alamat di peta. Periksa koneksi lalu coba lagi.');
      } finally {
        setGeocoding(false);
      }
    }, GEOCODE_DEBOUNCE_MS);

    return () => clearTimeout(handle);
  }, [address, onCoordinatesChange]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <TextField
        label="Alamat hewan"
        value={address}
        onChangeText={onAddressChange}
        placeholder="Jl. Contoh No.1, kelurahan, kota"
        multiline
      />
      {geocoding ? <Text style={styles.hintText}>Mencari lokasi di peta...</Text> : null}

      <Pressable style={styles.button} onPress={useCurrentLocation} disabled={locating}>
        <Text style={styles.buttonText}>
          {locating ? 'Mengambil lokasi...' : 'Ambil Lokasi Hewan (GPS)'}
        </Text>
      </Pressable>

      {coordinates ? (
        <Text style={styles.coordsText}>
          Titik: {coordinates.latitude.toFixed(5)}, {coordinates.longitude.toFixed(5)}
        </Text>
      ) : (
        <Text style={styles.hintText}>
          Isi alamat lengkap untuk menandai lokasi otomatis, atau tekan tombol GPS.
        </Text>
      )}

      {Platform.OS === 'web' ? (
        <View style={[styles.map, styles.mapUnavailable]}>
          <Text style={styles.mapUnavailableText}>Peta hanya tersedia di aplikasi mobile.</Text>
        </View>
      ) : (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={
            coordinates
              ? {
                  latitude: coordinates.latitude,
                  longitude: coordinates.longitude,
                  latitudeDelta: 0.02,
                  longitudeDelta: 0.02,
                }
              : DEFAULT_REGION
          }
        >
          {coordinates ? <Marker coordinate={coordinates} /> : null}
        </MapView>
      )}

      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  label: { color: '#1f2937', fontSize: 14, fontWeight: '600' },
  button: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0f766e',
    borderRadius: 8,
    paddingVertical: 12,
    backgroundColor: '#f0fdfa',
  },
  buttonText: { color: '#0f766e', fontWeight: '700' },
  coordsText: { color: '#0f766e', fontSize: 13, fontWeight: '700' },
  hintText: { color: '#64748b', fontSize: 13 },
  map: {
    width: '100%',
    height: 220,
    overflow: 'hidden',
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
  },
  mapUnavailable: { alignItems: 'center', justifyContent: 'center', padding: 20 },
  mapUnavailableText: { color: '#64748b', fontSize: 14, textAlign: 'center' },
  message: { color: '#b45309', fontSize: 13 },
});
