import { Image } from 'expo-image';
import { Text, TouchableOpacity, View } from 'react-native';

import { hapticLight } from '../utils/haptics';
import { formatFcfa } from '../utils/currency';
import type { Car } from '../types/models';

// Generic blurhash placeholder for car photos (slate-blue gradient)
const CAR_BLURHASH = 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.';

type CarCardProps = {
  car: Car;
  onPress: () => void;
};

export function CarCard({ car, onPress }: CarCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      className="mb-4 overflow-hidden rounded-xl bg-white"
      onPress={() => { hapticLight(); onPress(); }}
      style={{
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
      }}
    >
      <Image
        cachePolicy="memory-disk"
        contentFit="cover"
        placeholder={{ blurhash: CAR_BLURHASH }}
        source={{ uri: car.imageUrl }}
        style={{ height: 176, width: '100%' }}
        transition={200}
      />
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
            <Text className="font-black text-brand-blue">{formatFcfa(car.pricePerDay)}</Text>
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
