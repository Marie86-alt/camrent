import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Text, TouchableOpacity, View } from 'react-native';

import { BrandLogo } from '../../components/BrandLogo';
import { Screen } from '../../components/Screen';
import { listAvailableDrivers } from '../../services/driverService';
import { useBookingDraftStore } from '../../store/bookingDraftStore';
import type { AppUser } from '../../types/models';
import { formatFcfa } from '../../utils/currency';

type DriverListScreenProps = {
  navigation: any;
  route: {
    params: {
      carCity: string;
      carId: string;
      startDate?: string;
      endDate?: string;
      selectable?: boolean;
    };
  };
};

export function DriverListScreen({ navigation, route }: DriverListScreenProps) {
  const { carCity, startDate, endDate, selectable = true } = route.params;
  const { setSelectedDriver } = useBookingDraftStore();
  const [drivers, setDrivers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    listAvailableDrivers({ city: carCity, endDate, startDate })
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
  }, [carCity, startDate, endDate]);

  function selectDriver(driver: AppUser) {
    if (!selectable) {
      navigation.navigate('DriverDetail', { driver });
      return;
    }

    setSelectedDriver(driver);
    navigation.goBack();
  }

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
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#3B63D4" size="large" />
          </View>
        ) : (
          <FlatList
            ListEmptyComponent={
              <View className="mt-16 items-center gap-3">
                <View className="h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                  <Ionicons color="#94a3b8" name="people-outline" size={32} />
                </View>
                <Text className="text-base font-bold text-slate-700">Aucun chauffeur disponible</Text>
                <Text className="text-center text-sm text-slate-400">
                  Aucun chauffeur certifié n'est disponible à {carCity} pour le moment.
                </Text>
              </View>
            }
            data={drivers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <DriverCard
                driver={item}
                onSelect={() => selectDriver(item)}
                selectable={selectable}
              />
            )}
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
