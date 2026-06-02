import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { BookingScreen } from '../screens/client/BookingScreen';
import { CarDetailScreen } from '../screens/client/CarDetailScreen';
import { ContractScreen } from '../screens/client/ContractScreen';
import { PaymentScreen } from '../screens/client/PaymentScreen';
import { ClientTabNavigator } from './ClientTabNavigator';
import type { ClientStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<ClientStackParamList>();

export function ClientNavigator() {
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
      <Stack.Screen name="Tabs" component={ClientTabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="CarDetail" component={CarDetailScreen} options={{ title: 'Détails' }} />
      <Stack.Screen name="Booking" component={BookingScreen} options={{ title: 'Réservation' }} />
      <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: 'Paiement' }} />
      <Stack.Screen name="Contract" component={ContractScreen} options={{ title: 'Contrat de location' }} />
    </Stack.Navigator>
  );
}
