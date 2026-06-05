import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { DriverCalendarScreen } from '../screens/driver/DriverCalendarScreen';
import { DriverMissionsScreen } from '../screens/driver/DriverMissionsScreen';
import { DriverOwnProfileScreen } from '../screens/driver/DriverOwnProfileScreen';
import type { DriverTabParamList } from '../types/navigation';

const Tab = createBottomTabNavigator<DriverTabParamList>();

const TAB_ICONS: Record<keyof DriverTabParamList, [string, string]> = {
  DriverMissions: ['briefcase', 'briefcase-outline'],
  DriverCalendar: ['calendar', 'calendar-outline'],
  DriverOwnProfile: ['person', 'person-outline'],
};

export function DriverTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#3B63D4',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e2e8f0',
          elevation: 4,
          shadowColor: '#000',
          shadowOpacity: 0.06,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: -2 },
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginBottom: 2 },
        tabBarIcon: ({ color, focused }) => {
          const [active, inactive] = TAB_ICONS[route.name as keyof DriverTabParamList];
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
      <Tab.Screen name="DriverMissions" component={DriverMissionsScreen} options={{ title: 'Missions' }} />
      <Tab.Screen name="DriverCalendar" component={DriverCalendarScreen} options={{ title: 'Calendrier' }} />
      <Tab.Screen name="DriverOwnProfile" component={DriverOwnProfileScreen} options={{ title: 'Profil' }} />
    </Tab.Navigator>
  );
}
