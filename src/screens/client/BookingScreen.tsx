import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { KeyboardTypeOptions } from 'react-native';
import { useTranslation } from 'react-i18next';

import { PAYMENT_METHODS } from '../../constants/cameroon';
import { DatePickerField } from '../../components/DatePickerField';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Screen } from '../../components/Screen';
import { doc, getDoc } from 'firebase/firestore';

import { createBooking } from '../../services/bookingService';
import { db, hasFirebaseConfig } from '../../services/firebase';
import { isOfflineError } from '../../services/networkGuard';
import { useAuthStore } from '../../store/authStore';
import { useBookingDraftStore } from '../../store/bookingDraftStore';
import type { PaymentMethod } from '../../types/models';
import type { BookingScreenProps } from '../../types/navigation';
import { SuccessOverlay, useToast } from '../../components/ui';
import { hapticWarning, hapticError } from '../../utils/haptics';
import { formatFcfa } from '../../utils/currency';
import { formatDate, formatInputDate, getRentalDays, parseHumanDate } from '../../utils/dates';

type DateField = 'start' | 'end';
type TimeField = 'startTime' | 'endTime';

type DriverLicenseForm = {
  fullName: string;
  licenseNumber: string;
  issuingCountry: string;
  issueDate: string;
  expiryDate: string;
  categories: string;
};

const INITIAL_DRIVER_LICENSE: DriverLicenseForm = {
  fullName: '',
  licenseNumber: '',
  issuingCountry: 'Cameroun',
  issueDate: '',
  expiryDate: '',
  categories: 'B',
};

function formatLicenseDateInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);
  if (digits.length <= 2) return day;
  if (digits.length <= 4) return `${day}/${month}`;
  return `${day}/${month}/${year}`;
}

type LicenseInputProps = {
  keyboardType?: KeyboardTypeOptions;
  label: string;
  maxLength?: number;
  onChangeText: (value: string) => void;
  placeholder: string;
  value: string;
};

function LicenseInput({ keyboardType, label, maxLength, onChangeText, placeholder, value }: LicenseInputProps) {
  return (
    <View className="gap-1.5">
      <Text className="text-xs font-semibold uppercase text-slate-500">{label}</Text>
      <TextInput
        autoCapitalize="words"
        className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-950"
        keyboardType={keyboardType}
        maxLength={maxLength}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        value={value}
      />
    </View>
  );
}

function clampDate(d: Date, floor: Date): Date {
  return d >= floor ? d : floor;
}

function parseDateParam(iso: string | undefined, floor: Date): Date {
  if (!iso) return floor;
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  return clampDate(d, floor);
}

