import { Ionicons } from '@expo/vector-icons';
import { useCallback } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';

import { Screen } from '../../components/Screen';
import { BookingCardSkeleton, EmptyState, useBottomSheet, useToast } from '../../components/ui';
import EmptyReservationsIllustration from '../../../assets/illustrations/empty-reservations.svg';
import { useAuth } from '../../hooks/useAuth';
import { useBookings } from '../../hooks/useBookings';
import { ownerCancelBooking, updateBookingStatus } from '../../services/bookingService';
import type { Booking, BookingStatus, PaymentStatus } from '../../types/models';
import { hapticError, hapticSuccess } from '../../utils/haptics';
import { formatFcfa } from '../../utils/currency';
import { formatDateRange } from '../../utils/dates';
import { toJsDate } from '../../utils/firestoreDate';

type StatusStyle = { label: string; textColor: string; bgColor: string };

const SKELETON_ITEMS = [0, 1, 2];

const STATUS_MAP: Record<BookingStatus, StatusStyle> = {
  pending: { label: 'En attente', textColor: 'text-yellow-700', bgColor: 'bg-yellow-50' },
  confirmed: { label: 'Confirmee', textColor: 'text-blue-700', bgColor: 'bg-blue-50' },
  cancelled: { label: 'Annulee', textColor: 'text-red-700', bgColor: 'bg-red-50' },
  completed: { label: 'Terminee', textColor: 'text-slate-600', bgColor: 'bg-slate-100' },
};

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: 'Non paye',
  pending: 'En attente',
  paid: 'Paye',
  failed: 'Echoue',
};

export function ReservationsScreen() {
  const { user } = useAuth();
  const { bookings, error, loading } = useBookings(user?.id, 'owner');
  const toast = useToast();
  const bottomSheet = useBottomSheet();

  const setStatus = useCallback(async (booking: Booking, status: Extract<BookingStatus, 'confirmed'>) => {
    try {
      await updateBookingStatus(booking.id, status);
    } catch {
      hapticError(); toast.error('Impossible de mettre a jour la reservation.');
    }
  }, [toast]);

  const cancelOwnerReservation = useCallback((booking: Booking) => {
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
              hapticSuccess(); toast.success('Reservation annulee — remboursement en cours.');
            } catch {
              hapticError(); toast.error("Impossible d'annuler la reservation.");
            }
          },
        },
      ],
    });
  }, [bottomSheet, toast]);

  const bookingKeyExtractor = useCallback((item: Booking) => item.id, []);

  const renderBooking = useCallback(
    ({ item }: { item: Booking }) => {
      const canDecide = item.status === 'pending';
      const status = STATUS_MAP[item.status] ?? STATUS_MAP.pending;
      const carLabel =
        item.carBrand && item.carModel
          ? `${item.carBrand} ${item.carModel}`
          : `Reservation #${item.id.slice(0, 6)}`;

      return (
        <View
          className="mb-3 rounded-xl bg-white p-4"
          style={{
            shadowColor: '#000',
            shadowOpacity: 0.06,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 },
            elevation: 2,
          }}
        >
          <View className="flex-row items-center justify-between gap-3">
            <Text className="flex-1 font-bold text-slate-950">{carLabel}</Text>
            <Text className={`rounded-full px-3 py-1 text-xs font-semibold ${status.bgColor} ${status.textColor}`}>
              {status.label}
            </Text>
          </View>

          <Text className="mt-2 text-sm text-slate-500">
            {formatDateRange(toJsDate(item.startDate), toJsDate(item.endDate))}
          </Text>

          <View className="mt-1 flex-row items-center justify-between">
            <Text className="text-sm text-slate-500">
              {item.totalDays} jour{item.totalDays > 1 ? 's' : ''} - {PAYMENT_STATUS_LABELS[item.paymentStatus]}
            </Text>
            <Text className="text-lg font-black text-brand-blue">{formatFcfa(item.totalPrice)}</Text>
          </View>

          {item.driverLicense ? (
            <View className="mt-4 rounded-xl bg-slate-50 p-3">
              <View className="mb-2 flex-row items-center gap-2">
                <Ionicons color="#334155" name="id-card-outline" size={17} />
                <Text className="font-bold text-slate-800">Permis de conduire</Text>
              </View>
              <Text className="text-sm text-slate-600">
                {item.driverLicense.fullName} - {item.driverLicense.licenseNumber}
              </Text>
              <Text className="mt-1 text-xs text-slate-500">
                Cat. {item.driverLicense.categories} - {item.driverLicense.issuingCountry}
              </Text>
              <Text className="mt-1 text-xs text-slate-500">
                Delivre le {item.driverLicense.issueDate} - Expire le {item.driverLicense.expiryDate}
              </Text>
            </View>
          ) : null}

          {canDecide ? (
            <View className="mt-4 flex-row gap-2">
              <TouchableOpacity
                activeOpacity={0.8}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-brand-blue px-3 py-3"
                onPress={() => setStatus(item, 'confirmed')}
              >
                <Ionicons color="white" name="checkmark-outline" size={16} />
                <Text className="font-semibold text-white">Accepter</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-brand-danger px-3 py-3"
                onPress={() => cancelOwnerReservation(item)}
              >
                <Ionicons color="white" name="close-outline" size={16} />
                <Text className="font-semibold text-white">Refuser</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      );
    },
    [cancelOwnerReservation, setStatus],
  );

  if (loading) {
    return (
      <Screen scroll={false}>
        <View className="flex-1 px-5 pt-4">
          <FlatList
            ListHeaderComponent={
              <Text className="mb-4 text-2xl font-black text-slate-950">Reservations recues</Text>
            }
            data={SKELETON_ITEMS}
            keyExtractor={(item) => `reservation-skeleton-${item}`}
            renderItem={() => <BookingCardSkeleton />}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <View className="flex-1 px-5 pt-4">
        <FlatList
          ListHeaderComponent={
            <Text className="mb-4 text-2xl font-black text-slate-950">Reservations recues</Text>
          }
          ListEmptyComponent={
            <EmptyState
              icon="calendar-outline"
              illustration={EmptyReservationsIllustration}
              subtitle="Les nouvelles demandes apparaitront ici des qu'un client reserve une voiture."
              title={error ?? 'Aucune reservation recue'}
            />
          }
          data={bookings}
          keyExtractor={bookingKeyExtractor}
          renderItem={renderBooking}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </Screen>
  );
}
