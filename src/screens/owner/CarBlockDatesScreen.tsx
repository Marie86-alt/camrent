import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import type { DateData } from 'react-native-calendars';

import { PrimaryButton } from '../../components/PrimaryButton';
import { Screen } from '../../components/Screen';
import { useToast } from '../../components/ui';
import { bookingRangesToOccupiedDates, subscribeToCarBookings } from '../../services/bookingService';
import type { DateRange } from '../../services/bookingService';
import { updateCar } from '../../services/carService';
import type { OwnerStackParamList } from '../../types/navigation';
import { hapticError, hapticSuccess } from '../../utils/haptics';

LocaleConfig.locales['fr'] = {
  monthNames: ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'],
  monthNamesShort: ['Janv.','Févr.','Mars','Avr.','Mai','Juin','Juil.','Août','Sept.','Oct.','Nov.','Déc.'],
  dayNames: ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'],
  dayNamesShort: ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'],
  today: "Aujourd'hui",
};
LocaleConfig.defaultLocale = 'fr';

type Props = NativeStackScreenProps<OwnerStackParamList, 'CarBlockDates'>;

type CalendarDayMark = {
  disabled?: boolean;
  disableTouchEvent?: boolean;
  selected?: boolean;
  selectedColor?: string;
  selectedTextColor?: string;
};

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

export function CarBlockDatesScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { car } = route.params;
  const toast = useToast();

  const [bookedRanges, setBookedRanges] = useState<DateRange[]>([]);
  const [localBlocked, setLocalBlocked] = useState<Set<string>>(
    () => new Set(car.blockedDates ?? []),
  );
  const [saving, setSaving] = useState(false);

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  useEffect(() => {
    const unsub = subscribeToCarBookings(car.id, setBookedRanges, () => {});
    return unsub;
  }, [car.id]);

  const clientReservedDates = useMemo(
    () => bookingRangesToOccupiedDates(bookedRanges, []),
    [bookedRanges],
  );

  const markedDates = useMemo(() => {
    const result: Record<string, CalendarDayMark> = {};
    for (const date of clientReservedDates) {
      result[date] = { disabled: true, disableTouchEvent: true };
    }
    for (const date of localBlocked) {
      if (!clientReservedDates.has(date)) {
        result[date] = { selected: true, selectedColor: '#F59E0B', selectedTextColor: '#fff' };
      }
    }
    return result;
  }, [clientReservedDates, localBlocked]);

  const onDayPress = useCallback((day: DateData) => {
    const date = day.dateString;
    if (date < todayStr || clientReservedDates.has(date)) return;
    setLocalBlocked((current) => {
      const next = new Set(current);
      if (next.has(date)) {
        next.delete(date);
      } else {
        next.add(date);
      }
      return next;
    });
  }, [todayStr, clientReservedDates]);

  const save = async () => {
    setSaving(true);
    try {
      await updateCar(car.id, { blockedDates: [...localBlocked].sort() });
      hapticSuccess();
      toast.success(t('owner.blocked_dates_saved'));
      navigation.goBack();
    } catch {
      hapticError();
      toast.error(t('owner.blocked_dates_error'));
    } finally {
      setSaving(false);
    }
  };

  const blockedCount = localBlocked.size;

  return (
    <Screen>
      <View className="gap-5 pt-4">
        <View>
          <Text className="text-2xl font-black text-slate-950">{t('owner.availability_title')}</Text>
          <Text className="mt-1 text-sm text-slate-500">{car.brand} {car.model}</Text>
        </View>

        <View
          className="overflow-hidden rounded-2xl bg-white"
          style={{ elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } }}
        >
          <Calendar
            enableSwipeMonths
            markedDates={markedDates}
            minDate={todayStr}
            onDayPress={onDayPress}
            theme={CALENDAR_THEME}
          />
        </View>

        <Text className="text-center text-sm text-slate-400">{t('owner.availability_hint')}</Text>

        <View className="flex-row items-center justify-center gap-6">
          <View className="flex-row items-center gap-1.5">
            <View className="h-3 w-3 rounded-sm bg-slate-200" />
            <Text className="text-xs text-slate-500">{t('owner.legend_client')}</Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <View className="h-3 w-3 rounded-sm" style={{ backgroundColor: '#F59E0B' }} />
            <Text className="text-xs text-slate-500">{t('owner.legend_blocked')}</Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <View className="h-3 w-3 rounded-sm border border-slate-200 bg-white" />
            <Text className="text-xs text-slate-500">{t('owner.legend_free')}</Text>
          </View>
        </View>

        {blockedCount > 0 && (
          <View className="flex-row items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <Ionicons color="#D97706" name="warning-outline" size={16} />
            <Text className="text-sm font-semibold text-amber-800">
              {blockedCount === 1
                ? t('owner.blocked_count_one', { count: blockedCount })
                : t('owner.blocked_count_other', { count: blockedCount })}
            </Text>
          </View>
        )}

        <PrimaryButton loading={saving} onPress={save}>
          {t('owner.save_availability')}
        </PrimaryButton>
      </View>
    </Screen>
  );
}
