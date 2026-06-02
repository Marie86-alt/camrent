import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AddCarScreen } from '../screens/owner/AddCarScreen';
import { DriverProfileScreen } from '../screens/owner/DriverProfileScreen';
import { EditCarScreen } from '../screens/owner/EditCarScreen';
import type { OwnerStackParamList } from '../types/navigation';
import { OwnerTabNavigator } from './OwnerTabNavigator';

const Stack = createNativeStackNavigator<OwnerStackParamList>();

export function OwnerNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerBackTitleVisible: false,
        headerStyle: { backgroundColor: '#f8fafc' },
        headerShadowVisible: false,
        headerTintColor: '#0f172a',
        contentStyle: { backgroundColor: '#f8fafc' },
      }}
    >
      <Stack.Screen name="OwnerTabs" component={OwnerTabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="AddCar" component={AddCarScreen} options={{ title: 'Ajouter' }} />
      <Stack.Screen name="EditCar" component={EditCarScreen} options={{ title: 'Modifier' }} />
      <Stack.Screen name="DriverProfile" component={DriverProfileScreen} options={{ title: 'Profil chauffeur' }} />
    </Stack.Navigator>
  );
}
