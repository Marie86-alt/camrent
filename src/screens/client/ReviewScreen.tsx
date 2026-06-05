import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { BrandLogo } from '../../components/BrandLogo';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Screen } from '../../components/Screen';
import { markBookingReviewSubmitted, submitReview } from '../../services/reviewService';
import { useAuthStore } from '../../store/authStore';
import type { ReviewScreenProps } from '../../types/navigation';

function StarRow({ rating, onRate }: { rating: number; onRate: (r: number) => void }) {
  return (
    <View className="flex-row gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => onRate(star)}>
          <Ionicons
            color={star <= rating ? '#ca8a04' : '#e2e8f0'}
            name={star <= rating ? 'star' : 'star-outline'}
            size={32}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function ReviewScreen({ navigation, route }: ReviewScreenProps) {
  const { booking } = route.params;
  const user = useAuthStore((state) => state.user);

  const [carRating, setCarRating] = useState(0);
  const [carComment, setCarComment] = useState('');
  const [driverRating, setDriverRating] = useState(0);
  const [driverComment, setDriverComment] = useState('');
  const [loading, setLoading] = useState(false);

  const hasDriver = Boolean(booking.withDriver && booking.driverId);

  async function submit() {
    if (carRating === 0) {
      Alert.alert('Note requise', 'Veuillez noter le véhicule avant de soumettre.');
      return;
    }
    if (hasDriver && driverRating === 0) {
      Alert.alert('Note requise', 'Veuillez noter le chauffeur avant de soumettre.');
      return;
    }
    if (!user) return;

    try {
      setLoading(true);

      await submitReview({
        authorId: user.id,
        targetId: booking.carId,
        targetType: 'car',
        rating: carRating,
        comment: carComment.trim(),
        bookingId: booking.id,
      });

      if (hasDriver && booking.driverId) {
        await submitReview({
          authorId: user.id,
          targetId: booking.driverId,
          targetType: 'driver',
          rating: driverRating,
          comment: driverComment.trim(),
          bookingId: booking.id,
        });
      }

      await markBookingReviewSubmitted(booking.id);

      Alert.alert('Merci !', 'Votre avis a bien été enregistré.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Erreur', "L'avis n'a pas pu être enregistré. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen topSafeArea>
      <View className="gap-6 px-5 pt-4">
        {/* Header */}
        <View className="gap-3">
          <View className="flex-row items-center justify-between">
            <BrandLogo variant="xs" />
            <TouchableOpacity
              className="h-10 w-10 items-center justify-center rounded-full bg-white"
              style={{ elevation: 1, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } }}
              onPress={() => navigation.goBack()}
            >
              <Ionicons color="#334155" name="close" size={20} />
            </TouchableOpacity>
          </View>
          <View>
            <Text className="text-xs font-medium text-slate-400">Location terminée</Text>
            <Text className="mt-0.5 text-2xl font-black text-slate-950">Laisser un avis</Text>
          </View>
        </View>

        {/* Car rating */}
        <View
          className="gap-4 rounded-2xl bg-white p-4"
          style={{ elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } }}
        >
          <View className="flex-row items-center gap-2">
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
              <Ionicons color="#3B63D4" name="car-outline" size={18} />
            </View>
            <View>
              <Text className="text-xs text-slate-400">Véhicule</Text>
              <Text className="font-bold text-slate-950">
                {booking.carBrand} {booking.carModel}
              </Text>
            </View>
          </View>
          <StarRow rating={carRating} onRate={setCarRating} />
          <TextInput
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950"
            maxLength={300}
            multiline
            numberOfLines={3}
            onChangeText={setCarComment}
            placeholder="Votre commentaire sur le véhicule (optionnel)"
            placeholderTextColor="#94a3b8"
            textAlignVertical="top"
            value={carComment}
          />
        </View>

        {/* Driver rating — only when booking had a driver */}
        {hasDriver ? (
          <View
            className="gap-4 rounded-2xl bg-white p-4"
            style={{ elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } }}
          >
            <View className="flex-row items-center gap-2">
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-amber-50">
                <Ionicons color="#ca8a04" name="person-outline" size={18} />
              </View>
              <View>
                <Text className="text-xs text-slate-400">Chauffeur</Text>
                <Text className="font-bold text-slate-950">
                  {booking.driverName ?? 'Votre chauffeur'}
                </Text>
              </View>
            </View>
            <StarRow rating={driverRating} onRate={setDriverRating} />
            {driverRating > 0 && driverRating <= 2 ? (
              <View className="flex-row items-center gap-2 rounded-lg bg-red-50 px-3 py-2">
                <Ionicons color="#b91c1c" name="warning-outline" size={14} />
                <Text className="flex-1 text-xs text-red-700">
                  Une note ≤ 2/5 peut entraîner la suspension automatique du chauffeur.
                </Text>
              </View>
            ) : null}
            <TextInput
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950"
              maxLength={300}
              multiline
              numberOfLines={3}
              onChangeText={setDriverComment}
              placeholder="Votre commentaire sur le chauffeur (optionnel)"
              placeholderTextColor="#94a3b8"
              textAlignVertical="top"
              value={driverComment}
            />
          </View>
        ) : null}

        <PrimaryButton loading={loading} onPress={submit}>
          Soumettre mon avis
        </PrimaryButton>
      </View>
    </Screen>
  );
}
