import { Ionicons } from '@expo/vector-icons';
import { TextInput, TouchableOpacity, View } from 'react-native';

type SearchBarProps = {
  onChangeText: (value: string) => void;
  placeholder?: string;
  value: string;
};

export function SearchBar({
  onChangeText,
  placeholder = 'Rechercher une voiture ou une ville',
  value,
}: SearchBarProps) {
  return (
    <View className="flex-row items-center gap-2 rounded-xl border border-slate-200 bg-white px-4">
      <Ionicons color="#94a3b8" name="search-outline" size={18} />
      <TextInput
        autoCapitalize="none"
        className="h-12 flex-1 text-slate-950"
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        value={value}
      />
      {value.length > 0 ? (
        <TouchableOpacity onPress={() => onChangeText('')}>
          <Ionicons color="#94a3b8" name="close-circle" size={18} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
