import { Ionicons } from '@expo/vector-icons';
import { Text, TouchableOpacity } from 'react-native';
import type { NavigationProp, ParamListBase } from '@react-navigation/native';

type BackButtonProps = {
  label?: string;
  navigation: NavigationProp<ParamListBase>;
};

export function BackButton({ label = 'Retour', navigation }: BackButtonProps) {
  if (!navigation.canGoBack()) return null;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      className="mb-2 flex-row items-center gap-1 self-start rounded-full bg-white px-3 py-2"
      onPress={() => navigation.goBack()}
      style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}
    >
      <Ionicons color="#0f172a" name="chevron-back" size={18} />
      <Text className="font-semibold text-slate-900">{label}</Text>
    </TouchableOpacity>
  );
}
