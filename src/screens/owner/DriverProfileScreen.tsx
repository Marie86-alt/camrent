import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { CitySearchInput } from '../../components/CitySearchInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Screen } from '../../components/Screen';
import { createOwnerDriver } from '../../services/ownerDriverService';
import { uploadDriverProfilePhoto, uploadUserDocument } from '../../services/storageService';
import { useAuth } from '../../hooks/useAuth';
import type { CameroonCity } from '../../types/models';
import type { OwnerStackParamList } from '../../types/navigation';
import { isValidCameroonPhone } from '../../utils/validation';

type Props = NativeStackScreenProps<OwnerStackParamList, 'DriverProfile'>;

type FieldProps = {
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  label: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  value: string;
};

function Field({ keyboardType = 'default', label, onChangeText, placeholder, secureTextEntry, value }: FieldProps) {
  return (
    <View className="gap-1.5">
      <Text className="text-sm font-semibold text-slate-700">{label}</Text>
      <TextInput
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
        className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-slate-950"
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        secureTextEntry={secureTextEntry}
        value={value}
      />
    </View>
  );
}

function formatDateInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);

  if (digits.length <= 2) return day;
  if (digits.length <= 4) return `${day}/${month}`;
  return `${day}/${month}/${year}`;
}

function DocumentButton({ label, onPress, selected }: { label: string; onPress: () => void; selected: boolean }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      className={`flex-row items-center gap-3 rounded-xl border px-4 py-3 ${
        selected ? 'border-brand-blue bg-blue-50' : 'border-slate-200 bg-slate-50'
      }`}
      onPress={onPress}
    >
      <Ionicons
        color={selected ? '#3B63D4' : '#64748b'}
        name={selected ? 'checkmark-circle-outline' : 'document-outline'}
        size={20}
      />
      <Text className={`flex-1 font-semibold ${selected ? 'text-brand-blue' : 'text-slate-600'}`}>
        {selected ? `${label} ajouté` : `Ajouter ${label}`}
      </Text>
    </TouchableOpacity>
  );
}

