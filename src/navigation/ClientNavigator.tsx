import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { BookingScreen } from '../screens/client/BookingScreen';
import { CarDetailScreen } from '../screens/client/CarDetailScreen';
import { ContractScreen } from '../screens/client/ContractScreen';
import { DriverDetailScreen } from '../screens/client/DriverDetailScreen';
import { DriverListScreen } from '../screens/client/DriverListScreen';
import { PaymentScreen } from '../screens/client/PaymentScreen';
import { ReviewScreen } from '../screens/client/ReviewScreen';
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
      <Stack.Screen name="CarDetail" component={CarDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Booking" component={BookingScreen} options={{ headerShown: false }} />
      <Stack.Screen name="DriverList" component={DriverListScreen} options={{ headerShown: false }} />
      <Stack.Screen name="DriverDetail" component={DriverDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Payment" component={PaymentScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Contract" component={ContractScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Review" component={ReviewScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
