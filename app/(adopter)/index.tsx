import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { PetCard } from "@/components/pets/PetCard";
import { useAuth } from "@/contexts/auth-context";
import { sortByDrivingDistance } from "@/lib/domain/distance";
import { listAvailablePets } from "@/lib/firebase/pets";
import { listReportsForAdopter } from "@/lib/firebase/reports";
import type {
  Coordinates,
  MonitoringReportStatus,
  Pet,
  PostAdoptionReport,
} from "@/types/domain";

const monitoringStatusLabels: Record<MonitoringReportStatus, string> = {
  scheduled: "Terjadwal",
  due: "Jatuh tempo",
  submitted: "Terkirim",
  late: "Terlambat",
};

function formatDate(value?: number) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function paramToString(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default function AdopterHomeScreen() {
  const { firebaseUser } = useAuth();
  const params = useLocalSearchParams<{
    species?: string | string[];
    primaryColor?: string | string[];
  }>();
  const speciesFilter = paramToString(params.species).trim().toLowerCase();
  const colorFilter = paramToString(params.primaryColor).trim().toLowerCase();
  const [pets, setPets] = useState<Pet[]>([]);
  const [reports, setReports] = useState<PostAdoptionReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [origin, setOrigin] = useState<Coordinates | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [distanceNotice, setDistanceNotice] = useState<string | null>(null);
  const [sortedPets, setSortedPets] = useState<
    (Pet & { distanceKm?: number })[]
  >([]);

  useEffect(() => {
    async function loadLocation() {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== Location.PermissionStatus.GRANTED) {
          setLocationDenied(true);
          return;
        }
        const current = await Location.getCurrentPositionAsync({});
        setOrigin({
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
        });
      } catch {
        setLocationDenied(true);
      }
    }
    void loadLocation();
  }, []);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [availablePets, adopterReports] = await Promise.all([
        listAvailablePets(),
        firebaseUser
          ? listReportsForAdopter(firebaseUser.uid)
          : Promise.resolve([]),
      ]);
      setPets(availablePets);
      setReports(adopterReports);
    } catch {
      setError("Gagal memuat hewan tersedia. Periksa koneksi lalu coba lagi.");
      setPets([]);
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [firebaseUser]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const activeReports = reports.filter(
    (report) => report.status !== "submitted",
  );

  const filteredBase = useMemo(
    () =>
      pets.filter((pet) => {
        const matchesSpecies = speciesFilter
          ? pet.species.toLowerCase().includes(speciesFilter)
          : true;
        const matchesColor = colorFilter
          ? pet.primaryColor.toLowerCase().includes(colorFilter)
          : true;
        return matchesSpecies && matchesColor;
      }),
    [pets, speciesFilter, colorFilter],
  );

  useEffect(() => {
    let cancelled = false;
    if (!origin) {
      setSortedPets(filteredBase);
      setDistanceNotice(null);
      return () => {
        cancelled = true;
      };
    }
    void (async () => {
      setDistanceNotice(null);
      const sorted = await sortByDrivingDistance(origin, filteredBase);
      if (cancelled) return;

      setSortedPets(sorted);

      const hasPetCoordinates = filteredBase.some((pet) => Boolean(pet.coordinates));
      const hasDistance = sorted.some((pet) => pet.distanceKm !== undefined);

      if (hasPetCoordinates && !hasDistance) {
        setDistanceNotice(
          "Jarak tempuh belum dapat dihitung. Daftar hewan tetap ditampilkan tanpa pengurutan jarak.",
        );
      } else if (filteredBase.length > 0 && !hasPetCoordinates) {
        setDistanceNotice(
          "Data koordinat hewan belum tersedia. Daftar hewan ditampilkan tanpa jarak tempuh.",
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filteredBase, origin]);

  const filteredPets = sortedPets;

  const hasFilter = Boolean(speciesFilter || colorFilter);

  function clearFilter() {
    router.setParams({ species: "", primaryColor: "" });
    router.navigate("/(adopter)/search");
  }

  if (loading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator color="#0f766e" />
        <Text style={styles.stateText}>Memuat hewan tersedia...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerState}>
        <Text style={styles.emptyTitle}>Tidak bisa memuat hewan</Text>
        <Text style={styles.emptyBody}>{error}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={loadDashboard}
          style={styles.retryButton}
        >
          <Text style={styles.retryButtonText}>Coba lagi</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      data={filteredPets}
      keyExtractor={(item) => item.id}
      style={styles.screen}
      contentContainerStyle={
        filteredPets.length === 0 ? styles.emptyContent : styles.content
      }
      renderItem={({ item }) => (
        <PetCard
          pet={item}
          hideMeta
          showDetailButton
          onDetailPress={() => router.push(`/(adopter)/pets/${item.id}`)}
        />
      )}
      ListHeaderComponent={
        <View style={styles.header}>
          <View style={styles.headerText}>
            <View style={styles.titleRow}>
              <Text
                style={[styles.title, { fontFamily: "Poppins_800ExtraBold" }]}
              >
                Cari Hewan
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Buka peta hewan"
                onPress={() => router.push("/(adopter)/map")}
                style={({ pressed }) => [
                  styles.mapBtn,
                  pressed ? styles.mapBtnPressed : null,
                ]}
              >
                <Ionicons name="map" size={18} color="#ffffff" />
                <Text style={styles.mapBtnText}>Peta</Text>
              </Pressable>
            </View>
            <Text style={[styles.body, { fontFamily: "Poppins_500Medium" }]}>
              Temukan hewan yang sedang siap diadopsi.
            </Text>
          </View>
          {locationDenied ? (
            <Text style={styles.notice}>
              Izin lokasi tidak aktif. Aktifkan agar hewan diurutkan dari yang
              terdekat.
            </Text>
          ) : null}
          {distanceNotice ? (
            <Text style={styles.notice}>{distanceNotice}</Text>
          ) : null}
          {hasFilter ? (
            <View style={styles.filterChip}>
              <Text style={styles.filterChipText}>
                Filter:
                {speciesFilter ? ` jenis "${speciesFilter}"` : ""}
                {speciesFilter && colorFilter ? "," : ""}
                {colorFilter ? ` warna "${colorFilter}"` : ""}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={clearFilter}
                style={styles.filterClearBtn}
              >
                <Text style={styles.filterClearText}>Hapus filter</Text>
              </Pressable>
            </View>
          ) : null}
          {activeReports.length > 0 ? (
            <View style={styles.monitoringPanel}>
              <Text style={styles.sectionTitle}>Monitoring adopsi</Text>
              {activeReports.map((report) => (
                <Pressable
                  key={report.id}
                  accessibilityRole="button"
                  style={styles.reportItem}
                  onPress={() =>
                    router.push(`/(adopter)/reports/${report.requestId}`)
                  }
                >
                  <View style={styles.reportTextGroup}>
                    <Text style={styles.reportTitle}>
                      Laporan #{report.id.slice(0, 6)}
                    </Text>
                    <Text style={styles.reportMeta}>
                      Jatuh tempo: {formatDate(report.dueAt)}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.reportStatus,
                      styles[`reportStatus_${report.status}`],
                    ]}
                  >
                    {monitoringStatusLabels[report.status]}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      }
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>
            {hasFilter ? "Tidak ada hasil" : "Belum ada hewan tersedia"}
          </Text>
          <Text style={styles.emptyBody}>
            {hasFilter
              ? "Coba longgarkan filter jenis atau warna."
              : "Cek lagi nanti saat pemilik menambahkan hewan untuk diadopsi."}
          </Text>
        </View>
      }
      onRefresh={loadDashboard}
      refreshing={loading}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f8fafc" },
  content: { gap: 12, padding: 20, paddingBottom: 32 },
  emptyContent: { flexGrow: 1, gap: 20, padding: 20 },
  header: { gap: 6, marginBottom: 4 },
  headerText: { gap: 6 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  title: { color: "#0f766e", fontSize: 28, fontWeight: "800", flexShrink: 1 },
  mapBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    backgroundColor: "#0f766e",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  mapBtnPressed: { opacity: 0.85 },
  mapBtnText: { color: "#ffffff", fontSize: 13, fontWeight: "800" },
  body: { color: "#475569", fontSize: 16 },
  sectionTitle: { color: "#0f172a", fontSize: 17, fontWeight: "800" },
  monitoringPanel: { gap: 10, marginTop: 10 },
  reportItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderWidth: 1,
    borderColor: "#ccfbf1",
    borderRadius: 8,
    backgroundColor: "#ffffff",
    padding: 12,
  },
  reportTextGroup: { flex: 1, gap: 3 },
  reportTitle: { color: "#0f172a", fontSize: 14, fontWeight: "800" },
  reportMeta: { color: "#64748b", fontSize: 12 },
  reportStatus: {
    overflow: "hidden",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
    fontWeight: "800",
  },
  reportStatus_scheduled: { color: "#475569", backgroundColor: "#e2e8f0" },
  reportStatus_due: { color: "#854d0e", backgroundColor: "#fef3c7" },
  reportStatus_submitted: { color: "#0f766e", backgroundColor: "#ccfbf1" },
  reportStatus_late: { color: "#991b1b", backgroundColor: "#fee2e2" },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#f8fafc",
  },
  stateText: { color: "#475569", fontSize: 15, fontWeight: "600" },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: "#0f172a",
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  emptyBody: {
    color: "#64748b",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  retryButton: {
    borderRadius: 8,
    backgroundColor: "#0f766e",
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  retryButtonText: { color: "#ffffff", fontSize: 15, fontWeight: "800" },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 8,
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 6,
  },
  filterChipText: {
    flex: 1,
    color: "#065f46",
    fontSize: 13,
    fontWeight: "700",
  },
  filterClearBtn: {
    borderRadius: 999,
    backgroundColor: "#0f766e",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  filterClearText: { color: "#ffffff", fontSize: 12, fontWeight: "800" },
  notice: {
    borderRadius: 8,
    backgroundColor: "#fef3c7",
    color: "#92400e",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
    padding: 12,
    marginTop: 6,
  },
});
