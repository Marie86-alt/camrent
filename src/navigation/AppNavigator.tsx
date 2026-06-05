import { NavigationContainer } from '@react-navigation/native';
import Constants from 'expo-constants';
import { useEffect, useRef } from 'react';

import { AdminNavigator } from './AdminNavigator';
import { ClientNavigator } from './ClientNavigator';
import { DriverNavigator } from './DriverNavigator';
import { OwnerNavigator } from './OwnerNavigator';
import { PublicNavigator } from './PublicNavigator';
import { hasFirebaseConfig } from '../services/firebase';
import { useAuthStore } from '../store/authStore';

export function AppNavigator() {
  const user = useAuthStore((state) => state.user);
  const registeredPushUserId = useRef<string | null>(null);

  useEffect(() => {
    if (
      !hasFirebaseConfig ||
      !user?.id ||
      Constants.appOwnership === 'expo' ||
      registeredPushUserId.current === user.id
    ) {
      return;
    }

    registeredPushUserId.current = user.id;
    import('../services/notificationService')
      .then(({ registerUserPushToken }) => registerUserPushToken(user.id))
      .catch((error) => {
        console.warn('Push token registration failed', error);
      });
  }, [user?.id]);

  return (
    <NavigationContainer>
      {!user ? (
        <PublicNavigator />
      ) : user.role === 'admin' ? (
        <AdminNavigator />
      ) : user.role === 'owner' ? (
        <OwnerNavigator />
      ) : user.role === 'driver' ? (
        <DriverNavigator />
      ) : (
        <ClientNavigator />
      )}
    </NavigationContainer>
  );
}
