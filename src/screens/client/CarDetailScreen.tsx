import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

const CAR_BLURHASH = 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.';

import { BackButton } from '../../components/BackButton';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Screen } from '../../components/Screen';
import { subscribeToCarReviews } from '../../services/reviewService';
import { useAuthStore } from '../../store/authStore';
import type { Review } from '../../types/models';
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

function StarBar({ rating }: { rating: number }) {
  return (
    <View className="flex-row gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Ionicons
          key={s}
          color={s <= Math.round(rating) ? '#ca8a04' : '#e2e8f0'}
          name={s <= Math.round(rating) ? 'star' : 'star-outline'}
          size={14}
        />
      ))}
    </View>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const date = review.createdAt
    ? new Date((review.createdAt as any).toDate?.() ?? review.createdAt).toLocaleDateString('fr-FR')
    : '';

  return (
    <View className="mb-3 rounded-xl bg-white p-4" style={{ elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } }}>
      <View className="flex-row items-center justify-between">
        <StarBar rating={review.rating} />
        <Text className="text-xs text-slate-400">{date}</Text>
      </View>
      {review.comment ? (
        <Text className="mt-2 text-sm text-slate-600">{review.comment}</Text>
      ) : null}
    </View>
  );
}

function getCarPhotos(car: CarDetailScreenProps['route']['params']['car']) {
  const photos = [...(car.imageUrls ?? [])];
  if (car.imageUrl && !photos.includes(car.imageUrl)) {
    photos.unshift(car.imageUrl);
  }

  return photos.slice(0, 6);
}

function InfoRow({ label, value }: { label: string; value?: string | number }) {
  return (
    <View className="flex-row items-center justify-between gap-4 border-b border-slate-100 py-3">
      <Text className="flex-1 text-sm font-semibold text-slate-500">{label}</Text>
      <Text className="flex-1 text-right text-sm font-bold text-slate-900">
        {value || 'Non renseigné'}
      </Text>
    </View>
  );
}

function ActionCard({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      className="flex-1 items-center gap-2 rounded-2xl bg-white p-4"
      disabled={!onPress}
      onPress={onPress}
      style={{ elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } }}
    >
      <View className="h-10 w-10 items-center justify-center rounded-full bg-blue-50">
        <Ionicons color="#3B63D4" name={icon} size={20} />
      </View>
      <Text className="text-center text-sm font-bold text-slate-800">{label}</Text>
    </TouchableOpacity>
  );
}

export function CarDetailScreen({ navigation, route }: CarDetailScreenProps) {
  const { car } = route.params;
  const user = useAuthStore((state) => state.user);
  const isVerified = car.documentsVerified && car.adminStatus === 'approved';
  const [reviews, setReviews] = useState<Review[]>([]);
  const photos = getCarPhotos(car);
  const technicalSheet = car.technicalSheet;

  useEffect(() => {
    const unsub = subscribeToCarReviews(car.id, setReviews, () => {});
    return unsub;
  }, [car.id]);

  const avgRating =
    reviews.length > 0
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
      : null;

  return (
    <Screen topSafeArea>
      <View className="gap-5">
        <BackButton navigation={navigation} />

        {/* ─── Image ─── */}
        <View className="overflow-hidden rounded-2xl">
          <Image
            cachePolicy="memory-disk"
            contentFit="cover"
            placeholder={{ blurhash: CAR_BLURHASH }}
            source={{ uri: car.imageUrl }}
            style={{ height: 256, width: '100%' }}
            transition={200}
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
        {photos.length > 1 ? (
          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-bold text-slate-950">Photos du véhicule</Text>
              <Text className="text-sm font-semibold text-slate-400">{photos.length}/6</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10 }}
            >
              {photos.map((photo, index) => (
                <Image
                  key={`${photo}-${index}`}
                  cachePolicy="memory-disk"
                  contentFit="cover"
                  placeholder={{ blurhash: CAR_BLURHASH }}
                  source={{ uri: photo }}
                  style={{ height: 96, width: 128, borderRadius: 16 }}
                  transition={200}
                />
              ))}
            </ScrollView>
          </View>
        ) : null}

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

          {/* Rating summary inline */}
          {avgRating !== null && (
            <View className="mt-1 flex-row items-center gap-2">
              <StarBar rating={avgRating} />
              <Text className="text-sm font-bold text-slate-700">{avgRating}/5</Text>
              <Text className="text-sm text-slate-400">({reviews.length} avis)</Text>
            </View>
          )}

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
        <View className="flex-row gap-3">
          <ActionCard
            icon="images-outline"
            label={`${photos.length} photo${photos.length > 1 ? 's' : ''}`}
          />
          <ActionCard
            icon="people-outline"
            label="Chauffeurs disponibles"
            onPress={() =>
              (navigation as any).navigate('DriverList', {
                carCity: car.city,
                carId: car.id,
                selectable: false,
              })
            }
          />
        </View>

        <View className="rounded-2xl bg-white p-4">
          <View className="mb-1 flex-row items-center justify-between">
            <Text className="text-lg font-bold text-slate-950">Fiche technique</Text>
            {isVerified ? (
              <View className="flex-row items-center gap-1 rounded-full bg-blue-50 px-2 py-1">
                <Ionicons color="#3B63D4" name="shield-checkmark" size={12} />
                <Text className="text-xs font-bold text-brand-blue">Vérifiée</Text>
              </View>
            ) : null}
          </View>
          <InfoRow label="Année" value={car.year} />
          <InfoRow label="Kilométrage" value={technicalSheet?.mileage ? `${technicalSheet.mileage} km` : undefined} />
          <InfoRow label="Assurance expire le" value={technicalSheet?.insuranceExpiry} />
          <InfoRow label="Contrôle technique expire le" value={technicalSheet?.technicalInspectionExpiry} />
          <InfoRow label="Carte grise" value={technicalSheet?.registrationDocumentUrl ? 'Document fourni' : undefined} />
        </View>

        {car.description ? (
          <View className="gap-2">
            <Text className="text-lg font-bold text-slate-950">Description</Text>
            <Text className="leading-6 text-slate-600">{car.description}</Text>
          </View>
        ) : null}

        {/* ─── Reviews ─── */}
        {reviews.length > 0 && (
          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-bold text-slate-950">Avis clients</Text>
              <View className="flex-row items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1">
                <Ionicons color="#ca8a04" name="star" size={13} />
                <Text className="text-sm font-black text-yellow-700">{avgRating}/5</Text>
                <Text className="text-xs text-slate-400">· {reviews.length}</Text>
              </View>
            </View>
            {reviews.slice(0, 5).map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </View>
        )}

        <PrimaryButton onPress={() => (user ? navigation.navigate('Booking', { car }) : (navigation as any).navigate('Login'))}>
          Réserver cette voiture
        </PrimaryButton>
      </View>
    </Screen>
  );
}
