import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CarCard } from '../../components/CarCard';
import { CitySearchInput } from '../../components/CitySearchInput';
import { Screen } from '../../components/Screen';
import { CarCardSkeleton, EmptyState } from '../../components/ui';
import EmptyCarsIllustration from '../../../assets/illustrations/empty-cars.svg';
import ErrorIllustration from '../../../assets/illustrations/state-error.svg';
import { useCars } from '../../hooks/useCars';
import type { CameroonCity, Car } from '../../types/models';
import type { ClientStackParamList } from '../../types/navigation';
import { normalizeCity } from '../../utils/city';

const SKELETON_COUNT = 3;

export function SearchScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<ClientStackParamList>>();
  const [query, setQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<CameroonCity | null>(null);
  const { cars, error, loading, retry } = useCars();

  const filteredCars = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return cars.filter((car) => {
      if (selectedCity) return normalizeCity(car.city ?? '') === normalizeCity(selectedCity);
      if (!normalized) return true;
      return `${car.brand} ${car.model} ${car.city}`.toLowerCase().includes(normalized);
    });
  }, [cars, query, selectedCity]);
  const skeletonItems = useMemo(() => Array.from({ length: SKELETON_COUNT }, (_, i) => i), []);
  const renderSkeleton = useCallback(() => <CarCardSkeleton />, []);
  const skeletonKeyExtractor = useCallback((item: number) => String(item), []);
  const carKeyExtractor = useCallback((item: Car) => item.id, []);
  const renderCar = useCallback(
    ({ item }: { item: Car }) => (
      <CarCard car={item} onPress={() => navigation.navigate('CarDetail', { car: item })} />
    ),
    [navigation],
  );

  return (
    <Screen scroll={false}>
      <View className="flex-1 gap-4 px-5 pt-4">
        <CitySearchInput
          onChangeQuery={(text) => {
            setQuery(text);
            setSelectedCity(null);
          }}
          onSelectCity={(city) => {
            setSelectedCity(city || null);
            setQuery(city);
          }}
          placeholder={t('home.search_screen_placeholder')}
          showLabel={false}
          value={selectedCity}
        />
        {loading ? (
          <FlatList
            data={skeletonItems}
            keyExtractor={skeletonKeyExtractor}
            renderItem={renderSkeleton}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <FlatList
            ListEmptyComponent={
              <EmptyState
                ctaLabel={error ? t('common.retry') : t('common.clear_search')}
                icon={error ? 'cloud-offline-outline' : 'search-outline'}
                illustration={error ? ErrorIllustration : EmptyCarsIllustration}
                onCta={() => {
                  if (error) { retry(); return; }
                  setQuery('');
                  setSelectedCity(null);
                }}
                subtitle={error ? t('errors.search_retry') : t('home.no_results_subtitle')}
                title={error ?? t('home.no_results')}
              />
            }
            data={filteredCars}
            keyExtractor={carKeyExtractor}
            renderItem={renderCar}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </Screen>
  );
}
