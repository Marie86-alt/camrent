import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { BrandLogo } from '../../components/BrandLogo';
import { Screen } from '../../components/Screen';
import { subscribeToDriverBookings } from '../../services/bookingService';
import { useAuth } from '../../hooks/useAuth';
import type { Booking, BookingStatus } from '../../types/models';
import type { DriverStackParamList, DriverTabParamList } from '../../types/navigation';
import { formatFcfa } from '../../utils/currency';
import { formatDateRange } from '../../utils/dates';

type Props = CompositeScreenProps<
  BottomTabScreenProps<DriverTabParamList, 'DriverMissions'>,
  NativeStackScreenProps<DriverStackParamList>
>;

const STATUS_MAP: Record<BookingStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'En attente', color: '#ca8a04', bg: '#fefce8' },
  confirmed: { label: 'Confirmée', color: '#3B63D4', bg: '#eff6ff' },
  cancelled: { label: 'Annulée', color: '#b91c1c', bg: '#fef2f2' },
  completed: { label: 'Terminée', color: '#64748b', bg: '#f1f5f9' },
};

function toDate(v: Date): Date {
  return typeof (v as any).toDate === 'function' ? (v as any).toDate() : v;
}

function MissionCard({ booking, onReviewClient }: { booking: Booking; onReviewClient?: () => void }) {
  const st = STATUS_MAP[booking.status] ?? STATUS_MAP.pending;
  const carLabel =
    booking.carBrand && booking.carModel
      ? `${booking.carBrand} ${booking.carModel}`
      : 'Véhicule';

  return (
    <View
      className="mb-3 rounded-2xl bg-white p-4"
      style={{
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        borderLeftWidth: 4,
        borderLeftColor: st.color,
      }}
    >
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-1">
          <Text className="font-bold text-slate-950">{carLabel}</Text>
          <Text className="mt-0.5 text-xs text-slate-500">
            {formatDateRange(toDate(booking.startDate), toDate(booking.endDate))}
          </Text>
          <Text className="mt-0.5 text-xs text-slate-400">
            {booking.totalDays} jour{booking.totalDays > 1 ? 's' : ''} · {booking.city ?? ''}
          </Text>
        </View>
        <View className="items-end gap-1">
          <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: st.bg }}>
            <Text className="text-xs font-bold" style={{ color: st.color }}>{st.label}</Text>
          </View>
          {booking.driverPricePerDay ? (
            <Text className="text-sm font-black text-brand-blue">
              {formatFcfa(booking.totalDays * booking.driverPricePerDay)}
            </Text>
          ) : null}
        </View>
      </View>

      {booking.status === 'completed' && !booking.driverReviewSubmitted && onReviewClient ? (
        <TouchableOpacity
          activeOpacity={0.85}
          className="mt-3 flex-row items-center justify-center gap-2 rounded-xl bg-amber-50 py-2.5"
          style={{ borderWidth: 1, borderColor: '#fde68a' }}
          onPress={onReviewClient}
        >
          <Ionicons color="#ca8a04" name="star-outline" size={15} />
          <Text className="text-xs font-bold text-yellow-700">Noter le client</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export function DriverMissionsScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    const unsub = subscribeToDriverBookings(
      user.id,
      (data) => { setBookings(data); setLoading(false); },
      () => setLoading(false),
    );
    return unsub;
  }, [user?.id]);

  const active = bookings.filter((b) => b.status === 'pending' || b.status === 'confirmed');
  const history = bookings.filter((b) => b.status === 'completed' || b.status === 'cancelled');
  const totalEarned = bookings
    .filter((b) => b.status === 'completed' && b.driverPricePerDay)
    .reduce((sum, b) => sum + b.totalDays * (b.driverPricePerDay ?? 0), 0);

  return (
    <Screen scroll={false} topSafeArea>
      <View className="flex-1 px-5 pt-4">
        {/* Header */}
        <View className="mb-5 gap-3">
          <BrandLogo variant="xs" />
          <View>
            <Text className="text-xs font-medium text-slate-400">Tableau de bord</Text>
            <Text className="mt-0.5 text-2xl font-black text-slate-950">
              Bonjour, {user?.fullName?.split(' ')[0]} 👋
            </Text>
          </View>
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#3B63D4" size="large" />
          </View>
        ) : (
          <FlatList
            ListHeaderComponent={
              <View className="gap-5 pb-2">
                {/* Stats */}
                <View className="flex-row gap-3">
                  <View className="flex-1 rounded-2xl bg-slate-950 p-4">
                    <Text className="text-xs font-semibold text-slate-400">Revenus cumulés</Text>
                    <Text className="mt-1 text-xl font-black text-white">{formatFcfa(totalEarned)}</Text>
                  </View>
                  <View className="flex-1 rounded-2xl bg-white p-4" style={{ elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } }}>
                    <View className="mb-1 h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                      <Ionicons color="#3B63D4" name="car-outline" size={16} />
                    </View>
                    <Text className="text-xl font-black text-slate-950">{bookings.length}</Text>
                    <Text className="text-xs text-slate-400">Missions</Text>
                  </View>
                </View>

                {active.length > 0 ? (
                  <View>
                    <Text className="mb-3 font-bold text-slate-950">Missions en cours</Text>
                    {active.map((b) => <MissionCard booking={b} key={b.id} />)}
                  </View>
                ) : null}

                {history.length > 0 ? (
                  <Text className="font-bold text-slate-950">Historique</Text>
                ) : null}
              </View>
            }
            ListEmptyComponent={
              active.length === 0 ? (
                <View className="mt-8 items-center gap-3 py-8">
                  <View className="h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                    <Ionicons color="#94a3b8" name="car-outline" size={32} />
                  </View>
                  <Text className="text-base font-bold text-slate-700">Aucune mission pour l'instant</Text>
                  <Text className="text-center text-sm text-slate-400">
                    Vos missions apparaîtront ici une fois assignées.
                  </Text>
                </View>
              ) : null
            }
            data={history}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <MissionCard
                booking={item}
                onReviewClient={
                  item.status === 'completed' && !item.driverReviewSubmitted
                    ? () => navigation.navigate('DriverReviewClient', { booking: item })
                    : undefined
                }
              />
            )}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </Screen>
  );
}
