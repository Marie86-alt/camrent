import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, type Auth, type Persistence } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

export const hasFirebaseConfig = Boolean(process.env.EXPO_PUBLIC_FIREBASE_API_KEY);

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? 'demo-api-key',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'demo.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? 'demo-camrent',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? 'demo-camrent.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '000000000000',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '1:000000000000:web:demo',
};

if (!hasFirebaseConfig) {
  console.warn('Firebase config manquante: creez un fichier .env avec les variables EXPO_PUBLIC_FIREBASE_*.');
}

export const app = initializeApp(firebaseConfig);

type ReactNativeAuthExports = {
  getReactNativePersistence?: (storage: typeof ReactNativeAsyncStorage) => Persistence;
};

function initializeReactNativeAuth(): Auth {
  const { getReactNativePersistence } = require('@firebase/auth') as ReactNativeAuthExports;

  if (!getReactNativePersistence) {
    return getAuth(app);
  }

  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });
  } catch {
    return getAuth(app);
  }
}

export const auth = initializeReactNativeAuth();
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
});
export const storage = getStorage(app);
