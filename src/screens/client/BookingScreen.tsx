import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useMemo, useState } from 'react';
import { Alert, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { PAYMENT_METHODS } from '../../constants/cameroon';
import { BackButton } from '../../components/BackButton';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Screen } from '../../components/Screen';
import { createBooking } from '../../services/bookingService';
import { hasFirebaseConfig } from '../../services/firebase';
import { useAuthStore } from '../../store/authStore';
import type { PaymentMethod } from '../../types/models';
import type { BookingScreenProps } from '../../types/navigation';
import { formatFcfa } from '../../utils/currency';
import { formatDate, getRentalDays } from '../../utils/dates';

type DateField = 'start' | 'end';

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

const DATE_FORMAT_REGEX = /^\d{4}-\d{2}-\d{2}$/;

type LicenseInputProps = {
  label: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  value: string;
};

function LicenseInput({ label, onChangeText, placeholder, value }: LicenseInputProps) {
  return (
    <View className="gap-1.5">
      <Text className="text-xs font-semibold uppercase text-slate-500">{label}</Text>
      <TextInput
        autoCapitalize="words"
        className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-950"
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

  const totalDays = useMemo(() => getRentalDays(startDate, endDate), [endDate, startDate]);
  const totalPrice = totalDays * car.pricePerDay;

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

    if (!DATE_FORMAT_REGEX.test(normalized.issueDate) || !DATE_FORMAT_REGEX.test(normalized.expiryDate)) {
      Alert.alert('Dates invalides', 'Utilisez le format AAAA-MM-JJ pour les dates du permis.');
      return null;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiryDate = new Date(`${normalized.expiryDate}T00:00:00`);

    if (Number.isNaN(expiryDate.getTime()) || expiryDate < today) {
      Alert.alert('Permis expire', 'La reservation est refusee car le permis de conduire n est plus valide.');
      return null;
    }

    return normalized;
  };

  const reserve = async () => {
    if (!user) {
      Alert.alert('Session expirée', 'Reconnectez-vous pour réserver.');
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
      });

      navigation.navigate('Payment', {
        amount: totalPrice,
        bookingId: booking.id,
        paymentMethod,
      });
    } catch {
      Alert.alert('Erreur', 'La réservation n\'a pas pu être créée.');
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
    <Screen>
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
              className={`flex-1 rounded-xl border bg-white p-4 ${activeDateField === 'start' ? 'border-cameroonGreen' : 'border-slate-200'}`}
              onPress={() => setActiveDateField('start')}
            >
              <View className="flex-row items-center gap-1.5 mb-1">
                <Ionicons color="#94a3b8" name="calendar-outline" size={14} />
                <Text className="text-xs text-slate-500">Début</Text>
              </View>
              <Text className="font-bold text-slate-950">{formatDate(startDate)}</Text>
            </TouchableOpacity>

            <View className="items-center justify-center px-1">
              <Ionicons color="#94a3b8" name="arrow-forward-outline" size={18} />
            </View>

            <TouchableOpacity
              className={`flex-1 rounded-xl border bg-white p-4 ${activeDateField === 'end' ? 'border-cameroonGreen' : 'border-slate-200'}`}
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
              Minimum 1 jour · Début et fin le même jour comptent pour 1 jour
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

        <View className="gap-3">
          <Text className="font-semibold text-slate-800">Paiement Mobile Money</Text>
          <View className="flex-row gap-2">
            {PAYMENT_METHODS.map((method) => (
              <TouchableOpacity
                className={`flex-1 rounded-xl border px-4 py-3 ${
                  paymentMethod === method
                    ? 'border-cameroonGreen bg-green-50'
                    : 'border-slate-200 bg-white'
                }`}
                key={method}
                onPress={() => setPaymentMethod(method)}
              >
                <Text
                  className={`text-center font-semibold ${
                    paymentMethod === method ? 'text-cameroonGreen' : 'text-slate-600'
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
              Ces informations seront transmises au propriÃ©taire pour valider la location.
            </Text>
          </View>

          <LicenseInput
            label="Nom complet sur le permis"
            onChangeText={(value) => updateDriverLicense('fullName', value)}
            placeholder="Ex: Marie Menguene"
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
                label="Delivre le"
                onChangeText={(value) => updateDriverLicense('issueDate', value)}
                placeholder="AAAA-MM-JJ"
                value={driverLicense.issueDate}
              />
            </View>
            <View className="flex-1">
              <LicenseInput
                label="Expire le"
                onChangeText={(value) => updateDriverLicense('expiryDate', value)}
                placeholder="AAAA-MM-JJ"
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
            <Text className="text-slate-500">Durée</Text>
            <Text className="font-bold text-slate-950">
              {totalDays} jour{totalDays > 1 ? 's' : ''}
            </Text>
          </View>
          <View className="mt-1 border-t border-slate-100 pt-3 flex-row justify-between">
            <Text className="font-semibold text-slate-700">Total</Text>
            <Text className="text-xl font-black text-cameroonGreen">{formatFcfa(totalPrice)}</Text>
          </View>
        </View>

        <PrimaryButton loading={loading} onPress={reserve}>
          Confirmer la réservation
        </PrimaryButton>
      </View>
    </Screen>
  );
}
