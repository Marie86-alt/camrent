import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { PrimaryButton } from '../../components/PrimaryButton';
import { Screen } from '../../components/Screen';
import { BookingCardSkeleton, EmptyState, useToast } from '../../components/ui';
import { hapticError, hapticSuccess } from '../../utils/haptics';
import EmptyBookingsIllustration from '../../../assets/illustrations/empty-bookings.svg';
import ErrorIllustration from '../../../assets/illustrations/state-error.svg';
import { subscribeToAllBookings, updateBookingAdminFields } from '../../services/adminService';
import type { Booking, BookingStatus } from '../../types/models';
import { formatFcfa } from '../../utils/currency';
import { formatDate } from '../../utils/dates';
import { toJsDate } from '../../utils/firestoreDate';

const SKELETON_ITEMS = [0, 1, 2];

function toReadableDate(value: Booking['startDate'], notProvided: string) {
  if (!value) return notProvided;
  return formatDate(toJsDate(value));
}

function BookingRow({ booking, selected, onPress }: { booking: Booking; selected: boolean; onPress: () => void }) {
  const { t } = useTranslation();

  function statusLabel(status: BookingStatus) {
    if (status === 'confirmed') return t('admin.booking_status_confirmed');
    if (status === 'cancelled') return t('admin.booking_status_cancelled');
    if (status === 'completed') return t('admin.booking_status_completed');
    return t('admin.booking_status_pending');
  }

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      className={`mb-3 rounded-xl border bg-white p-4 ${selected ? 'border-brand-blue' : 'border-slate-100'}`}
      onPress={onPress}
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-base font-black text-slate-950">
            {booking.carBrand} {booking.carModel}
          </Text>
          <Text className="mt-1 text-sm text-slate-500">
            {toReadableDate(booking.startDate, t('common.not_provided'))} - {toReadableDate(booking.endDate, t('common.not_provided'))}
          </Text>
          <Text className="mt-1 text-xs font-semibold text-slate-400">{booking.clientId}</Text>
        </View>
        <View className="items-end">
          <Text className="text-sm font-black text-slate-950">{formatFcfa(booking.totalPrice)}</Text>
          <Text className="mt-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
            {statusLabel(booking.status)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function DetailLine({ label, value }: { label: string; value?: string | number | null }) {
  const { t } = useTranslation();
  return (
    <View className="flex-row items-center justify-between border-b border-slate-100 py-3">
      <Text className="text-sm text-slate-500">{label}</Text>
      <Text className="max-w-[60%] text-right text-sm font-bold text-slate-900">{value || t('common.not_provided')}</Text>
    </View>
  );
}

export function AdminBookingsScreen() {
  const { t } = useTranslation();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | BookingStatus>('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const toast = useToast();

  const filters: Array<{ label: string; value: 'all' | BookingStatus }> = [
    { label: t('admin.booking_filter_all'), value: 'all' },
    { label: t('admin.booking_filter_pending'), value: 'pending' },
    { label: t('admin.booking_filter_confirmed'), value: 'confirmed' },
    { label: t('admin.booking_filter_cancelled'), value: 'cancelled' },
    { label: t('admin.booking_filter_completed'), value: 'completed' },
  ];

  function statusLabel(status: BookingStatus) {
    if (status === 'confirmed') return t('admin.booking_status_confirmed');
    if (status === 'cancelled') return t('admin.booking_status_cancelled');
    if (status === 'completed') return t('admin.booking_status_completed');
    return t('admin.booking_status_pending');
  }

  useEffect(() => {
    setLoading(true);
    setError(null);
    const unsubscribe = subscribeToAllBookings(
      (items) => {
        setBookings(items);
        setSelectedId((current) => current ?? items[0]?.id ?? null);
        setLoading(false);
        setError(null);
      },
      () => {
        setError(t('admin.load_bookings_error'));
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [retryToken, t]);

  const visibleBookings = useMemo(
    () => (filter === 'all' ? bookings : bookings.filter((booking) => booking.status === filter)),
    [bookings, filter],
  );

  const selectedBooking = useMemo(
    () => bookings.find((booking) => booking.id === selectedId) ?? visibleBookings[0],
    [bookings, selectedId, visibleBookings],
  );

  async function updateSelected(payload: Partial<Booking>, successMessage: string) {
    if (!selectedBooking) return;

    try {
      setSaving(true);
      await updateBookingAdminFields(selectedBooking.id, payload);
      hapticSuccess(); toast.success(successMessage);
    } catch {
      hapticError(); toast.error(t('admin.action_error'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen topSafeArea>
      <View className="gap-5">
        <View>
          <Text className="text-xs font-bold uppercase text-brand-blue">Module 5</Text>
          <Text className="text-3xl font-black text-slate-950">{t('admin.bookings_title')}</Text>
          <Text className="mt-1 text-sm text-slate-500">{t('admin.bookings_subtitle')}</Text>
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1 rounded-xl bg-white p-4">
            <Text className="text-2xl font-black text-slate-950">{bookings.length}</Text>
            <Text className="text-xs font-semibold text-slate-500">{t('admin.bookings')}</Text>
          </View>
          <View className="flex-1 rounded-xl bg-white p-4">
            <Text className="text-2xl font-black text-amber-600">
              {bookings.filter((booking) => booking.paymentStatus === 'pending').length}
            </Text>
            <Text className="text-xs font-semibold text-slate-500">{t('admin.pending_payments_label')}</Text>
          </View>
          <View className="flex-1 rounded-xl bg-white p-4">
            <Text className="text-2xl font-black text-red-600">
              {bookings.filter((booking) => booking.disputeStatus === 'open').length}
            </Text>
            <Text className="text-xs font-semibold text-slate-500">{t('admin.disputes_label')}</Text>
          </View>
        </View>

        <View className="flex-row flex-wrap gap-2">
          {filters.map((item) => (
            <TouchableOpacity
              className={`rounded-full px-4 py-2 ${filter === item.value ? 'bg-slate-950' : 'bg-white'}`}
              key={item.value}
              onPress={() => setFilter(item.value)}
            >
              <Text className={`text-xs font-bold ${filter === item.value ? 'text-white' : 'text-slate-600'}`}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View>
            {SKELETON_ITEMS.map((item) => (
              <BookingCardSkeleton key={`admin-booking-skeleton-${item}`} />
            ))}
          </View>
        ) : error ? (
          <EmptyState
            ctaLabel={t('common.retry')}
            icon="cloud-offline-outline"
            illustration={ErrorIllustration}
            onCta={() => setRetryToken((value) => value + 1)}
            subtitle={t('errors.connection_retry')}
            title={error}
          />
        ) : (
          <View className="gap-5">
            <View>
              <Text className="mb-3 text-lg font-black text-slate-950">{t('admin.booking_list_title')}</Text>
              {visibleBookings.length === 0 ? (
                <EmptyState
                  icon="receipt-outline"
                  illustration={EmptyBookingsIllustration}
                  subtitle={t('admin.empty_bookings_subtitle')}
                  title={t('admin.empty_bookings')}
                />
              ) : (
                visibleBookings.map((booking) => (
                  <BookingRow
                    booking={booking}
                    key={booking.id}
                    onPress={() => setSelectedId(booking.id)}
                    selected={selectedBooking?.id === booking.id}
                  />
                ))
              )}
            </View>

            {selectedBooking ? (
              <View className="gap-4 rounded-xl bg-white p-4">
                <View className="flex-row items-center gap-2">
                  <Ionicons color="#3B63D4" name="receipt-outline" size={22} />
                  <Text className="flex-1 text-xl font-black text-slate-950">{t('admin.booking_detail_title')}</Text>
                </View>

                <DetailLine label={t('admin.field_vehicle')} value={`${selectedBooking.carBrand} ${selectedBooking.carModel}`} />
                <DetailLine label={t('admin.field_client')} value={selectedBooking.clientId} />
                <DetailLine label={t('admin.field_owner')} value={selectedBooking.ownerId} />
                <DetailLine label={t('admin.field_start')} value={toReadableDate(selectedBooking.startDate, t('common.not_provided'))} />
                <DetailLine label={t('admin.field_end')} value={toReadableDate(selectedBooking.endDate, t('common.not_provided'))} />
                <DetailLine label={t('admin.field_amount')} value={formatFcfa(selectedBooking.totalPrice)} />
                <DetailLine label={t('admin.field_payment')} value={`${selectedBooking.paymentMethod} - ${selectedBooking.paymentStatus}`} />
                <DetailLine label={t('admin.field_status')} value={statusLabel(selectedBooking.status)} />
                <DetailLine label={t('admin.field_dispute')} value={selectedBooking.disputeStatus ?? 'none'} />
                <DetailLine label={t('admin.field_deposit')} value={selectedBooking.depositStatus ?? 'held'} />
                <DetailLine label={t('admin.field_license')} value={selectedBooking.driverLicense?.licenseNumber} />
                <DetailLine label={t('admin.field_license_expiry')} value={selectedBooking.driverLicense?.expiryDate} />
                <DetailLine
                  label={t('admin.field_inspection_before')}
                  value={selectedBooking.inspection ? String(selectedBooking.inspection.beforePhotos.length) : undefined}
                />
                <DetailLine
                  label={t('admin.field_inspection_after')}
                  value={selectedBooking.inspection ? String(selectedBooking.inspection.afterPhotos.length) : undefined}
                />

                <View className="gap-3 pt-2">
                  <PrimaryButton
                    loading={saving}
                    onPress={() => updateSelected({ disputeStatus: 'open' }, t('admin.dispute_opened'))}
                  >
                    {t('admin.open_dispute')}
                  </PrimaryButton>
                  <PrimaryButton
                    loading={saving}
                    onPress={() => updateSelected({ disputeStatus: 'resolved' }, t('admin.dispute_resolved'))}
                  >
                    {t('admin.resolve_dispute')}
                  </PrimaryButton>
                  <PrimaryButton
                    loading={saving}
                    onPress={() => updateSelected({ refundStatus: 'approved' }, t('admin.refund_approved'))}
                  >
                    {t('admin.approve_refund')}
                  </PrimaryButton>
                  <PrimaryButton
                    loading={saving}
                    onPress={() => updateSelected({ depositStatus: 'released' }, t('admin.deposit_released'))}
                  >
                    {t('admin.release_deposit')}
                  </PrimaryButton>
                </View>
              </View>
            ) : null}
          </View>
        )}
      </View>
    </Screen>
  );
}
