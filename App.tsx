import './global.css';

import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

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
      <SafeAreaProvider>
        <View style={styles.loadingScreen}>
          <ActivityIndicator color="#3B63D4" size="large" />
          <Text style={styles.loadingText}>Chargement d'Autofix Pro...</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    flex: 1,
    justifyContent: 'center',
  },
  loadingText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
  },
});
