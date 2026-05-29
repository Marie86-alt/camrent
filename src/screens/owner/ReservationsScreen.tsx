import { Ionicons } from '@expo/vector-icons';
import { Alert, FlatList, Text, TouchableOpacity, View } from 'react-native';

import { Screen } from '../../components/Screen';
import { useAuth } from '../../hooks/useAuth';
import { useBookings } from '../../hooks/useBookings';
import { updateBookingStatus } from '../../services/bookingService';
import type { Booking, BookingStatus, PaymentStatus } from '../../types/models';
import { formatFcfa } from '../../utils/currency';
import { formatDate } from '../../utils/dates';

type StatusStyle = { label: string; textColor: string; bgColor: string };

const STATUS_MAP: Record<BookingStatus, StatusStyle> = {
  pending: { label: 'En attente', textColor: 'text-yellow-700', bgColor: 'bg-yellow-50' },
  confirmed: { label: 'Confirmée', textColor: 'text-green-700', bgColor: 'bg-green-50' },
  cancelled: { label: 'Annulée', textColor: 'text-red-700', bgColor: 'bg-red-50' },
  completed: { label: 'Terminée', textColor: 'text-slate-600', bgColor: 'bg-slate-100' },
};

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: 'Non payé',
  pending: 'En attente',
  paid: 'Payé',
  failed: 'Échoué',
};

function toDate(value: Date): Date {
  return typeof (value as any).toDate === 'function' ? (value as any).toDate() : value;
}

export function ReservationsScreen() {
  const { user } = useAuth();
  const { bookings, error } = useBookings(user?.id, 'owner');

  const setStatus = async (
    booking: Booking,
    status: Extract<BookingStatus, 'cancelled' | 'confirmed'>,
  ) => {
    try {
      await updateBookingStatus(booking.id, status);
    } catch {
      Alert.alert('Erreur', 'Impossible de mettre à jour la réservation.');
    }
  };

  return (
    <Screen scroll={false}>
      <View className="flex-1 px-5 pt-4">
        <FlatList
          ListHeaderComponent={
            <Text className="mb-4 text-2xl font-black text-slate-950">Réservations reçues</Text>
          }
          ListEmptyComponent={
            <View className="mt-20 items-center gap-3">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <Ionicons color="#94a3b8" name="calendar-outline" size={32} />
              </View>
              <Text className="text-base font-bold text-slate-700">
                {error ?? 'Aucune réservation reçue'}
              </Text>
            </View>
          }
          data={bookings}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const canDecide = item.status === 'pending';
            const status = STATUS_MAP[item.status] ?? STATUS_MAP.pending;
            const carLabel =
              item.carBrand && item.carModel
                ? `${item.carBrand} ${item.carModel}`
                : `Réservation #${item.id.slice(0, 6)}`;

            return (
              <View
                className="mb-3 rounded-xl bg-white p-4"
                style={{ shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 }}
              >
                <View className="flex-row items-center justify-between gap-3">
                  <Text className="flex-1 font-bold text-slate-950">{carLabel}</Text>
                  <Text
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${status.bgColor} ${status.textColor}`}
                  >
                    {status.label}
                  </Text>
                </View>

                <Text className="mt-2 text-sm text-slate-500">
                  {formatDate(toDate(item.startDate))} → {formatDate(toDate(item.endDate))}
                </Text>

                <View className="mt-1 flex-row items-center justify-between">
                  <Text className="text-sm text-slate-500">
                    {item.totalDays} jour{item.totalDays > 1 ? 's' : ''} · {PAYMENT_STATUS_LABELS[item.paymentStatus]}
                  </Text>
                  <Text className="text-lg font-black text-cameroonGreen">
                    {formatFcfa(item.totalPrice)}
                  </Text>
                </View>

                {item.driverLicense ? (
                  <View className="mt-4 rounded-xl bg-slate-50 p-3">
                    <View className="mb-2 flex-row items-center gap-2">
                      <Ionicons color="#334155" name="id-card-outline" size={17} />
                      <Text className="font-bold text-slate-800">Permis de conduire</Text>
                    </View>
                    <Text className="text-sm text-slate-600">
                      {item.driverLicense.fullName} Â· {item.driverLicense.licenseNumber}
                    </Text>
                    <Text className="mt-1 text-xs text-slate-500">
                      Cat. {item.driverLicense.categories} Â· {item.driverLicense.issuingCountry}
                    </Text>
                    <Text className="mt-1 text-xs text-slate-500">
                      Delivre le {item.driverLicense.issueDate} Â· Expire le {item.driverLicense.expiryDate}
                    </Text>
                  </View>
                ) : null}

                {canDecide ? (
                  <View className="mt-4 flex-row gap-2">
                    <TouchableOpacity
                      activeOpacity={0.8}
                      className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-cameroonGreen px-3 py-3"
                      onPress={() => setStatus(item, 'confirmed')}
                    >
                      <Ionicons color="white" name="checkmark-outline" size={16} />
                      <Text className="font-semibold text-white">Accepter</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-cameroonRed px-3 py-3"
                      onPress={() => setStatus(item, 'cancelled')}
                    >
                      <Ionicons color="white" name="close-outline" size={16} />
                      <Text className="font-semibold text-white">Refuser</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            );
          }}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </Screen>
  );
}
