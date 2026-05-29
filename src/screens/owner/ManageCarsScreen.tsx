import { Ionicons } from '@expo/vector-icons';
import { Alert, FlatList, Image, Text, TouchableOpacity, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Screen } from '../../components/Screen';
import { useAuth } from '../../hooks/useAuth';
import { useCars } from '../../hooks/useCars';
import { deleteCar, setCarAvailability } from '../../services/carService';
import type { Car } from '../../types/models';
import type { OwnerStackParamList, OwnerTabParamList } from '../../types/navigation';
import { formatFcfa } from '../../utils/currency';

type Props = CompositeScreenProps<
  BottomTabScreenProps<OwnerTabParamList, 'ManageCars'>,
  NativeStackScreenProps<OwnerStackParamList>
>;

export function ManageCarsScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { cars, error } = useCars(user?.id);

  const toggleAvailability = async (car: Car) => {
    try {
      await setCarAvailability(car.id, !car.isAvailable);
    } catch {
      Alert.alert('Erreur', 'Impossible de modifier la disponibilité.');
    }
  };

  const confirmDeleteCar = (car: Car) => {
    Alert.alert(
      'Supprimer cette voiture',
      `${car.brand} ${car.model} sera retiree de votre flotte. Cette action est definitive.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCar(car.id);
            } catch {
              Alert.alert('Erreur', 'Impossible de supprimer cette voiture.');
            }
          },
        },
      ],
    );
  };

  return (
    <Screen scroll={false}>
      <View className="flex-1 px-5 pt-4">
        <FlatList
          ListHeaderComponent={
            <Text className="mb-4 text-2xl font-black text-slate-950">Mes voitures</Text>
          }
          ListEmptyComponent={
            <View className="mt-20 items-center gap-3">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <Ionicons color="#94a3b8" name="car-outline" size={32} />
              </View>
              <Text className="text-base font-bold text-slate-700">
                {error ?? 'Aucune voiture publiée'}
              </Text>
            </View>
          }
          data={cars}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View
              className="mb-4 overflow-hidden rounded-xl bg-white"
              style={{ shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 }}
            >
              <Image
                className="h-40 w-full bg-slate-200"
                resizeMode="cover"
                source={{ uri: item.imageUrl }}
              />
              <View className="gap-3 p-4">
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-slate-950">
                      {item.brand} {item.model}
                    </Text>
                    <Text className="text-sm text-slate-500">{item.city} · {item.year}</Text>
                  </View>
                  <Text className="font-black text-cameroonGreen">
                    {formatFcfa(item.pricePerDay)}<Text className="text-xs font-semibold">/j</Text>
                  </Text>
                </View>

                <View className="flex-row items-center gap-1.5">
                  <View
                    className={`h-2 w-2 rounded-full ${item.isAvailable ? 'bg-cameroonGreen' : 'bg-cameroonRed'}`}
                  />
                  <Text
                    className={`text-sm font-semibold ${
                      item.isAvailable ? 'text-cameroonGreen' : 'text-cameroonRed'
                    }`}
                  >
                    {item.isAvailable ? 'Disponible' : 'Désactivée'}
                  </Text>
                </View>

                <View className="flex-row gap-2">
                  <TouchableOpacity
                    activeOpacity={0.8}
                    className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-3"
                    onPress={() => navigation.navigate('EditCar', { car: item })}
                  >
                    <Ionicons color="white" name="create-outline" size={16} />
                    <Text className="font-semibold text-white">Modifier</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    className={`flex-1 flex-row items-center justify-center gap-2 rounded-xl px-3 py-3 ${
                      item.isAvailable ? 'bg-cameroonRed' : 'bg-cameroonGreen'
                    }`}
                    onPress={() => toggleAvailability(item)}
                  >
                    <Ionicons
                      color="white"
                      name={item.isAvailable ? 'pause-circle-outline' : 'play-circle-outline'}
                      size={16}
                    />
                    <Text className="font-semibold text-white">
                      {item.isAvailable ? 'Désactiver' : 'Réactiver'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  className="flex-row items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-3"
                  onPress={() => confirmDeleteCar(item)}
                >
                  <Ionicons color="#b91c1c" name="trash-outline" size={17} />
                  <Text className="font-semibold text-red-700">Supprimer cette voiture</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </Screen>
  );
}
