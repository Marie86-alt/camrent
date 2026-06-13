import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';

import { BookingCard } from '../../components/BookingCard';
import { BrandLogo } from '../../components/BrandLogo';
import { Screen } from '../../components/Screen';
import { BookingCardSkeleton, EmptyState, useBottomSheet, useToast } from '../../components/ui';
import EmptyBookingsIllustration from '../../../assets/illustrations/empty-bookings.svg';
import { useAuth } from '../../hooks/useAuth';
import { useBookings } from '../../hooks/useBookings';
import { cancelBooking } from '../../services/bookingService';
import type { Booking } from '../../types/models';
import type { ClientStackParamList, ClientTabParamList } from '../../types/navigation';
import { formatFcfa } from '../../utils/currency';
import { toJsDate } from '../../utils/firestoreDate';
import { hapticError, hapticSuccess } from '../../utils/haptics';

type MyBookingsNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<ClientTabParamList, 'MyBookings'>,
  NativeStackNavigationProp<ClientStackParamList>
>;

type Filter = 'active' | 'history';

const SKELETON_ITEMS = [0, 1, 2];

export function MyBookingsScreen() {
  const navigation = useNavigation<MyBookingsNavProp>();
  const { user } = useAuth();
  const { bookings, error, loading } = useBookings(user?.id, 'client');
  const [filter, setFilter] = useState<Filter>('active');
  const toast = useToast();
  const bottomSheet = useBottomSheet();

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

    return {
      cancellationFee,
      isFree: cancellationFee === 0,
      refundAmount,
    };
  }, []);

  const handleCancelBooking = useCallback((booking: Booking) => {
    const preview = getCancellationPreview(booking);
    const subtitle = preview.isFree
      ? 'Annulation plus de 48h avant le depart : aucun frais.'
      : `Moins de 48h avant le depart : frais de 10% (${formatFcfa(preview.cancellationFee)}). Remboursement estime : ${formatFcfa(preview.refundAmount)}.`;

    bottomSheet.show({
      title: 'Annuler cette reservation ?',
      subtitle,
      actions: [
        {
          label: 'Oui, annuler',
          variant: 'danger',
          icon: 'close-circle-outline',
          onPress: async () => {
            try {
              await cancelBooking(booking.id);
              hapticSuccess();
              toast.success(preview.isFree ? 'Reservation annulee sans frais.' : 'Reservation annulee : frais de 10% appliques.');
            } catch (error) {
              hapticError();
              toast.error(error instanceof Error ? error.message : 'Annulation impossible.');
            }
          },
        },
      ],
    });
  }, [bottomSheet, getCancellationPreview, toast]);

  const activeBookings = bookings.filter(
    (booking) => booking.status === 'pending' || booking.status === 'confirmed',
  );
  const historyBookings = bookings.filter(
    (booking) => booking.status === 'completed' || booking.status === 'cancelled',
  );
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

  const listHeader = (
    <View className="mb-4 gap-4">
      <View className="flex-row rounded-xl bg-slate-100 p-1">
        <TouchableOpacity
          activeOpacity={0.8}
          className={`flex-1 items-center rounded-lg py-2 ${filter === 'active' ? 'bg-white' : ''}`}
          onPress={() => setFilter('active')}
          style={
            filter === 'active'
              ? { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2 }
              : undefined
          }
        >
          <Text className={`text-sm font-bold ${filter === 'active' ? 'text-slate-950' : 'text-slate-400'}`}>
            En cours{activeBookings.length > 0 ? ` (${activeBookings.length})` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.8}
          className={`flex-1 items-center rounded-lg py-2 ${filter === 'history' ? 'bg-white' : ''}`}
          onPress={() => setFilter('history')}
          style={
            filter === 'history'
              ? { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2 }
              : undefined
          }
        >
          <Text className={`text-sm font-bold ${filter === 'history' ? 'text-slate-950' : 'text-slate-400'}`}>
            Historique{historyBookings.length > 0 ? ` (${historyBookings.length})` : ''}
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
          <Text className="text-2xl font-black text-slate-950">Mes reservations</Text>
        </View>

        {loading ? (
          <FlatList
            data={SKELETON_ITEMS}
            keyExtractor={skeletonKeyExtractor}
            renderItem={renderSkeleton}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <FlatList
            ListEmptyComponent={
              <EmptyState
                ctaLabel={filter === 'active' ? 'Explorer les voitures' : undefined}
                icon={filter === 'active' ? 'calendar-outline' : 'time-outline'}
                illustration={EmptyBookingsIllustration}
                onCta={filter === 'active' ? () => navigation.navigate('Home') : undefined}
                subtitle={
                  filter === 'active'
                    ? 'Vos reservations actives apparaitront ici.'
                    : 'Vos reservations terminees ou annulees apparaitront ici.'
                }
                title={error ?? (filter === 'active' ? 'Aucune reservation en cours' : 'Aucun historique')}
              />
            }
            ListHeaderComponent={listHeader}
            data={displayed}
            keyExtractor={bookingKeyExtractor}
            renderItem={renderBooking}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </Screen>
  );
}
