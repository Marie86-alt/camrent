import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { HomeScreen } from '../screens/client/HomeScreen';
import { MyBookingsScreen } from '../screens/client/MyBookingsScreen';
import { ProfileScreen } from '../screens/client/ProfileScreen';
import { SearchScreen } from '../screens/client/SearchScreen';
import type { ClientTabParamList } from '../types/navigation';

const Tab = createBottomTabNavigator<ClientTabParamList>();

const TAB_ICONS: Record<keyof ClientTabParamList, [string, string]> = {
  Home: ['home', 'home-outline'],
  Search: ['search', 'search-outline'],
  MyBookings: ['calendar', 'calendar-outline'],
  Profile: ['person', 'person-outline'],
};

export function ClientTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: '#f8fafc' },
        headerShadowVisible: false,
        headerTintColor: '#0f172a',
        tabBarActiveTintColor: '#15803d',
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
          const [active, inactive] = TAB_ICONS[route.name as keyof ClientTabParamList];
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
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Accueil', headerShown: false }} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ title: 'Rechercher' }} />
      <Tab.Screen
        name="MyBookings"
        component={MyBookingsScreen}
        options={{ title: 'Réservations' }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profil' }} />
    </Tab.Navigator>
  );
}
