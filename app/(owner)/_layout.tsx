import { Tabs } from 'expo-router';

export default function OwnerLayout() {
  return (
    <Tabs
      screenOptions={{
        headerTitleAlign: 'center',
        tabBarActiveTintColor: '#0f766e',
      }}>
      <Tabs.Screen name="index" options={{ title: 'Hewan' }} />
      <Tabs.Screen name="requests" options={{ title: 'Pengajuan' }} />
      <Tabs.Screen name="monitoring" options={{ title: 'Monitoring' }} />
      <Tabs.Screen name="pets/new" options={{ href: null, title: 'Tambah Hewan' }} />
    </Tabs>
  );
}
