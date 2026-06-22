import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Screen } from '../../components/Screen';
import { BookingCardSkeleton, EmptyState, useBottomSheet, useToast } from '../../components/ui';
import EmptyReservationsIllustration from '../../../assets/illustrations/empty-reservations.svg';
import ErrorIllustration from '../../../assets/illustrations/state-error.svg';
import { useAuth } from '../../hooks/useAuth';
import { useBookings } from '../../hooks/useBookings';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { ownerCancelBooking, updateBookingStatus } from '../../services/bookingService';
import { isOfflineError } from '../../services/networkGuard';
import type { Booking, BookingStatus, PaymentStatus } from '../../types/models';
import { hapticError, hapticSuccess, hapticWarning } from '../../utils/haptics';
import { formatFcfa } from '../../utils/currency';
import { formatDateRange } from '../../utils/dates';
import { toJsDate } from '../../utils/firestoreDate';

type StatusStyle = { label: string; textColor: string; bgColor: string };

const SKELETON_ITEMS = [0, 1, 2];

export function ReservationsScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { bookings, error, loading, retry } = useBookings(user?.id, 'owner');
  const { isOnline } = useNetworkStatus();
  const [refreshing, setRefreshing] = useState(false);
  const wasOfflineRef = useRef(false);
  const toast = useToast();
  const bottomSheet = useBottomSheet();

  const STATUS_MAP: Record<BookingStatus, StatusStyle> = {
    pending: { label: t('booking.status_pending'), textColor: 'text-yellow-700', bgColor: 'bg-yellow-50' },
    confirmed: { label: t('booking.status_confirmed'), textColor: 'text-blue-700', bgColor: 'bg-blue-50' },
    cancelled: { label: t('booking.status_cancelled'), textColor: 'text-red-700', bgColor: 'bg-red-50' },
    completed: { label: t('booking.status_completed'), textColor: 'text-slate-600', bgColor: 'bg-slate-100' },
  };

  const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
    unpaid: t('owner.payment_unpaid'),
    pending: t('booking.status_pending'),
    paid: t('owner.payment_paid'),
    failed: t('owner.payment_failed'),
  };

  useEffect(() => {
    if (!loading) {
      setRefreshing(false);
    }
  }, [loading]);

  useEffect(() => {
    if (!isOnline) {
      wasOfflineRef.current = true;
      return;
    }

    if (wasOfflineRef.current) {
      wasOfflineRef.current = false;
      retry();
    }
  }, [isOnline, retry]);

  const setStatus = useCallback(async (booking: Booking, status: Extract<BookingStatus, 'confirmed'>) => {
    try {
      await updateBookingStatus(booking.id, status);
    } catch (error) {
      if (isOfflineError(error)) {
        hapticWarning(); toast.warning(error.message);
        return;
      }

      hapticError(); toast.error(t('owner.update_error'));
    }
  }, [toast, t]);

  const cancelOwnerReservation = useCallback((booking: Booking) => {
    bottomSheet.show({
      title: t('owner.cancel_title'),
      subtitle: t('owner.cancel_subtitle'),
      actions: [
        {
          label: t('owner.cancel_action'),
          variant: 'danger',
          icon: 'close-circle-outline',
          onPress: async () => {
            try {
              await ownerCancelBooking(booking.id);
              hapticSuccess(); toast.success(t('owner.cancel_success'));
            } catch (error) {
              if (isOfflineError(error)) {
                hapticWarning(); toast.warning(error.message);
                return;
              }

              hapticError(); toast.error(t('owner.cancel_error'));
            }
          },
        },
      ],
    });
  }, [bottomSheet, toast, t]);

  const bookingKeyExtractor = useCallback((item: Booking) => item.id, []);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    retry();
  }, [retry]);
  const refreshControl = (
    <RefreshControl
      colors={['#3B63D4']}
      onRefresh={onRefresh}
      refreshing={refreshing}
      tintColor="#3B63D4"
    />
  );

  const renderBooking = useCallback(
    ({ item }: { item: Booking }) => {
      const canDecide = item.status === 'pending';
      const status = STATUS_MAP[item.status] ?? STATUS_MAP.pending;
      const carLabel =
        item.carBrand && item.carModel
          ? `${item.carBrand} ${item.carModel}`
          : t('owner.reservation_no', { id: item.id.slice(0, 6) });

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
              {item.totalDays > 1
                ? t('common.days_other', { count: item.totalDays })
                : t('common.days_one', { count: item.totalDays })} - {PAYMENT_STATUS_LABELS[item.paymentStatus]}
            </Text>
            <Text className="text-lg font-black text-brand-blue">{formatFcfa(item.totalPrice)}</Text>
          </View>

          {item.driverLicense ? (
            <View className="mt-4 rounded-xl bg-slate-50 p-3">
              <View className="mb-2 flex-row items-center gap-2">
                <Ionicons color="#334155" name="id-card-outline" size={17} />
                <Text className="font-bold text-slate-800">{t('owner.license_section')}</Text>
              </View>
              <Text className="text-sm text-slate-600">
                {item.driverLicense.fullName} - {item.driverLicense.licenseNumber}
              </Text>
              <Text className="mt-1 text-xs text-slate-500">
                Cat. {item.driverLicense.categories} - {item.driverLicense.issuingCountry}
              </Text>
              <Text className="mt-1 text-xs text-slate-500">
                {t('owner.issued_on')} {item.driverLicense.issueDate} - {t('owner.expires_on')} {item.driverLicense.expiryDate}
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
                <Text className="font-semibold text-white">{t('owner.accept')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-brand-danger px-3 py-3"
                onPress={() => cancelOwnerReservation(item)}
              >
                <Ionicons color="white" name="close-outline" size={16} />
                <Text className="font-semibold text-white">{t('owner.reject_booking')}</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cancelOwnerReservation, setStatus, t],
  );

  const header = (
    <Text className="mb-4 text-2xl font-black text-slate-950">{t('owner.reservations_title')}</Text>
  );

  if (loading) {
    return (
      <Screen scroll={false}>
        <View className="flex-1 px-5 pt-4">
          <FlatList
            ListHeaderComponent={header}
            data={SKELETON_ITEMS}
            keyExtractor={(item) => `reservation-skeleton-${item}`}
            refreshControl={refreshControl}
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
          ListHeaderComponent={header}
          ListEmptyComponent={
            <EmptyState
              ctaLabel={error ? t('common.retry') : undefined}
              icon={error ? 'cloud-offline-outline' : 'calendar-outline'}
              illustration={error ? ErrorIllustration : EmptyReservationsIllustration}
              onCta={error ? retry : undefined}
              subtitle={
                error
                  ? t('errors.connection_retry')
                  : t('owner.no_reservations_subtitle')
              }
              title={error ?? t('owner.reservations_title')}
            />
          }
          data={bookings}
          keyExtractor={bookingKeyExtractor}
          refreshControl={refreshControl}
          renderItem={renderBooking}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </Screen>
  );
}
