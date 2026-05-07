import * as Notifications from 'expo-notifications';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';

import { firestore } from '@/lib/firebase/client';

export async function registerPushToken(userId: string) {
  const permission = await Notifications.requestPermissionsAsync();

  if (!permission.granted) {
    return null;
  }

  const token = await Notifications.getDevicePushTokenAsync();
  await updateDoc(doc(firestore, 'users', userId), {
    fcmToken: token.data,
    updatedAt: serverTimestamp(),
  });

  return token.data;
}
