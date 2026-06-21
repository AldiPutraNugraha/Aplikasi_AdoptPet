import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  label?: string;
  onPress?: () => void;
};

export function BackButton({ label = 'Kembali', onPress }: Props) {
  function handlePress() {
    if (onPress) {
      onPress();
      return;
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }

  return (
    <View style={styles.wrapper}>
      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        onPress={handlePress}
        accessibilityRole="button"
      >
        <Ionicons name="chevron-back" size={20} color="#0f766e" />
        <Text style={styles.label}>{label}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignSelf: 'flex-start' },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#0f766e',
    borderRadius: 999,
    paddingLeft: 8,
    paddingRight: 14,
    paddingVertical: 6,
    backgroundColor: '#f0fdfa',
  },
  pressed: { opacity: 0.6 },
  label: { color: '#0f766e', fontSize: 13, fontWeight: '800' },
});
