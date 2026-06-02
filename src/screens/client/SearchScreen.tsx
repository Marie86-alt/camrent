import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { FlatList, Text, View } from 'react-native';

import { CarCard } from '../../components/CarCard';
import { CarCardSkeleton } from '../../components/CarCardSkeleton';
import { CitySearchInput } from '../../components/CitySearchInput';
import { Screen } from '../../components/Screen';
import { useCars } from '../../hooks/useCars';
import type { CameroonCity } from '../../types/models';
import type { ClientStackParamList } from '../../types/navigation';

const SKELETON_COUNT = 3;

export function SearchScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ClientStackParamList>>();
  const [query, setQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<CameroonCity | null>(null);
  const { cars, loading } = useCars();

  const filteredCars = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return cars.filter((car) => {
      if (selectedCity) {
        return car.city === selectedCity;
      }

      if (!normalized) {
        return true;
      }

      return `${car.brand} ${car.model} ${car.city}`.toLowerCase().includes(normalized);
    });
  }, [cars, query, selectedCity]);

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
          placeholder="Rechercher une voiture ou une ville"
          showLabel={false}
          value={selectedCity}
        />
        {loading ? (
          <FlatList
            data={Array.from({ length: SKELETON_COUNT }, (_, i) => i)}
            keyExtractor={(item) => String(item)}
            renderItem={() => <CarCardSkeleton />}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <FlatList
            ListEmptyComponent={
              <Text className="mt-10 text-center text-slate-500">Aucun résultat trouvé.</Text>
            }
            data={filteredCars}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <CarCard car={item} onPress={() => navigation.navigate('CarDetail', { car: item })} />
            )}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </Screen>
  );
}
