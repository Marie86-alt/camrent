import { Ionicons } from '@expo/vector-icons';
import { useCallback, useMemo, useState } from 'react';
import { Image } from 'expo-image';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';

const CAR_BLURHASH = 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { CitySearchInput } from '../../components/CitySearchInput';
import { Screen } from '../../components/Screen';
import { CarCardSkeleton, EmptyState, useBottomSheet, useToast } from '../../components/ui';
import { hapticError } from '../../utils/haptics';
import EmptyReservationsIllustration from '../../../assets/illustrations/empty-reservations.svg';
import ErrorIllustration from '../../../assets/illustrations/state-error.svg';
import { useAuth } from '../../hooks/useAuth';
import { useCars } from '../../hooks/useCars';
import { deleteCar, setCarAvailability } from '../../services/carService';
import type { CameroonCity, Car } from '../../types/models';
import type { OwnerStackParamList, OwnerTabParamList } from '../../types/navigation';
import { formatFcfa } from '../../utils/currency';

const SKELETON_ITEMS = [0, 1, 2];

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
  const isVisibleToClients = key === 'approved' && car.isAvailable === true;

  let description = 'Documents en cours de verification';
  if (key === 'pending_review') {
    description = "L'admin verifie vos photos et la fiche technique.";
  } else if (key === 'rejected') {
    description = 'Corrigez les informations manquantes et resoumettez.';
  } else if (isVisibleToClients) {
    description = 'Documents verifies - Visible des clients';
  } else if (key === 'approved') {
    description = 'Annonce approuvee mais desactivee';
  }

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
        <Text className="text-xs text-slate-500">{description}</Text>
      </View>
      {key === 'approved' && (
        <Ionicons
          color={isVisibleToClients ? '#3B63D4' : '#94a3b8'}
          name={isVisibleToClients ? 'shield-checkmark' : 'shield-outline'}
          size={16}
        />
      )}
    </View>
  );
}

function OwnerCarListItem({
  car,
  onDelete,
  onEdit,
  onToggleAvailability,
}: {
  car: Car;
  onDelete: (car: Car) => void;
  onEdit: (car: Car) => void;
  onToggleAvailability: (car: Car) => void;
}) {
  return (
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
        cachePolicy="memory-disk"
        contentFit="cover"
        placeholder={{ blurhash: CAR_BLURHASH }}
        source={{ uri: car.imageUrl }}
        style={{ height: 176, width: '100%' }}
        transition={200}
      />

      <View
        className="absolute left-3 top-3 flex-row items-center gap-1.5 rounded-full px-3 py-1"
        style={{
          backgroundColor: car.isAvailable
            ? 'rgba(59,99,212,0.9)'
            : 'rgba(185,28,28,0.85)',
        }}
      >
        <View className="h-1.5 w-1.5 rounded-full bg-white" />
        <Text className="text-xs font-bold text-white">
          {car.isAvailable ? 'Disponible' : 'D\u00e9sactiv\u00e9e'}
        </Text>
      </View>

      <View className="gap-3 p-4">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="text-lg font-black text-slate-950">
              {car.brand} {car.model}
            </Text>
            <Text className="text-sm text-slate-500">
              {car.city} {'\u00b7'} {car.year} {'\u00b7'} {car.seats} places
            </Text>
          </View>
          <View className="items-end">
            <Text className="font-black text-brand-blue">
              {formatFcfa(car.pricePerDay)}
            </Text>
            <Text className="text-xs text-slate-400">/jour</Text>
          </View>
        </View>

        <AdminStatusBanner car={car} />

        <View className="flex-row gap-2">
          <TouchableOpacity
            activeOpacity={0.8}
            className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-3"
            onPress={() => onEdit(car)}
          >
            <Ionicons color="white" name="create-outline" size={16} />
            <Text className="font-semibold text-white">Modifier</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            className={`flex-1 flex-row items-center justify-center gap-2 rounded-xl px-3 py-3 ${
              car.isAvailable ? 'bg-brand-danger' : 'bg-brand-blue'
            }`}
            onPress={() => onToggleAvailability(car)}
          >
            <Ionicons
              color="white"
              name={car.isAvailable ? 'pause-circle-outline' : 'play-circle-outline'}
              size={16}
            />
            <Text className="font-semibold text-white">
              {car.isAvailable ? 'D\u00e9sactiver' : 'R\u00e9activer'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          className="flex-row items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5"
          onPress={() => onDelete(car)}
        >
          <Ionicons color="#b91c1c" name="trash-outline" size={16} />
          <Text className="text-sm font-semibold text-red-700">Supprimer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function ManageCarsScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { cars, error, loading, retry } = useCars(user?.id);
  const [selectedCity, setSelectedCity] = useState<CameroonCity | null>(null);
  const toast = useToast();
  const bottomSheet = useBottomSheet();

  const displayedCars = useMemo(
    () => (selectedCity ? cars.filter((car) => car.city === selectedCity) : cars),
    [cars, selectedCity],
  );

  const toggleAvailability = useCallback(async (car: Car) => {
    if (!car.isAvailable && car.adminStatus !== 'approved') {
      toast.info("Cette voiture doit d'abord etre validee par l'admin avant d'etre publiee.");
      return;
    }

    try {
      await setCarAvailability(car.id, !car.isAvailable);
    } catch {
      hapticError(); toast.error('Impossible de modifier la disponibilite.');
    }
  }, [toast]);

  const confirmDeleteCar = useCallback((car: Car) => {
    bottomSheet.show({
      title: 'Supprimer cette voiture ?',
      subtitle: `${car.brand} ${car.model} sera retiree de votre flotte. Cette action est definitive.`,
      actions: [
        {
          label: 'Supprimer la voiture',
          variant: 'danger',
          icon: 'trash-outline',
          onPress: async () => {
            try {
              await deleteCar(car.id);
            } catch {
              hapticError(); toast.error('Impossible de supprimer cette voiture.');
            }
          },
        },
      ],
    });
  }, [bottomSheet, toast]);
  const carKeyExtractor = useCallback((item: Car) => item.id, []);
  const editCar = useCallback((car: Car) => {
    navigation.navigate('EditCar', { car });
  }, [navigation]);
  const renderCar = useCallback(
    ({ item }: { item: Car }) => (
      <OwnerCarListItem
        car={item}
        onDelete={confirmDeleteCar}
        onEdit={editCar}
        onToggleAvailability={toggleAvailability}
      />
    ),
    [confirmDeleteCar, editCar, toggleAvailability],
  );

  if (loading) {
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
              </View>
            }
            data={SKELETON_ITEMS}
            keyExtractor={(item) => `car-skeleton-${item}`}
            renderItem={() => <CarCardSkeleton />}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </Screen>
    );
  }

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
            <EmptyState
              ctaLabel={error ? 'Réessayer' : 'Ajouter une voiture'}
              icon={error ? 'cloud-offline-outline' : 'car-outline'}
              illustration={error ? ErrorIllustration : EmptyReservationsIllustration}
              onCta={error ? retry : () => navigation.navigate('AddCar')}
              subtitle={
                error
                  ? 'Vérifiez votre connexion puis relancez le chargement.'
                  : 'Ajoutez votre premiere voiture depuis le tableau de bord.'
              }
              title={error ?? 'Aucune voiture publiee'}
            />
          }
          data={displayedCars}
          keyExtractor={carKeyExtractor}
          renderItem={renderCar}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </Screen>
  );
}
