import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useMemo, useState } from 'react';
import { Alert, Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BackButton } from '../../components/BackButton';
import { CitySearchInput } from '../../components/CitySearchInput';
import { DatePickerField } from '../../components/DatePickerField';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Screen } from '../../components/Screen';
import { registerWithEmail, updateUserProfile } from '../../services/authService';
import { uploadDriverProfilePhoto, uploadUserDocument } from '../../services/storageService';
import { useAuthStore } from '../../store/authStore';
import type { AppUser, CameroonCity, UserRole } from '../../types/models';
import type { RegisterScreenProps } from '../../types/navigation';
import { isValidCameroonPhone } from '../../utils/validation';

type DriverDocumentKey = 'profilePhoto' | 'nationalId' | 'nationalIdBack' | 'driverLicense' | 'criminalRecord';

async function pickImage(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Permission requise', "Autorisez l'accès aux photos.");
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    allowsEditing: true,
    mediaTypes: ['images' as const],
    quality: 0.8,
  });

  return result.canceled ? null : result.assets[0].uri;
}

export function RegisterScreen({ navigation }: RegisterScreenProps) {
  const { t } = useTranslation();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+237');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('client');
  const [city, setCity] = useState<CameroonCity>('Yaounde');
  const [experienceYears, setExperienceYears] = useState('');
  const [licenseCategories, setLicenseCategories] = useState('');
  const [licenseExpiryDate, setLicenseExpiryDate] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [nationalIdNumber, setNationalIdNumber] = useState('');
  const [pricePerDay, setPricePerDay] = useState('');
  const [driverDocuments, setDriverDocuments] = useState<Record<DriverDocumentKey, string | null>>({
    criminalRecord: null,
    driverLicense: null,
    nationalId: null,
    nationalIdBack: null,
    profilePhoto: null,
  });
  const [loading, setLoading] = useState(false);
  const setUser = useAuthStore((state) => state.setUser);
  const isIndependentDriver = role === 'driver';
  const minLicenseExpiryDate = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const roles: { label: string; value: UserRole; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
    { label: t('auth.role_client'), value: 'client', icon: 'person-outline' },
    { label: t('auth.role_owner'), value: 'owner', icon: 'car-outline' },
    { label: t('auth.role_driver_independent'), value: 'driver', icon: 'briefcase-outline' },
  ];

  const driverDocItems = [
    { key: 'profilePhoto' as const, label: t('driver.doc_profile_photo') },
    { key: 'nationalId' as const, label: t('driver.national_id_front') },
    { key: 'nationalIdBack' as const, label: t('driver.national_id_back') },
    { key: 'driverLicense' as const, label: t('driver.license') },
    { key: 'criminalRecord' as const, label: t('driver.doc_criminal_record') },
  ];

  const selectDriverDocument = async (key: DriverDocumentKey) => {
    const uri = await pickImage();
    if (!uri) return;
    setDriverDocuments((current) => ({ ...current, [key]: uri }));
  };

  const validateDriverProfile = () => {
    if (!isIndependentDriver) return true;

    const missingDocument = Object.values(driverDocuments).some((value) => !value);
    if (
      missingDocument ||
      !licenseNumber.trim() ||
      !licenseCategories.trim() ||
      !licenseExpiryDate.trim() ||
      !nationalIdNumber.trim() ||
      !pricePerDay.trim()
    ) {
      Alert.alert(t('auth.driver_profile_title'), t('auth.driver_profile_incomplete'));
      return false;
    }

    return true;
  };

  const buildIndependentDriverProfile = (): AppUser['driverProfile'] => ({
    blockedDates: [],
    experienceYears: Number(experienceYears) || 0,
    isAvailable: true,
    isIndependent: true,
    licenseCategories: licenseCategories.trim().toUpperCase(),
    licenseExpiryDate: licenseExpiryDate.trim(),
    licenseNumber: licenseNumber.trim(),
    nationalIdNumber: nationalIdNumber.trim(),
    pricePerDay: Number(pricePerDay) || 10000,
  });

  const register = async () => {
    if (!isValidCameroonPhone(phone)) {
      Alert.alert(t('auth.phone'), t('auth.phone_invalid'));
      return;
    }

    if (!validateDriverProfile()) return;

    try {
      setLoading(true);
      const user = await registerWithEmail({
        city,
        driverProfile: isIndependentDriver ? buildIndependentDriverProfile() : undefined,
        email,
        fullName,
        kycStatus: isIndependentDriver ? 'pending' : undefined,
        password,
        phone,
        role,
        status: isIndependentDriver ? 'pending_validation' : undefined,
      });

      if (!isIndependentDriver) {
        setUser(user);
        return;
      }

      const [profilePhotoUrl, nationalIdUrl, nationalIdBackUrl, driverLicenseUrl, criminalRecordUrl] = await Promise.all([
        uploadDriverProfilePhoto(user.id, driverDocuments.profilePhoto as string),
        uploadUserDocument(user.id, driverDocuments.nationalId as string, 'national-id-front'),
        uploadUserDocument(user.id, driverDocuments.nationalIdBack as string, 'national-id-back'),
        uploadUserDocument(user.id, driverDocuments.driverLicense as string, 'driver-license'),
        uploadUserDocument(user.id, driverDocuments.criminalRecord as string, 'criminal-record'),
      ]);

      const updatedUser: AppUser = {
        ...user,
        documents: {
          criminalRecordUrl,
          driverLicenseUrl,
          nationalIdBackUrl,
          nationalIdUrl,
          profilePhotoUrl,
        },
        driverProfile: {
          ...user.driverProfile,
          profilePhotoUrl,
        },
      };

      await updateUserProfile(user.id, {
        documents: updatedUser.documents,
        driverProfile: updatedUser.driverProfile,
      });
      setUser(updatedUser);
    } catch {
      Alert.alert(t('auth.register_title'), t('auth.register_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View className="gap-6 pt-8">
        <BackButton navigation={navigation} />
        <View>
          <Text className="text-3xl font-black text-slate-950">{t('auth.register_title')}</Text>
          <Text className="mt-2 text-base text-slate-600">{t('auth.register_subtitle')}</Text>
        </View>

        <View className="gap-4">
          <View className="gap-1.5">
            <Text className="text-sm font-semibold text-slate-700">{t('auth.full_name')}</Text>
            <TextInput
              className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-slate-950"
              onChangeText={setFullName}
              placeholder={t('auth.full_name_placeholder')}
              placeholderTextColor="#94a3b8"
              returnKeyType="next"
              value={fullName}
            />
          </View>

          <View className="gap-1.5">
            <Text className="text-sm font-semibold text-slate-700">{t('auth.email')}</Text>
            <TextInput
              autoCapitalize="none"
              className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-slate-950"
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder={t('auth.email_placeholder')}
              placeholderTextColor="#94a3b8"
              returnKeyType="next"
              value={email}
            />
          </View>

          <View className="gap-1.5">
            <Text className="text-sm font-semibold text-slate-700">{t('auth.phone')}</Text>
            <TextInput
              className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-slate-950"
              keyboardType="phone-pad"
              onChangeText={setPhone}
              placeholder={t('auth.phone_placeholder')}
              placeholderTextColor="#94a3b8"
              returnKeyType="next"
              value={phone}
            />
          </View>

          <CitySearchInput label={t('profile.city')} onSelectCity={setCity} value={city} />

          <View className="gap-1.5">
            <Text className="text-sm font-semibold text-slate-700">{t('auth.password')}</Text>
            <View className="relative">
              <TextInput
                className="h-12 rounded-xl border border-slate-200 bg-white px-4 pr-12 text-slate-950"
                onChangeText={setPassword}
                placeholder={t('auth.password_placeholder')}
                placeholderTextColor="#94a3b8"
                returnKeyType="done"
                secureTextEntry={!showPassword}
                value={password}
              />
              <TouchableOpacity
                className="absolute right-4 top-3"
                onPress={() => setShowPassword((value) => !value)}
              >
                <Ionicons
                  color="#94a3b8"
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View className="gap-3">
          <Text className="font-semibold text-slate-800">{t('auth.profile_section')}</Text>
          <View className="gap-2">
            {roles.map((item) => (
              <TouchableOpacity
                className={`flex-row items-center justify-center gap-2 rounded-xl border px-4 py-3 ${
                  role === item.value
                    ? 'border-brand-blue bg-blue-50'
                    : 'border-slate-200 bg-white'
                }`}
                key={item.value}
                onPress={() => setRole(item.value)}
              >
                <Ionicons
                  color={role === item.value ? '#3B63D4' : '#64748b'}
                  name={item.icon}
                  size={18}
                />
                <Text
                  className={`font-semibold ${
                    role === item.value ? 'text-brand-blue' : 'text-slate-600'
                  }`}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {isIndependentDriver ? (
          <View className="gap-4 rounded-2xl bg-white p-4">
            <View>
              <Text className="text-base font-black text-slate-950">{t('auth.driver_profile_title')}</Text>
              <Text className="mt-1 text-xs text-slate-500">{t('auth.driver_validation_notice')}</Text>
            </View>

            <View className="flex-row flex-wrap gap-3">
              {driverDocItems.map((item) => {
                const uri = driverDocuments[item.key];
                return (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    key={item.key}
                    onPress={() => selectDriverDocument(item.key)}
                    style={{ width: '47%' }}
                  >
                    <View className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                      {uri ? (
                        <Image className="h-24 w-full" resizeMode="cover" source={{ uri }} />
                      ) : (
                        <View className="h-24 items-center justify-center">
                          <Ionicons color="#94a3b8" name="cloud-upload-outline" size={24} />
                        </View>
                      )}
                      <View className="flex-row items-center justify-between px-2 py-1.5">
                        <Text className="text-xs font-bold text-slate-600">{item.label}</Text>
                        {uri ? <Ionicons color="#3B63D4" name="checkmark-circle" size={14} /> : null}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TextInput
              className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-slate-950"
              onChangeText={setLicenseNumber}
              placeholder={t('driver.license_number_placeholder')}
              placeholderTextColor="#94a3b8"
              value={licenseNumber}
            />
            <TextInput
              className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-slate-950"
              onChangeText={setLicenseCategories}
              placeholder={t('driver.license_categories_placeholder')}
              placeholderTextColor="#94a3b8"
              value={licenseCategories}
            />
            <DatePickerField
              label={t('driver.license_expiry')}
              minimumDate={minLicenseExpiryDate}
              onChange={setLicenseExpiryDate}
              placeholder={t('common.date_placeholder')}
              value={licenseExpiryDate}
            />
            <TextInput
              className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-slate-950"
              onChangeText={setNationalIdNumber}
              placeholder={t('driver.national_id_number')}
              placeholderTextColor="#94a3b8"
              value={nationalIdNumber}
            />
            <TextInput
              className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-slate-950"
              keyboardType="numeric"
              onChangeText={setExperienceYears}
              placeholder={t('driver.experience_placeholder')}
              placeholderTextColor="#94a3b8"
              value={experienceYears}
            />
            <TextInput
              className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-slate-950"
              keyboardType="numeric"
              onChangeText={setPricePerDay}
              placeholder={t('driver.price_per_day_placeholder')}
              placeholderTextColor="#94a3b8"
              value={pricePerDay}
            />
          </View>
        ) : null}

        <PrimaryButton disabled={!fullName || !email || !password} loading={loading} onPress={register}>
          {t('auth.register_cta_short')}
        </PrimaryButton>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text className="text-center font-semibold text-brand-blue">{t('auth.already_have_account')}</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}
