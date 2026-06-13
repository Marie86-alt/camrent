import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Image, Text, TouchableOpacity, View } from 'react-native';

import { BrandLogo } from '../../components/BrandLogo';
import { Screen } from '../../components/Screen';
import { DriverCardSkeleton, EmptyState } from '../../components/ui';
import EmptyDriversIllustration from '../../../assets/illustrations/empty-drivers.svg';
import { listAvailableDrivers } from '../../services/driverService';
import { useBookingDraftStore } from '../../store/bookingDraftStore';
import type { AppUser } from '../../types/models';
import type { ClientStackParamList, DriverListScreenProps, PublicDriverListScreenProps, PublicStackParamList } from '../../types/navigation';
import { formatFcfa } from '../../utils/currency';

const SKELETON_ITEMS = [0, 1, 2];

type Props = {
  navigation: NativeStackNavigationProp<ClientStackParamList & PublicStackParamList>;
  route: DriverListScreenProps['route'] | PublicDriverListScreenProps['route'];
};

export function DriverListScreen({ navigation, route }: Props) {
  const { carCity, carId, startDate, endDate, selectable = true } = route.params;
  const { setSelectedDriver } = useBookingDraftStore();
  const [drivers, setDrivers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    listAvailableDrivers({ carId, city: carCity, endDate, startDate })
      .then((available) => {
        if (!mounted) return;
        setDrivers(available);
        setLoading(false);
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [carCity, carId, startDate, endDate]);

  const selectDriver = useCallback((driver: AppUser) => {
    if (!selectable) {
      navigation.navigate('DriverDetail', { driver });
      return;
    }

    setSelectedDriver(driver);
    navigation.goBack();
  }, [navigation, selectable, setSelectedDriver]);
  const driverKeyExtractor = useCallback((item: AppUser) => item.id, []);
  const renderDriver = useCallback(
    ({ item }: { item: AppUser }) => (
      <DriverCard
        driver={item}
        onSelect={() => selectDriver(item)}
        selectable={selectable}
      />
    ),
    [selectDriver, selectable],
  );

  return (
    <Screen scroll={false} topSafeArea>
      <View className="flex-1 px-5 pt-4">
        {/* Header */}
        <View className="mb-5 gap-3">
          <View className="flex-row items-center justify-between">
            <BrandLogo variant="xs" />
            <TouchableOpacity
              className="h-10 w-10 items-center justify-center rounded-full bg-white"
              style={{ elevation: 1, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } }}
              onPress={() => navigation.goBack()}
            >
              <Ionicons color="#334155" name="arrow-back" size={20} />
            </TouchableOpacity>
          </View>
          <View>
            <Text className="text-xs font-medium text-slate-400">Disponibles à {carCity}</Text>
            <Text className="mt-0.5 text-2xl font-black text-slate-950">
              {selectable ? 'Choisir un chauffeur' : 'Chauffeurs disponibles'}
            </Text>
          </View>
        </View>

        {loading ? (
          <FlatList
            data={SKELETON_ITEMS}
            keyExtractor={(item) => `driver-skeleton-${item}`}
            renderItem={() => <DriverCardSkeleton />}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <FlatList
            ListEmptyComponent={
              <EmptyState
                icon="people-outline"
                illustration={EmptyDriversIllustration}
                subtitle={`Aucun chauffeur certifie n'est disponible a ${carCity} pour le moment.`}
                title="Aucun chauffeur disponible"
              />
            }
            data={drivers}
            keyExtractor={driverKeyExtractor}
            renderItem={renderDriver}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </Screen>
  );
}

function DriverCard({ driver, onSelect, selectable }: { driver: AppUser; onSelect: () => void; selectable: boolean }) {
  const photoUrl = driver.driverProfile?.profilePhotoUrl ?? driver.photoUrl;
  const initials = driver.fullName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const price = driver.driverProfile?.pricePerDay ?? 10000;
  const isIndependent = driver.driverProfile?.isIndependent === true;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      className="mb-3 flex-row items-center gap-3 rounded-2xl bg-white p-4"
      onPress={onSelect}
      style={{
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      }}
    >
      {photoUrl ? (
        <Image
          className="h-14 w-14 rounded-full bg-slate-200"
          resizeMode="cover"
          source={{ uri: photoUrl }}
        />
      ) : (
        <View className="h-14 w-14 items-center justify-center rounded-full bg-brand-blue">
          <Text className="text-base font-black text-white">{initials}</Text>
        </View>
      )}

      <View className="flex-1">
        <Text className="font-bold text-slate-950">{driver.fullName}</Text>
        <View
          className={`mt-1 self-start rounded-full px-2 py-0.5 ${
            isIndependent ? 'bg-blue-50' : 'bg-slate-100'
          }`}
        >
          <Text className={`text-[10px] font-bold ${isIndependent ? 'text-brand-blue' : 'text-slate-600'}`}>
            {isIndependent ? 'Ind\u00e9pendant' : 'Chauffeur du propri\u00e9taire'}
          </Text>
        </View>
        <View className="mt-0.5 flex-row items-center gap-2">
          {driver.ratingAverage ? (
            <View className="flex-row items-center gap-1">
              <Ionicons color="#ca8a04" name="star" size={12} />
              <Text className="text-xs font-semibold text-slate-600">{driver.ratingAverage}/5</Text>
              {driver.missionsCount ? (
                <Text className="text-xs text-slate-400">({driver.missionsCount} missions)</Text>
              ) : null}
            </View>
          ) : (
            <Text className="text-xs text-slate-400">Nouveau chauffeur</Text>
          )}
        </View>
        {driver.driverProfile?.experienceYears ? (
          <Text className="mt-0.5 text-xs text-slate-400">
            {driver.driverProfile.experienceYears} ans d'expérience
          </Text>
        ) : null}
      </View>

      <View className="items-end gap-1">
        <Text className="text-sm font-black text-brand-blue">{formatFcfa(price)}</Text>
        <Text className="text-xs text-slate-400">par jour</Text>
        <View className="rounded-full bg-blue-50 px-2 py-0.5">
          <Text className="text-xs font-bold text-brand-blue">{selectable ? 'Choisir' : 'Voir'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
