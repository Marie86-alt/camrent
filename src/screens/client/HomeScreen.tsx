import { Ionicons } from '@expo/vector-icons';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BrandLogo } from '../../components/BrandLogo';
import { CarCard } from '../../components/CarCard';
import { CitySearchInput } from '../../components/CitySearchInput';
import { Screen } from '../../components/Screen';
import { CarCardSkeleton, EmptyState } from '../../components/ui';
import EmptyCarsIllustration from '../../../assets/illustrations/empty-cars.svg';
import ErrorIllustration from '../../../assets/illustrations/state-error.svg';
import { useBookings } from '../../hooks/useBookings';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useAuthStore } from '../../store/authStore';
import { useCarsStore } from '../../store/carsStore';
import type { CameroonCity, Car } from '../../types/models';
import type { ClientStackParamList, ClientTabParamList } from '../../types/navigation';

type HomeNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<ClientTabParamList, 'Home'>,
  NativeStackNavigationProp<ClientStackParamList>
>;

const BOOKING_STATUS_COLORS: Record<string, string> = {
  pending: '#ca8a04',
  confirmed: '#3B63D4',
  cancelled: '#b91c1c',
  completed: '#64748b',
};

const SKELETON_COUNT = 3;

export function HomeScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<HomeNavProp>();
  const user = useAuthStore((state) => state.user);
  const { cars, error, loading, subscribeToAvailableCars } = useCarsStore();
  const { bookings } = useBookings(user?.id, 'client');
  const { isOnline } = useNetworkStatus();
  const [selectedCity, setSelectedCity] = useState<CameroonCity | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const wasOfflineRef = useRef(false);

  useEffect(() => subscribeToAvailableCars(), [retryToken, subscribeToAvailableCars]);

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
      setRetryToken((v) => v + 1);
    }
  }, [isOnline]);

  const isGuest = !user;
  const initials =
    user?.fullName
      ?.split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() ?? '';

  const BOOKING_STATUS_LABELS: Record<string, string> = {
    pending: t('booking.status_pending'),
    confirmed: t('booking.status_confirmed'),
    cancelled: t('booking.status_cancelled'),
    completed: t('booking.status_completed'),
  };

  const activeBooking = bookings.find((b) => b.status === 'pending' || b.status === 'confirmed');
  const displayedCars = selectedCity ? cars.filter((c) => c.city === selectedCity) : cars;
  const skeletonItems = Array.from({ length: SKELETON_COUNT }, (_, i) => i);

  const renderSkeleton = useCallback(() => <CarCardSkeleton />, []);
  const skeletonKeyExtractor = useCallback((item: number) => String(item), []);
  const carKeyExtractor = useCallback((item: Car) => item.id, []);
  const renderCar = useCallback(
    ({ item }: { item: Car }) => (
      <CarCard car={item} onPress={() => navigation.navigate('CarDetail', { car: item })} />
    ),
    [navigation],
  );
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setRetryToken((v) => v + 1);
  }, []);
  const refreshControl = (
    <RefreshControl colors={['#3B63D4']} onRefresh={onRefresh} refreshing={refreshing} tintColor="#3B63D4" />
  );

  const ListHeader = (
    <View className="gap-5 pb-2">
      <View className="gap-3">
        <View className="flex-row items-center justify-between">
          <BrandLogo variant="xs" />
          <View className="flex-row items-center gap-2">
            {isGuest ? (
              <TouchableOpacity
                className="flex-row items-center gap-1.5 rounded-full bg-white px-3.5 py-2"
                onPress={() => (navigation as any).navigate('Login')}
                style={{ shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1, borderWidth: 1, borderColor: '#e2e8f0' }}
              >
                <Ionicons color="#3B63D4" name="person-outline" size={15} />
                <Text className="text-sm font-semibold text-slate-700">{t('auth.sign_in_link')}</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  className="h-10 w-10 items-center justify-center rounded-full bg-white"
                  onPress={() => navigation.navigate('MyBookings')}
                  style={{ shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}
                >
                  <Ionicons color="#64748b" name="notifications-outline" size={20} />
                  {activeBooking ? <View className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand-danger" /> : null}
                </TouchableOpacity>
                <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-blue">
                  <Text className="text-sm font-black text-white">{initials}</Text>
                </View>
              </>
            )}
          </View>
        </View>

        <View>
          <Text className="text-2xl font-black text-slate-950">
            {isGuest
              ? t('home.welcome_guest')
              : t('home.greeting_name', { name: user?.fullName?.split(' ')[0] })}
          </Text>
          <Text className="mt-0.5 text-sm text-slate-500">{t('home.subtitle')}</Text>
        </View>
      </View>

      <TouchableOpacity
        activeOpacity={0.8}
        className="flex-row items-center gap-3 rounded-2xl bg-white px-4 py-3.5"
        onPress={() => navigation.navigate('Search')}
        style={{ shadowColor: '#3B63D4', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3, borderWidth: 1.5, borderColor: '#dbeafe' }}
      >
        <Ionicons color="#3B63D4" name="search-outline" size={20} />
        <Text className="flex-1 text-slate-400">{t('home.search_placeholder')}</Text>
        <View className="rounded-lg bg-brand-blue px-2 py-1">
          <Ionicons color="white" name="arrow-forward" size={14} />
        </View>
      </TouchableOpacity>

      <View className="rounded-2xl bg-white p-4">
        <CitySearchInput
          label={t('home.filter_city')}
          onSelectCity={(city) => setSelectedCity(city || null)}
          placeholder={t('home.search_city_placeholder')}
          value={selectedCity}
        />
        {selectedCity ? (
          <TouchableOpacity className="mt-3 self-start" onPress={() => setSelectedCity(null)}>
            <Text className="text-sm font-semibold text-brand-blue">{t('common.see_all_cities')}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {!isGuest && activeBooking ? (
        <TouchableOpacity
          activeOpacity={0.85}
          className="flex-row items-center gap-3 overflow-hidden rounded-2xl bg-white p-4"
          onPress={() => navigation.navigate('MyBookings')}
          style={{ shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2, borderLeftWidth: 4, borderLeftColor: BOOKING_STATUS_COLORS[activeBooking.status] }}
        >
          <View
            className="h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: BOOKING_STATUS_COLORS[activeBooking.status] + '18' }}
          >
            <Ionicons color={BOOKING_STATUS_COLORS[activeBooking.status]} name="car-outline" size={20} />
          </View>
          <View className="flex-1">
            <Text className="text-xs font-semibold text-slate-400">{t('home.active_booking')}</Text>
            <Text className="mt-0.5 font-bold text-slate-950">
              {activeBooking.carBrand && activeBooking.carModel
                ? `${activeBooking.carBrand} ${activeBooking.carModel}`
                : t('home.vehicle_booked')}
            </Text>
            <Text className="mt-0.5 text-xs font-semibold" style={{ color: BOOKING_STATUS_COLORS[activeBooking.status] }}>
              {BOOKING_STATUS_LABELS[activeBooking.status]}
            </Text>
          </View>
          <Ionicons color="#94a3b8" name="chevron-forward" size={18} />
        </TouchableOpacity>
      ) : null}

      <View className="flex-row items-center justify-between">
        <Text className="text-lg font-bold text-slate-950">
          {selectedCity ? t('home.cars_in_city', { city: selectedCity }) : t('home.available_cars')}
          {!loading && displayedCars.length > 0 ? (
            <Text className="text-base font-semibold text-slate-400"> ({displayedCars.length})</Text>
          ) : null}
        </Text>
        {selectedCity ? (
          <TouchableOpacity onPress={() => setSelectedCity(null)}>
            <Text className="text-sm font-semibold text-brand-blue">{t('common.see_all')}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );

  return (
    <Screen scroll={false} topSafeArea>
      <View className="flex-1 px-5 pt-4">
        {loading ? (
          <FlatList
            ListHeaderComponent={ListHeader}
            data={skeletonItems}
            keyExtractor={skeletonKeyExtractor}
            refreshControl={refreshControl}
            renderItem={renderSkeleton}
            scrollEnabled
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <FlatList
            ListHeaderComponent={ListHeader}
            ListEmptyComponent={
              <EmptyState
                ctaLabel={error ? t('common.retry') : selectedCity ? t('common.see_all_cities') : undefined}
                icon={error ? 'cloud-offline-outline' : 'car-outline'}
                illustration={error ? ErrorIllustration : EmptyCarsIllustration}
                onCta={
                  error
                    ? () => setRetryToken((v) => v + 1)
                    : selectedCity
                      ? () => setSelectedCity(null)
                      : undefined
                }
                subtitle={
                  error
                    ? t('home.error_subtitle')
                    : selectedCity
                    ? t('home.no_cars_city_subtitle')
                    : t('home.no_cars_subtitle')
                }
                title={
                  error ??
                  (selectedCity ? t('home.no_cars_city', { city: selectedCity }) : t('home.no_cars'))
                }
              />
            }
            data={displayedCars}
            keyExtractor={carKeyExtractor}
            refreshControl={refreshControl}
            renderItem={renderCar}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </Screen>
  );
}
