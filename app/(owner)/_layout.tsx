import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function OwnerLayout() {
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
          title: 'Hewan',
          tabBarIcon: ({ color, size }) => <Ionicons name="paw" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: 'Pengajuan',
          tabBarIcon: ({ color, size }) => <Ionicons name="mail-open-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="monitoring"
        options={{
          title: 'Monitoring',
          tabBarIcon: ({ color, size }) => <Ionicons name="clipboard-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-circle-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen name="pets/new" options={{ href: null, title: 'Tambah Hewan' }} />
      <Tabs.Screen name="pets/[id]" options={{ href: null, title: 'Edit Hewan' }} />
    </Tabs>
  );
}
