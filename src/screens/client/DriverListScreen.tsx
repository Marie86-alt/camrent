import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Image, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BrandLogo } from '../../components/BrandLogo';
import { Screen } from '../../components/Screen';
import { DriverCardSkeleton, EmptyState, useToast } from '../../components/ui';
import EmptyDriversIllustration from '../../../assets/illustrations/empty-drivers.svg';
import ErrorIllustration from '../../../assets/illustrations/state-error.svg';
import { listAvailableDrivers } from '../../services/driverService';
import { isOfflineError } from '../../services/networkGuard';
import { useBookingDraftStore } from '../../store/bookingDraftStore';
import type { AppUser } from '../../types/models';
import type { ClientStackParamList, DriverListScreenProps, PublicDriverListScreenProps, PublicStackParamList } from '../../types/navigation';
import { formatFcfa } from '../../utils/currency';
import { hapticWarning } from '../../utils/haptics';

const SKELETON_ITEMS = [0, 1, 2];

type Props = {
  navigation: NativeStackNavigationProp<ClientStackParamList & PublicStackParamList>;
  route: DriverListScreenProps['route'] | PublicDriverListScreenProps['route'];
};

export function DriverListScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { carCity, carId, startDate, endDate, selectable = true } = route.params;
  const { setSelectedDriver } = useBookingDraftStore();
  const [drivers, setDrivers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const toast = useToast();

  useEffect(() => {
    let mounted = true;

    setLoading(true);
    setError(null);
    listAvailableDrivers({ carId, city: carCity, endDate, startDate })
      .then((available) => {
        if (!mounted) return;
        setDrivers(available);
        setError(null);
        setLoading(false);
      })
      .catch((loadError) => {
        if (!mounted) return;
        if (isOfflineError(loadError)) {
          hapticWarning();
          toast.warning(loadError.message);
        }
        setError(t('driver.load_error'));
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [carCity, carId, endDate, retryToken, startDate, t, toast]);

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
            <Text className="text-xs font-medium text-slate-400">
              {t('driver.available_in_city', { city: carCity })}
            </Text>
            <Text className="mt-0.5 text-2xl font-black text-slate-950">
              {selectable ? t('driver.choose_title') : t('driver.available_title')}
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
                ctaLabel={error ? t('common.retry') : undefined}
                icon={error ? 'cloud-offline-outline' : 'people-outline'}
                illustration={error ? ErrorIllustration : EmptyDriversIllustration}
                onCta={error ? () => setRetryToken((value) => value + 1) : undefined}
                subtitle={
                  error
                    ? t('driver.connection_retry')
                    : t('driver.empty_subtitle', { city: carCity })
                }
                title={error ?? t('driver.empty_title')}
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
  const { t } = useTranslation();
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
            {isIndependent ? t('driver.independent_short') : t('driver.owner_driver')}
          </Text>
        </View>
        <View className="mt-0.5 flex-row items-center gap-2">
          {driver.ratingAverage ? (
            <View className="flex-row items-center gap-1">
              <Ionicons color="#ca8a04" name="star" size={12} />
              <Text className="text-xs font-semibold text-slate-600">{driver.ratingAverage}/5</Text>
              {driver.missionsCount ? (
                <Text className="text-xs text-slate-400">
                  {t('driver.missions_badge', { count: driver.missionsCount })}
                </Text>
              ) : null}
            </View>
          ) : (
            <Text className="text-xs text-slate-400">{t('driver.new_driver')}</Text>
          )}
        </View>
        {driver.driverProfile?.experienceYears ? (
          <Text className="mt-0.5 text-xs text-slate-400">
            {t('driver.experience_years', { count: driver.driverProfile.experienceYears })}
          </Text>
        ) : null}
      </View>

      <View className="items-end gap-1">
        <Text className="text-sm font-black text-brand-blue">{formatFcfa(price)}</Text>
        <Text className="text-xs text-slate-400">{t('common.per_day')}</Text>
        <View className="rounded-full bg-blue-50 px-2 py-0.5">
          <Text className="text-xs font-bold text-brand-blue">
            {selectable ? t('driver.choose_action') : t('driver.see_action')}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
