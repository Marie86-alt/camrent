import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import type { DateData } from 'react-native-calendars';

const CAR_BLURHASH = 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.';

import { BackButton } from '../../components/BackButton';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Screen } from '../../components/Screen';
import { bookingRangesToOccupiedDates, subscribeToCarBookings } from '../../services/bookingService';
import type { DateRange } from '../../services/bookingService';
import { useToast } from '../../components/ui';
import { hapticWarning } from '../../utils/haptics';
import { subscribeToCarReviews } from '../../services/reviewService';
import { useAuthStore } from '../../store/authStore';
import type { Review } from '../../types/models';
import type { CarDetailScreenProps } from '../../types/navigation';
import { formatFcfa } from '../../utils/currency';

LocaleConfig.locales['fr'] = {
  monthNames: ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'],
  monthNamesShort: ['Janv.','Févr.','Mars','Avr.','Mai','Juin','Juil.','Août','Sept.','Oct.','Nov.','Déc.'],
  dayNames: ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'],
  dayNamesShort: ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'],
  today: "Aujourd'hui",
};
LocaleConfig.defaultLocale = 'fr';

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
  const { t } = useTranslation();
  return (
    <View className="flex-row items-center justify-between gap-4 border-b border-slate-100 py-3">
      <Text className="flex-1 text-sm font-semibold text-slate-500">{label}</Text>
      <Text className="flex-1 text-right text-sm font-bold text-slate-900">
        {value || t('common.not_provided')}
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

type PeriodMark = {
  startingDay?: boolean;
  endingDay?: boolean;
  color: string;
  textColor: string;
};

function hasOccupiedInRange(start: string, end: string, occupied: Set<string>): boolean {
  const cur = new Date(start);
  const endDate = new Date(end);
  while (cur <= endDate) {
    if (occupied.has(cur.toISOString().slice(0, 10))) return true;
    cur.setDate(cur.getDate() + 1);
  }
  return false;
}

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

const CALENDAR_THEME = {
  calendarBackground: '#ffffff',
  textSectionTitleColor: '#475569',
  todayTextColor: '#3B63D4',
  todayBackgroundColor: '#EEF2FD',
  dayTextColor: '#0f172a',
  textDisabledColor: '#cbd5e1',
  arrowColor: '#3B63D4',
  disabledArrowColor: '#e2e8f0',
  monthTextColor: '#0f172a',
  textDayFontWeight: '500' as const,
  textMonthFontWeight: '700' as const,
  textDayHeaderFontWeight: '600' as const,
  textDayFontSize: 14,
  textMonthFontSize: 16,
  textDayHeaderFontSize: 12,
};

export function CarDetailScreen({ navigation, route }: CarDetailScreenProps) {
  const { t } = useTranslation();
  const { car } = route.params;
  const user = useAuthStore((state) => state.user);
  const isVerified = car.documentsVerified && car.adminStatus === 'approved';
  const toast = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [bookedRanges, setBookedRanges] = useState<DateRange[]>([]);
  const [selectedStart, setSelectedStart] = useState<string | null>(null);
  const [selectedEnd, setSelectedEnd] = useState<string | null>(null);
  const photos = getCarPhotos(car);
  const technicalSheet = car.technicalSheet;
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  useEffect(() => {
    const unsub = subscribeToCarReviews(car.id, setReviews, () => {});
    return unsub;
  }, [car.id]);

  useEffect(() => {
    const unsub = subscribeToCarBookings(car.id, setBookedRanges, () => {});
    return unsub;
  }, [car.id]);

  const occupiedSet = useMemo(
    () => bookingRangesToOccupiedDates(bookedRanges, car.blockedDates),
    [bookedRanges, car.blockedDates],
  );

  const markedDates = useMemo(() => {
    const result: Record<string, PeriodMark> = {};
    for (const date of occupiedSet) {
      result[date] = { color: '#f1f5f9', textColor: '#94a3b8' };
    }
    if (selectedStart) {
      if (!selectedEnd) {
        result[selectedStart] = { startingDay: true, endingDay: true, color: '#3B63D4', textColor: '#fff' };
      } else {
        const cur = new Date(selectedStart);
        const end = new Date(selectedEnd);
        while (cur <= end) {
          const d = cur.toISOString().slice(0, 10);
          const isEdge = d === selectedStart || d === selectedEnd;
          result[d] = {
            startingDay: d === selectedStart,
            endingDay: d === selectedEnd,
            color: isEdge ? '#3B63D4' : '#EEF2FD',
            textColor: isEdge ? '#fff' : '#3B63D4',
          };
          cur.setDate(cur.getDate() + 1);
        }
      }
    }
    return result;
  }, [occupiedSet, selectedStart, selectedEnd]);

  const onDayPress = useCallback((day: DateData) => {
    const dateStr = day.dateString;
    if (dateStr < todayStr || occupiedSet.has(dateStr)) return;

    if (!selectedStart || selectedEnd) {
      setSelectedStart(dateStr);
      setSelectedEnd(null);
      return;
    }

    if (dateStr <= selectedStart) {
      setSelectedStart(dateStr);
      return;
    }

    if (hasOccupiedInRange(selectedStart, dateStr, occupiedSet)) {
      hapticWarning();
      toast.warning(t('car.selection_conflict'));
      setSelectedStart(null);
      return;
    }

    setSelectedEnd(dateStr);
  }, [todayStr, occupiedSet, selectedStart, selectedEnd, toast, t]);

  const avgRating =
    reviews.length > 0
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
      : null;

  return (
    <Screen topSafeArea>
      <View className="gap-5">
        <BackButton navigation={navigation} />

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
              <Text className="text-xs font-bold text-white">{t('common.verified')}</Text>
            </View>
          )}
        </View>

        {photos.length > 1 ? (
          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-bold text-slate-950">{t('car.photos_gallery')}</Text>
              <Text className="text-sm font-semibold text-slate-400">{photos.length}/6</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
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
                <Text className="text-xs font-bold text-brand-blue">{t('car.verified_badge')}</Text>
              </View>
            )}
          </View>
          <Text className="text-base text-slate-500">
            {car.city} · {car.year}
          </Text>

          {avgRating !== null && (
            <View className="mt-1 flex-row items-center gap-2">
              <StarBar rating={avgRating} />
              <Text className="text-sm font-bold text-slate-700">{avgRating}/5</Text>
              <Text className="text-sm text-slate-400">{t('car.count_badge', { count: reviews.length })}</Text>
            </View>
          )}

          <Text className="mt-1 text-2xl font-black text-brand-blue">
            {formatFcfa(car.pricePerDay)}<Text className="text-base font-semibold">{t('common.per_day')}</Text>
          </Text>
        </View>

        <View className="flex-row gap-3">
          <SpecCard icon="people-outline" label={t('car.seats')} value={String(car.seats)} />
          <SpecCard icon="settings-outline" label={t('car.transmission_short')} value={car.transmission} />
          <SpecCard icon="water-outline" label={t('car.fuel')} value={car.fuelType} />
        </View>

        <View className="flex-row gap-3">
          <ActionCard
            icon="images-outline"
            label={`${photos.length} ${t('car.photos').toLowerCase()}`}
          />
          <ActionCard
            icon="people-outline"
            label={t('car.drivers_available')}
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
            <Text className="text-lg font-bold text-slate-950">{t('car.technical_sheet')}</Text>
            {isVerified ? (
              <View className="flex-row items-center gap-1 rounded-full bg-blue-50 px-2 py-1">
                <Ionicons color="#3B63D4" name="shield-checkmark" size={12} />
                <Text className="text-xs font-bold text-brand-blue">{t('car.technical_sheet_verified')}</Text>
              </View>
            ) : null}
          </View>
          <InfoRow label={t('car.year')} value={car.year} />
          <InfoRow label={t('car.mileage')} value={technicalSheet?.mileage ? t('car.mileage_value', { value: technicalSheet.mileage }) : undefined} />
          <InfoRow label={t('car.insurance_expiry')} value={technicalSheet?.insuranceExpiry} />
          <InfoRow label={t('car.inspection_expiry')} value={technicalSheet?.technicalInspectionExpiry} />
          <InfoRow label={t('car.registration_doc')} value={technicalSheet?.registrationDocumentUrl ? t('car.document_provided') : undefined} />
        </View>

        {car.description ? (
          <View className="gap-2">
            <Text className="text-lg font-bold text-slate-950">{t('car.description')}</Text>
            <Text className="leading-6 text-slate-600">{car.description}</Text>
          </View>
        ) : null}

        <View className="gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-bold text-slate-950">{t('car.availability_title')}</Text>
            {selectedStart ? (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => { setSelectedStart(null); setSelectedEnd(null); }}
              >
                <Text className="text-sm font-semibold text-brand-blue">{t('car.availability_reset')}</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <View
            className="overflow-hidden rounded-2xl bg-white"
            style={{ elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } }}
          >
            <Calendar
              enableSwipeMonths
              markingType="period"
              markedDates={markedDates}
              minDate={todayStr}
              onDayPress={onDayPress}
              theme={CALENDAR_THEME}
            />
          </View>

          <Text className="text-center text-sm text-slate-400">
            {!selectedStart
              ? t('car.availability_hint_start')
              : !selectedEnd
                ? t('car.availability_hint_end')
                : t('car.availability_selected', {
                    start: formatDateShort(selectedStart),
                    end: formatDateShort(selectedEnd),
                  })}
          </Text>

          <View className="flex-row items-center gap-5 px-1">
            <View className="flex-row items-center gap-1.5">
              <View className="h-3 w-3 rounded-sm border border-slate-200 bg-white" />
              <Text className="text-xs text-slate-500">{t('car.legend_free')}</Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <View className="h-3 w-3 rounded-sm bg-slate-200" />
              <Text className="text-xs text-slate-500">{t('car.legend_booked')}</Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <View className="h-3 w-3 rounded-full bg-blue-50" style={{ borderWidth: 1.5, borderColor: '#3B63D4' }} />
              <Text className="text-xs text-slate-500">{t('car.legend_today')}</Text>
            </View>
          </View>

          {selectedStart && selectedEnd ? (
            <TouchableOpacity
              activeOpacity={0.85}
              className="flex-row items-center justify-center gap-2 rounded-2xl bg-brand-blue py-4"
              onPress={() => {
                if (user) {
                  navigation.navigate('Booking', { car, startDate: selectedStart, endDate: selectedEnd });
                } else {
                  (navigation as any).navigate('Login');
                }
              }}
            >
              <Ionicons color="white" name="calendar-outline" size={18} />
              <Text className="text-base font-bold text-white">{t('car.book_selected_dates')}</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {reviews.length > 0 && (
          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-bold text-slate-950">{t('car.reviews_title')}</Text>
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
          {t('car.book')}
        </PrimaryButton>
      </View>
    </Screen>
  );
}