function formatTime(date: Date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function timeToDate(time: string) {
  const date = new Date();
  const [hours, minutes] = time.split(':').map(Number);
  date.setHours(Number.isFinite(hours) ? hours : 8, Number.isFinite(minutes) ? minutes : 0, 0, 0);
  return date;
}

export function BookingScreen({ navigation, route }: BookingScreenProps) {
  const { t } = useTranslation();
  const { car } = route.params;
  const user = useAuthStore((state) => state.user);
  const { selectedDriver, clearDriver } = useBookingDraftStore();
  const toast = useToast();
  const [withDriver, setWithDriver] = useState(false);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [startDate, setStartDate] = useState(() => parseDateParam(route.params.startDate, today));
  const [endDate, setEndDate] = useState(() => {
    const start = parseDateParam(route.params.startDate, today);
    return parseDateParam(route.params.endDate, start);
  });
  const [startDateInput, setStartDateInput] = useState(() => formatInputDate(parseDateParam(route.params.startDate, today)));
  const [endDateInput, setEndDateInput] = useState(() => {
    const start = parseDateParam(route.params.startDate, today);
    return formatInputDate(parseDateParam(route.params.endDate, start));
  });
  const [activeDatePicker, setActiveDatePicker] = useState<DateField | null>(null);
  const [activeTimePicker, setActiveTimePicker] = useState<TimeField | null>(null);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('18:00');
  const [driverLicense, setDriverLicense] = useState<DriverLicenseForm>(INITIAL_DRIVER_LICENSE);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('MTN MoMo');
  const [loading, setLoading] = useState(false);
  const [nextPayment, setNextPayment] = useState<{
    amount: number;
    bookingId: string;
    paymentMethod: PaymentMethod;
  } | null>(null);
  const [depositAmount, setDepositAmount] = useState<number>(0);

  useEffect(() => {
    return () => { clearDriver(); };
  }, [clearDriver]);

  useEffect(() => {
    async function loadDeposit() {
      try {
        const snap = await getDoc(doc(db, 'adminSettings', 'security'));
        const data = snap.data() as { defaultDepositAmount?: number } | undefined;
        if (data?.defaultDepositAmount) setDepositAmount(Number(data.defaultDepositAmount));
      } catch { /* ignore — le champ reste à 0 */ }
    }
    void loadDeposit();
  }, []);

  const totalDays = useMemo(() => getRentalDays(startDate, endDate), [endDate, startDate]);
  const driverPricePerDay = selectedDriver?.driverProfile?.pricePerDay ?? 10000;
  const totalPrice = totalDays * car.pricePerDay + (withDriver && selectedDriver ? totalDays * driverPricePerDay : 0);

  const updateDriverLicense = (field: keyof DriverLicenseForm, value: string) => {
    setDriverLicense((current) => ({ ...current, [field]: value }));
  };

  const updateRentalDate = (field: DateField, value: string) => {
    const formatted = formatLicenseDateInput(value);
    const parsed = parseHumanDate(formatted);

    if (field === 'start') {
      setStartDateInput(formatted);
      if (!parsed) return;
      const nextStart = parsed < today ? today : parsed;
      setStartDate(nextStart);
      setStartDateInput(formatInputDate(nextStart));
      if (nextStart > endDate) {
        setEndDate(nextStart);
        setEndDateInput(formatInputDate(nextStart));
      }
      return;
    }

    setEndDateInput(formatted);
    if (!parsed) return;
    const nextEnd = parsed < startDate ? startDate : parsed;
    setEndDate(nextEnd);
    setEndDateInput(formatInputDate(nextEnd));
  };

  const updateRentalDateFromPicker = (field: DateField, value: Date) => {
    const selectedDate = new Date(value);
    selectedDate.setHours(0, 0, 0, 0);

    if (field === 'start') {
      const nextStart = selectedDate < today ? today : selectedDate;
      setStartDate(nextStart);
      setStartDateInput(formatInputDate(nextStart));
      if (nextStart > endDate) {
        setEndDate(nextStart);
        setEndDateInput(formatInputDate(nextStart));
      }
      return;
    }

    const nextEnd = selectedDate < startDate ? startDate : selectedDate;
    setEndDate(nextEnd);
    setEndDateInput(formatInputDate(nextEnd));
  };

  const onDatePickerChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === 'dismissed') {
      setActiveDatePicker(null);
      return;
    }
    if (activeDatePicker && selectedDate) {
      updateRentalDateFromPicker(activeDatePicker, selectedDate);
    }
    setActiveDatePicker(null);
  };

  const onTimePickerChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === 'dismissed') {
      setActiveTimePicker(null);
      return;
    }

    if (activeTimePicker && selectedDate) {
      const value = formatTime(selectedDate);
      if (activeTimePicker === 'startTime') {
        setStartTime(value);
      } else {
        setEndTime(value);
      }
    }

    setActiveTimePicker(null);
  };

  const validateDriverLicense = () => {
    const normalized = {
      fullName: driverLicense.fullName.trim(),
      licenseNumber: driverLicense.licenseNumber.trim(),
      issuingCountry: driverLicense.issuingCountry.trim(),
      issueDate: driverLicense.issueDate.trim(),
      expiryDate: driverLicense.expiryDate.trim(),
      categories: driverLicense.categories.trim().toUpperCase(),
    };

    if (
      !normalized.fullName ||
      !normalized.licenseNumber ||
      !normalized.issuingCountry ||
      !normalized.issueDate ||
      !normalized.expiryDate ||
      !normalized.categories
    ) {
      hapticWarning(); toast.warning(t('booking.license_missing'));
      return null;
    }

    if (normalized.licenseNumber.length < 5) {
      hapticWarning(); toast.warning(t('booking.license_number_short'));
      return null;
    }

    const issueDate = parseHumanDate(normalized.issueDate);
    const expiryDate = parseHumanDate(normalized.expiryDate);

    if (!issueDate || !expiryDate) {
      hapticWarning(); toast.warning(t('booking.dates_invalid'));
      return null;
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (expiryDate < now) {
      hapticWarning(); toast.warning(t('booking.license_expired_msg'));
      return null;
    }

    function toApiDate(date: Date) {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }
    return {
      ...normalized,
      issueDate: toApiDate(issueDate),
      expiryDate: toApiDate(expiryDate),
    };
  };

  const reserve = async () => {
    if (!user) {
      hapticWarning(); toast.warning(t('booking.session_expired_msg'));
      return;
    }

    const validatedDriverLicense = withDriver ? null : validateDriverLicense();
    if (!withDriver && !validatedDriverLicense) return;

    try {
      setLoading(true);
      if (!hasFirebaseConfig) {
        setNextPayment({
          amount: totalPrice,
          bookingId: `demo-booking-${Date.now()}`,
          paymentMethod,
        });
        return;
      }

      const booking = await createBooking({
        car,
        clientId: user.id,
        driverLicense: validatedDriverLicense,
        endDate,
        endTime,
        paymentMethod,
        startDate,
        startTime,
        totalDays,
        totalPrice,
        withDriver,
        ...(withDriver && selectedDriver ? {
          driverId: selectedDriver.id,
          driverName: selectedDriver.fullName,
          driverPhotoUrl: selectedDriver.driverProfile?.profilePhotoUrl,
          driverPricePerDay,
        } : {}),
      });

      setNextPayment({
        amount: booking.totalPrice,
        bookingId: booking.id,
        paymentMethod,
      });
    } catch (error) {
      if (isOfflineError(error)) {
        hapticWarning();
        toast.warning(error.message);
        return;
      }
      hapticError(); toast.error(error instanceof Error ? error.message : t('booking.create_error'));
    } finally {
      setLoading(false);
    }
  };

  const continueToPayment = useCallback(() => {
    if (!nextPayment) return;
    const paymentParams = nextPayment;
    setNextPayment(null);
    navigation.navigate('Payment', paymentParams);
  }, [navigation, nextPayment]);

  const goBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate('CarDetail', { car });
  };

  return (
    <Screen topSafeArea>
      <View className="gap-6">
        <TouchableOpacity
          accessibilityLabel={t('common.back')}
          activeOpacity={0.8}
          className="self-start rounded-full bg-white p-3"
          onPress={goBack}
          style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}
        >
          <Ionicons color="#0f172a" name="arrow-back" size={24} />
        </TouchableOpacity>

        <View>
          <Text className="text-2xl font-black text-slate-950">
            {car.brand} {car.model}
          </Text>
          <Text className="mt-1 text-slate-500">{formatFcfa(car.pricePerDay)} {t('common.per_day')}</Text>
        </View>

        <View className="gap-3">
          <Text className="font-semibold text-slate-800">{t('booking.rental_dates')}</Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              activeOpacity={0.85}
              className="flex-1 rounded-xl border border-slate-200 bg-white p-4"
              onPress={() => setActiveDatePicker('start')}
            >
              <View className="flex-row items-center gap-1.5 mb-1">
                <Ionicons color="#94a3b8" name="calendar-outline" size={14} />
                <Text className="text-xs text-slate-500">{t('booking.start_label')}</Text>
              </View>
              <TextInput
                className="p-0 text-base font-bold text-slate-950"
                editable={false}
                keyboardType="number-pad"
                maxLength={10}
                onChangeText={(value) => updateRentalDate('start', value)}
                placeholder={t('common.date_placeholder')}
                placeholderTextColor="#94a3b8"
                pointerEvents="none"
                value={startDateInput}
              />
              <Text className="mt-1 text-xs text-slate-400">{formatDate(startDate)}</Text>
            </TouchableOpacity>

            <View className="items-center justify-center px-1">
              <Ionicons color="#94a3b8" name="arrow-forward-outline" size={18} />
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              className="flex-1 rounded-xl border border-slate-200 bg-white p-4"
              onPress={() => setActiveDatePicker('end')}
            >
              <View className="flex-row items-center gap-1.5 mb-1">
                <Ionicons color="#94a3b8" name="calendar-outline" size={14} />
                <Text className="text-xs text-slate-500">{t('common.end')}</Text>
              </View>
              <TextInput
                className="p-0 text-base font-bold text-slate-950"
                editable={false}
                keyboardType="number-pad"
                maxLength={10}
                onChangeText={(value) => updateRentalDate('end', value)}
                placeholder={t('common.date_placeholder')}
                placeholderTextColor="#94a3b8"
                pointerEvents="none"
                value={endDateInput}
              />
              <Text className="mt-1 text-xs text-slate-400">{formatDate(endDate)}</Text>
            </TouchableOpacity>
          </View>

          {activeDatePicker ? (
            <DateTimePicker
              display="calendar"
              minimumDate={activeDatePicker === 'start' ? today : startDate}
              mode="date"
              onChange={onDatePickerChange}
              value={activeDatePicker === 'start' ? startDate : endDate}
            />
          ) : null}

          <View className="gap-3">
            <Text className="font-semibold text-slate-800">{t('booking.rental_times')}</Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                activeOpacity={0.85}
                className="flex-1 rounded-xl border border-slate-200 bg-white p-4"
                onPress={() => setActiveTimePicker('startTime')}
              >
                <View className="mb-1 flex-row items-center gap-1.5">
                  <Ionicons color="#94a3b8" name="time-outline" size={14} />
                  <Text className="text-xs text-slate-500">{t('booking.pickup_time')}</Text>
                </View>
                <Text className="text-base font-bold text-slate-950">{startTime}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                className="flex-1 rounded-xl border border-slate-200 bg-white p-4"
                onPress={() => setActiveTimePicker('endTime')}
              >
                <View className="mb-1 flex-row items-center gap-1.5">
                  <Ionicons color="#94a3b8" name="time-outline" size={14} />
                  <Text className="text-xs text-slate-500">{t('booking.return_time')}</Text>
                </View>
                <Text className="text-base font-bold text-slate-950">{endTime}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {activeTimePicker ? (
            <DateTimePicker
              display="default"
              mode="time"
              onChange={onTimePickerChange}
              value={timeToDate(activeTimePicker === 'startTime' ? startTime : endTime)}
            />
          ) : null}

          <View className="flex-row items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2">
            <Ionicons color="#3b82f6" name="information-circle-outline" size={16} />
            <Text className="text-xs text-blue-600">{t('booking.date_info')}</Text>
          </View>
        </View>

        <View className="gap-3">
          <Text className="font-semibold text-slate-800">{t('booking.driver_toggle')}</Text>
          <View className="flex-row gap-2">
            <TouchableOpacity
              className={`flex-1 flex-row items-center justify-center gap-2 rounded-xl border py-3 ${!withDriver ? 'border-brand-blue bg-blue-50' : 'border-slate-200 bg-white'}`}
              onPress={() => { setWithDriver(false); clearDriver(); }}
            >
              <Ionicons color={!withDriver ? '#3B63D4' : '#94a3b8'} name="person-outline" size={16} />
              <Text className={`font-semibold ${!withDriver ? 'text-brand-blue' : 'text-slate-500'}`}>
                {t('booking.without_driver')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 flex-row items-center justify-center gap-2 rounded-xl border py-3 ${withDriver ? 'border-brand-blue bg-blue-50' : 'border-slate-200 bg-white'}`}
              onPress={() => setWithDriver(true)}
            >
              <Ionicons color={withDriver ? '#3B63D4' : '#94a3b8'} name="people-outline" size={16} />
              <Text className={`font-semibold ${withDriver ? 'text-brand-blue' : 'text-slate-500'}`}>
                {t('booking.with_driver')}
              </Text>
            </TouchableOpacity>
          </View>

          {withDriver ? (
            selectedDriver ? (
              <View className="flex-row items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3">
                {selectedDriver.driverProfile?.profilePhotoUrl ? (
                  <Image
                    className="h-12 w-12 rounded-full bg-slate-200"
                    resizeMode="cover"
                    source={{ uri: selectedDriver.driverProfile.profilePhotoUrl }}
                  />
                ) : (
                  <View className="h-12 w-12 items-center justify-center rounded-full bg-brand-blue">
                    <Text className="text-sm font-black text-white">
                      {selectedDriver.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                    </Text>
                  </View>
                )}
                <View className="flex-1">
                  <Text className="font-bold text-slate-950">{selectedDriver.fullName}</Text>
                  <Text className="text-xs text-slate-500">
                    {selectedDriver.driverProfile?.experienceYears
                      ? (selectedDriver.driverProfile.experienceYears > 1
                          ? t('booking.driver_experience_plural', { count: selectedDriver.driverProfile.experienceYears })
                          : t('booking.driver_experience', { count: selectedDriver.driverProfile.experienceYears }))
                      : t('booking.driver_certified')}
                    {selectedDriver.ratingAverage ? ` · ★ ${selectedDriver.ratingAverage}/5` : ''}
                  </Text>
                  <Text className="mt-0.5 text-xs font-semibold text-brand-blue">
                    {t('booking.driver_price_per_day', { price: formatFcfa(driverPricePerDay) })}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('DriverList', { carCity: car.city, carId: car.id, startDate: startDate.toISOString(), endDate: endDate.toISOString() })}>
                  <Text className="text-xs font-bold text-brand-blue">{t('common.change')}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                activeOpacity={0.85}
                className="flex-row items-center justify-center gap-2 rounded-xl border border-dashed border-brand-blue bg-blue-50 py-4"
                onPress={() => navigation.navigate('DriverList', { carCity: car.city, carId: car.id, startDate: startDate.toISOString(), endDate: endDate.toISOString() })}
              >
                <Ionicons color="#3B63D4" name="person-add-outline" size={18} />
                <Text className="font-semibold text-brand-blue">{t('booking.driver_choose')}</Text>
              </TouchableOpacity>
            )
          ) : null}
        </View>

        <View className="gap-3">
          <Text className="font-semibold text-slate-800">{t('booking.payment_section')}</Text>
          <View className="flex-row gap-2">
            {PAYMENT_METHODS.map((method) => (
              <TouchableOpacity
                className={`flex-1 rounded-xl border px-4 py-3 ${paymentMethod === method ? 'border-brand-blue bg-blue-50' : 'border-slate-200 bg-white'}`}
                key={method}
                onPress={() => setPaymentMethod(method)}
              >
                <Text className={`text-center font-semibold ${paymentMethod === method ? 'text-brand-blue' : 'text-slate-600'}`}>
                  {method}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {!withDriver && (
          <View className="gap-3">
            <View>
              <Text className="font-semibold text-slate-800">{t('booking.license_section')}</Text>
              <Text className="mt-1 text-xs text-slate-500">{t('booking.license_help')}</Text>
            </View>

            <LicenseInput
              label={t('booking.license_full_name')}
              onChangeText={(value) => updateDriverLicense('fullName', value)}
              placeholder="Ex: Jean Kamga"
              value={driverLicense.fullName}
            />
            <LicenseInput
              label={t('booking.license_number')}
              onChangeText={(value) => updateDriverLicense('licenseNumber', value)}
              placeholder="Ex: CE-123456789"
              value={driverLicense.licenseNumber}
            />
            <View className="flex-row gap-3">
              <View className="flex-1">
                <LicenseInput
                  label={t('booking.license_country_short')}
                  onChangeText={(value) => updateDriverLicense('issuingCountry', value)}
                  placeholder="Cameroun"
                  value={driverLicense.issuingCountry}
                />
              </View>
              <View className="w-24">
                <LicenseInput
                  label={t('booking.license_cat_short')}
                  onChangeText={(value) => updateDriverLicense('categories', value)}
                  placeholder="B"
                  value={driverLicense.categories}
                />
              </View>
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <DatePickerField
                  label={t('booking.license_issue_date')}
                  maximumDate={today}
                  onChange={(value) => updateDriverLicense('issueDate', value)}
                  placeholder="Ex: 03/06/2026"
                  value={driverLicense.issueDate}
                />
              </View>
              <View className="flex-1">
                <DatePickerField
                  label={t('booking.license_expire')}
                  minimumDate={today}
                  onChange={(value) => updateDriverLicense('expiryDate', value)}
                  placeholder="Ex: 03/06/2030"
                  value={driverLicense.expiryDate}
                />
              </View>
            </View>
          </View>
        )}

        <View
          className="rounded-xl bg-white p-4"
          style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}
        >
          <View className="flex-row justify-between">
            <Text className="text-slate-500">{t('booking.total_days')}</Text>
            <Text className="font-bold text-slate-950">
              {totalDays > 1 ? t('booking.duration_days_other', { count: totalDays }) : t('booking.duration_days_one', { count: totalDays })}
            </Text>
          </View>
          <View className="mt-2 flex-row justify-between">
            <Text className="text-slate-500">{t('booking.car_label')}</Text>
            <Text className="font-semibold text-slate-800">{formatFcfa(totalDays * car.pricePerDay)}</Text>
          </View>
          {withDriver && selectedDriver ? (
            <View className="mt-1 flex-row justify-between">
              <Text className="text-slate-500">{t('booking.driver_price')}</Text>
              <Text className="font-semibold text-slate-800">{formatFcfa(totalDays * driverPricePerDay)}</Text>
            </View>
          ) : null}
          <View className="mt-2 border-t border-slate-100 pt-3 flex-row justify-between">
            <Text className="font-semibold text-slate-700">{t('booking.total_price')}</Text>
            <Text className="text-xl font-black text-brand-blue">{formatFcfa(totalPrice)}</Text>
          </View>
          {depositAmount > 0 ? (
            <View className="mt-3 flex-row items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <Ionicons color="#D97706" name="shield-checkmark-outline" size={16} style={{ marginTop: 1 }} />
              <View className="flex-1">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-bold text-amber-800">{t('booking.deposit_label')}</Text>
                  <Text className="text-sm font-black text-amber-800">{formatFcfa(depositAmount)}</Text>
                </View>
                <Text className="mt-0.5 text-xs text-amber-700">{t('booking.deposit_note')}</Text>
              </View>
            </View>
          ) : null}
        </View>

        <PrimaryButton loading={loading} onPress={reserve}>{t('booking.confirm_cta')}</PrimaryButton>
      </View>
      <SuccessOverlay
        message={t('booking.created')}
        onDone={continueToPayment}
        visible={Boolean(nextPayment)}
      />
    </Screen>
  );
}
