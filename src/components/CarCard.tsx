import { Image, Text, TouchableOpacity, View } from 'react-native';

import { formatFcfa } from '../utils/currency';
import type { Car } from '../types/models';

type CarCardProps = {
  car: Car;
  onPress: () => void;
};

export function CarCard({ car, onPress }: CarCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      className="mb-4 overflow-hidden rounded-xl bg-white"
      onPress={onPress}
      style={{
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
      }}
    >
      <Image className="h-44 w-full bg-slate-200" resizeMode="cover" source={{ uri: car.imageUrl }} />
      <View className="gap-2 p-4">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="text-lg font-bold text-slate-950">
              {car.brand} {car.model}
            </Text>
            <Text className="text-sm text-slate-500">
              {car.city} · {car.year}
            </Text>
          </View>
          <View className="items-end">
            <Text className="font-black text-cameroonGreen">{formatFcfa(car.pricePerDay)}</Text>
            <Text className="text-xs text-slate-400">/jour</Text>
          </View>
        </View>
        <View className="flex-row gap-2">
          <View className="rounded-full bg-slate-100 px-2.5 py-1">
            <Text className="text-xs font-medium text-slate-600">{car.seats} places</Text>
          </View>
          <View className="rounded-full bg-slate-100 px-2.5 py-1">
            <Text className="text-xs font-medium text-slate-600">{car.transmission}</Text>
          </View>
          <View className="rounded-full bg-slate-100 px-2.5 py-1">
            <Text className="text-xs font-medium text-slate-600">{car.fuelType}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
