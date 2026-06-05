import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { BrandLogo } from '../../components/BrandLogo';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Screen } from '../../components/Screen';
import { markDriverReviewSubmitted, submitReview } from '../../services/reviewService';
import { useAuthStore } from '../../store/authStore';
import type { DriverReviewClientScreenProps } from '../../types/navigation';

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

export function DriverReviewClientScreen({ navigation, route }: DriverReviewClientScreenProps) {
  const { booking } = route.params;
  const user = useAuthStore((state) => state.user);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const clientName = booking.driverLicense?.fullName ?? 'le client';

  async function submit() {
    if (rating === 0) {
      Alert.alert('Note requise', 'Veuillez attribuer une note avant de valider.');
      return;
    }
    if (!user) return;

    try {
      setLoading(true);
      await submitReview({
        authorId: user.id,
        targetId: booking.clientId,
        targetType: 'client',
        rating,
        comment: comment.trim(),
        bookingId: booking.id,
      });
      await markDriverReviewSubmitted(booking.id);
      Alert.alert('Merci !', 'Votre avis sur le client a été enregistré.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Erreur', "L'avis n'a pas pu être enregistré.");
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
            <Text className="text-xs font-medium text-slate-400">Mission terminée</Text>
            <Text className="mt-0.5 text-2xl font-black text-slate-950">Noter le client</Text>
          </View>
        </View>

        {/* Client info */}
        <View
          className="flex-row items-center gap-3 rounded-2xl bg-white p-4"
          style={{ elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } }}
        >
          <View className="h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <Ionicons color="#64748b" name="person-outline" size={24} />
          </View>
          <View>
            <Text className="font-bold text-slate-950">{clientName}</Text>
            <Text className="text-xs text-slate-500">
              {booking.carBrand} {booking.carModel} · {booking.totalDays} jour{booking.totalDays > 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        {/* Rating */}
        <View
          className="gap-4 rounded-2xl bg-white p-4"
          style={{ elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } }}
        >
          <Text className="font-semibold text-slate-800">Votre évaluation</Text>
          <StarRow rating={rating} onRate={setRating} />
          {rating > 0 && (
            <Text className="text-sm text-slate-500">
              {rating >= 5 ? 'Excellent client !' : rating >= 4 ? 'Très bon client' : rating >= 3 ? 'Client correct' : rating >= 2 ? 'Quelques problèmes' : 'Client difficile'}
            </Text>
          )}
          <TextInput
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950"
            maxLength={300}
            multiline
            numberOfLines={3}
            onChangeText={setComment}
            placeholder="Commentaire sur le comportement du client (optionnel)"
            placeholderTextColor="#94a3b8"
            textAlignVertical="top"
            value={comment}
          />
        </View>

        <PrimaryButton loading={loading} onPress={submit}>
          Valider mon évaluation
        </PrimaryButton>
      </View>
    </Screen>
  );
}
