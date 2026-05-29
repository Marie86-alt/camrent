import { NavigationContainer } from '@react-navigation/native';

import { AuthStack } from './AuthStack';
import { ClientNavigator } from './ClientNavigator';
import { OwnerNavigator } from './OwnerNavigator';
import { useAuthStore } from '../store/authStore';

export function AppNavigator() {
  const user = useAuthStore((state) => state.user);

  return (
    <NavigationContainer>
      {!user ? <AuthStack /> : user.role === 'owner' ? <OwnerNavigator /> : <ClientNavigator />}
    </NavigationContainer>
  );
}
