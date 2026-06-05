import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { DriverReviewClientScreen } from '../screens/driver/DriverReviewClientScreen';
import type { DriverStackParamList } from '../types/navigation';
import { DriverTabNavigator } from './DriverTabNavigator';

const Stack = createNativeStackNavigator<DriverStackParamList>();

export function DriverNavigator() {
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
      <Stack.Screen name="DriverTabs" component={DriverTabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="DriverReviewClient" component={DriverReviewClientScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
