import { Ionicons } from '@expo/vector-icons';
import { useCallback } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { BrandLogo } from '../../components/BrandLogo';
import { Screen } from '../../components/Screen';
import { useBottomSheet, useToast } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { hapticError, hapticSuccess } from '../../utils/haptics';
import { useBookings } from '../../hooks/useBookings';
import { useCars } from '../../hooks/useCars';
import { ownerCancelBooking, updateBookingStatus } from '../../services/bookingService';
import type { Booking, BookingStatus, PaymentMethod } from '../../types/models';
import type { OwnerStackParamList, OwnerTabParamList } from '../../types/navigation';
import { formatFcfa } from '../../utils/currency';
import { formatDate, formatDateRange } from '../../utils/dates';
import { toJsDate } from '../../utils/firestoreDate';

type Props = CompositeScreenProps<
  BottomTabScreenProps<OwnerTabParamList, 'Dashboard'>,
  NativeStackScreenProps<OwnerStackParamList>
>;

const TEXT = {
  activity: 'Activit\u00e9 r\u00e9cente',
  cancelled: 'Annul\u00e9e',
  completed: 'Termin\u00e9e',
  confirmed: 'Confirm\u00e9e',
  dash: '\u2014',
  dot: '\u00b7',
  reservation: 'R\u00e9servation',
  reservations: 'R\u00e9servations',
  revenues: 'Revenus confirm\u00e9s',
  revenueEmpty: 'Vos revenus appara\u00eetront ici une fois les r\u00e9servations confirm\u00e9es.',
  updateError: 'Impossible de mettre \u00e0 jour la r\u00e9servation.',
  vehicle: 'V\u00e9hicule',
  arrow: '\u2192',
};

const STATUS_MAP: Record<BookingStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'En attente', color: '#ca8a04', bg: '#fefce8' },
  confirmed: { label: TEXT.confirmed, color: '#3B63D4', bg: '#eff6ff' },
  cancelled: { label: TEXT.cancelled, color: '#b91c1c', bg: '#fef2f2' },
  completed: { label: TEXT.completed, color: '#64748b', bg: '#f1f5f9' },
};

const PAYMENT_METHODS: { key: PaymentMethod; label: string; color: string }[] = [
  { key: 'MTN MoMo', label: 'MTN MoMo', color: '#eab308' },
  { key: 'Orange Money', label: 'Orange Money', color: '#f97316' },
  { key: 'Carte bancaire', label: 'Carte bancaire', color: '#3b82f6' },
];

