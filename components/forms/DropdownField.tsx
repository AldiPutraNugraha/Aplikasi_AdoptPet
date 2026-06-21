import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

type Props = {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
  loading?: boolean;
  allowCustom?: boolean;
};

const CUSTOM_VALUE = '__custom__';

export function DropdownField({
  label,
  value,
  options,
  onChange,
  placeholder = 'Pilih...',
  loading,
  allowCustom = true,
}: Props) {
  const [modalVisible, setModalVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [customMode, setCustomMode] = useState(false);
  const [customDraft, setCustomDraft] = useState('');

  const normalizedOptions = useMemo(() => {
    const set = new Set<string>();
    for (const opt of options) {
      const cleaned = opt.trim();
      if (cleaned) set.add(cleaned);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [options]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return normalizedOptions;
    return normalizedOptions.filter((opt) => opt.toLowerCase().includes(q));
  }, [normalizedOptions, search]);

  const isCustom = value.trim().length > 0 && !normalizedOptions.some((opt) => opt.toLowerCase() === value.trim().toLowerCase());

  function open() {
    setSearch('');
    setCustomDraft(isCustom ? value : '');
    setCustomMode(false);
    setModalVisible(true);
  }

  function pick(opt: string) {
    if (opt === CUSTOM_VALUE) {
      setCustomMode(true);
      return;
    }
    onChange(opt);
    setModalVisible(false);
  }

  function saveCustom() {
    const next = customDraft.trim();
    if (!next) return;
    onChange(next);
    setModalVisible(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.field} onPress={open} disabled={loading}>
        <Text style={[styles.value, !value && styles.placeholder]} numberOfLines={1}>
          {loading ? 'Memuat...' : value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#475569" />
      </Pressable>
      {isCustom ? <Text style={styles.customHint}>Nilai kustom: {value}</Text> : null}

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <Pressable style={styles.backdrop} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{label}</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color="#475569" />
              </Pressable>
            </View>

            {customMode ? (
              <View style={styles.customWrap}>
                <Text style={styles.subLabel}>Masukkan nilai kustom</Text>
                <TextInput
                  style={styles.customInput}
                  value={customDraft}
                  onChangeText={setCustomDraft}
                  placeholder="Ketik nilai baru..."
                  placeholderTextColor="#94a3b8"
                  autoFocus
                />
                <View style={styles.actions}>
                  <Pressable style={[styles.btn, styles.btnGhost]} onPress={() => setCustomMode(false)}>
                    <Text style={styles.btnGhostText}>Batal</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.btn, styles.btnPrimary, !customDraft.trim() && styles.btnDisabled]}
                    onPress={saveCustom}
                    disabled={!customDraft.trim()}
                  >
                    <Text style={styles.btnPrimaryText}>Pakai</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <>
                <TextInput
                  style={styles.search}
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Cari..."
                  placeholderTextColor="#94a3b8"
                />
                <FlatList
                  data={filtered}
                  keyExtractor={(item) => item}
                  style={styles.list}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => {
                    const active = value.trim().toLowerCase() === item.toLowerCase();
                    return (
                      <Pressable
                        style={[styles.option, active && styles.optionActive]}
                        onPress={() => pick(item)}
                      >
                        <Text style={[styles.optionText, active && styles.optionTextActive]}>{item}</Text>
                        {active ? <Ionicons name="checkmark" size={18} color="#0f766e" /> : null}
                      </Pressable>
                    );
                  }}
                  ListEmptyComponent={
                    <Text style={styles.emptyText}>
                      {normalizedOptions.length === 0 ? 'Belum ada pilihan.' : 'Tidak ada hasil cocok.'}
                    </Text>
                  }
                />
                {allowCustom ? (
                  <Pressable style={styles.customRow} onPress={() => pick(CUSTOM_VALUE)}>
                    <Ionicons name="add-circle-outline" size={18} color="#0f766e" />
                    <Text style={styles.customRowText}>Lainnya / Custom</Text>
                  </Pressable>
                ) : null}
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: { color: '#1f2937', fontSize: 14, fontWeight: '700' },
  field: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
  },
  value: { flex: 1, color: '#111827', fontSize: 15 },
  placeholder: { color: '#6b7280' },
  customHint: { color: '#0f766e', fontSize: 12, fontWeight: '700' },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,0.55)' },
  sheet: {
    maxHeight: '78%',
    gap: 12,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: '#ffffff',
    padding: 18,
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetTitle: { color: '#0f172a', fontSize: 17, fontWeight: '800' },
  search: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  list: { maxHeight: 340 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  optionActive: { backgroundColor: '#f0fdfa' },
  optionText: { color: '#0f172a', fontSize: 15 },
  optionTextActive: { color: '#0f766e', fontWeight: '800' },
  emptyText: { color: '#64748b', fontSize: 14, textAlign: 'center', paddingVertical: 18 },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  customRowText: { color: '#0f766e', fontSize: 14, fontWeight: '800' },
  customWrap: { gap: 10 },
  subLabel: { color: '#475569', fontSize: 13, fontWeight: '700' },
  customInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#0f172a',
    backgroundColor: '#ffffff',
  },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  btn: { flex: 1, alignItems: 'center', borderRadius: 8, paddingVertical: 12 },
  btnPrimary: { backgroundColor: '#0f766e' },
  btnPrimaryText: { color: '#ffffff', fontWeight: '800' },
  btnGhost: { borderWidth: 1, borderColor: '#cbd5e1' },
  btnGhostText: { color: '#475569', fontWeight: '800' },
  btnDisabled: { opacity: 0.5 },
});
