import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BrandLogo } from '../../components/BrandLogo';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Screen } from '../../components/Screen';
import { useToast } from '../../components/ui';
import { subscribeToDriverBookings } from '../../services/bookingService';
import { updateUserProfile } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';
import { useAuthStore } from '../../store/authStore';
import { hapticSuccess, hapticWarning, hapticError } from '../../utils/haptics';
import type { Booking } from '../../types/models';
import { toJsDate } from '../../utils/firestoreDate';

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function isBetween(date: Date, start: Date, end: Date) {
  const d = date.getTime();
  return d >= start.getTime() && d <= end.getTime();
}

export function DriverCalendarScreen() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const setUser = useAuthStore((state) => state.setUser);
  const toast = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [viewDate, setViewDate] = useState(new Date());
  const [blockedDates, setBlockedDates] = useState<Set<string>>(
    new Set(user?.driverProfile?.blockedDates ?? []),
  );
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-US';

  useEffect(() => {
    if (!user?.id) return;
    return subscribeToDriverBookings(user.id, setBookings, () => {});
  }, [user?.id]);

  const activeBookings = bookings.filter(
    (b) => b.status === 'confirmed' || b.status === 'pending',
  );

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7;

  const days = useMemo(() => {
    const cells: (Date | null)[] = Array(startOffset).fill(null);
    for (let d = 1; d <= lastDay.getDate(); d++) cells.push(new Date(year, month, d));
    return cells;
  }, [year, month, startOffset, lastDay]);

  // Mon–Sun abbreviated day names in the current locale
  const dayHeaders = useMemo(
    () => Array.from({ length: 7 }, (_, i) => {
      // 2024-01-01 is a Monday, so +i gives Mon–Sun
      return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(2024, 0, 1 + i));
    }),
    [locale],
  );

  const monthLabel = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(new Date(year, month)),
    [year, month, locale],
  );

  function getMissionStatus(date: Date) {
    for (const b of activeBookings) {
      if (isBetween(date, toJsDate(b.startDate), toJsDate(b.endDate))) return b.status;
    }
    return null;
  }

  function toggleBlock(date: Date) {
    const key = dateKey(date);
    const missionStatus = getMissionStatus(date);
    if (missionStatus) {
      hapticWarning(); toast.warning(t('driver.date_mission_locked'));
      return;
    }
    setBlockedDates((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    setDirty(true);
  }

  async function save() {
    if (!user) return;
    try {
      setSaving(true);
      const newBlockedDates = Array.from(blockedDates);
      await updateUserProfile(user.id, {
        driverProfile: { ...user.driverProfile, blockedDates: newBlockedDates },
      });
      setUser({ ...user, driverProfile: { ...user.driverProfile, blockedDates: newBlockedDates } });
      setDirty(false);
      hapticSuccess(); toast.success(t('driver.availability_updated'));
    } catch {
      hapticError(); toast.error(t('driver.save_error'));
    } finally {
      setSaving(false);
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const legend = [
    { color: '#3B63D4', label: t('driver.legend_confirmed') },
    { color: '#ca8a04', bg: '#fef9c3', label: t('booking.status_pending') },
    { color: '#b91c1c', bg: '#fecaca', label: t('driver.legend_blocked') },
  ];

  return (
    <Screen scroll={false} topSafeArea>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="gap-5 px-5 pb-8 pt-4">
          <View className="gap-3">
            <BrandLogo variant="xs" />
            <View>
              <Text className="text-xs font-medium text-slate-400">{t('driver.my_availability')}</Text>
              <Text className="mt-0.5 text-2xl font-black text-slate-950">{t('driver.calendar_title')}</Text>
            </View>
          </View>

          <View
            className="flex-row items-center justify-between rounded-2xl bg-white px-4 py-3"
            style={{ elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } }}
          >
            <TouchableOpacity onPress={() => setViewDate(new Date(year, month - 1, 1))}>
              <Ionicons color="#64748b" name="chevron-back" size={22} />
            </TouchableOpacity>
            <Text className="text-base font-black text-slate-950 capitalize">{monthLabel}</Text>
            <TouchableOpacity onPress={() => setViewDate(new Date(year, month + 1, 1))}>
              <Ionicons color="#64748b" name="chevron-forward" size={22} />
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center gap-2 rounded-xl bg-blue-50 px-3 py-2.5">
            <Ionicons color="#3B63D4" name="information-circle-outline" size={16} />
            <Text className="flex-1 text-xs text-blue-700">{t('driver.date_instruction')}</Text>
          </View>

          <View
            className="rounded-2xl bg-white p-4"
            style={{ elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } }}
          >
            <View className="mb-2 flex-row">
              {dayHeaders.map((d) => (
                <View className="flex-1 items-center" key={d}>
                  <Text className="text-xs font-bold text-slate-400">{d}</Text>
                </View>
              ))}
            </View>

            <View className="flex-row flex-wrap">
              {days.map((date, i) => {
                if (!date) {
                  return (
                    <View
                      className="p-1"
                      key={`empty-${i}`}
                      style={{ minWidth: '14.28%', maxWidth: '14.28%' }}
                    />
                  );
                }

                const key = dateKey(date);
                const missionStatus = getMissionStatus(date);
                const isBlocked = blockedDates.has(key);
                const isPast = date < today;

                const bgColor = missionStatus === 'confirmed'
                  ? '#3B63D4'
                  : missionStatus === 'pending'
                  ? '#fef9c3'
                  : isBlocked
                  ? '#fecaca'
                  : 'transparent';

                const textColor = missionStatus === 'confirmed'
                  ? '#fff'
                  : isPast
                  ? '#cbd5e1'
                  : isBlocked
                  ? '#b91c1c'
                  : '#1e293b';

                return (
                  <TouchableOpacity
                    activeOpacity={isPast || !!missionStatus ? 1 : 0.7}
                    key={key}
                    onPress={() => !isPast && toggleBlock(date)}
                    style={{ minWidth: '14.28%', maxWidth: '14.28%', padding: 2 }}
                  >
                    <View
                      className="h-9 w-full items-center justify-center rounded-full"
                      style={{ backgroundColor: bgColor }}
                    >
                      <Text className="text-sm font-semibold" style={{ color: textColor }}>
                        {date.getDate()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View className="flex-row flex-wrap gap-x-4 gap-y-2">
            {legend.map(({ color, bg, label }) => (
              <View className="flex-row items-center gap-1.5" key={label}>
                <View className="h-4 w-4 rounded-full" style={{ backgroundColor: bg ?? color }} />
                <Text className="text-xs text-slate-600">{label}</Text>
              </View>
            ))}
          </View>

          {dirty && (
            <PrimaryButton loading={saving} onPress={save}>
              {t('driver.save_availability')}
            </PrimaryButton>
          )}

          {activeBookings.length > 0 ? (
            <View className="gap-3">
              <Text className="font-bold text-slate-950">{t('driver.upcoming_missions')}</Text>
              {activeBookings.map((b) => (
                <View
                  key={b.id}
                  className="rounded-xl bg-white p-3"
                  style={{ elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } }}
                >
                  <Text className="font-semibold text-slate-950">
                    {b.carBrand} {b.carModel}
                  </Text>
                  <Text className="mt-0.5 text-xs text-slate-500">
                    {toJsDate(b.startDate).toLocaleDateString(locale)} → {toJsDate(b.endDate).toLocaleDateString(locale)}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View className="items-center gap-2 py-4">
              <Ionicons color="#94a3b8" name="calendar-outline" size={28} />
              <Text className="text-sm text-slate-400">{t('driver.no_upcoming')}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
