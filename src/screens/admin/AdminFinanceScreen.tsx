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
import { subscribeToAllBookings, subscribeToPaymentFlows, updatePlatformFinanceSettings } from '../../services/adminService';
import type { Booking, PaymentFlow, PaymentMethod } from '../../types/models';
import { formatFcfa } from '../../utils/currency';

const methods: PaymentMethod[] = ['MTN MoMo', 'Orange Money', 'Carte bancaire'];
const SKELETON_ITEMS = [0, 1, 2];

function methodTotal(bookings: Booking[], method: PaymentMethod) {
  return bookings
    .filter((booking) => booking.paymentMethod === method && booking.paymentStatus === 'paid')
    .reduce((sum, booking) => sum + booking.totalPrice, 0);
}

function PaymentRow({ payment }: { payment: PaymentFlow }) {
  const { t } = useTranslation();

  function paymentStatusLabel(status?: PaymentFlow['status']) {
    if (status === 'success') return t('admin.payment_status_success');
    if (status === 'failed') return t('admin.payment_status_failed');
    return t('admin.payment_status_pending');
  }

  return (
    <View className="mb-3 rounded-xl border border-slate-100 bg-white p-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-base font-black text-slate-950">{payment.reference ?? payment.id}</Text>
          <Text className="mt-1 text-sm text-slate-500">
            {payment.method ?? payment.provider ?? t('admin.payment_method_unknown')} -{' '}
            {payment.phone ?? t('admin.phone_missing')}
          </Text>
          <Text className="mt-1 text-xs font-semibold text-slate-400">
            {payment.bookingId ?? t('admin.payment_booking_unlinked')}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-sm font-black text-slate-950">{formatFcfa(payment.amount || 0)}</Text>
          <Text className="mt-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
            {paymentStatusLabel(payment.status)}
          </Text>
        </View>
      </View>
    </View>
  );
}

