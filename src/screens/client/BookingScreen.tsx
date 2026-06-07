import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { KeyboardTypeOptions } from 'react-native';

import { PAYMENT_METHODS } from '../../constants/cameroon';
import { BackButton } from '../../components/BackButton';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Screen } from '../../components/Screen';
import { createBooking } from '../../services/bookingService';
import { hasFirebaseConfig } from '../../services/firebase';
import { useAuthStore } from '../../store/authStore';
import { useBookingDraftStore } from '../../store/bookingDraftStore';
import type { PaymentMethod } from '../../types/models';
import type { BookingScreenProps } from '../../types/navigation';
import { formatFcfa } from '../../utils/currency';
import { formatDate, formatInputDate, getRentalDays, parseHumanDate } from '../../utils/dates';

type DateField = 'start' | 'end';

const TEXT = {
  bookingError: "La r\u00e9servation n'a pas pu \u00eatre cr\u00e9\u00e9e.",
  bookingSubmit: 'Confirmer la r\u00e9servation',
  dateInfo: 'Minimum 1 jour \u00b7 D\u00e9but et fin le m\u00eame jour comptent pour 1 jour',
  duration: 'Dur\u00e9e',
  issueDate: 'D\u00e9livr\u00e9 le',
  licenseHelp: 'Ces informations seront transmises au propri\u00e9taire pour valider la location.',
  sessionExpired: 'Session expir\u00e9e',
  start: 'D\u00e9but',
};

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