export function DriverProfileScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+237');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState<CameroonCity>('Yaounde');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseExpiryDate, setLicenseExpiryDate] = useState('');
  const [licenseCategories, setLicenseCategories] = useState('B');
  const [nationalIdNumber, setNationalIdNumber] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [pricePerDay, setPricePerDay] = useState('10000');
  const [profilePhotoUri, setProfilePhotoUri] = useState('');
  const [nationalIdUri, setNationalIdUri] = useState('');
  const [nationalIdBackUri, setNationalIdBackUri] = useState('');
  const [driverLicenseUri, setDriverLicenseUri] = useState('');
  const [saving, setSaving] = useState(false);

  const canSubmit =
    fullName.trim() &&
    email.trim() &&
    password.length >= 6 &&
    isValidCameroonPhone(phone) &&
    licenseNumber.trim() &&
    licenseExpiryDate.length === 10 &&
    nationalIdNumber.trim();

  async function pickProfilePhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission requise', "Autorisez l'accès à la galerie pour ajouter la photo du chauffeur.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      mediaTypes: ['images' as const],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfilePhotoUri(result.assets[0].uri);
    }
  }

  async function pickDocument(setter: (uri: string) => void) {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission requise', "Autorisez l'accès à la galerie pour ajouter le document.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      mediaTypes: ['images' as const],
      quality: 0.85,
    });

    if (!result.canceled) {
      setter(result.assets[0].uri);
    }
  }

  async function submit() {
    if (!canSubmit) {
      Alert.alert('Formulaire incomplet', 'Renseignez les informations obligatoires du chauffeur.');
      return;
    }

    try {
      setSaving(true);
      const profilePhotoUrl =
        user && profilePhotoUri
          ? await uploadDriverProfilePhoto(user.id, profilePhotoUri)
          : undefined;
      const nationalIdUrl =
        user && nationalIdUri
          ? await uploadUserDocument(user.id, nationalIdUri, 'driver-national-id-front')
          : undefined;
      const nationalIdBackUrl =
        user && nationalIdBackUri
          ? await uploadUserDocument(user.id, nationalIdBackUri, 'driver-national-id-back')
          : undefined;
      const driverLicenseUrl =
        user && driverLicenseUri
          ? await uploadUserDocument(user.id, driverLicenseUri, 'driver-license')
          : undefined;

      await createOwnerDriver({
        city,
        email,
        experienceYears: Number(experienceYears) || 0,
        fullName,
        licenseCategories,
        licenseExpiryDate,
        licenseNumber,
        nationalIdNumber,
        password,
        phone,
        pricePerDay: Number(pricePerDay) || 10000,
        driverLicenseUrl,
        nationalIdBackUrl,
        nationalIdUrl,
        profilePhotoUrl,
      });

      Alert.alert('Chauffeur créé', 'Le compte chauffeur est créé et envoyé en validation admin.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Création impossible', error instanceof Error ? error.message : "Le chauffeur n'a pas pu être créé.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen topSafeArea>
      <View className="gap-5 px-5 pt-4">
        <View>
          <Text className="text-xs font-bold uppercase text-brand-blue">Espace propriétaire</Text>
          <Text className="text-3xl font-black text-slate-950">Ajouter un chauffeur</Text>
          <Text className="mt-1 text-sm text-slate-500">
            Créez un compte chauffeur séparé. Le chauffeur pourra ensuite se connecter à son propre espace.
          </Text>
        </View>

        <View className="gap-4">
          <View className="items-center gap-3 rounded-2xl bg-white p-4">
            <TouchableOpacity activeOpacity={0.85} onPress={pickProfilePhoto}>
              {profilePhotoUri ? (
                <Image
                  className="h-24 w-24 rounded-full bg-slate-200"
                  resizeMode="cover"
                  source={{ uri: profilePhotoUri }}
                />
              ) : (
                <View className="h-24 w-24 items-center justify-center rounded-full bg-blue-50">
                  <Ionicons color="#3B63D4" name="camera-outline" size={28} />
                </View>
              )}
              <View className="absolute bottom-0 right-0 h-8 w-8 items-center justify-center rounded-full bg-brand-blue">
                <Ionicons color="white" name="camera-outline" size={14} />
              </View>
            </TouchableOpacity>
            <View className="items-center">
              <Text className="text-base font-black text-slate-950">Photo du chauffeur</Text>
              <Text className="mt-1 text-center text-xs text-slate-500">
                Recommandée pour la validation admin et la confiance côté client.
              </Text>
            </View>
          </View>
          <Field label="Nom complet" onChangeText={setFullName} placeholder="Ex: Jean Kamga" value={fullName} />
          <Field keyboardType="email-address" label="Email chauffeur" onChangeText={setEmail} placeholder="chauffeur@email.com" value={email} />
          <Field keyboardType="phone-pad" label="Téléphone" onChangeText={setPhone} placeholder="+237 6XX XXX XXX" value={phone} />
          <Field label="Mot de passe temporaire" onChangeText={setPassword} placeholder="Minimum 6 caractères" secureTextEntry value={password} />
          <CitySearchInput label="Ville du chauffeur" onSelectCity={setCity} value={city} />
        </View>

        <View className="gap-4 rounded-2xl bg-white p-4">
          <Text className="text-lg font-black text-slate-950">Permis et profil</Text>
          <Field label="Numéro de permis" onChangeText={setLicenseNumber} placeholder="Ex: CE123456" value={licenseNumber} />
          <Field
            keyboardType="numeric"
            label="Expiration permis"
            onChangeText={(value) => setLicenseExpiryDate(formatDateInput(value))}
            placeholder="Ex: 03/06/2030"
            value={licenseExpiryDate}
          />
          <Field label="Catégories permis" onChangeText={setLicenseCategories} placeholder="Ex: B, C" value={licenseCategories} />
          <Field label="Numéro CNI" onChangeText={setNationalIdNumber} placeholder="Numéro CNI" value={nationalIdNumber} />
          <Field keyboardType="numeric" label="Années d'expérience" onChangeText={setExperienceYears} placeholder="Ex: 5" value={experienceYears} />
          <Field keyboardType="numeric" label="Prix chauffeur par jour" onChangeText={setPricePerDay} placeholder="Ex: 10000" value={pricePerDay} />
        </View>

        <View className="gap-3 rounded-2xl bg-white p-4">
          <Text className="text-lg font-black text-slate-950">Documents du chauffeur</Text>
          <Text className="text-xs text-slate-500">
            Ajoutez la CNI et le permis pour faciliter la validation admin.
          </Text>
          <DocumentButton
            label="CNI recto"
            selected={Boolean(nationalIdUri)}
            onPress={() => pickDocument(setNationalIdUri)}
          />
          <DocumentButton
            label="CNI verso"
            selected={Boolean(nationalIdBackUri)}
            onPress={() => pickDocument(setNationalIdBackUri)}
          />
          <DocumentButton
            label="Permis de conduire"
            selected={Boolean(driverLicenseUri)}
            onPress={() => pickDocument(setDriverLicenseUri)}
          />
        </View>

        <PrimaryButton disabled={!canSubmit} loading={saving} onPress={submit}>
          Créer le chauffeur
        </PrimaryButton>
      </View>
    </Screen>
  );
}
