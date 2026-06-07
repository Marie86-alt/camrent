import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Image, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { BackButton } from '../../components/BackButton';
import { CitySearchInput } from '../../components/CitySearchInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Screen } from '../../components/Screen';
import { registerWithEmail, updateUserProfile } from '../../services/authService';
import { uploadDriverProfilePhoto, uploadUserDocument } from '../../services/storageService';
import { useAuthStore } from '../../store/authStore';
import type { AppUser, CameroonCity, UserRole } from '../../types/models';
import type { RegisterScreenProps } from '../../types/navigation';
import { isValidCameroonPhone } from '../../utils/validation';

const roles: { label: string; value: UserRole; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { label: 'Client', value: 'client', icon: 'person-outline' },
  { label: 'Propriétaire', value: 'owner', icon: 'car-outline' },
  { label: 'Chauffeur indépendant', value: 'driver', icon: 'briefcase-outline' },
];

type DriverDocumentKey = 'profilePhoto' | 'nationalId' | 'nationalIdBack' | 'driverLicense';

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
    driverLicense: null,
    nationalId: null,
    nationalIdBack: null,
    profilePhoto: null,
  });
  const [loading, setLoading] = useState(false);
  const setUser = useAuthStore((state) => state.setUser);
  const isIndependentDriver = role === 'driver';

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
      Alert.alert(
        'Profil chauffeur incomplet',
        'Ajoutez la photo, la CNI recto/verso, le permis et les informations chauffeur.',
      );
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
      Alert.alert(
        'Numéro invalide',
        'Utilisez un numéro camerounais au format +237XXXXXXXXX.',
      );
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

      const [profilePhotoUrl, nationalIdUrl, nationalIdBackUrl, driverLicenseUrl] = await Promise.all([
        uploadDriverProfilePhoto(user.id, driverDocuments.profilePhoto as string),
        uploadUserDocument(user.id, driverDocuments.nationalId as string, 'national-id-front'),
        uploadUserDocument(user.id, driverDocuments.nationalIdBack as string, 'national-id-back'),
        uploadUserDocument(user.id, driverDocuments.driverLicense as string, 'driver-license'),
      ]);

      const updatedUser: AppUser = {
        ...user,
        documents: {
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
      Alert.alert('Inscription impossible', 'Vérifiez les informations et réessayez.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View className="gap-6 pt-8">
        <BackButton navigation={navigation} />
        <View>
          <Text className="text-3xl font-black text-slate-950">Créer un compte</Text>
          <Text className="mt-2 text-base text-slate-600">
            Rejoignez Autofix Pro comme client, propriétaire ou chauffeur indépendant.
          </Text>
        </View>

        <View className="gap-4">
          <View className="gap-1.5">
            <Text className="text-sm font-semibold text-slate-700">Nom complet</Text>
            <TextInput
              className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-slate-950"
              onChangeText={setFullName}
              placeholder="Jean Dupont"
              placeholderTextColor="#94a3b8"
              returnKeyType="next"
              value={fullName}
            />
          </View>

          <View className="gap-1.5">
            <Text className="text-sm font-semibold text-slate-700">Adresse email</Text>
            <TextInput
              autoCapitalize="none"
              className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-slate-950"
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="exemple@email.com"
              placeholderTextColor="#94a3b8"
              returnKeyType="next"
              value={email}
            />
          </View>

          <View className="gap-1.5">
            <Text className="text-sm font-semibold text-slate-700">Téléphone</Text>
            <TextInput
              className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-slate-950"
              keyboardType="phone-pad"
              onChangeText={setPhone}
              placeholder="+237 6XX XXX XXX"
              placeholderTextColor="#94a3b8"
              returnKeyType="next"
              value={phone}
            />
          </View>

          <View className="gap-1.5">
            <Text className="text-sm font-semibold text-slate-700">Mot de passe</Text>
            <View className="relative">
              <TextInput
                className="h-12 rounded-xl border border-slate-200 bg-white px-4 pr-12 text-slate-950"
                onChangeText={setPassword}
                placeholder="Mot de passe"
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
          <Text className="font-semibold text-slate-800">Profil</Text>
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

        <CitySearchInput label="Ville" onSelectCity={setCity} value={city} />

        {isIndependentDriver ? (
          <View className="gap-4 rounded-2xl bg-white p-4">
            <View>
              <Text className="text-base font-black text-slate-950">Profil chauffeur indépendant</Text>
              <Text className="mt-1 text-xs text-slate-500">
                Votre compte sera soumis à validation admin avant d'apparaître aux clients.
              </Text>
            </View>

            <View className="flex-row flex-wrap gap-3">
              {[
                { key: 'profilePhoto' as const, label: 'Photo profil' },
                { key: 'nationalId' as const, label: 'CNI recto' },
                { key: 'nationalIdBack' as const, label: 'CNI verso' },
                { key: 'driverLicense' as const, label: 'Permis' },
              ].map((item) => {
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
              placeholder="Numéro de permis"
              placeholderTextColor="#94a3b8"
              value={licenseNumber}
            />
            <TextInput
              className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-slate-950"
              onChangeText={setLicenseCategories}
              placeholder="Catégories du permis, ex: B"
              placeholderTextColor="#94a3b8"
              value={licenseCategories}
            />
            <TextInput
              className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-slate-950"
              onChangeText={setLicenseExpiryDate}
              placeholder="Expiration permis, ex: 03/06/2027"
              placeholderTextColor="#94a3b8"
              value={licenseExpiryDate}
            />
            <TextInput
              className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-slate-950"
              onChangeText={setNationalIdNumber}
              placeholder="Numéro CNI"
              placeholderTextColor="#94a3b8"
              value={nationalIdNumber}
            />
            <TextInput
              className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-slate-950"
              keyboardType="numeric"
              onChangeText={setExperienceYears}
              placeholder="Années d'expérience"
              placeholderTextColor="#94a3b8"
              value={experienceYears}
            />
            <TextInput
              className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-slate-950"
              keyboardType="numeric"
              onChangeText={setPricePerDay}
              placeholder="Tarif par jour en FCFA"
              placeholderTextColor="#94a3b8"
              value={pricePerDay}
            />
          </View>
        ) : null}

        <PrimaryButton disabled={!fullName || !email || !password} loading={loading} onPress={register}>
          S'inscrire
        </PrimaryButton>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text className="text-center font-semibold text-brand-blue">J'ai déjà un compte</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}
