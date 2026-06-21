import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function AdopterLayout() {
  return (
    <Tabs
      screenOptions={{
        headerTitleAlign: 'center',
        tabBarActiveTintColor: '#0f766e',
        tabBarLabelStyle: { fontFamily: 'Poppins_700Bold', fontSize: 11 },
        headerTitleStyle: { fontFamily: 'Poppins_800ExtraBold', fontSize: 17 },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Cari Hewan',
          tabBarIcon: ({ color, size }) => <Ionicons name="paw" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Pencarian',
          tabBarIcon: ({ color, size }) => <Ionicons name="search" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-circle-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen name="pets/[id]" options={{ href: null, title: 'Detail Hewan' }} />
      <Tabs.Screen name="owners/[id]" options={{ href: null, title: 'Profil Pemilik' }} />
      <Tabs.Screen name="requests/[petId]" options={{ href: null, title: 'Form Adopsi' }} />
      <Tabs.Screen name="reports/[requestId]" options={{ href: null, title: 'Laporan' }} />
    </Tabs>
  );
}
