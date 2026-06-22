import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useMemo, useState } from 'react';
import { Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { KeyboardTypeOptions } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CitySearchInput } from '../../components/CitySearchInput';
import { DatePickerField } from '../../components/DatePickerField';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Screen } from '../../components/Screen';
import { useToast } from '../../components/ui';
import { hapticError, hapticSuccess, hapticWarning } from '../../utils/haptics';
import { CAR_PHOTO_SLOTS } from '../../constants/cameroon';
import { useAuth } from '../../hooks/useAuth';
import { createCar } from '../../services/carService';
import { hasFirebaseConfig } from '../../services/firebase';
import { uploadCarDocument, uploadCarImage } from '../../services/storageService';
import type { CameroonCity } from '../../types/models';

type CarInputProps = {
  keyboardType?: KeyboardTypeOptions;
  label: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  value: string;
};

function CarInput({ keyboardType, label, onChangeText, placeholder, value }: CarInputProps) {
  return (
    <View className="gap-1.5">
      <Text className="text-xs font-semibold uppercase text-slate-500">{label}</Text>
      <TextInput
        className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-slate-950"
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        value={value}
      />
    </View>
  );
}

async function pickPhoto(): Promise<{ uri: string | null; permissionDenied: boolean }> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return { uri: null, permissionDenied: true };

  const result = await ImagePicker.launchImageLibraryAsync({
    allowsEditing: true,
    aspect: [4, 3],
    mediaTypes: ['images' as const],
    quality: 0.8,
  });

  return { uri: result.canceled ? null : result.assets[0].uri, permissionDenied: false };
}

