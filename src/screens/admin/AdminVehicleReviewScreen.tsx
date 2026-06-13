import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Image } from 'expo-image';
import { Text, TouchableOpacity, View } from 'react-native';

const CAR_BLURHASH = 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.';

import { CAR_PHOTO_SLOTS } from '../../constants/cameroon';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Screen } from '../../components/Screen';
import { CarCardSkeleton, EmptyState, useBottomSheet, useToast } from '../../components/ui';
import { hapticError, hapticSuccess } from '../../utils/haptics';
import EmptyCarsIllustration from '../../../assets/illustrations/empty-cars.svg';
import { subscribeToAllCars, updateCar } from '../../services/carService';
import type { Car } from '../../types/models';
import { formatFcfa } from '../../utils/currency';

type InfoRowProps = {
  label: string;
  value?: string | number | boolean | null;
};

const SKELETON_ITEMS = [0, 1, 2];

function normalizeValue(value: InfoRowProps['value']) {
  if (value === true) return 'Oui';
  if (value === false) return 'Non';
  if (value === undefined || value === null || value === '') return 'Non renseigne';
  return String(value);
}

function InfoRow({ label, value }: InfoRowProps) {
  const missing = value === undefined || value === null || value === '';

  return (
    <View className="flex-row items-center justify-between gap-4 border-b border-slate-100 py-2.5">
      <Text className="flex-1 text-sm text-slate-500">{label}</Text>
      <Text className={`flex-1 text-right text-sm font-semibold ${missing ? 'text-amber-700' : 'text-slate-900'}`}>
        {normalizeValue(value)}
      </Text>
    </View>
  );
}

function getCarPhotos(car: Car) {
  const photos = [...(car.imageUrls ?? [])];

  if (car.imageUrl && !photos.includes(car.imageUrl)) {
    photos.unshift(car.imageUrl);
  }

  return photos.slice(0, 6);
}

function isCarVisibleToClients(car: Car) {
  return car.adminStatus === 'approved' && car.isAvailable === true;
}

function getAdminStatusLabel(car: Car) {
  if (isCarVisibleToClients(car)) return 'Visible client';
  if (car.adminStatus === 'approved') return 'Approuvee mais inactive';
  if (car.adminStatus === 'rejected') return 'Refusee';
  return 'A verifier';
}

function getAdminStatusDotClass(car: Car) {
  if (isCarVisibleToClients(car)) return 'bg-brand-blue';
  if (car.adminStatus === 'approved') return 'bg-slate-400';
  if (car.adminStatus === 'rejected') return 'bg-red-500';
  return 'bg-amber-500';
}

