import { Ionicons } from '@expo/vector-icons';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Screen } from '../../components/Screen';
import { useAuth } from '../../hooks/useAuth';
import { useBookings } from '../../hooks/useBookings';
import { useCars } from '../../hooks/useCars';
import { updateBookingStatus } from '../../services/bookingService';
import type { Booking, BookingStatus } from '../../types/models';
import type { OwnerStackParamList, OwnerTabParamList } from '../../types/navigation';
import { formatFcfa } from '../../utils/currency';
import { formatDate } from '../../utils/dates';

type Props = CompositeScreenProps<
  BottomTabScreenProps<OwnerTabParamList, 'Dashboard'>,
  NativeStackScreenProps<OwnerStackParamList>
>;

const STATUS_MAP: Record<BookingStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'En attente', color: '#ca8a04', bg: '#fefce8' },
  confirmed: { label: 'Confirmée', color: '#15803d', bg: '#f0fdf4' },
  cancelled: { label: 'Annulée', color: '#b91c1c', bg: '#fef2f2' },
  completed: { label: 'Terminée', color: '#64748b', bg: '#f1f5f9' },
};

function toDate(value: Date): Date {
  return typeof (value as any).toDate === 'function' ? (value as any).toDate() : value;
}

async function handleStatusUpdate(
  booking: Booking,
  status: Extract<BookingStatus, 'cancelled' | 'confirmed'>,
) {
  try {
    await updateBookingStatus(booking.id, status);
  } catch {
    Alert.alert('Erreur', 'Impossible de mettre à jour la réservation.');
  }
}