export function AdminFinanceScreen() {
  const { t } = useTranslation();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<PaymentFlow[]>([]);
  const [commissionRate, setCommissionRate] = useState(10);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const toast = useToast();

  useEffect(() => {
    setLoadingBookings(true);
    setLoadingPayments(true);
    setError(null);
    const unsubscribeBookings = subscribeToAllBookings(
      (items) => {
        setBookings(items);
        setLoadingBookings(false);
        setError(null);
      },
      () => {
        setError(t('admin.load_bookings_error'));
        setLoadingBookings(false);
      },
    );

    const unsubscribePayments = subscribeToPaymentFlows(
      (items) => {
        setPayments(items);
        setLoadingPayments(false);
        setError(null);
      },
      () => {
        setError(t('admin.load_payments_error'));
        setLoadingPayments(false);
      },
    );

    return () => {
      unsubscribeBookings();
      unsubscribePayments();
    };
  }, [retryToken, t]);

  const paidRevenue = useMemo(
    () => bookings.filter((booking) => booking.paymentStatus === 'paid').reduce((sum, booking) => sum + booking.totalPrice, 0),
    [bookings],
  );
  const pendingRevenue = useMemo(
    () => bookings.filter((booking) => booking.paymentStatus === 'pending').reduce((sum, booking) => sum + booking.totalPrice, 0),
    [bookings],
  );
  const failedCount = bookings.filter((booking) => booking.paymentStatus === 'failed').length;
  const platformCommission = Math.round((paidRevenue * commissionRate) / 100);

  async function saveCommission() {
    try {
      setSaving(true);
      await updatePlatformFinanceSettings({ commissionRate });
      hapticSuccess(); toast.success(t('admin.finance_save_success', { rate: commissionRate }));
    } catch {
      hapticError(); toast.error(t('admin.finance_save_error'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <View className="gap-5">
        <View>
          <Text className="text-xs font-bold uppercase text-brand-blue">Module 6</Text>
          <Text className="text-3xl font-black text-slate-950">{t('admin.finance_title')}</Text>
          <Text className="mt-1 text-sm text-slate-500">{t('admin.finance_subtitle')}</Text>
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1 rounded-xl bg-white p-4">
            <Text className="text-xl font-black text-slate-950">{formatFcfa(paidRevenue)}</Text>
            <Text className="text-xs font-semibold text-slate-500">{t('admin.finance_collected')}</Text>
          </View>
          <View className="flex-1 rounded-xl bg-white p-4">
            <Text className="text-xl font-black text-amber-600">{formatFcfa(pendingRevenue)}</Text>
            <Text className="text-xs font-semibold text-slate-500">{t('admin.finance_pending')}</Text>
          </View>
          <View className="flex-1 rounded-xl bg-white p-4">
            <Text className="text-xl font-black text-red-600">{failedCount}</Text>
            <Text className="text-xs font-semibold text-slate-500">{t('admin.finance_failures')}</Text>
          </View>
        </View>

        {loadingBookings || loadingPayments ? (
          <View>
            {SKELETON_ITEMS.map((item) => (
              <BookingCardSkeleton key={`finance-skeleton-${item}`} />
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
            <View className="rounded-xl bg-white p-4">
              <View className="mb-3 flex-row items-center gap-2">
                <Ionicons color="#3B63D4" name="analytics-outline" size={22} />
                <Text className="text-lg font-black text-slate-950">{t('admin.finance_by_method')}</Text>
              </View>
              {methods.map((method) => (
                <View className="flex-row items-center justify-between border-b border-slate-100 py-3" key={method}>
                  <Text className="text-sm font-bold text-slate-700">{method}</Text>
                  <Text className="text-sm font-black text-slate-950">{formatFcfa(methodTotal(bookings, method))}</Text>
                </View>
              ))}
            </View>

            <View className="rounded-xl bg-white p-4">
              <View className="mb-3 flex-row items-center gap-2">
                <Ionicons color="#3B63D4" name="cash-outline" size={22} />
                <Text className="text-lg font-black text-slate-950">{t('admin.finance_commission')}</Text>
              </View>
              <Text className="text-sm text-slate-500">{t('admin.finance_current_rate')}</Text>
              <View className="mt-3 flex-row items-center justify-between">
                <TouchableOpacity
                  className="h-10 w-10 items-center justify-center rounded-full bg-slate-100"
                  onPress={() => setCommissionRate((value) => Math.max(0, value - 1))}
                >
                  <Ionicons color="#334155" name="remove" size={20} />
                </TouchableOpacity>
                <View className="items-center">
                  <Text className="text-3xl font-black text-slate-950">{commissionRate}%</Text>
                  <Text className="text-xs font-semibold text-slate-500">
                    {t('admin.finance_on_collected', { amount: formatFcfa(platformCommission) })}
                  </Text>
                </View>
                <TouchableOpacity
                  className="h-10 w-10 items-center justify-center rounded-full bg-slate-100"
                  onPress={() => setCommissionRate((value) => Math.min(50, value + 1))}
                >
                  <Ionicons color="#334155" name="add" size={20} />
                </TouchableOpacity>
              </View>
              <View className="mt-4">
                <PrimaryButton loading={saving} onPress={saveCommission}>
                  {t('admin.finance_save_rate')}
                </PrimaryButton>
              </View>
            </View>

            <View>
              <View className="mb-3 flex-row items-center justify-between">
                <Text className="text-lg font-black text-slate-950">{t('admin.finance_flows')}</Text>
                <TouchableOpacity
                  className="rounded-full bg-slate-950 px-4 py-2"
                  onPress={() => toast.info(t('admin.finance_export_info'))}
                >
                  <Text className="text-xs font-bold text-white">{t('admin.finance_export')}</Text>
                </TouchableOpacity>
              </View>
              {payments.length === 0 ? (
                <EmptyState
                  icon="cash-outline"
                  illustration={EmptyBookingsIllustration}
                  subtitle={t('admin.finance_empty_subtitle')}
                  title={t('admin.finance_empty')}
                />
              ) : (
                payments.map((payment) => <PaymentRow key={payment.id} payment={payment} />)
              )}
            </View>
          </View>
        )}
      </View>
    </Screen>
  );
}
