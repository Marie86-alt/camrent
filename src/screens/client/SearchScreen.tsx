import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

// ─── Types ────────────────────────────────────────────────────────────────────

type Transmission = 'Automatique' | 'Manuelle';
type FuelType = 'Essence' | 'Diesel' | 'Hybride' | 'Electrique';

type SearchFilters = {
  transmission: Transmission | null;
  fuelType: FuelType | null;
  minSeats: number | null;
  withDriver: boolean | null;
  minPrice: string;
  maxPrice: string;
  availableToday: boolean;
};

const DEFAULT_FILTERS: SearchFilters = {
  transmission: null,
  fuelType: null,
  minSeats: null,
  withDriver: null,
  minPrice: '',
  maxPrice: '',
  availableToday: false,
};

const SKELETON_COUNT = 3;
const SEAT_OPTIONS = [4, 5, 7] as const;
const TRANSMISSIONS: Transmission[] = ['Automatique', 'Manuelle'];
const FUEL_TYPES: FuelType[] = ['Essence', 'Diesel', 'Hybride', 'Electrique'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function countActiveFilters(f: SearchFilters): number {
  let n = 0;
  if (f.transmission) n++;
  if (f.fuelType) n++;
  if (f.minSeats !== null) n++;
  if (f.withDriver !== null) n++;
  if (f.minPrice !== '') n++;
  if (f.maxPrice !== '') n++;
  if (f.availableToday) n++;
  return n;
}

function applyFilters(
  cars: Car[],
  f: SearchFilters,
  query: string,
  selectedCity: CameroonCity | null,
  today: string,
): Car[] {
  const normalized = query.trim().toLowerCase();
  const minP = f.minPrice !== '' ? Number(f.minPrice) : null;
  const maxP = f.maxPrice !== '' ? Number(f.maxPrice) : null;

  return cars.filter((car) => {
    if (selectedCity) {
      if (normalizeCity(car.city ?? '') !== normalizeCity(selectedCity)) return false;
    } else if (normalized) {
      if (!`${car.brand} ${car.model} ${car.city}`.toLowerCase().includes(normalized)) return false;
    }
    if (f.transmission && car.transmission !== f.transmission) return false;
    if (f.fuelType && car.fuelType !== f.fuelType) return false;
    if (f.minSeats !== null && car.seats < f.minSeats) return false;
    if (f.withDriver === true && car.allowIndependentDrivers !== true) return false;
    if (minP !== null && Number.isFinite(minP) && car.pricePerDay < minP) return false;
    if (maxP !== null && Number.isFinite(maxP) && car.pricePerDay > maxP) return false;
    if (f.availableToday) {
      if (!car.isAvailable) return false;
      if (car.blockedDates?.includes(today)) return false;
    }
    return true;
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FilterChip({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      className={`mb-2 mr-2 rounded-full px-3 py-1.5 ${
        active ? 'bg-brand-blue' : 'border border-slate-200 bg-white'
      }`}
      onPress={onPress}
    >
      <Text className={`text-sm font-semibold ${active ? 'text-white' : 'text-slate-600'}`}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function FilterLabel({ label }: { label: string }) {
  return <Text className="mb-2 text-sm font-bold text-slate-950">{label}</Text>;
}

type FilterSheetProps = {
  cars: Car[];
  draft: SearchFilters;
  query: string;
  selectedCity: CameroonCity | null;
  today: string;
  onChangeDraft: (f: SearchFilters) => void;
  onApply: () => void;
  onClose: () => void;
};

function FilterSheet({
  cars,
  draft,
  query,
  selectedCity,
  today,
  onChangeDraft,
  onApply,
  onClose,
}: FilterSheetProps) {
  const { t } = useTranslation();
  const { bottom } = useSafeAreaInsets();

  const resultCount = useMemo(
    () => applyFilters(cars, draft, query, selectedCity, today).length,
    [cars, draft, query, selectedCity, today],
  );

  function patch<K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) {
    onChangeDraft({ ...draft, [key]: value });
  }

  function toggleTransmission(v: Transmission) {
    patch('transmission', draft.transmission === v ? null : v);
  }

  function toggleFuelType(v: FuelType) {
    patch('fuelType', draft.fuelType === v ? null : v);
  }

  function toggleSeats(n: number) {
    patch('minSeats', draft.minSeats === n ? null : n);
  }

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible>
      <Pressable
        onPress={onClose}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }}
      />
      <View
        style={{
          backgroundColor: '#fff',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          maxHeight: '88%',
          paddingBottom: bottom + 8,
          shadowColor: '#000',
          shadowOpacity: 0.16,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: -2 },
          elevation: 12,
        }}
      >
        {/* Handle */}
        <View className="items-center pb-2 pt-3">
          <View className="h-1 w-10 rounded-full bg-slate-300" />
        </View>

        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pb-4">
          <Text className="text-lg font-black text-slate-950">{t('home.filter_btn')}</Text>
          <TouchableOpacity onPress={() => onChangeDraft(DEFAULT_FILTERS)}>
            <Text className="text-sm font-semibold text-brand-blue">{t('home.filter_reset')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="px-5" showsVerticalScrollIndicator={false}>
          {/* Transmission */}
          <View className="mb-5">
            <FilterLabel label={t('home.filter_transmission')} />
            <View className="flex-row flex-wrap">
              {TRANSMISSIONS.map((v) => (
                <FilterChip
                  key={v}
                  active={draft.transmission === v}
                  label={v}
                  onPress={() => toggleTransmission(v)}
                />
              ))}
            </View>
          </View>

          {/* Fuel */}
          <View className="mb-5">
            <FilterLabel label={t('home.filter_fuel')} />
            <View className="flex-row flex-wrap">
              {FUEL_TYPES.map((v) => (
                <FilterChip
                  key={v}
                  active={draft.fuelType === v}
                  label={v}
                  onPress={() => toggleFuelType(v)}
                />
              ))}
            </View>
          </View>

          {/* Seats */}
          <View className="mb-5">
            <FilterLabel label={t('home.filter_seats')} />
            <View className="flex-row flex-wrap">
              {SEAT_OPTIONS.map((n) => (
                <FilterChip
                  key={n}
                  active={draft.minSeats === n}
                  label={t('home.filter_seats_min', { count: n })}
                  onPress={() => toggleSeats(n)}
                />
              ))}
            </View>
          </View>

          {/* Driver option */}
          <View className="mb-5">
            <FilterLabel label={t('home.filter_with_driver')} />
            <View className="flex-row flex-wrap">
              <FilterChip
                active={draft.withDriver === true}
                label={t('home.filter_driver_with')}
                onPress={() =>
                  patch('withDriver', draft.withDriver === true ? null : true)
                }
              />
            </View>
          </View>

          {/* Price range */}
          <View className="mb-5">
            <FilterLabel label={t('home.filter_price')} />
            <View className="flex-row gap-3">
              <TextInput
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-950"
                keyboardType="numeric"
                onChangeText={(v) => patch('minPrice', v.replace(/[^0-9]/g, ''))}
                placeholder={t('home.filter_price_min')}
                placeholderTextColor="#94a3b8"
                value={draft.minPrice}
              />
              <TextInput
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-950"
                keyboardType="numeric"
                onChangeText={(v) => patch('maxPrice', v.replace(/[^0-9]/g, ''))}
                placeholder={t('home.filter_price_max')}
                placeholderTextColor="#94a3b8"
                value={draft.maxPrice}
              />
            </View>
          </View>

          {/* Available today */}
          <View className="mb-6 flex-row items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <View className="flex-row items-center gap-2">
              <Ionicons color="#3B63D4" name="flash-outline" size={18} />
              <Text className="font-semibold text-slate-950">
                {t('home.filter_available_today')}
              </Text>
            </View>
            <Switch
              onValueChange={(v) => patch('availableToday', v)}
              thumbColor="#fff"
              trackColor={{ false: '#e2e8f0', true: '#3B63D4' }}
              value={draft.availableToday}
            />
          </View>
        </ScrollView>

        {/* Apply */}
        <View className="px-5 pt-2">
          <TouchableOpacity
            activeOpacity={0.85}
            className="items-center rounded-xl bg-brand-blue py-4"
            onPress={onApply}
          >
            <Text className="text-base font-bold text-white">
              {resultCount === 1
                ? t('home.filter_apply_one', { count: resultCount })
                : t('home.filter_apply_other', { count: resultCount })}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export function SearchScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<ClientStackParamList>>();
  const [query, setQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<CameroonCity | null>(null);
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [draft, setDraft] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const { cars, error, loading, retry } = useCars();

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const filteredCars = useMemo(
    () => applyFilters(cars, filters, query, selectedCity, today),
    [cars, filters, query, selectedCity, today],
  );

  const activeFilterCount = useMemo(() => countActiveFilters(filters), [filters]);

  const openFilters = useCallback(() => {
    setDraft(filters);
    setShowFilters(true);
  }, [filters]);

  const applyDraft = useCallback(() => {
    setFilters(draft);
    setShowFilters(false);
  }, [draft]);

  const skeletonItems = useMemo(
    () => Array.from({ length: SKELETON_COUNT }, (_, i) => i),
    [],
  );
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
      <View className="flex-1 gap-3 px-5 pt-4">
        {/* Search input */}
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

        {/* Filter button */}
        <TouchableOpacity
          activeOpacity={0.8}
          className="flex-row items-center gap-2 self-end rounded-full border border-slate-200 bg-white px-4 py-2"
          onPress={openFilters}
          style={
            activeFilterCount > 0
              ? { borderColor: '#3B63D4', backgroundColor: '#EEF2FD' }
              : undefined
          }
        >
          <Ionicons
            color={activeFilterCount > 0 ? '#3B63D4' : '#64748b'}
            name="options-outline"
            size={16}
          />
          <Text
            className={`text-sm font-semibold ${
              activeFilterCount > 0 ? 'text-brand-blue' : 'text-slate-600'
            }`}
          >
            {t('home.filter_btn')}
          </Text>
          {activeFilterCount > 0 ? (
            <View className="h-5 w-5 items-center justify-center rounded-full bg-brand-blue">
              <Text className="text-xs font-black text-white">{activeFilterCount}</Text>
            </View>
          ) : null}
        </TouchableOpacity>

        {/* Car list */}
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
                  if (error) {
                    retry();
                    return;
                  }
                  setQuery('');
                  setSelectedCity(null);
                  setFilters(DEFAULT_FILTERS);
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

      {showFilters ? (
        <FilterSheet
          cars={cars}
          draft={draft}
          onApply={applyDraft}
          onChangeDraft={setDraft}
          onClose={() => setShowFilters(false)}
          query={query}
          selectedCity={selectedCity}
          today={today}
        />
      ) : null}
    </Screen>
  );
}
