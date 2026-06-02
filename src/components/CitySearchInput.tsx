import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { searchCameroonCities } from '../services/cityService';
import type { CameroonCity } from '../types/models';

type CitySearchInputProps = {
  label?: string;
  onChangeQuery?: (query: string) => void;
  onSelectCity: (city: CameroonCity) => void;
  placeholder?: string;
  showLabel?: boolean;
  value: CameroonCity | null;
};

export function CitySearchInput({
  label = 'Ville',
  onChangeQuery,
  onSelectCity,
  placeholder = 'Rechercher une ville au Cameroun',
  showLabel = true,
  value,
}: CitySearchInputProps) {
  const [query, setQuery] = useState(value ?? '');
  const [results, setResults] = useState<CameroonCity[]>([]);
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!focused || query.trim().length < 2 || query === value) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      const cities = await searchCameroonCities(query);
      setResults(cities);
      setLoading(false);
    }, 250);

    return () => clearTimeout(timeout);
  }, [focused, query, value]);

  useEffect(() => {
    setQuery(value ?? '');
  }, [value]);

  function selectCity(city: CameroonCity) {
    setQuery(city);
    setFocused(false);
    setResults([]);
    onSelectCity(city);
  }

  return (
    <View className="gap-2">
      {showLabel ? <Text className="text-sm font-semibold text-slate-700">{label}</Text> : null}
      <View className="flex-row items-center gap-2 rounded-xl border border-slate-200 bg-white px-3">
        <Ionicons color="#64748b" name="search-outline" size={18} />
        <TextInput
          autoCorrect={false}
          className="h-12 flex-1 text-slate-950"
          onChangeText={(text) => {
            setQuery(text);
            onChangeQuery?.(text);
            if (!text.trim()) {
              onSelectCity('');
            }
          }}
          onFocus={() => setFocused(true)}
          placeholder={placeholder}
          placeholderTextColor="#94a3b8"
          value={query}
        />
        {loading ? <ActivityIndicator color="#3B63D4" size="small" /> : null}
      </View>

      {focused && query.trim().length >= 2 && results.length > 0 ? (
        <View className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {results.map((city) => (
          <TouchableOpacity
            activeOpacity={0.85}
            className="flex-row items-center justify-between border-b border-slate-100 px-4 py-3"
            key={city}
            onPress={() => selectCity(city)}
            onPressIn={() => selectCity(city)}
          >
              <Text className="font-semibold text-slate-800">{city}</Text>
              {value === city ? <Ionicons color="#3B63D4" name="checkmark-circle" size={18} /> : null}
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </View>
  );
}
