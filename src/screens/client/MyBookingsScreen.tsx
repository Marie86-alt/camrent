import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { useState } from 'react';
import type { CompositeNavigationProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { BookingCard } from '../../components/BookingCard';
import { BrandLogo } from '../../components/BrandLogo';
import { Screen } from '../../components/Screen';
import { useAuth } from '../../hooks/useAuth';
import { useBookings } from '../../hooks/useBookings';
import type { ClientStackParamList, ClientTabParamList } from '../../types/navigation';
import type { Booking } from '../../types/models';

type MyBookingsNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<ClientTabParamList, 'MyBookings'>,
  NativeStackNavigationProp<ClientStackParamList>
>;

type Filter = 'active' | 'history';

export function MyBookingsScreen() {
  const navigation = useNavigation<MyBookingsNavProp>();
  const { user } = useAuth();
  const { bookings, error, loading } = useBookings(user?.id, 'client');
  const [filter, setFilter] = useState<Filter>('active');

  const initials = user?.fullName
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? '';

  const handleSignContract = (booking: Booking) => {
    navigation.navigate('Contract', { booking });
  };

  const activeBookings = bookings.filter(
    (b) => b.status === 'pending' || b.status === 'confirmed',
  );
  const historyBookings = bookings.filter(
    (b) => b.status === 'completed' || b.status === 'cancelled',
  );

  const displayed = filter === 'active' ? activeBookings : historyBookings;

  return (
    <Screen scroll={false} topSafeArea>
      <View className="flex-1 px-5 pt-4">
        {/* ─── Header ─── */}
        <View className="mb-4 gap-3">
          <View className="flex-row items-center justify-between">
            <BrandLogo variant="xs" />
            <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-blue">
              <Text className="text-sm font-black text-white">{initials}</Text>
            </View>
          </View>
          <Text className="text-2xl font-black text-slate-950">Mes réservations</Text>
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#3B63D4" size="large" />
          </View>
        ) : (
          <FlatList
            ListHeaderComponent={
              <View className="mb-4 gap-4">
                {/* ─── Filter tabs ─── */}
                <View className="flex-row rounded-xl bg-slate-100 p-1">
                  <TouchableOpacity
                    activeOpacity={0.8}
                    className={`flex-1 items-center rounded-lg py-2 ${filter === 'active' ? 'bg-white' : ''}`}
                    onPress={() => setFilter('active')}
                    style={
                      filter === 'active'
                        ? { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2 }
                        : undefined
                    }
                  >
                    <Text
                      className={`text-sm font-bold ${filter === 'active' ? 'text-slate-950' : 'text-slate-400'}`}
                    >
                      En cours
                      {activeBookings.length > 0 ? ` (${activeBookings.length})` : ''}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    className={`flex-1 items-center rounded-lg py-2 ${filter === 'history' ? 'bg-white' : ''}`}
                    onPress={() => setFilter('history')}
                    style={
                      filter === 'history'
                        ? { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2 }
                        : undefined
                    }
                  >
                    <Text
                      className={`text-sm font-bold ${filter === 'history' ? 'text-slate-950' : 'text-slate-400'}`}
                    >
                      Historique
                      {historyBookings.length > 0 ? ` (${historyBookings.length})` : ''}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            }
            ListEmptyComponent={
              <View className="mt-16 items-center gap-3">
                <View className="h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                  <Ionicons
                    color="#94a3b8"
                    name={filter === 'active' ? 'calendar-outline' : 'time-outline'}
                    size={32}
                  />
                </View>
                <Text className="text-base font-bold text-slate-700">
                  {error ?? (filter === 'active' ? 'Aucune réservation en cours' : 'Aucun historique')}
                </Text>
                <Text className="text-center text-sm text-slate-400">
                  {filter === 'active'
                    ? 'Vos réservations actives apparaîtront ici.'
                    : 'Vos réservations terminées ou annulées apparaîtront ici.'}
                </Text>
              </View>
            }
            data={displayed}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <BookingCard
                booking={item}
                onSignContract={() => handleSignContract(item)}
                onReview={() => navigation.navigate('Review', { booking: item })}
              />
            )}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </Screen>
  );
}
