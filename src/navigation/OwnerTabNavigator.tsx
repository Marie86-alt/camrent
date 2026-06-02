import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { DashboardScreen } from '../screens/owner/DashboardScreen';
import { ManageCarsScreen } from '../screens/owner/ManageCarsScreen';
import { OwnerProfileScreen } from '../screens/owner/OwnerProfileScreen';
import { ReservationsScreen } from '../screens/owner/ReservationsScreen';
import type { OwnerTabParamList } from '../types/navigation';

const Tab = createBottomTabNavigator<OwnerTabParamList>();

const TAB_ICONS: Record<keyof OwnerTabParamList, [string, string]> = {
  Dashboard: ['grid', 'grid-outline'],
  ManageCars: ['car', 'car-outline'],
  Reservations: ['calendar', 'calendar-outline'],
  OwnerProfile: ['person', 'person-outline'],
};

export function OwnerTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: '#f8fafc' },
        headerShadowVisible: false,
        headerTintColor: '#0f172a',
        tabBarActiveTintColor: '#3B63D4',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e2e8f0',
          elevation: 4,
          shadowColor: '#000',
          shadowOpacity: 0.06,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: -2 },
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: 2,
        },
        tabBarIcon: ({ color, focused }) => {
          const [active, inactive] = TAB_ICONS[route.name as keyof OwnerTabParamList];
          return (
            <Ionicons
              color={color}
              name={(focused ? active : inactive) as React.ComponentProps<typeof Ionicons>['name']}
              size={22}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Accueil', headerShown: false }} />
      <Tab.Screen name="ManageCars" component={ManageCarsScreen} options={{ title: 'Voitures' }} />
      <Tab.Screen name="Reservations" component={ReservationsScreen} options={{ title: 'Resa recues' }} />
      <Tab.Screen name="OwnerProfile" component={OwnerProfileScreen} options={{ title: 'Profil', headerShown: false }} />
    </Tab.Navigator>
  );
}
