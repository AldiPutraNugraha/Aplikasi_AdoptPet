import { Tabs } from 'expo-router';

export default function AdopterLayout() {
  return (
    <Tabs
      screenOptions={{
        headerTitleAlign: 'center',
        tabBarActiveTintColor: '#0f766e',
      }}>
      <Tabs.Screen name="index" options={{ title: 'Cari Hewan' }} />
      <Tabs.Screen name="search" options={{ title: 'Pencarian' }} />
      <Tabs.Screen name="pets/[id]" options={{ href: null, title: 'Detail Hewan' }} />
      <Tabs.Screen name="requests/[petId]" options={{ href: null, title: 'Form Adopsi' }} />
      <Tabs.Screen name="reports/[requestId]" options={{ href: null, title: 'Laporan' }} />
    </Tabs>
  );
}
