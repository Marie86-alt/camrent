import { Ionicons } from '@expo/vector-icons';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';

import { BrandLogo } from '../../components/BrandLogo';
import { CarCard } from '../../components/CarCard';
import { CitySearchInput } from '../../components/CitySearchInput';
import { Screen } from '../../components/Screen';
import { CarCardSkeleton, EmptyState } from '../../components/ui';
import EmptyCarsIllustration from '../../../assets/illustrations/empty-cars.svg';
import { useBookings } from '../../hooks/useBookings';
import { useAuthStore } from '../../store/authStore';
import { useCarsStore } from '../../store/carsStore';
import type { CameroonCity, Car } from '../../types/models';
import type { ClientStackParamList, ClientTabParamList } from '../../types/navigation';

type HomeNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<ClientTabParamList, 'Home'>,
  NativeStackNavigationProp<ClientStackParamList>
>;

const BOOKING_STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  cancelled: 'Annulée',
  completed: 'Terminée',
};

const BOOKING_STATUS_COLORS: Record<string, string> = {
  pending: '#ca8a04',
  confirmed: '#3B63D4',
  cancelled: '#b91c1c',
  completed: '#64748b',
};

const SKELETON_COUNT = 3;

export function HomeScreen() {
  const navigation = useNavigation<HomeNavProp>();
  const user = useAuthStore((state) => state.user);
  const { cars, error, loading, subscribeToAvailableCars } = useCarsStore();
  const { bookings } = useBookings(user?.id, 'client');
  const [selectedCity, setSelectedCity] = useState<CameroonCity | null>(null);

  useEffect(() => subscribeToAvailableCars(), [subscribeToAvailableCars]);

  const isGuest = !user;
  const initials =
    user?.fullName
      ?.split(' ')
      .map((name) => name[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() ?? '';

  const activeBooking = bookings.find((booking) => booking.status === 'pending' || booking.status === 'confirmed');
  const displayedCars = selectedCity ? cars.filter((car) => car.city === selectedCity) : cars;
  const skeletonItems = Array.from({ length: SKELETON_COUNT }, (_, index) => index);

  const renderSkeleton = useCallback(() => <CarCardSkeleton />, []);
  const skeletonKeyExtractor = useCallback((item: number) => String(item), []);
  const carKeyExtractor = useCallback((item: Car) => item.id, []);
  const renderCar = useCallback(
    ({ item }: { item: Car }) => (
      <CarCard car={item} onPress={() => navigation.navigate('CarDetail', { car: item })} />
    ),
    [navigation],
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
                style={{
                  shadowColor: '#000',
                  shadowOpacity: 0.07,
                  shadowRadius: 4,
                  shadowOffset: { width: 0, height: 1 },
                  elevation: 1,
                  borderWidth: 1,
                  borderColor: '#e2e8f0',
                }}
              >
                <Ionicons color="#3B63D4" name="person-outline" size={15} />
                <Text className="text-sm font-semibold text-slate-700">Se connecter</Text>
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
            {isGuest ? 'Bienvenue sur Autofix Pro' : `Bonjour, ${user?.fullName?.split(' ')[0]} 👋`}
          </Text>
          <Text className="mt-0.5 text-sm text-slate-500">
            Trouvez votre voiture idéale au Cameroun
          </Text>
        </View>
      </View>

      <TouchableOpacity
        activeOpacity={0.8}
        className="flex-row items-center gap-3 rounded-2xl bg-white px-4 py-3.5"
        onPress={() => navigation.navigate('Search')}
        style={{
          shadowColor: '#3B63D4',
          shadowOpacity: 0.12,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          elevation: 3,
          borderWidth: 1.5,
          borderColor: '#dbeafe',
        }}
      >
        <Ionicons color="#3B63D4" name="search-outline" size={20} />
        <Text className="flex-1 text-slate-400">Rechercher marque, modèle ou ville...</Text>
        <View className="rounded-lg bg-brand-blue px-2 py-1">
          <Ionicons color="white" name="arrow-forward" size={14} />
        </View>
      </TouchableOpacity>

      <View className="rounded-2xl bg-white p-4">
        <CitySearchInput
          label="Filtrer par ville"
          onSelectCity={(city) => setSelectedCity(city || null)}
          placeholder="Rechercher Yaounde, Douala, Kribi..."
          value={selectedCity}
        />
        {selectedCity ? (
          <TouchableOpacity className="mt-3 self-start" onPress={() => setSelectedCity(null)}>
            <Text className="text-sm font-semibold text-brand-blue">Voir toutes les villes</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {!isGuest && activeBooking ? (
        <TouchableOpacity
          activeOpacity={0.85}
          className="flex-row items-center gap-3 overflow-hidden rounded-2xl bg-white p-4"
          onPress={() => navigation.navigate('MyBookings')}
          style={{
            shadowColor: '#000',
            shadowOpacity: 0.07,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 },
            elevation: 2,
            borderLeftWidth: 4,
            borderLeftColor: BOOKING_STATUS_COLORS[activeBooking.status],
          }}
        >
          <View
            className="h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: BOOKING_STATUS_COLORS[activeBooking.status] + '18' }}
          >
            <Ionicons color={BOOKING_STATUS_COLORS[activeBooking.status]} name="car-outline" size={20} />
          </View>
          <View className="flex-1">
            <Text className="text-xs font-semibold text-slate-400">Réservation active</Text>
            <Text className="mt-0.5 font-bold text-slate-950">
              {activeBooking.carBrand && activeBooking.carModel
                ? `${activeBooking.carBrand} ${activeBooking.carModel}`
                : 'Véhicule réservé'}
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
          {selectedCity ? `Voitures à ${selectedCity}` : 'Voitures disponibles'}
          {!loading && displayedCars.length > 0 ? (
            <Text className="text-base font-semibold text-slate-400"> ({displayedCars.length})</Text>
          ) : null}
        </Text>
        {selectedCity ? (
          <TouchableOpacity onPress={() => setSelectedCity(null)}>
            <Text className="text-sm font-semibold text-brand-blue">Tout voir</Text>
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
            renderItem={renderSkeleton}
            scrollEnabled
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <FlatList
            ListHeaderComponent={ListHeader}
            ListEmptyComponent={
              <EmptyState
                ctaLabel={selectedCity ? 'Voir toutes les villes' : undefined}
                icon="car-outline"
                illustration={EmptyCarsIllustration}
                onCta={selectedCity ? () => setSelectedCity(null) : undefined}
                subtitle={
                  selectedCity
                    ? 'Essayez une autre ville ou affichez toutes les annonces disponibles.'
                    : 'Revenez plus tard pour voir les nouvelles annonces.'
                }
                title={error ?? `Aucune voiture disponible${selectedCity ? ` a ${selectedCity}` : ''}`}
              />
            }
            data={displayedCars}
            keyExtractor={carKeyExtractor}
            renderItem={renderCar}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </Screen>
  );
}
