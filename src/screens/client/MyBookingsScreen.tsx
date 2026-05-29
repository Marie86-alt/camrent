import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';

import { BookingCard } from '../../components/BookingCard';
import { Screen } from '../../components/Screen';
import { useAuth } from '../../hooks/useAuth';
import { useBookings } from '../../hooks/useBookings';

export function MyBookingsScreen() {
  const { user } = useAuth();
  const { bookings, error, loading } = useBookings(user?.id, 'client');

  return (
    <Screen scroll={false}>
      <View className="flex-1 px-5 pt-4">
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#15803d" size="large" />
          </View>
        ) : (
          <FlatList
            ListHeaderComponent={
              <Text className="mb-4 text-2xl font-black text-slate-950">Mes réservations</Text>
            }
            ListEmptyComponent={
              <View className="mt-20 items-center gap-3">
                <View className="h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                  <Ionicons color="#94a3b8" name="calendar-outline" size={32} />
                </View>
                <Text className="text-base font-bold text-slate-700">
                  {error ?? 'Aucune réservation'}
                </Text>
                <Text className="text-center text-sm text-slate-400">
                  Vos réservations apparaîtront ici.
                </Text>
              </View>
            }
            data={bookings}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <BookingCard booking={item} />}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </Screen>
  );
}
