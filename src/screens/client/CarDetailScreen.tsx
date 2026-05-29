import { Ionicons } from '@expo/vector-icons';
import { Image, Text, View } from 'react-native';

import { BackButton } from '../../components/BackButton';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Screen } from '../../components/Screen';
import type { CarDetailScreenProps } from '../../types/navigation';
import { formatFcfa } from '../../utils/currency';

type SpecCardProps = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
};

function SpecCard({ icon, label, value }: SpecCardProps) {
  return (
    <View
      className="flex-1 items-center gap-1 rounded-xl bg-white p-4"
      style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}
    >
      <Ionicons color="#15803d" name={icon} size={22} />
      <Text className="text-xs text-slate-500">{label}</Text>
      <Text className="text-center text-sm font-bold text-slate-950">{value}</Text>
    </View>
  );
}

export function CarDetailScreen({ navigation, route }: CarDetailScreenProps) {
  const { car } = route.params;

  return (
    <Screen>
      <View className="gap-5">
        <BackButton navigation={navigation} />

        <Image
          className="h-64 w-full rounded-xl bg-slate-200"
          resizeMode="cover"
          source={{ uri: car.imageUrl }}
        />

        <View className="gap-1">
          <Text className="text-3xl font-black text-slate-950">
            {car.brand} {car.model}
          </Text>
          <Text className="text-base text-slate-500">
            {car.city} · {car.year}
          </Text>
          <Text className="mt-1 text-2xl font-black text-cameroonGreen">
            {formatFcfa(car.pricePerDay)}<Text className="text-base font-semibold">/jour</Text>
          </Text>
        </View>

        <View className="flex-row gap-3">
          <SpecCard icon="people-outline" label="Places" value={String(car.seats)} />
          <SpecCard icon="settings-outline" label="Boîte" value={car.transmission} />
          <SpecCard icon="water-outline" label="Carburant" value={car.fuelType} />
        </View>

        <View className="gap-2">
          <Text className="text-lg font-bold text-slate-950">Description</Text>
          <Text className="leading-6 text-slate-600">{car.description}</Text>
        </View>

        <PrimaryButton onPress={() => navigation.navigate('Booking', { car })}>
          Réserver cette voiture
        </PrimaryButton>
      </View>
    </Screen>
  );
}
