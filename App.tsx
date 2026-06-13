import './global.css';

import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import { Sora_700Bold } from '@expo-google-fonts/sora';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BrandLogo } from './src/components/BrandLogo';
import { BottomSheetProvider } from './src/components/ui/BottomSheet';
import { ToastProvider } from './src/components/ui/Toast';
import { AppNavigator } from './src/navigation/AppNavigator';
import { auth, db } from './src/services/firebase';
import { useAuthStore } from './src/store/authStore';
import type { AppUser } from './src/types/models';

// Design system tokens (used in StyleSheet where NativeWind isn't available)
const DS = {
  primary600: '#3B63D4',
  slate50:    '#F8FAFC',
  slate500:   '#64748B',
} as const;

const PROFILE_LOAD_TIMEOUT_MS = 8000;
const AUTH_BOOT_TIMEOUT_MS    = 10000;

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

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Sora_700Bold,
  });

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

        const snapshot = await withTimeout(
          getDoc(doc(db, 'users', firebaseUser.uid)),
          PROFILE_LOAD_TIMEOUT_MS,
        );
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

  if (initializing || !fontsLoaded) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingScreen}>
          <BrandLogo variant="full" />
          <ActivityIndicator
            color={DS.primary600}
            size="large"
            style={styles.spinner}
          />
          <Text style={styles.loadingText}>Chargement en cours…</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <ToastProvider>
        <BottomSheetProvider>
          <AppNavigator />
        </BottomSheetProvider>
      </ToastProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    alignItems: 'center',
    backgroundColor: DS.slate50,
    flex: 1,
    justifyContent: 'center',
  },
  spinner: {
    marginTop: 32,
  },
  loadingText: {
    color: DS.slate500,
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    marginTop: 12,
  },
});
