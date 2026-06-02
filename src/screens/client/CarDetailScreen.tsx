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
      <Ionicons color="#3B63D4" name={icon} size={22} />
      <Text className="text-xs text-slate-500">{label}</Text>
      <Text className="text-center text-sm font-bold text-slate-950">{value}</Text>
    </View>
  );
}

export function CarDetailScreen({ navigation, route }: CarDetailScreenProps) {
  const { car } = route.params;
  const isVerified = car.documentsVerified && car.adminStatus === 'approved';

  return (
    <Screen>
      <View className="gap-5">
        <BackButton navigation={navigation} />

        {/* ─── Image ─── */}
        <View className="overflow-hidden rounded-2xl">
          <Image
            className="h-64 w-full bg-slate-200"
            resizeMode="cover"
            source={{ uri: car.imageUrl }}
          />
          {isVerified && (
            <View
              className="absolute bottom-3 right-3 flex-row items-center gap-1.5 rounded-full px-3 py-1.5"
              style={{ backgroundColor: 'rgba(59,99,212,0.92)' }}
            >
              <Ionicons color="white" name="shield-checkmark" size={13} />
              <Text className="text-xs font-bold text-white">Vérifié</Text>
            </View>
          )}
        </View>

        {/* ─── Title ─── */}
        <View className="gap-1">
          <View className="flex-row items-start justify-between gap-3">
            <Text className="flex-1 text-3xl font-black text-slate-950">
              {car.brand} {car.model}
            </Text>
            {isVerified && (
              <View className="mt-1 flex-row items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1">
                <Ionicons color="#3B63D4" name="shield-checkmark" size={12} />
                <Text className="text-xs font-bold text-brand-blue">Véhicule vérifié</Text>
              </View>
            )}
          </View>
          <Text className="text-base text-slate-500">
            {car.city} · {car.year}
          </Text>
          <Text className="mt-1 text-2xl font-black text-brand-blue">
            {formatFcfa(car.pricePerDay)}<Text className="text-base font-semibold">/jour</Text>
          </Text>
        </View>

        {/* ─── Specs ─── */}
        <View className="flex-row gap-3">
          <SpecCard icon="people-outline" label="Places" value={String(car.seats)} />
          <SpecCard icon="settings-outline" label="Boîte" value={car.transmission} />
          <SpecCard icon="water-outline" label="Carburant" value={car.fuelType} />
        </View>

        {/* ─── Description ─── */}
        {car.description ? (
          <View className="gap-2">
            <Text className="text-lg font-bold text-slate-950">Description</Text>
            <Text className="leading-6 text-slate-600">{car.description}</Text>
          </View>
        ) : null}

        <PrimaryButton onPress={() => navigation.navigate('Booking', { car })}>
          Réserver cette voiture
        </PrimaryButton>
      </View>
    </Screen>
  );
}
