import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useEffect, useState } from 'react';

import { AdminBookingsScreen } from '../screens/admin/AdminBookingsScreen';
import { AdminDashboardScreen } from '../screens/admin/AdminDashboardScreen';
import { AdminDriversScreen } from '../screens/admin/AdminDriversScreen';
import { AdminMoreScreen } from '../screens/admin/AdminMoreScreen';
import { AdminVehicleReviewScreen } from '../screens/admin/AdminVehicleReviewScreen';
import { subscribeToAllBookings, subscribeToAllUsers } from '../services/adminService';
import { subscribeToAllCars } from '../services/carService';
import { hasFirebaseConfig } from '../services/firebase';
import type { AdminTabParamList } from '../types/navigation';

const Tab = createBottomTabNavigator<AdminTabParamList>();

function useAdminBadgeCounts() {
  const [pendingVehicles, setPendingVehicles] = useState(0);
  const [pendingKyc, setPendingKyc] = useState(0);
  const [openDisputes, setOpenDisputes] = useState(0);

  useEffect(() => {
    if (!hasFirebaseConfig) return;

    const u1 = subscribeToAllCars(
      (cars) => setPendingVehicles(cars.filter((c) => c.adminStatus === 'pending_review').length),
      () => {},
    );
    const u2 = subscribeToAllUsers(
      (users) =>
        setPendingKyc(
          users.filter((u) => u.kycStatus === 'pending' || u.status === 'pending_validation').length,
        ),
      () => {},
    );
    const u3 = subscribeToAllBookings(
      (bookings) =>
        setOpenDisputes(bookings.filter((b) => b.disputeStatus === 'open').length),
      () => {},
    );
    return () => {
      u1();
      u2();
      u3();
    };
  }, []);

  return { openDisputes, pendingKyc, pendingVehicles };
}

export function AdminTabNavigator() {
  const { openDisputes, pendingKyc, pendingVehicles } = useAdminBadgeCounts();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#3B63D4',
        tabBarInactiveTintColor: '#64748b',
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          marginTop: 0,
        },
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e2e8f0',
          height: 60,
          paddingBottom: 8,
          paddingTop: 5,
        },
      }}
    >
      <Tab.Screen
        name="AdminHome"
        component={AdminDashboardScreen}
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color }) => <Ionicons color={color} name="home-outline" size={22} />,
        }}
      />
      <Tab.Screen
        name="AdminVehicles"
        component={AdminVehicleReviewScreen}
        options={{
          title: 'Véhicules',
          tabBarBadge: pendingVehicles > 0 ? pendingVehicles : undefined,
          tabBarBadgeStyle: { backgroundColor: '#ca8a04', fontSize: 10 },
          tabBarIcon: ({ color }) => <Ionicons color={color} name="car-sport-outline" size={22} />,
        }}
      />
      <Tab.Screen
        name="AdminDrivers"
        component={AdminDriversScreen}
        options={{
          title: 'Utilisateurs',
          tabBarBadge: pendingKyc > 0 ? pendingKyc : undefined,
          tabBarBadgeStyle: { backgroundColor: '#2563eb', fontSize: 10 },
          tabBarIcon: ({ color }) => <Ionicons color={color} name="people-outline" size={22} />,
        }}
      />
      <Tab.Screen
        name="AdminBookings"
        component={AdminBookingsScreen}
        options={{
          title: 'Réservations',
          tabBarBadge: openDisputes > 0 ? openDisputes : undefined,
          tabBarBadgeStyle: { backgroundColor: '#b91c1c', fontSize: 10 },
          tabBarIcon: ({ color }) => <Ionicons color={color} name="receipt-outline" size={22} />,
        }}
      />
      <Tab.Screen
        name="AdminMore"
        component={AdminMoreScreen}
        options={{
          title: 'Plus',
          tabBarIcon: ({ color }) => (
            <Ionicons color={color} name="ellipsis-horizontal-outline" size={22} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
