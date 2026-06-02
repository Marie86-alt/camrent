import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Alert, FlatList, Image, Text, TouchableOpacity, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { CitySearchInput } from '../../components/CitySearchInput';
import { Screen } from '../../components/Screen';
import { useAuth } from '../../hooks/useAuth';
import { useCars } from '../../hooks/useCars';
import { deleteCar, setCarAvailability } from '../../services/carService';
import type { CameroonCity, Car } from '../../types/models';
import type { OwnerStackParamList, OwnerTabParamList } from '../../types/navigation';
import { formatFcfa } from '../../utils/currency';

type Props = CompositeScreenProps<
  BottomTabScreenProps<OwnerTabParamList, 'ManageCars'>,
  NativeStackScreenProps<OwnerStackParamList>
>;

const ADMIN_STATUS_CONFIG = {
  approved: {
    bg: '#eff6ff',
    border: '#bfdbfe',
    color: '#3B63D4',
    icon: 'checkmark-circle' as const,
    label: 'Annonce approuvée',
  },
  rejected: {
    bg: '#fef2f2',
    border: '#fecaca',
    color: '#b91c1c',
    icon: 'close-circle' as const,
    label: 'Annonce refusée',
  },
  pending_review: {
    bg: '#fffbeb',
    border: '#fde68a',
    color: '#ca8a04',
    icon: 'time-outline' as const,
    label: 'En attente de validation',
  },
};

function AdminStatusBanner({ car }: { car: Car }) {
  const key = car.adminStatus ?? 'pending_review';
  const cfg = ADMIN_STATUS_CONFIG[key] ?? ADMIN_STATUS_CONFIG.pending_review;

  return (
    <View
      className="flex-row items-center gap-2 rounded-xl px-3 py-2.5"
      style={{ backgroundColor: cfg.bg, borderWidth: 1, borderColor: cfg.border }}
    >
      <Ionicons color={cfg.color} name={cfg.icon} size={16} />
      <View className="flex-1">
        <Text className="text-xs font-bold" style={{ color: cfg.color }}>
          {cfg.label}
        </Text>
        {key === 'pending_review' ? (
          <Text className="text-xs text-slate-500">
            L'admin vérifie vos photos et la fiche technique.
          </Text>
        ) : key === 'rejected' ? (
          <Text className="text-xs text-slate-500">
            Corrigez les informations manquantes et resoumettez.
          </Text>
        ) : car.documentsVerified ? (
          <Text className="text-xs text-slate-500">Documents vérifiés · Visible des clients</Text>
        ) : (
          <Text className="text-xs text-slate-500">Documents en cours de vérification</Text>
        )}
      </View>
      {key === 'approved' && (
        <Ionicons
          color={car.documentsVerified ? '#3B63D4' : '#94a3b8'}
          name={car.documentsVerified ? 'shield-checkmark' : 'shield-outline'}
          size={16}
        />
      )}
    </View>
  );
}

export function ManageCarsScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { cars, error } = useCars(user?.id);
  const [selectedCity, setSelectedCity] = useState<CameroonCity | null>(null);

  const displayedCars = useMemo(
    () => (selectedCity ? cars.filter((car) => car.city === selectedCity) : cars),
    [cars, selectedCity],
  );

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
      `${car.brand} ${car.model} sera retirée de votre flotte. Cette action est définitive.`,
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
            <View className="mb-4 gap-4">
              <Text className="text-2xl font-black text-slate-950">Mes voitures</Text>
              <CitySearchInput
                label="Filtrer par ville"
                onSelectCity={(city) => setSelectedCity(city || null)}
                placeholder="Choisir une ville"
                value={selectedCity}
              />
              {selectedCity ? (
                <TouchableOpacity onPress={() => setSelectedCity(null)}>
                  <Text className="text-sm font-semibold text-brand-blue">Afficher toutes mes voitures</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          }
          ListEmptyComponent={
            <View className="mt-20 items-center gap-3">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <Ionicons color="#94a3b8" name="car-outline" size={32} />
              </View>
              <Text className="text-base font-bold text-slate-700">
                {error ?? 'Aucune voiture publiée'}
              </Text>
              <Text className="text-center text-sm text-slate-400">
                Ajoutez votre première voiture depuis le tableau de bord.
              </Text>
            </View>
          }
          data={displayedCars}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View
              className="mb-4 overflow-hidden rounded-2xl bg-white"
              style={{
                shadowColor: '#000',
                shadowOpacity: 0.07,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 2 },
                elevation: 2,
              }}
            >
              <Image
                className="h-44 w-full bg-slate-200"
                resizeMode="cover"
                source={{ uri: item.imageUrl }}
              />

              {/* Availability pill over image */}
              <View
                className="absolute left-3 top-3 flex-row items-center gap-1.5 rounded-full px-3 py-1"
                style={{
                  backgroundColor: item.isAvailable
                    ? 'rgba(59,99,212,0.9)'
                    : 'rgba(185,28,28,0.85)',
                }}
              >
                <View className="h-1.5 w-1.5 rounded-full bg-white" />
                <Text className="text-xs font-bold text-white">
                  {item.isAvailable ? 'Disponible' : 'Désactivée'}
                </Text>
              </View>

              <View className="gap-3 p-4">
                {/* Car name + price */}
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <Text className="text-lg font-black text-slate-950">
                      {item.brand} {item.model}
                    </Text>
                    <Text className="text-sm text-slate-500">
                      {item.city} · {item.year} · {item.seats} places
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="font-black text-brand-blue">
                      {formatFcfa(item.pricePerDay)}
                    </Text>
                    <Text className="text-xs text-slate-400">/jour</Text>
                  </View>
                </View>

                {/* Admin status banner */}
                <AdminStatusBanner car={item} />

                {/* Action buttons */}
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
                      item.isAvailable ? 'bg-brand-danger' : 'bg-brand-blue'
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
                  className="flex-row items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5"
                  onPress={() => confirmDeleteCar(item)}
                >
                  <Ionicons color="#b91c1c" name="trash-outline" size={16} />
                  <Text className="text-sm font-semibold text-red-700">Supprimer</Text>
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
