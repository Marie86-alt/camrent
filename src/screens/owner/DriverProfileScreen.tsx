import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { PrimaryButton } from '../../components/PrimaryButton';
import { Screen } from '../../components/Screen';
import { useAuth } from '../../hooks/useAuth';
import { updateUserProfile } from '../../services/authService';
import { uploadUserDocument } from '../../services/storageService';
import { useAuthStore } from '../../store/authStore';
import type { AppUser } from '../../types/models';
import type { OwnerStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<OwnerStackParamList, 'DriverProfile'>;

type DocumentKey = 'driverLicenseUrl' | 'nationalIdBackUrl' | 'nationalIdUrl';

const documentLabels: Record<DocumentKey, string> = {
  nationalIdUrl: 'CNI recto',
  nationalIdBackUrl: 'CNI verso',
  driverLicenseUrl: 'Permis',
};

function Field({
  keyboardType = 'default',
  label,
  onChangeText,
  placeholder,
  value,
}: {
  keyboardType?: 'default' | 'numeric';
  label: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <View className="gap-1.5">
      <Text className="text-sm font-semibold text-slate-700">{label}</Text>
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

function DocumentButton({
  label,
  onPress,
  uri,
}: {
  label: string;
  onPress: () => void;
  uri?: string;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      className="flex-row items-center gap-3 rounded-xl border border-slate-200 bg-white p-3"
      onPress={onPress}
    >
      {uri ? (
        <Image className="h-12 w-12 rounded-lg bg-slate-100" resizeMode="cover" source={{ uri }} />
      ) : (
        <View className="h-12 w-12 items-center justify-center rounded-lg bg-slate-100">
          <Ionicons color="#64748b" name="cloud-upload-outline" size={22} />
        </View>
      )}
      <View className="flex-1">
        <Text className="font-bold text-slate-900">{label}</Text>
        <Text className="text-xs font-semibold text-slate-500">{uri ? 'Document ajoute' : 'Ajouter une image'}</Text>
      </View>
      <Ionicons color="#94a3b8" name="chevron-forward" size={18} />
    </TouchableOpacity>
  );
}

export function DriverProfileScreen(_props: Props) {
  const { user } = useAuth();
  const setUser = useAuthStore((state) => state.setUser);
  const [licenseNumber, setLicenseNumber] = useState(user?.driverProfile?.licenseNumber ?? '');
  const [licenseExpiryDate, setLicenseExpiryDate] = useState(user?.driverProfile?.licenseExpiryDate ?? '');
  const [licenseCategories, setLicenseCategories] = useState(user?.driverProfile?.licenseCategories ?? 'B');
  const [nationalIdNumber, setNationalIdNumber] = useState(user?.driverProfile?.nationalIdNumber ?? '');
  const [experienceYears, setExperienceYears] = useState(String(user?.driverProfile?.experienceYears ?? ''));
  const [documents, setDocuments] = useState<AppUser['documents']>(user?.documents ?? {});
  const [uploadingKey, setUploadingKey] = useState<DocumentKey | null>(null);
  const [saving, setSaving] = useState(false);

  async function pickDocument(key: DocumentKey) {
    if (!user) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission requise', 'Autorisez la galerie pour ajouter ce document.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      mediaTypes: ['images' as const],
      quality: 0.75,
    });

    if (result.canceled) {
      return;
    }

    try {
      setUploadingKey(key);
      const url = await uploadUserDocument(user.id, result.assets[0].uri, key);
      setDocuments((current) => ({ ...current, [key]: url }));
    } catch {
      Alert.alert('Upload impossible', "Le document n'a pas pu etre envoye.");
    } finally {
      setUploadingKey(null);
    }
  }

  async function saveProfile() {
    if (!user) return;

    if (!licenseNumber || !licenseExpiryDate || !nationalIdNumber) {
      Alert.alert('Profil incomplet', 'Renseignez le numero de permis, son expiration et le numero CNI.');
      return;
    }

    const updatedUser: AppUser = {
      ...user,
      documents,
      driverProfile: {
        experienceYears: Number(experienceYears) || 0,
        isAvailable: true,
        licenseCategories,
        licenseExpiryDate,
        licenseNumber,
        nationalIdNumber,
      },
      kycStatus: 'pending',
      status: 'pending_validation',
    };

    try {
      setSaving(true);
      await updateUserProfile(user.id, {
        documents: updatedUser.documents,
        driverProfile: updatedUser.driverProfile,
        kycStatus: updatedUser.kycStatus,
        status: updatedUser.status,
      });
      setUser(updatedUser);
      Alert.alert('Profil envoye', "Votre profil chauffeur est en attente de validation admin.");
    } catch {
      Alert.alert('Erreur', "Le profil chauffeur n'a pas pu etre sauvegarde.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen topSafeArea>
      <View className="gap-5">
        <View>
          <Text className="text-xs font-bold uppercase text-brand-blue">Proprietaire</Text>
          <Text className="text-3xl font-black text-slate-950">Profil chauffeur</Text>
          <Text className="mt-1 text-sm text-slate-500">Ces informations seront verifiees par l'administration Autofix Pro.</Text>
        </View>

        <View className="gap-4">
          <Field label="Numero de permis" onChangeText={setLicenseNumber} placeholder="Ex: CE123456" value={licenseNumber} />
          <Field label="Expiration permis" onChangeText={setLicenseExpiryDate} placeholder="AAAA-MM-JJ" value={licenseExpiryDate} />
          <Field label="Categories permis" onChangeText={setLicenseCategories} placeholder="B, C" value={licenseCategories} />
          <Field label="Numero CNI" onChangeText={setNationalIdNumber} placeholder="Numero CNI" value={nationalIdNumber} />
          <Field
            keyboardType="numeric"
            label="Annees d'experience"
            onChangeText={setExperienceYears}
            placeholder="Ex: 5"
            value={experienceYears}
          />
        </View>

        <View className="gap-3">
          <Text className="text-lg font-black text-slate-950">Documents</Text>
          <View className="rounded-xl border border-slate-200 bg-white p-4">
            <Text className="font-bold text-slate-900">Photo chauffeur</Text>
            <Text className="mt-1 text-sm text-slate-500">
              La photo chauffeur utilise la photo de profil du compte proprietaire.
            </Text>
          </View>
          {(Object.keys(documentLabels) as DocumentKey[]).map((key) => (
            <DocumentButton
              key={key}
              label={uploadingKey === key ? 'Upload en cours...' : documentLabels[key]}
              onPress={() => pickDocument(key)}
              uri={documents?.[key]}
            />
          ))}
        </View>

        <PrimaryButton loading={saving || Boolean(uploadingKey)} onPress={saveProfile}>
          Envoyer pour validation
        </PrimaryButton>
      </View>
    </Screen>
  );
}