export function DashboardScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { cars } = useCars(user?.id);
  const { bookings } = useBookings(user?.id, 'owner');

  const initials = user?.fullName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const pendingBookings = bookings.filter((b) => b.status === 'pending');
  const recentBookings = bookings
    .filter((b) => b.status !== 'pending')
    .slice(0, 3);
  const confirmedRevenue = bookings
    .filter((b) => b.status === 'confirmed' || b.status === 'completed')
    .reduce((sum, b) => sum + b.totalPrice, 0);

  return (
    <Screen scroll={false} topSafeArea>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="gap-6 px-5 pb-8 pt-4">

          {/* ─── Header ─── */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View className="h-12 w-12 items-center justify-center rounded-full bg-cameroonGreen">
                <Text className="text-base font-black text-white">{initials}</Text>
              </View>
              <View>
                <Text className="text-xs text-slate-400">Tableau de bord</Text>
                <Text className="text-lg font-black text-slate-950">
                  Bonjour, {user?.fullName?.split(' ')[0]} 👋
                </Text>
              </View>
            </View>
            <View className="flex-row gap-2">
              <TouchableOpacity
                className="h-10 w-10 items-center justify-center rounded-full bg-white"
                style={{ shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}
                onPress={() => navigation.navigate('Reservations')}
              >
                <Ionicons color="#64748b" name="notifications-outline" size={20} />
                {pendingBookings.length > 0 && (
                  <View className="absolute right-2 top-1.5 h-4 w-4 items-center justify-center rounded-full bg-cameroonRed">
                    <Text className="text-xs font-black text-white">{pendingBookings.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                className="h-10 w-10 items-center justify-center rounded-full bg-white"
                style={{ shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}
                onPress={() => navigation.navigate('OwnerProfile')}
              >
                <Ionicons color="#64748b" name="person-outline" size={20} />
              </TouchableOpacity>
            </View>
          </View>

          {/* ─── Stats row ─── */}
          <View className="flex-row gap-3">
            <View
              className="flex-1 rounded-2xl bg-white p-4"
              style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}
            >
              <View className="mb-2 h-9 w-9 items-center justify-center rounded-xl bg-green-50">
                <Ionicons color="#15803d" name="car-outline" size={18} />
              </View>
              <Text className="text-2xl font-black text-slate-950">{cars.length}</Text>
              <Text className="mt-0.5 text-xs text-slate-400">Voiture{cars.length > 1 ? 's' : ''}</Text>
            </View>

            <View
              className="flex-1 rounded-2xl bg-white p-4"
              style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}
            >
              <View className="mb-2 h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
                <Ionicons color="#2563eb" name="calendar-outline" size={18} />
              </View>
              <Text className="text-2xl font-black text-slate-950">{bookings.length}</Text>
              <Text className="mt-0.5 text-xs text-slate-400">Réservation{bookings.length > 1 ? 's' : ''}</Text>
            </View>
          </View>

          {/* ─── Revenue card ─── */}
          <View
            className="rounded-2xl bg-slate-950 p-5"
            style={{ shadowColor: '#15803d', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 4 }}
          >
            <View className="flex-row items-start justify-between">
              <View>
                <Text className="text-xs font-semibold text-slate-400">Revenus confirmés</Text>
                <Text className="mt-1 text-3xl font-black text-white">
                  {formatFcfa(confirmedRevenue)}
                </Text>
              </View>
              <View className="h-10 w-10 items-center justify-center rounded-full bg-cameroonYellow">
                <Ionicons color="#78350f" name="cash-outline" size={20} />
              </View>
            </View>
            {confirmedRevenue === 0 ? (
              <Text className="mt-3 text-xs text-slate-500">
                Vos revenus apparaîtront ici une fois les réservations confirmées.
              </Text>
            ) : (
              <Text className="mt-3 text-xs text-slate-500">
                Sur {bookings.filter((b) => b.status === 'confirmed' || b.status === 'completed').length} réservation(s) confirmée(s)
              </Text>
            )}
          </View>

          {/* ─── Pending reservations ─── */}
          {pendingBookings.length > 0 ? (
            <View className="gap-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <View className="h-2 w-2 rounded-full bg-yellow-400" />
                  <Text className="font-bold text-slate-950">En attente de confirmation</Text>
                </View>
                <View className="rounded-full bg-yellow-50 px-2 py-0.5">
                  <Text className="text-xs font-bold text-yellow-700">{pendingBookings.length}</Text>
                </View>
              </View>

              {pendingBookings.map((booking) => {
                const carLabel =
                  booking.carBrand && booking.carModel
                    ? `${booking.carBrand} ${booking.carModel}`
                    : 'Véhicule';

                return (
                  <View
                    key={booking.id}
                    className="rounded-2xl bg-white p-4"
                    style={{
                      shadowColor: '#000',
                      shadowOpacity: 0.06,
                      shadowRadius: 6,
                      shadowOffset: { width: 0, height: 2 },
                      elevation: 2,
                      borderLeftWidth: 4,
                      borderLeftColor: '#facc15',
                    }}
                  >
                    <View className="flex-row items-start justify-between gap-3">
                      <View className="flex-1">
                        <Text className="font-bold text-slate-950">{carLabel}</Text>
                        <Text className="mt-0.5 text-xs text-slate-500">
                          {formatDate(toDate(booking.startDate))} → {formatDate(toDate(booking.endDate))}
                        </Text>
                        <Text className="mt-0.5 text-xs text-slate-500">
                          {booking.totalDays} jour{booking.totalDays > 1 ? 's' : ''} · {booking.paymentMethod}
                        </Text>
                      </View>
                      <Text className="text-base font-black text-cameroonGreen">
                        {formatFcfa(booking.totalPrice)}
                      </Text>
                    </View>

                    <View className="mt-3 flex-row gap-2">
                      <TouchableOpacity
                        activeOpacity={0.8}
                        className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-cameroonGreen py-2.5"
                        onPress={() => handleStatusUpdate(booking, 'confirmed')}
                      >
                        <Ionicons color="white" name="checkmark-outline" size={16} />
                        <Text className="font-semibold text-white">Accepter</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        className="flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5"
                        onPress={() => handleStatusUpdate(booking, 'cancelled')}
                      >
                        <Ionicons color="#b91c1c" name="close-outline" size={16} />
                        <Text className="font-semibold text-cameroonRed">Refuser</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : null}

          {/* ─── Recent activity ─── */}
          {recentBookings.length > 0 ? (
            <View className="gap-3">
              <View className="flex-row items-center justify-between">
                <Text className="font-bold text-slate-950">Activité récente</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Reservations')}>
                  <Text className="text-sm font-semibold text-cameroonGreen">Tout voir</Text>
                </TouchableOpacity>
              </View>

              {recentBookings.map((booking) => {
                const st = STATUS_MAP[booking.status];
                const carLabel =
                  booking.carBrand && booking.carModel
                    ? `${booking.carBrand} ${booking.carModel}`
                    : 'Véhicule';

                return (
                  <View
                    key={booking.id}
                    className="flex-row items-center gap-3 rounded-2xl bg-white p-4"
                    style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}
                  >
                    <View
                      className="h-10 w-10 items-center justify-center rounded-xl"
                      style={{ backgroundColor: st.bg }}
                    >
                      <Ionicons color={st.color} name="car-outline" size={20} />
                    </View>
                    <View className="flex-1">
                      <Text className="font-semibold text-slate-950">{carLabel}</Text>
                      <Text className="text-xs text-slate-400">
                        {formatDate(toDate(booking.startDate))}
                      </Text>
                    </View>
                    <View>
                      <Text
                        className="rounded-full px-2.5 py-1 text-xs font-semibold"
                        style={{ color: st.color, backgroundColor: st.bg }}
                      >
                        {st.label}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : null}

          {/* ─── Quick actions ─── */}
          <View className="gap-3">
            <Text className="font-bold text-slate-950">Actions rapides</Text>

            <TouchableOpacity
              activeOpacity={0.85}
              className="flex-row items-center gap-3 rounded-2xl bg-cameroonGreen p-4"
              style={{ shadowColor: '#15803d', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3 }}
              onPress={() => navigation.navigate('AddCar')}
            >
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                <Ionicons color="white" name="add" size={22} />
              </View>
              <Text className="flex-1 font-bold text-white">Ajouter une voiture</Text>
              <Ionicons color="rgba(255,255,255,0.6)" name="chevron-forward" size={18} />
            </TouchableOpacity>

            <View className="flex-row gap-3">
              <TouchableOpacity
                activeOpacity={0.8}
                className="flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-white py-4"
                style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}
                onPress={() => navigation.navigate('ManageCars')}
              >
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                  <Ionicons color="#334155" name="car-outline" size={20} />
                </View>
                <Text className="text-sm font-semibold text-slate-700">Mes voitures</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                className="flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-white py-4"
                style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}
                onPress={() => navigation.navigate('Reservations')}
              >
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                  <Ionicons color="#2563eb" name="calendar-outline" size={20} />
                </View>
                <Text className="text-sm font-semibold text-slate-700">Réservations</Text>
              </TouchableOpacity>
            </View>
          </View>

        </View>
      </ScrollView>
    </Screen>
  );
}
