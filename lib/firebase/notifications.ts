import Constants, { ExecutionEnvironment } from "expo-constants";
import {
  deleteField,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { firestore } from "@/lib/firebase/client";

const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export async function registerPushToken(userId: string) {
  if (isExpoGo) {
    return null;
  }

  const Notifications = await import("expo-notifications");

  const permission = await Notifications.requestPermissionsAsync();

  if (!permission.granted) {
    return null;
  }

  const token = await Notifications.getDevicePushTokenAsync();
  await updateDoc(doc(firestore, "users", userId), {
    fcmToken: token.data,
    updatedAt: serverTimestamp(),
  });

  return token.data;
}

export function unregisterPushToken(userId: string) {
  return updateDoc(doc(firestore, "users", userId), {
    fcmToken: deleteField(),
    updatedAt: serverTimestamp(),
  });
}
