import { getApps, initializeApp } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';

// getReactNativePersistence lives in @firebase/auth's RN build,
// which Metro resolves via the "react-native" condition.
// @ts-ignore — TS resolves the browser types, not RN types.
import { getReactNativePersistence } from '@firebase/auth';

import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// If the app was already initialized (hot reload), getAuth works.
// On cold start we use initializeAuth to wire AsyncStorage persistence.
const alreadyInitialized = getApps().length > 0;
export const firebaseApp = alreadyInitialized
  ? getApps()[0]!
  : initializeApp(firebaseConfig);

const persistence = getReactNativePersistence(ReactNativeAsyncStorage);

export const firebaseAuth = alreadyInitialized
  ? getAuth(firebaseApp)
  : initializeAuth(firebaseApp, { persistence });

export const firestore = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);
export const functions = getFunctions(firebaseApp, 'asia-southeast2');