export function AddCarScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const toast = useToast();
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [pricePerDay, setPricePerDay] = useState('');
  const [city, setCity] = useState<CameroonCity>('Yaounde');
  const [seats, setSeats] = useState('');
  const [transmission, setTransmission] = useState<'Automatique' | 'Manuelle'>('Automatique');
  const [fuelType, setFuelType] = useState<'Essence' | 'Diesel' | 'Hybride' | 'Electrique'>('Essence');
  const [description, setDescription] = useState('');
  const [photoUris, setPhotoUris] = useState<(string | null)[]>(Array(6).fill(null));
  const [registrationDocumentUri, setRegistrationDocumentUri] = useState<string | null>(null);
  const [licensePlate, setLicensePlate] = useState('');
  const [chassisNumber, setChassisNumber] = useState('');
  const [mileage, setMileage] = useState('');
  const [insuranceExpiry, setInsuranceExpiry] = useState('');
  const [technicalInspectionExpiry, setTechnicalInspectionExpiry] = useState('');
  const [allowIndependentDrivers, setAllowIndependentDrivers] = useState(false);
  const [loading, setLoading] = useState(false);
  const minDocumentDate = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const transmissionLabels: Record<'Automatique' | 'Manuelle', string> = {
    Automatique: t('car.transmission_auto'),
    Manuelle: t('car.transmission_manual'),
  };

  const fuelLabels: Record<'Essence' | 'Diesel' | 'Hybride' | 'Electrique', string> = {
    Essence: t('car.fuel_essence'),
    Diesel: t('car.fuel_diesel'),
    Hybride: t('car.fuel_hybrid'),
    Electrique: t('car.fuel_electric'),
  };

  const handlePickPhoto = async (index: number) => {
    const result = await pickPhoto();
    if (result.permissionDenied) { toast.info(t('car.photo_permission')); return; }
    const { uri } = result;
    if (!uri) return;

    setPhotoUris((prev) => {
      const next = [...prev];
      next[index] = uri;
      return next;
    });
  };

  const pickRegistrationDocument = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      toast.info(t('car.reg_doc_permission'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      mediaTypes: ['images' as const],
      quality: 0.8,
    });

    if (!result.canceled) setRegistrationDocumentUri(result.assets[0].uri);
  };

  const resetForm = () => {
    setBrand('');
    setModel('');
    setYear('');
    setPricePerDay('');
    setSeats('');
    setTransmission('Automatique');
    setFuelType('Essence');
    setDescription('');
    setPhotoUris(Array(6).fill(null));
    setRegistrationDocumentUri(null);
    setLicensePlate('');
    setChassisNumber('');
    setMileage('');
    setInsuranceExpiry('');
    setTechnicalInspectionExpiry('');
    setAllowIndependentDrivers(false);
  };

  const submit = async () => {
    if (!user) return;

    if (photoUris.some((uri) => !uri)) {
      hapticWarning(); toast.warning(t('car.photos_all_required'));
      return;
    }

    const numericYear = Number(year);
    const numericSeats = Number(seats);
    const numericPrice = Number(pricePerDay);

    if (!brand.trim() || !model.trim() || !description.trim()) {
      hapticWarning(); toast.warning(t('car.brand_model_required'));
      return;
    }

    if (!Number.isInteger(numericYear) || numericYear < 1990 || numericYear > new Date().getFullYear() + 1) {
      hapticWarning(); toast.warning(t('car.year_invalid'));
      return;
    }

    if (!Number.isInteger(numericSeats) || numericSeats < 2 || numericSeats > 9) {
      hapticWarning(); toast.warning(t('car.seats_invalid'));
      return;
    }

    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      hapticWarning(); toast.warning(t('car.price_invalid'));
      return;
    }

    try {
      setLoading(true);

      if (!hasFirebaseConfig) {
        toast.info(t('car.demo_notice'));
        resetForm();
        return;
      }

      const uploadedUrls = await Promise.all(
        photoUris.map((uri) => (uri ? uploadCarImage(user.id, uri) : Promise.resolve(null))),
      );
      const imageUrls = uploadedUrls.filter((url): url is string => url !== null);
      const imageUrl = imageUrls[0];

      const registrationDocumentUrl = registrationDocumentUri
        ? await uploadCarDocument(user.id, registrationDocumentUri, 'registration-document')
        : undefined;

      await createCar({
        ownerId: user.id,
        brand: brand.trim(),
        model: model.trim(),
        year: numericYear,
        city,
        pricePerDay: numericPrice,
        imageUrl,
        imageUrls,
        seats: numericSeats,
        transmission,
        fuelType,
        isAvailable: false,
        description: description.trim(),
        adminStatus: 'pending_review',
        documentsVerified: false,
        allowIndependentDrivers,
        technicalSheet: {
          licensePlate: licensePlate.trim(),
          chassisNumber: chassisNumber.trim(),
          mileage: Number(mileage) || 0,
          insuranceExpiry: insuranceExpiry.trim(),
          technicalInspectionExpiry: technicalInspectionExpiry.trim(),
          registrationDocumentUrl,
        },
      });

      hapticSuccess(); toast.success(t('car.add_success'));
      resetForm();
    } catch {
      hapticError(); toast.error(t('car.add_error'));
    } finally {
      setLoading(false);
    }
  };

  const filledCount = photoUris.filter(Boolean).length;

  return (
    <Screen>
      <View className="gap-5 pt-4">
        <Text className="text-2xl font-black text-slate-950">{t('car.add_title')}</Text>

        <View className="gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="font-bold text-slate-950">{t('car.photos_section')}</Text>
            <Text
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                filledCount === 6 ? 'bg-blue-50 text-brand-blue' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {filledCount}/6
            </Text>
          </View>
          <Text className="text-xs text-slate-400">{t('car.photos_warning')}</Text>

          <View className="flex-row flex-wrap gap-3">
            {CAR_PHOTO_SLOTS.map((slot, index) => {
              const uri = photoUris[index];
              const isRequired = index === 0;

              return (
                <TouchableOpacity
                  activeOpacity={0.8}
                  key={slot.key}
                  onPress={() => handlePickPhoto(index)}
                  style={{ width: '47%' }}
                >
                  <View
                    className="overflow-hidden rounded-xl"
                    style={{
                      borderWidth: 1.5,
                      borderColor: uri ? '#bfdbfe' : isRequired ? '#fde68a' : '#e2e8f0',
                      backgroundColor: uri ? undefined : '#f8fafc',
                    }}
                  >
                    {uri ? (
                      <Image className="h-28 w-full" resizeMode="cover" source={{ uri }} />
                    ) : (
                      <View className="h-28 items-center justify-center gap-1.5">
                        <Ionicons color={isRequired ? '#ca8a04' : '#94a3b8'} name="camera-outline" size={24} />
                      </View>
                    )}
                    <View
                      className="flex-row items-center justify-between px-2.5 py-1.5"
                      style={{ backgroundColor: uri ? 'rgba(0,0,0,0.45)' : '#f1f5f9', marginTop: uri ? -36 : 0 }}
                    >
                      <Text
                        className="text-xs font-bold"
                        style={{ color: uri ? 'white' : isRequired ? '#ca8a04' : '#64748b' }}
                      >
                        {slot.label}
                      </Text>
                      {isRequired && !uri ? <Text className="text-xs font-semibold text-amber-600">{t('common.required')}</Text> : null}
                      {uri ? <Ionicons color="white" name="checkmark-circle" size={14} /> : null}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View className="gap-3">
          <Text className="text-base font-black text-slate-950">{t('car.main_info')}</Text>
          <CarInput label={t('car.brand')} onChangeText={setBrand} placeholder="Ex: Toyota" value={brand} />
          <CarInput label={t('car.model')} onChangeText={setModel} placeholder="Ex: Corolla" value={model} />
          <CarInput keyboardType="numeric" label={t('car.year')} onChangeText={setYear} placeholder="Ex: 2021" value={year} />
          <CitySearchInput label={t('car.city_label')} onSelectCity={setCity} value={city} />
          <CarInput
            keyboardType="numeric"
            label={t('car.price_label')}
            onChangeText={setPricePerDay}
            placeholder={t('car.price_placeholder')}
            value={pricePerDay}
          />
          <CarInput keyboardType="numeric" label={t('car.seats_label')} onChangeText={setSeats} placeholder={t('car.seats_placeholder')} value={seats} />

          <View className="gap-1.5">
            <Text className="text-xs font-semibold uppercase text-slate-500">{t('car.gearbox_label')}</Text>
            <View className="flex-row gap-2">
              {(['Automatique', 'Manuelle'] as const).map((option) => (
                <TouchableOpacity
                  activeOpacity={0.85}
                  className={`flex-1 rounded-xl border py-3 ${transmission === option ? 'border-brand-blue bg-blue-50' : 'border-slate-200 bg-white'}`}
                  key={option}
                  onPress={() => setTransmission(option)}
                >
                  <Text className={`text-center font-bold ${transmission === option ? 'text-brand-blue' : 'text-slate-600'}`}>{transmissionLabels[option]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View className="gap-1.5">
            <Text className="text-xs font-semibold uppercase text-slate-500">{t('car.fuel_label')}</Text>
            <View className="flex-row flex-wrap gap-2">
              {(['Essence', 'Diesel', 'Hybride', 'Electrique'] as const).map((option) => (
                <TouchableOpacity
                  activeOpacity={0.85}
                  className={`rounded-xl border px-4 py-2.5 ${fuelType === option ? 'border-brand-blue bg-blue-50' : 'border-slate-200 bg-white'}`}
                  key={option}
                  onPress={() => setFuelType(option)}
                >
                  <Text className={`font-bold ${fuelType === option ? 'text-brand-blue' : 'text-slate-600'}`}>{fuelLabels[option]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View className="gap-1.5">
            <Text className="text-xs font-semibold uppercase text-slate-500">{t('car.description')}</Text>
            <TextInput
              className="min-h-24 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-950"
              maxLength={500}
              multiline
              onChangeText={setDescription}
              placeholder={t('car.description_placeholder')}
              placeholderTextColor="#94a3b8"
              textAlignVertical="top"
              value={description}
            />
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            className={`flex-row items-center gap-3 rounded-2xl border p-4 ${
              allowIndependentDrivers ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-white'
            }`}
            onPress={() => setAllowIndependentDrivers((value) => !value)}
          >
            <View
              className={`h-6 w-6 items-center justify-center rounded-full ${
                allowIndependentDrivers ? 'bg-brand-blue' : 'bg-slate-100'
              }`}
            >
              {allowIndependentDrivers ? <Ionicons color="white" name="checkmark" size={16} /> : null}
            </View>
            <View className="flex-1">
              <Text className="font-bold text-slate-950">{t('car.allow_independent_drivers')}</Text>
              <Text className="mt-1 text-xs text-slate-500">{t('car.allow_independent_drivers_desc')}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View
          className="gap-3 rounded-2xl bg-white p-4"
          style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}
        >
          <Text className="text-base font-black text-slate-950">{t('car.technical_sheet')}</Text>
          <CarInput label={t('car.plate_label')} onChangeText={setLicensePlate} placeholder="Ex: LT-123-AB" value={licensePlate} />
          <CarInput
            label={t('car.chassis_label')}
            onChangeText={setChassisNumber}
            placeholder="Ex: JTDBR32E720012345"
            value={chassisNumber}
          />
          <CarInput keyboardType="numeric" label={t('car.mileage_label')} onChangeText={setMileage} placeholder="Ex: 85000" value={mileage} />
          <DatePickerField
            label={t('car.insurance_expiry_label')}
            minimumDate={minDocumentDate}
            onChange={setInsuranceExpiry}
            placeholder="Ex: 03/06/2027"
            value={insuranceExpiry}
          />
          <DatePickerField
            label={t('car.inspection_expiry_label')}
            minimumDate={minDocumentDate}
            onChange={setTechnicalInspectionExpiry}
            placeholder="Ex: 03/06/2027"
            value={technicalInspectionExpiry}
          />
          <TouchableOpacity
            activeOpacity={0.8}
            className={`flex-row items-center gap-2 rounded-xl border p-3.5 ${registrationDocumentUri ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-slate-50'}`}
            onPress={pickRegistrationDocument}
          >
            <Ionicons
              color={registrationDocumentUri ? '#3B63D4' : '#64748b'}
              name={registrationDocumentUri ? 'checkmark-circle-outline' : 'document-outline'}
              size={18}
            />
            <Text className={`font-semibold ${registrationDocumentUri ? 'text-brand-blue' : 'text-slate-600'}`}>
              {registrationDocumentUri ? t('car.reg_doc_added') : t('car.reg_doc_add')}
            </Text>
          </TouchableOpacity>
        </View>

        <PrimaryButton
          disabled={
            !brand ||
            !model ||
            !year ||
            !city ||
            !pricePerDay ||
            !seats ||
            !description ||
            (hasFirebaseConfig && photoUris.some((uri) => !uri))
          }
          loading={loading}
          onPress={submit}
        >
          {t('car.publish_cta')}
        </PrimaryButton>
      </View>
    </Screen>
  );
}