export function BookingScreen({ navigation, route }: BookingScreenProps) {
  const { car } = route.params;
  const user = useAuthStore((state) => state.user);
  const { selectedDriver, clearDriver } = useBookingDraftStore();
  const [withDriver, setWithDriver] = useState(false);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [activeDateField, setActiveDateField] = useState<DateField | null>(null);
  const [driverLicense, setDriverLicense] = useState<DriverLicenseForm>(INITIAL_DRIVER_LICENSE);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('MTN MoMo');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => { clearDriver(); };
  }, [clearDriver]);

  const totalDays = useMemo(() => getRentalDays(startDate, endDate), [endDate, startDate]);
  const driverPricePerDay = selectedDriver?.driverProfile?.pricePerDay ?? 10000;
  const totalPrice = totalDays * car.pricePerDay + (withDriver && selectedDriver ? totalDays * driverPricePerDay : 0);

  const updateDriverLicense = (field: keyof DriverLicenseForm, value: string) => {
    setDriverLicense((current) => ({ ...current, [field]: value }));
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
      Alert.alert('Permis requis', 'Renseignez toutes les informations du permis de conduire.');
      return null;
    }

    if (normalized.licenseNumber.length < 5) {
      Alert.alert('Permis invalide', 'Le numero du permis doit contenir au moins 5 caracteres.');
      return null;
    }

    const issueDate = parseHumanDate(normalized.issueDate);
    const expiryDate = parseHumanDate(normalized.expiryDate);

    if (!issueDate || !expiryDate) {
      Alert.alert('Dates invalides', 'Utilisez un format comme 03/06/2026 ou 3 juin 2026.');
      return null;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (expiryDate < today) {
      Alert.alert('Permis expire', 'La reservation est refusee car le permis de conduire n est plus valide.');
      return null;
    }

    return {
      ...normalized,
      issueDate: formatInputDate(issueDate),
      expiryDate: formatInputDate(expiryDate),
    };
  };

  const reserve = async () => {
    if (!user) {
      Alert.alert(TEXT.sessionExpired, 'Reconnectez-vous pour reserver.');
      return;
    }

    const validatedDriverLicense = validateDriverLicense();
    if (!validatedDriverLicense) return;

    try {
      setLoading(true);
      if (!hasFirebaseConfig) {
        navigation.navigate('Payment', {
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
        paymentMethod,
        startDate,
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

      navigation.navigate('Payment', {
        amount: booking.totalPrice,
        bookingId: booking.id,
        paymentMethod,
      });
    } catch (error) {
      Alert.alert('Erreur', error instanceof Error ? error.message : TEXT.bookingError);
    } finally {
      setLoading(false);
    }
  };

  const onDateSelected = (date?: Date) => {
    if (!date || !activeDateField) {
      setActiveDateField(null);
      return;
    }

    if (activeDateField === 'start') {
      setStartDate(date);
      if (date > endDate) setEndDate(date);
    } else {
      setEndDate(date < startDate ? startDate : date);
    }

    if (Platform.OS !== 'ios') setActiveDateField(null);
  };

  return (
    <Screen topSafeArea>
      <View className="gap-6">
        <BackButton navigation={navigation} />

        <View>
          <Text className="text-2xl font-black text-slate-950">
            {car.brand} {car.model}
          </Text>
          <Text className="mt-1 text-slate-500">{formatFcfa(car.pricePerDay)} par jour</Text>
        </View>

        <View className="gap-3">
          <Text className="font-semibold text-slate-800">Dates de location</Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              className={`flex-1 rounded-xl border bg-white p-4 ${activeDateField === 'start' ? 'border-brand-blue' : 'border-slate-200'}`}
              onPress={() => setActiveDateField('start')}
            >
              <View className="flex-row items-center gap-1.5 mb-1">
                <Ionicons color="#94a3b8" name="calendar-outline" size={14} />
                <Text className="text-xs text-slate-500">{TEXT.start}</Text>
              </View>
              <Text className="font-bold text-slate-950">{formatDate(startDate)}</Text>
            </TouchableOpacity>

            <View className="items-center justify-center px-1">
              <Ionicons color="#94a3b8" name="arrow-forward-outline" size={18} />
            </View>

            <TouchableOpacity
              className={`flex-1 rounded-xl border bg-white p-4 ${activeDateField === 'end' ? 'border-brand-blue' : 'border-slate-200'}`}
              onPress={() => setActiveDateField('end')}
            >
              <View className="flex-row items-center gap-1.5 mb-1">
                <Ionicons color="#94a3b8" name="calendar-outline" size={14} />
                <Text className="text-xs text-slate-500">Fin</Text>
              </View>
              <Text className="font-bold text-slate-950">{formatDate(endDate)}</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2">
            <Ionicons color="#3b82f6" name="information-circle-outline" size={16} />
            <Text className="text-xs text-blue-600">
              {TEXT.dateInfo}
            </Text>
          </View>
        </View>

        {activeDateField ? (
          <DateTimePicker
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            minimumDate={activeDateField === 'end' ? startDate : today}
            mode="date"
            onChange={(_, date) => onDateSelected(date)}
            value={activeDateField === 'start' ? startDate : endDate}
          />
        ) : null}

        {/* ─── Avec / sans chauffeur ─── */}
        <View className="gap-3">
          <Text className="font-semibold text-slate-800">Chauffeur</Text>
          <View className="flex-row gap-2">
            <TouchableOpacity
              className={`flex-1 flex-row items-center justify-center gap-2 rounded-xl border py-3 ${!withDriver ? 'border-brand-blue bg-blue-50' : 'border-slate-200 bg-white'}`}
              onPress={() => { setWithDriver(false); clearDriver(); }}
            >
              <Ionicons color={!withDriver ? '#3B63D4' : '#94a3b8'} name="person-outline" size={16} />
              <Text className={`font-semibold ${!withDriver ? 'text-brand-blue' : 'text-slate-500'}`}>Sans chauffeur</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 flex-row items-center justify-center gap-2 rounded-xl border py-3 ${withDriver ? 'border-brand-blue bg-blue-50' : 'border-slate-200 bg-white'}`}
              onPress={() => setWithDriver(true)}
            >
              <Ionicons color={withDriver ? '#3B63D4' : '#94a3b8'} name="people-outline" size={16} />
              <Text className={`font-semibold ${withDriver ? 'text-brand-blue' : 'text-slate-500'}`}>Avec chauffeur</Text>
            </TouchableOpacity>
          </View>

          {withDriver ? (
            selectedDriver ? (
              <View
                className="flex-row items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3"
              >
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
                      ? `${selectedDriver.driverProfile.experienceYears} ans d'expérience`
                      : 'Chauffeur certifié'}
                    {selectedDriver.ratingAverage ? ` · ★ ${selectedDriver.ratingAverage}/5` : ''}
                  </Text>
                  <Text className="mt-0.5 text-xs font-semibold text-brand-blue">
                    +{formatFcfa(driverPricePerDay)}/jour
                  </Text>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('DriverList', { carCity: car.city, carId: car.id, startDate: startDate.toISOString(), endDate: endDate.toISOString() })}>
                  <Text className="text-xs font-bold text-brand-blue">Changer</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                activeOpacity={0.85}
                className="flex-row items-center justify-center gap-2 rounded-xl border border-dashed border-brand-blue bg-blue-50 py-4"
                onPress={() => navigation.navigate('DriverList', { carCity: car.city, carId: car.id, startDate: startDate.toISOString(), endDate: endDate.toISOString() })}
              >
                <Ionicons color="#3B63D4" name="person-add-outline" size={18} />
                <Text className="font-semibold text-brand-blue">Choisir un chauffeur</Text>
              </TouchableOpacity>
            )
          ) : null}
        </View>

        <View className="gap-3">
          <Text className="font-semibold text-slate-800">Paiement Mobile Money</Text>
          <View className="flex-row gap-2">
            {PAYMENT_METHODS.map((method) => (
              <TouchableOpacity
                className={`flex-1 rounded-xl border px-4 py-3 ${
                  paymentMethod === method
                    ? 'border-brand-blue bg-blue-50'
                    : 'border-slate-200 bg-white'
                }`}
                key={method}
                onPress={() => setPaymentMethod(method)}
              >
                <Text
                  className={`text-center font-semibold ${
                    paymentMethod === method ? 'text-brand-blue' : 'text-slate-600'
                  }`}
                >
                  {method}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="gap-3">
          <View>
            <Text className="font-semibold text-slate-800">Permis de conduire</Text>
            <Text className="mt-1 text-xs text-slate-500">
              {TEXT.licenseHelp}
            </Text>
          </View>

          <LicenseInput
            label="Nom complet sur le permis"
            onChangeText={(value) => updateDriverLicense('fullName', value)}
            placeholder="Ex: Jean Kamga"
            value={driverLicense.fullName}
          />

          <LicenseInput
            label="Numero du permis"
            onChangeText={(value) => updateDriverLicense('licenseNumber', value)}
            placeholder="Ex: CE-123456789"
            value={driverLicense.licenseNumber}
          />

          <View className="flex-row gap-3">
            <View className="flex-1">
              <LicenseInput
                label="Pays"
                onChangeText={(value) => updateDriverLicense('issuingCountry', value)}
                placeholder="Cameroun"
                value={driverLicense.issuingCountry}
              />
            </View>
            <View className="w-24">
              <LicenseInput
                label="Cat."
                onChangeText={(value) => updateDriverLicense('categories', value)}
                placeholder="B"
                value={driverLicense.categories}
              />
            </View>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <LicenseInput
                keyboardType="number-pad"
                label={TEXT.issueDate}
                maxLength={10}
                onChangeText={(value) => updateDriverLicense('issueDate', formatLicenseDateInput(value))}
                placeholder="Ex: 03/06/2026"
                value={driverLicense.issueDate}
              />
            </View>
            <View className="flex-1">
              <LicenseInput
                keyboardType="number-pad"
                label="Expire le"
                maxLength={10}
                onChangeText={(value) => updateDriverLicense('expiryDate', formatLicenseDateInput(value))}
                placeholder="Ex: 03/06/2030"
                value={driverLicense.expiryDate}
              />
            </View>
          </View>
        </View>

        <View
          className="rounded-xl bg-white p-4"
          style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}
        >
          <View className="flex-row justify-between">
            <Text className="text-slate-500">{TEXT.duration}</Text>
            <Text className="font-bold text-slate-950">
              {totalDays} jour{totalDays > 1 ? 's' : ''}
            </Text>
          </View>
          <View className="mt-2 flex-row justify-between">
            <Text className="text-slate-500">Véhicule</Text>
            <Text className="font-semibold text-slate-800">{formatFcfa(totalDays * car.pricePerDay)}</Text>
          </View>
          {withDriver && selectedDriver ? (
            <View className="mt-1 flex-row justify-between">
              <Text className="text-slate-500">Chauffeur</Text>
              <Text className="font-semibold text-slate-800">{formatFcfa(totalDays * driverPricePerDay)}</Text>
            </View>
          ) : null}
          <View className="mt-2 border-t border-slate-100 pt-3 flex-row justify-between">
            <Text className="font-semibold text-slate-700">Total</Text>
            <Text className="text-xl font-black text-brand-blue">{formatFcfa(totalPrice)}</Text>
          </View>
        </View>

        <PrimaryButton loading={loading} onPress={reserve}>{TEXT.bookingSubmit}</PrimaryButton>
      </View>
    </Screen>
  );
}
