import Constants, { ExecutionEnvironment } from "expo-constants";
import {
  deleteField,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { Platform } from "react-native";

import { firestore } from "@/lib/firebase/client";

const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

type ExpoNotificationsModule = typeof import("expo-notifications");

let configured = false;

async function ensureAndroidChannel(Notifications: ExpoNotificationsModule) {
  if (Platform.OS !== "android") {
    return;
  }

  await Notifications.setNotificationChannelAsync("default", {
    name: "AdoptPet",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#0f766e",
    sound: "default",
  });
}

export async function configureNotifications() {
  if (isExpoGo || configured) {
    return;
  }

  const Notifications = await import("expo-notifications");

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  await ensureAndroidChannel(Notifications);
  configured = true;
}

export async function registerPushToken(userId: string) {
  if (isExpoGo) {
    return null;
  }

  const Notifications = await import("expo-notifications");
  await configureNotifications();

  const permission = await Notifications.requestPermissionsAsync();

  if (!permission.granted) {
    return null;
  }

  const token = await Notifications.getDevicePushTokenAsync();
  await updateDoc(doc(firestore, "users", userId), {
    fcmToken: token.data,
    fcmTokenType: token.type,
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
