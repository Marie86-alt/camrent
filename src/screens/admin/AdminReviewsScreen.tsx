import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';

import { PrimaryButton } from '../../components/PrimaryButton';
import { Screen } from '../../components/Screen';
import { subscribeToReviews, updateReviewModeration } from '../../services/adminService';
import type { Review, ReviewStatus } from '../../types/models';

const filters: Array<{ label: string; value: 'all' | ReviewStatus }> = [
  { label: 'Tous', value: 'all' },
  { label: 'Publies', value: 'published' },
  { label: 'Signales', value: 'flagged' },
  { label: 'Supprimes', value: 'removed' },
];

function statusLabel(status: ReviewStatus) {
  if (status === 'flagged') return 'Signale';
  if (status === 'removed') return 'Supprime';
  return 'Publie';
}

function ReviewRow({ review, selected, onPress }: { review: Review; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      className={`mb-3 rounded-xl border bg-white p-4 ${selected ? 'border-brand-blue' : 'border-slate-100'}`}
      onPress={onPress}
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-base font-black text-slate-950">
            {review.targetType} - {review.rating}/5
          </Text>
          <Text className="mt-1 text-sm text-slate-500" numberOfLines={2}>
            {review.comment || 'Avis sans commentaire'}
          </Text>
          <Text className="mt-1 text-xs font-semibold text-slate-400">Auteur: {review.authorId}</Text>
        </View>
        <Text className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
          {statusLabel(review.status)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export function AdminReviewsScreen() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | ReviewStatus>('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToReviews(
      (items) => {
        setReviews(items);
        setSelectedId((current) => current ?? items[0]?.id ?? null);
        setLoading(false);
        setError(null);
      },
      () => {
        setError('Impossible de charger les avis.');
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  const visibleReviews = useMemo(
    () => (filter === 'all' ? reviews : reviews.filter((review) => review.status === filter)),
    [filter, reviews],
  );
  const selectedReview = useMemo(
    () => reviews.find((review) => review.id === selectedId) ?? visibleReviews[0],
    [reviews, selectedId, visibleReviews],
  );
  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviews.filter((review) => Math.round(review.rating) === rating).length,
  }));

  async function moderate(payload: Partial<Review>, message: string) {
    if (!selectedReview) return;

    try {
      setSaving(true);
      await updateReviewModeration(selectedReview.id, payload);
      Alert.alert('Moderation enregistree', message);
    } catch {
      Alert.alert('Erreur', "L'avis n'a pas pu etre modere.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <View className="gap-5">
        <View>
          <Text className="text-xs font-bold uppercase text-brand-blue">Module 7</Text>
          <Text className="text-3xl font-black text-slate-950">Avis & moderation</Text>
          <Text className="mt-1 text-sm text-slate-500">Controle des avis voitures, chauffeurs et clients.</Text>
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1 rounded-xl bg-white p-4">
            <Text className="text-2xl font-black text-slate-950">{reviews.length}</Text>
            <Text className="text-xs font-semibold text-slate-500">Avis</Text>
          </View>
          <View className="flex-1 rounded-xl bg-white p-4">
            <Text className="text-2xl font-black text-amber-600">
              {reviews.filter((review) => review.status === 'flagged').length}
            </Text>
            <Text className="text-xs font-semibold text-slate-500">Signales</Text>
          </View>
          <View className="flex-1 rounded-xl bg-white p-4">
            <Text className="text-2xl font-black text-red-600">
              {reviews.filter((review) => review.status === 'removed').length}
            </Text>
            <Text className="text-xs font-semibold text-slate-500">Supprimes</Text>
          </View>
        </View>

        <View className="flex-row flex-wrap gap-2">
          {filters.map((item) => (
            <TouchableOpacity
              className={`rounded-full px-4 py-2 ${filter === item.value ? 'bg-slate-950' : 'bg-white'}`}
              key={item.value}
              onPress={() => setFilter(item.value)}
            >
              <Text className={`text-xs font-bold ${filter === item.value ? 'text-white' : 'text-slate-600'}`}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View className="items-center justify-center py-16">
            <ActivityIndicator color="#3B63D4" size="large" />
          </View>
        ) : error ? (
          <View className="rounded-xl bg-red-50 p-4">
            <Text className="font-semibold text-red-700">{error}</Text>
          </View>
        ) : (
          <View className="gap-5">
            <View>
              <Text className="mb-3 text-lg font-black text-slate-950">Liste des avis</Text>
              {visibleReviews.length === 0 ? (
                <View className="rounded-xl bg-white p-4">
                  <Text className="font-semibold text-slate-500">Aucun avis dans ce filtre.</Text>
                </View>
              ) : (
                visibleReviews.map((review) => (
                  <ReviewRow
                    key={review.id}
                    onPress={() => setSelectedId(review.id)}
                    review={review}
                    selected={selectedReview?.id === review.id}
                  />
                ))
              )}
            </View>

            {selectedReview ? (
              <View className="gap-4 rounded-xl bg-white p-4">
                <View className="flex-row items-center gap-2">
                  <Ionicons color="#3B63D4" name="star-outline" size={22} />
                  <Text className="flex-1 text-xl font-black text-slate-950">Avis selectionne</Text>
                </View>
                <Text className="text-base font-semibold text-slate-800">{selectedReview.comment}</Text>
                <Text className="text-sm text-slate-500">Cible: {selectedReview.targetType} / {selectedReview.targetId}</Text>
                <Text className="text-sm text-slate-500">Motif signalement: {selectedReview.flaggedReason || 'Aucun'}</Text>

                <View className="gap-3">
                  <PrimaryButton
                    loading={saving}
                    onPress={() => moderate({ status: 'published', flaggedReason: '' }, "L'avis est republie.")}
                  >
                    Republier
                  </PrimaryButton>
                  <PrimaryButton
                    loading={saving}
                    onPress={() => moderate({ status: 'flagged', flaggedReason: 'Signalement manuel admin' }, "L'avis est signale.")}
                  >
                    Signaler
                  </PrimaryButton>
                  <PrimaryButton
                    loading={saving}
                    onPress={() => moderate({ status: 'removed', moderatedAt: new Date() }, "L'avis est supprime apres moderation.")}
                  >
                    Supprimer apres moderation
                  </PrimaryButton>
                </View>
              </View>
            ) : null}

            <View className="rounded-xl bg-white p-4">
              <Text className="mb-3 text-lg font-black text-slate-950">Distribution des etoiles</Text>
              {ratingDistribution.map((item) => (
                <View className="flex-row items-center justify-between border-b border-slate-100 py-3" key={item.rating}>
                  <Text className="font-bold text-slate-700">{item.rating} etoiles</Text>
                  <Text className="font-black text-slate-950">{item.count}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </Screen>
  );
}
