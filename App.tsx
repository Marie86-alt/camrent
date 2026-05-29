import './global.css';

import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { AppNavigator } from './src/navigation/AppNavigator';
import { auth, db } from './src/services/firebase';
import { useAuthStore } from './src/store/authStore';
import type { AppUser } from './src/types/models';

const PROFILE_LOAD_TIMEOUT_MS = 8000;
const AUTH_BOOT_TIMEOUT_MS = 10000;

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Profile loading timed out')), timeoutMs);
    }),
  ]);
}

export default function App() {
  const { initializing, setInitializing, setUser } = useAuthStore();

  useEffect(() => {
    const bootTimeout = setTimeout(() => {
      setInitializing(false);
    }, AUTH_BOOT_TIMEOUT_MS);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (!firebaseUser) {
          setUser(null);
          return;
        }

        const snapshot = await withTimeout(getDoc(doc(db, 'users', firebaseUser.uid)), PROFILE_LOAD_TIMEOUT_MS);
        const userProfile = snapshot.exists()
          ? ({ id: snapshot.id, ...snapshot.data() } as AppUser)
          : null;

        setUser(userProfile);
      } catch (error) {
        console.warn('Impossible de charger le profil utilisateur.', error);
        setUser(null);
      } finally {
        clearTimeout(bootTimeout);
        setInitializing(false);
      }
    });

    return () => {
      clearTimeout(bootTimeout);
      unsubscribe();
    };
  }, [setInitializing, setUser]);

  if (initializing) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator color="#16a34a" size="large" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <AppNavigator />
    </>
  );
}
