import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BookingCard } from '../../components/BookingCard';
import { BrandLogo } from '../../components/BrandLogo';
import { Screen } from '../../components/Screen';
import { BookingCardSkeleton, EmptyState, useBottomSheet, useToast } from '../../components/ui';
import EmptyBookingsIllustration from '../../../assets/illustrations/empty-bookings.svg';
import ErrorIllustration from '../../../assets/illustrations/state-error.svg';
import { useAuth } from '../../hooks/useAuth';
import { useBookings } from '../../hooks/useBookings';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { cancelBooking } from '../../services/bookingService';
import { isOfflineError } from '../../services/networkGuard';
import type { Booking } from '../../types/models';
import type { ClientStackParamList, ClientTabParamList } from '../../types/navigation';
import { formatFcfa } from '../../utils/currency';
import { toJsDate } from '../../utils/firestoreDate';
import { hapticError, hapticSuccess, hapticWarning } from '../../utils/haptics';

type MyBookingsNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<ClientTabParamList, 'MyBookings'>,
  NativeStackNavigationProp<ClientStackParamList>
>;

type Filter = 'active' | 'history';

const SKELETON_ITEMS = [0, 1, 2];

export function MyBookingsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<MyBookingsNavProp>();
  const { user } = useAuth();
  const { bookings, error, loading, retry } = useBookings(user?.id, 'client');
  const { isOnline } = useNetworkStatus();
  const [filter, setFilter] = useState<Filter>('active');
  const [refreshing, setRefreshing] = useState(false);
  const wasOfflineRef = useRef(false);
  const toast = useToast();
  const bottomSheet = useBottomSheet();

  useEffect(() => {
    if (!loading) setRefreshing(false);
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

  const initials = user?.fullName
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? '';

  const handleSignContract = useCallback((booking: Booking) => {
    navigation.navigate('Contract', { booking });
  }, [navigation]);

  const getCancellationPreview = useCallback((booking: Booking) => {
    const startDate = toJsDate(booking.startDate);
    const hoursBeforeStart = (startDate.getTime() - Date.now()) / (1000 * 60 * 60);
    const cancellationFee = hoursBeforeStart >= 48 ? 0 : Math.round(booking.totalPrice * 0.1);
    const refundAmount = Math.max(0, booking.totalPrice - cancellationFee);
    return { cancellationFee, isFree: cancellationFee === 0, refundAmount };
  }, []);

  const handleCancelBooking = useCallback((booking: Booking) => {
    const preview = getCancellationPreview(booking);
    const subtitle = preview.isFree
      ? t('booking.cancel_free_msg')
      : t('booking.cancel_fee_msg', {
          fee: formatFcfa(preview.cancellationFee),
          refund: formatFcfa(preview.refundAmount),
        });

    bottomSheet.show({
      title: t('booking.cancel_confirm_title'),
      subtitle,
      actions: [
        {
          label: t('booking.cancel_action'),
          variant: 'danger',
          icon: 'close-circle-outline',
          onPress: async () => {
            try {
              await cancelBooking(booking.id);
              hapticSuccess();
              toast.success(preview.isFree ? t('booking.cancel_success_free') : t('booking.cancel_success_fee'));
            } catch (error) {
              if (isOfflineError(error)) {
                hapticWarning();
                toast.warning(error.message);
                return;
              }
              hapticError();
              toast.error(error instanceof Error ? error.message : t('booking.cancel_error'));
            }
          },
        },
      ],
    });
  }, [bottomSheet, getCancellationPreview, t, toast]);

  const activeBookings = bookings.filter((b) => b.status === 'pending' || b.status === 'confirmed');
  const historyBookings = bookings.filter((b) => b.status === 'completed' || b.status === 'cancelled');
  const displayed = filter === 'active' ? activeBookings : historyBookings;

  const bookingKeyExtractor = useCallback((item: Booking) => item.id, []);
  const skeletonKeyExtractor = useCallback((item: number) => String(item), []);
  const renderSkeleton = useCallback(() => <BookingCardSkeleton />, []);
  const renderBooking = useCallback(
    ({ item }: { item: Booking }) => (
      <BookingCard
        booking={item}
        onCancel={() => handleCancelBooking(item)}
        onReview={() => navigation.navigate('Review', { booking: item })}
        onSignContract={() => handleSignContract(item)}
      />
    ),
    [handleCancelBooking, handleSignContract, navigation],
  );
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    retry();
  }, [retry]);
  const refreshControl = (
    <RefreshControl colors={['#3B63D4']} onRefresh={onRefresh} refreshing={refreshing} tintColor="#3B63D4" />
  );

  const listHeader = (
    <View className="mb-4 gap-4">
      <View className="flex-row rounded-xl bg-slate-100 p-1">
        <TouchableOpacity
          activeOpacity={0.8}
          className={`flex-1 items-center rounded-lg py-2 ${filter === 'active' ? 'bg-white' : ''}`}
          onPress={() => setFilter('active')}
          style={filter === 'active' ? { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2 } : undefined}
        >
          <Text className={`text-sm font-bold ${filter === 'active' ? 'text-slate-950' : 'text-slate-400'}`}>
            {t('booking.filter_active')}{activeBookings.length > 0 ? ` (${activeBookings.length})` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.8}
          className={`flex-1 items-center rounded-lg py-2 ${filter === 'history' ? 'bg-white' : ''}`}
          onPress={() => setFilter('history')}
          style={filter === 'history' ? { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2 } : undefined}
        >
          <Text className={`text-sm font-bold ${filter === 'history' ? 'text-slate-950' : 'text-slate-400'}`}>
            {t('booking.filter_history')}{historyBookings.length > 0 ? ` (${historyBookings.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Screen scroll={false} topSafeArea>
      <View className="flex-1 px-5 pt-4">
        <View className="mb-4 gap-3">
          <View className="flex-row items-center justify-between">
            <BrandLogo variant="xs" />
            <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-blue">
              <Text className="text-sm font-black text-white">{initials}</Text>
            </View>
          </View>
          <Text className="text-2xl font-black text-slate-950">{t('booking.my_bookings')}</Text>
        </View>

        {loading ? (
          <FlatList
            data={SKELETON_ITEMS}
            keyExtractor={skeletonKeyExtractor}
            refreshControl={refreshControl}
            renderItem={renderSkeleton}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <FlatList
            ListEmptyComponent={
              <EmptyState
                ctaLabel={error ? t('common.retry') : filter === 'active' ? t('home.explore') : undefined}
                icon={error ? 'cloud-offline-outline' : filter === 'active' ? 'calendar-outline' : 'time-outline'}
                illustration={error ? ErrorIllustration : EmptyBookingsIllustration}
                onCta={error ? retry : filter === 'active' ? () => navigation.navigate('Home') : undefined}
                subtitle={
                  error
                    ? t('errors.connection_retry')
                    : filter === 'active'
                    ? t('booking.active_empty_subtitle')
                    : t('booking.history_empty_subtitle')
                }
                title={
                  error ??
                  (filter === 'active' ? t('booking.active_empty_title') : t('booking.history_empty_title'))
                }
              />
            }
            ListHeaderComponent={listHeader}
            data={displayed}
            keyExtractor={bookingKeyExtractor}
            refreshControl={refreshControl}
            renderItem={renderBooking}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </Screen>
  );
}
