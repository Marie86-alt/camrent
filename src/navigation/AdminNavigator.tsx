import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AdminTabNavigator } from './AdminTabNavigator';
import { AdminContentScreen } from '../screens/admin/AdminContentScreen';
import { AdminFinanceScreen } from '../screens/admin/AdminFinanceScreen';
import { AdminReviewsScreen } from '../screens/admin/AdminReviewsScreen';
import { AdminSecurityScreen } from '../screens/admin/AdminSecurityScreen';
import type { AdminStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<AdminStackParamList>();

export function AdminNavigator() {
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
      <Stack.Screen name="AdminTabs" component={AdminTabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="AdminFinanceDetail" component={AdminFinanceScreen} options={{ title: 'Finances' }} />
      <Stack.Screen name="AdminReviewsDetail" component={AdminReviewsScreen} options={{ title: 'Avis & modération' }} />
      <Stack.Screen name="AdminContentDetail" component={AdminContentScreen} options={{ title: 'Communication' }} />
      <Stack.Screen name="AdminSecurityDetail" component={AdminSecurityScreen} options={{ title: 'Sécurité' }} />
    </Stack.Navigator>
  );
}