export function DashboardScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { cars } = useCars(user?.id);
  const { bookings } = useBookings(user?.id, 'owner');
  const toast = useToast();
  const bottomSheet = useBottomSheet();

  const handleStatusUpdate = useCallback(async (
    booking: Booking,
    status: Extract<BookingStatus, 'confirmed'>,
  ) => {
    try {
      await updateBookingStatus(booking.id, status);
    } catch {
      hapticError(); toast.error(TEXT.updateError);
    }
  }, [toast]);

  const confirmOwnerCancellation = useCallback((booking: Booking) => {
    bottomSheet.show({
      title: 'Annuler cette reservation ?',
      subtitle: "Le client sera rembourse integralement s'il a deja paye.",
      actions: [
        {
          label: 'Annuler la reservation',
          variant: 'danger',
          icon: 'close-circle-outline',
          onPress: async () => {
            try {
              await ownerCancelBooking(booking.id);
              hapticSuccess(); toast.success('Reservation annulee.');
            } catch {
              hapticError(); toast.error("Impossible d'annuler la reservation.");
            }
          },
        },
      ],
    });
  }, [bottomSheet, toast]);

  const pendingBookings = bookings.filter((b) => b.status === 'pending');
  const recentBookings = bookings.filter((b) => b.status !== 'pending').slice(0, 3);
  const paidBookings = bookings.filter(
    (b) => b.status === 'confirmed' || b.status === 'completed',
  );
  const confirmedRevenue = paidBookings.reduce((sum, b) => sum + b.totalPrice, 0);

  const revenueByMethod = PAYMENT_METHODS.map(({ key, label, color }) => ({
    label,
    color,
    amount: paidBookings
      .filter((b) => b.paymentMethod === key)
      .reduce((sum, b) => sum + b.totalPrice, 0),
    count: paidBookings.filter((b) => b.paymentMethod === key).length,
  }));

  return (
    <Screen scroll={false} topSafeArea>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="gap-6 px-5 pb-8 pt-4">
          <View className="gap-3">
            {/* Top bar: logo left · actions right */}
            <View className="flex-row items-center justify-between">
              <BrandLogo variant="xs" />
              <View className="flex-row items-center gap-2">
                <TouchableOpacity
                  className="h-10 w-10 items-center justify-center rounded-full bg-white"
                  style={{
                    shadowColor: '#000',
                    shadowOpacity: 0.06,
                    shadowRadius: 4,
                    shadowOffset: { width: 0, height: 1 },
                    elevation: 1,
                  }}
                  onPress={() => navigation.navigate('Reservations')}
                >
                  <Ionicons color="#64748b" name="notifications-outline" size={20} />
                  {pendingBookings.length > 0 ? (
                    <View className="absolute right-2 top-1.5 h-4 w-4 items-center justify-center rounded-full bg-brand-danger">
                      <Text className="text-xs font-black text-white">{pendingBookings.length}</Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
                <TouchableOpacity
                  className="h-10 w-10 items-center justify-center rounded-full bg-brand-blue"
                  onPress={() => navigation.navigate('OwnerProfile')}
                >
                  <Text className="text-sm font-black text-white">
                    {user?.fullName?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() ?? '?'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Greeting */}
            <View>
              <Text className="text-xs font-medium text-slate-400">Tableau de bord propriétaire</Text>
              <Text className="mt-0.5 text-2xl font-black text-slate-950">
                Bonjour, {user?.fullName?.split(' ')[0]} 👋
              </Text>
            </View>
          </View>

          <View className="flex-row gap-3">
            <View
              className="flex-1 rounded-2xl bg-white p-4"
              style={{
                shadowColor: '#000',
                shadowOpacity: 0.05,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 1 },
                elevation: 1,
              }}
            >
              <View className="mb-2 h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
                <Ionicons color="#3B63D4" name="car-outline" size={18} />
              </View>
              <Text className="text-2xl font-black text-slate-950">{cars.length}</Text>
              <Text className="mt-0.5 text-xs text-slate-400">
                Voiture{cars.length > 1 ? 's' : ''}
              </Text>
            </View>

            <View
              className="flex-1 rounded-2xl bg-white p-4"
              style={{
                shadowColor: '#000',
                shadowOpacity: 0.05,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 1 },
                elevation: 1,
              }}
            >
              <View className="mb-2 h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
                <Ionicons color="#2563eb" name="calendar-outline" size={18} />
              </View>
              <Text className="text-2xl font-black text-slate-950">{bookings.length}</Text>
              <Text className="mt-0.5 text-xs text-slate-400">
                {TEXT.reservation}
                {bookings.length > 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          <View
            className="rounded-2xl bg-slate-950 p-5"
            style={{
              shadowColor: '#3B63D4',
              shadowOpacity: 0.2,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 3 },
              elevation: 4,
            }}
          >
            <View className="flex-row items-start justify-between">
              <View>
                <Text className="text-xs font-semibold text-slate-400">{TEXT.revenues}</Text>
                <Text className="mt-1 text-3xl font-black text-white">
                  {formatFcfa(confirmedRevenue)}
                </Text>
              </View>
              <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-warning">
                <Ionicons color="#78350f" name="cash-outline" size={20} />
              </View>
            </View>
            {confirmedRevenue === 0 ? (
              <Text className="mt-3 text-xs text-slate-500">{TEXT.revenueEmpty}</Text>
            ) : (
              <View className="mt-4 gap-2">
                <View className="h-px bg-white/10" />
                {revenueByMethod.map(({ label, color, amount, count }) => (
                  <View key={label} className="flex-row items-center gap-2.5">
                    <View className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                    <Text className="flex-1 text-xs text-slate-400">{label}</Text>
                    <Text className="text-xs font-bold text-slate-300">
                      {count > 0 ? formatFcfa(amount) : TEXT.dash}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {pendingBookings.length > 0 ? (
            <View className="gap-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <View className="h-2 w-2 rounded-full bg-yellow-400" />
                  <Text className="font-bold text-slate-950">En attente de confirmation</Text>
                </View>
                <View className="rounded-full bg-yellow-50 px-2 py-0.5">
                  <Text className="text-xs font-bold text-yellow-700">
                    {pendingBookings.length}
                  </Text>
                </View>
              </View>

              {pendingBookings.map((booking) => {
                const carLabel =
                  booking.carBrand && booking.carModel
                    ? `${booking.carBrand} ${booking.carModel}`
                    : TEXT.vehicle;

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
                          {formatDateRange(toJsDate(booking.startDate), toJsDate(booking.endDate))}
                        </Text>
                        <Text className="mt-0.5 text-xs text-slate-500">
                          {booking.totalDays} jour{booking.totalDays > 1 ? 's' : ''}{' '}
                          {TEXT.dot} {booking.paymentMethod}
                        </Text>
                      </View>
                      <Text className="text-base font-black text-brand-blue">
                        {formatFcfa(booking.totalPrice)}
                      </Text>
                    </View>

                    <View className="mt-3 flex-row gap-2">
                      <TouchableOpacity
                        activeOpacity={0.8}
                        className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-brand-blue py-2.5"
                        onPress={() => handleStatusUpdate(booking, 'confirmed')}
                      >
                        <Ionicons color="white" name="checkmark-outline" size={16} />
                        <Text className="font-semibold text-white">Accepter</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        className="flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5"
                        onPress={() => confirmOwnerCancellation(booking)}
                      >
                        <Ionicons color="#b91c1c" name="close-outline" size={16} />
                        <Text className="font-semibold text-brand-danger">Refuser</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : null}

          {recentBookings.length > 0 ? (
            <View className="gap-3">
              <View className="flex-row items-center justify-between">
                <Text className="font-bold text-slate-950">{TEXT.activity}</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Reservations')}>
                  <Text className="text-sm font-semibold text-brand-blue">Tout voir</Text>
                </TouchableOpacity>
              </View>

              {recentBookings.map((booking) => {
                const st = STATUS_MAP[booking.status];
                const carLabel =
                  booking.carBrand && booking.carModel
                    ? `${booking.carBrand} ${booking.carModel}`
                    : TEXT.vehicle;

                return (
                  <View
                    key={booking.id}
                    className="flex-row items-center gap-3 rounded-2xl bg-white p-4"
                    style={{
                      shadowColor: '#000',
                      shadowOpacity: 0.05,
                      shadowRadius: 4,
                      shadowOffset: { width: 0, height: 1 },
                      elevation: 1,
                    }}
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
                        {formatDate(toJsDate(booking.startDate))}
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

          <View className="gap-3">
            <Text className="font-bold text-slate-950">Actions rapides</Text>

            <TouchableOpacity
              activeOpacity={0.85}
              className="flex-row items-center gap-3 rounded-2xl bg-brand-blue p-4"
              style={{
                backgroundColor: '#3B63D4',
                shadowColor: '#3B63D4',
                shadowOpacity: 0.25,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 3 },
                elevation: 3,
              }}
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
                style={{
                  shadowColor: '#000',
                  shadowOpacity: 0.04,
                  shadowRadius: 4,
                  shadowOffset: { width: 0, height: 1 },
                  elevation: 1,
                }}
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
                style={{
                  shadowColor: '#000',
                  shadowOpacity: 0.04,
                  shadowRadius: 4,
                  shadowOffset: { width: 0, height: 1 },
                  elevation: 1,
                }}
                onPress={() => navigation.navigate('Reservations')}
              >
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                  <Ionicons color="#2563eb" name="calendar-outline" size={20} />
                </View>
                <Text className="text-sm font-semibold text-slate-700">{TEXT.reservations}</Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                activeOpacity={0.8}
                className="flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-white py-4"
                style={{
                  shadowColor: '#000',
                  shadowOpacity: 0.04,
                  shadowRadius: 4,
                  shadowOffset: { width: 0, height: 1 },
                  elevation: 1,
                }}
                onPress={() => navigation.navigate('OwnerDrivers')}
              >
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                  <Ionicons color="#3B63D4" name="people-outline" size={20} />
                </View>
                <Text className="text-sm font-semibold text-slate-700">Mes chauffeurs</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                className="flex-1 items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 py-4"
                style={{
                  shadowColor: '#3B63D4',
                  shadowOpacity: 0.08,
                  shadowRadius: 4,
                  shadowOffset: { width: 0, height: 1 },
                  elevation: 1,
                }}
                onPress={() => navigation.navigate('DriverProfile')}
              >
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-white">
                  <Ionicons color="#3B63D4" name="person-add-outline" size={20} />
                </View>
                <Text className="text-sm font-semibold text-brand-blue">Ajouter chauffeur</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
