import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { doc, getDoc } from 'firebase/firestore';

import { BrandLogo } from '../../components/BrandLogo';
import { Screen } from '../../components/Screen';
import { BookingCardSkeleton, EmptyState } from '../../components/ui';
import EmptyMissionsIllustration from '../../../assets/illustrations/empty-missions.svg';
import { db } from '../../services/firebase';
import { subscribeToDriverBookings } from '../../services/bookingService';
import { useAuth } from '../../hooks/useAuth';
import type { Booking, BookingStatus } from '../../types/models';
import type { DriverStackParamList, DriverTabParamList } from '../../types/navigation';
import { formatFcfa } from '../../utils/currency';
import { formatDateRange } from '../../utils/dates';
import { toJsDate } from '../../utils/firestoreDate';

type Props = CompositeScreenProps<
  BottomTabScreenProps<DriverTabParamList, 'DriverMissions'>,
  NativeStackScreenProps<DriverStackParamList>
>;

const SKELETON_ITEMS = [0, 1, 2];

function MissionCard({ booking, onReviewClient }: { booking: Booking; onReviewClient?: () => void }) {
  const { t } = useTranslation();

  const STATUS_MAP: Record<BookingStatus, { label: string; color: string; bg: string }> = {
    pending: { label: t('booking.status_pending'), color: '#ca8a04', bg: '#fefce8' },
    confirmed: { label: t('booking.status_confirmed'), color: '#3B63D4', bg: '#eff6ff' },
    cancelled: { label: t('booking.status_cancelled'), color: '#b91c1c', bg: '#fef2f2' },
    completed: { label: t('booking.status_completed'), color: '#64748b', bg: '#f1f5f9' },
  };

  const st = STATUS_MAP[booking.status] ?? STATUS_MAP.pending;
  const carLabel =
    booking.carBrand && booking.carModel
      ? `${booking.carBrand} ${booking.carModel}`
      : t('driver.vehicle_label');

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
            {formatDateRange(toJsDate(booking.startDate), toJsDate(booking.endDate))}
          </Text>
          <Text className="mt-0.5 text-xs text-slate-400">
            {booking.totalDays > 1
              ? t('common.days_other', { count: booking.totalDays })
              : t('common.days_one', { count: booking.totalDays })} · {booking.city ?? ''}
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
          <Text className="text-xs font-bold text-yellow-700">{t('driver.rate_client')}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export function DriverMissionsScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [commissionRate, setCommissionRate] = useState(10);

  useEffect(() => {
    void getDoc(doc(db, 'adminSettings', 'security')).then((snap) => {
      const rate = snap.data()?.rentalCommissionRate;
      if (typeof rate === 'number') setCommissionRate(rate);
    });
  }, []);

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
  const grossEarnings = bookings
    .filter((b) => b.status === 'completed' && b.driverPricePerDay)
    .reduce((sum, b) => sum + b.totalDays * (b.driverPricePerDay ?? 0), 0);
  const commissionAmount = Math.round(grossEarnings * commissionRate / 100);
  const netEarnings = grossEarnings - commissionAmount;
  const bookingKeyExtractor = useCallback((item: Booking) => item.id, []);
  const renderHistoryMission = useCallback(
    ({ item }: { item: Booking }) => (
      <MissionCard
        booking={item}
        onReviewClient={
          item.status === 'completed' && !item.driverReviewSubmitted
            ? () => navigation.navigate('DriverReviewClient', { booking: item })
            : undefined
        }
      />
    ),
    [navigation],
  );

  return (
    <Screen scroll={false} topSafeArea>
      <View className="flex-1 px-5 pt-4">
        <View className="mb-5 gap-3">
          <BrandLogo variant="xs" />
          <View>
            <Text className="text-xs font-medium text-slate-400">{t('driver.dashboard_subtitle')}</Text>
            <Text className="mt-0.5 text-2xl font-black text-slate-950">
              {t('home.greeting_name', { name: user?.fullName?.split(' ')[0] })}
            </Text>
          </View>
        </View>

        {loading ? (
          <FlatList
            data={SKELETON_ITEMS}
            keyExtractor={(item) => `driver-mission-skeleton-${item}`}
            renderItem={() => <BookingCardSkeleton />}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <FlatList
            ListHeaderComponent={
              <View className="gap-5 pb-2">
                <View className="flex-row gap-3">
                  <View className="flex-1 rounded-2xl bg-slate-950 p-4">
                    <Text className="text-xs font-semibold text-slate-400">{t('driver.cumulative_earnings')}</Text>
                    <View className="mt-2 gap-1.5">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-xs text-slate-400">{t('driver.earnings_gross')}</Text>
                        <Text className="text-xs font-semibold text-slate-300">{formatFcfa(grossEarnings)}</Text>
                      </View>
                      <View className="flex-row items-center justify-between">
                        <Text className="text-xs text-red-400">{t('driver.earnings_commission', { rate: commissionRate })}</Text>
                        <Text className="text-xs font-semibold text-red-400">-{formatFcfa(commissionAmount)}</Text>
                      </View>
                      <View className="my-1 h-px bg-slate-700" />
                      <View className="flex-row items-center justify-between">
                        <Text className="text-xs font-bold text-white">{t('driver.earnings_net')}</Text>
                        <Text className="text-base font-black text-white">{formatFcfa(netEarnings)}</Text>
                      </View>
                    </View>
                  </View>
                  <View className="flex-1 rounded-2xl bg-white p-4" style={{ elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } }}>
                    <View className="mb-1 h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                      <Ionicons color="#3B63D4" name="car-outline" size={16} />
                    </View>
                    <Text className="text-xl font-black text-slate-950">{bookings.length}</Text>
                    <Text className="text-xs text-slate-400">{t('driver.missions_count_label')}</Text>
                  </View>
                </View>

                {active.length > 0 ? (
                  <View>
                    <Text className="mb-3 font-bold text-slate-950">{t('driver.active_missions')}</Text>
                    {active.map((b) => <MissionCard booking={b} key={b.id} />)}
                  </View>
                ) : null}

                {history.length > 0 ? (
                  <Text className="font-bold text-slate-950">{t('driver.history')}</Text>
                ) : null}
              </View>
            }
            ListEmptyComponent={
              active.length === 0 ? (
                <EmptyState
                  icon="car-outline"
                  illustration={EmptyMissionsIllustration}
                  subtitle={t('driver.no_missions_subtitle')}
                  title={t('driver.no_missions_title')}
                />
              ) : null
            }
            data={history}
            keyExtractor={bookingKeyExtractor}
            renderItem={renderHistoryMission}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </Screen>
  );
}