function PhotoGrid({ car }: { car: Car }) {
  const photos = getCarPhotos(car);
  const slots = Array.from({ length: 6 }, (_, index) => photos[index]);

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <Text className="text-lg font-black text-slate-950">Photos du vehicule</Text>
        <Text className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
          {photos.length}/6
        </Text>
      </View>

      <View className="flex-row flex-wrap gap-3">
        {slots.map((uri, index) => {
          const slot = CAR_PHOTO_SLOTS[index];
          return (
            <View
              className="overflow-hidden rounded-xl bg-slate-100"
              key={`${car.id}-photo-${index}`}
              style={{ width: '30.5%' }}
            >
              {uri ? (
                <View>
                  <Image cachePolicy="memory-disk" contentFit="cover" placeholder={{ blurhash: CAR_BLURHASH }} source={{ uri }} style={{ height: 96, width: '100%' }} transition={200} />
                  <View className="items-center py-1">
                    <Text className="text-xs font-bold text-slate-600">{slot.label}</Text>
                  </View>
                </View>
              ) : (
                <View className="h-28 items-center justify-center gap-1 px-1">
                  <Ionicons color="#cbd5e1" name="image-outline" size={20} />
                  <Text className="text-center text-xs font-semibold text-slate-400">{slot.label}</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

function VehicleCard({ car, selected, onPress }: { car: Car; selected: boolean; onPress: () => void }) {
  const photos = getCarPhotos(car);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      className={`mb-3 rounded-xl border bg-white p-3 ${
        selected ? 'border-brand-blue' : 'border-slate-100'
      }`}
      onPress={onPress}
      style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}
    >
      <View className="flex-row gap-3">
        <Image
          cachePolicy="memory-disk"
          contentFit="cover"
          placeholder={{ blurhash: CAR_BLURHASH }}
          source={{ uri: photos[0] ?? car.imageUrl }}
          style={{ height: 80, width: 96, borderRadius: 8 }}
          transition={200}
        />
        <View className="flex-1">
          <View className="flex-row items-start justify-between gap-2">
            <Text className="flex-1 text-base font-black text-slate-950">
              {car.brand} {car.model}
            </Text>
            <Text className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
              {photos.length}/6
            </Text>
          </View>
          <Text className="mt-1 text-sm text-slate-500">
            {car.city} - {car.year} - {formatFcfa(car.pricePerDay)}/j
          </Text>
          <View className="mt-2 flex-row items-center gap-2">
            <View className={`h-2 w-2 rounded-full ${getAdminStatusDotClass(car)}`} />
            <Text className="text-xs font-semibold text-slate-500">
              {getAdminStatusLabel(car)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function TechnicalSheet({ car }: { car: Car }) {
  const sheet = car.technicalSheet;

  return (
    <View className="rounded-xl bg-white p-4">
      <View className="mb-2 flex-row items-center gap-2">
        <Ionicons color="#3B63D4" name="document-text-outline" size={20} />
        <Text className="text-lg font-black text-slate-950">Fiche technique</Text>
      </View>

      <InfoRow label="Marque" value={car.brand} />
      <InfoRow label="Modele" value={car.model} />
      <InfoRow label="Annee" value={car.year} />
      <InfoRow label="Ville" value={car.city} />
      <InfoRow label="Prix journalier" value={formatFcfa(car.pricePerDay)} />
      <InfoRow label="Places" value={car.seats} />
      <InfoRow label="Transmission" value={car.transmission} />
      <InfoRow label="Carburant" value={car.fuelType} />
      <InfoRow label="Immatriculation" value={sheet?.licensePlate} />
      <InfoRow label="Numero chassis" value={sheet?.chassisNumber} />
      <InfoRow label="Kilometrage" value={sheet?.mileage ? `${sheet.mileage} km` : undefined} />
      <InfoRow label="Assurance expire le" value={sheet?.insuranceExpiry} />
      <InfoRow label="Controle technique expire le" value={sheet?.technicalInspectionExpiry} />
      <InfoRow label="Documents verifies" value={car.documentsVerified} />
    </View>
  );
}

export function AdminVehicleReviewScreen() {
  const [cars, setCars] = useState<Car[]>([]);
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewActionLoading, setReviewActionLoading] = useState<'approve' | 'reject' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const bottomSheet = useBottomSheet();

  useEffect(() => {
    const unsubscribe = subscribeToAllCars(
      (items) => {
        setCars(items);
        setSelectedCarId((current) => current ?? items[0]?.id ?? null);
        setError(null);
        setLoading(false);
      },
      () => {
        setError('Impossible de charger les vehicules.');
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  const selectedCar = useMemo(
    () => cars.find((car) => car.id === selectedCarId) ?? cars[0],
    [cars, selectedCarId],
  );

  const incompleteCars = cars.filter((car) => getCarPhotos(car).length < 6 || !car.technicalSheet).length;

  async function approveSelectedCar() {
    if (!selectedCar) return;

    try {
      setReviewActionLoading('approve');
      await updateCar(selectedCar.id, {
        adminStatus: 'approved',
        documentsVerified: true,
        isAvailable: true,
      });
      hapticSuccess(); toast.success('Annonce approuvee — vehicule visible par les clients.');
    } catch {
      hapticError(); toast.error("L'annonce n'a pas pu etre approuvee.");
    } finally {
      setReviewActionLoading(null);
    }
  }

  function rejectSelectedCar() {
    if (!selectedCar) return;

    bottomSheet.show({
      title: 'Rejeter cette annonce ?',
      subtitle: 'Le vehicule sera masque aux clients. Le proprietaire devra corriger les photos ou la fiche technique.',
      actions: [
        {
          label: "Rejeter l'annonce",
          variant: 'danger',
          icon: 'close-circle-outline',
          onPress: async () => {
            try {
              setReviewActionLoading('reject');
              await updateCar(selectedCar.id, {
                adminStatus: 'rejected',
                documentsVerified: false,
                isAvailable: false,
              });
              hapticSuccess(); toast.success("Annonce rejetee — l'annonce a ete masquee.");
            } catch {
              hapticError(); toast.error("L'annonce n'a pas pu etre rejetee.");
            } finally {
              setReviewActionLoading(null);
            }
          },
        },
      ],
    });
  }

  return (
    <Screen topSafeArea>
      <View className="gap-5">
        <View>
          <Text className="text-xs font-bold uppercase text-brand-blue">Administration</Text>
          <Text className="text-3xl font-black text-slate-950">Validation véhicules</Text>
          <Text className="mt-1 text-sm text-slate-500">Contrôle des 6 photos et de la fiche technique.</Text>
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1 rounded-xl bg-white p-4">
            <Text className="text-2xl font-black text-slate-950">{cars.length}</Text>
            <Text className="text-xs font-semibold text-slate-500">Vehicules</Text>
          </View>
          <View className="flex-1 rounded-xl bg-white p-4">
            <Text className="text-2xl font-black text-amber-600">{incompleteCars}</Text>
            <Text className="text-xs font-semibold text-slate-500">A completer</Text>
          </View>
          <View className="flex-1 rounded-xl bg-white p-4">
            <Text className="text-2xl font-black text-brand-blue">
              {cars.filter((car) => car.documentsVerified).length}
            </Text>
            <Text className="text-xs font-semibold text-slate-500">Verifies</Text>
          </View>
        </View>

        {loading ? (
          <View>
            {SKELETON_ITEMS.map((item) => (
              <CarCardSkeleton key={`admin-car-skeleton-${item}`} />
            ))}
          </View>
        ) : error ? (
          <View className="rounded-xl bg-red-50 p-4">
            <Text className="font-semibold text-red-700">{error}</Text>
          </View>
        ) : cars.length === 0 ? (
          <EmptyState
            icon="shield-checkmark-outline"
            illustration={EmptyCarsIllustration}
            subtitle="Les annonces soumises par les proprietaires apparaitront ici."
            title="Aucun vehicule a valider"
          />
        ) : (
          <View className="gap-5">
            <View>
              <Text className="mb-3 text-lg font-black text-slate-950">Annonces a controler</Text>
              {cars.map((car) => (
                <VehicleCard
                  car={car}
                  key={car.id}
                  onPress={() => setSelectedCarId(car.id)}
                  selected={selectedCar?.id === car.id}
                />
              ))}
            </View>

            {selectedCar ? (
              <View className="gap-5">
                <View className="rounded-xl bg-slate-950 p-4">
                  <Text className="text-xs font-bold uppercase text-slate-400">Annonce selectionnee</Text>
                  <Text className="mt-1 text-2xl font-black text-white">
                    {selectedCar.brand} {selectedCar.model}
                  </Text>
                  <Text className="mt-1 text-sm text-slate-400">{selectedCar.description}</Text>
                </View>

                <PhotoGrid car={selectedCar} />
                <TechnicalSheet car={selectedCar} />

                <View className="gap-3 rounded-xl bg-white p-4">
                  <View className="flex-row items-center gap-2">
                    <Ionicons color="#3B63D4" name="shield-checkmark-outline" size={20} />
                    <Text className="text-lg font-black text-slate-950">Decision admin</Text>
                  </View>
                  <Text className="text-sm leading-5 text-slate-500">
                    Approuver publie le vehicule cote client. Rejeter masque l'annonce jusqu'a correction par le proprietaire.
                  </Text>
                  <View className="gap-3">
                    <PrimaryButton
                      loading={reviewActionLoading === 'approve'}
                      onPress={approveSelectedCar}
                    >
                      {selectedCar.adminStatus === 'approved' && !selectedCar.isAvailable
                        ? "Publier l'annonce"
                        : "Approuver et publier l'annonce"}
                    </PrimaryButton>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      className="items-center rounded-xl border border-red-200 bg-red-50 py-3"
                      disabled={reviewActionLoading !== null}
                      onPress={rejectSelectedCar}
                    >
                      <Text className="font-bold text-red-700">
                        {reviewActionLoading === 'reject' ? 'Rejet en cours...' : "Rejeter l'annonce"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : null}
          </View>
        )}
      </View>
    </Screen>
  );
}
