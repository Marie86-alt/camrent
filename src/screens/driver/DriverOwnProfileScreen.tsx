import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Image, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { BrandLogo } from '../../components/BrandLogo';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Screen } from '../../components/Screen';
import { useToast } from '../../components/ui';
import { logout } from '../../services/authService';
import { updateUserProfile } from '../../services/authService';
import { uploadDriverProfilePhoto } from '../../services/storageService';
import { useAuth } from '../../hooks/useAuth';
import { useAuthStore } from '../../store/authStore';
import type { AppUser } from '../../types/models';
import { hapticSuccess, hapticWarning, hapticError } from '../../utils/haptics';
import { formatFcfa } from '../../utils/currency';

function Field({
  label, value, onChangeText, placeholder, keyboardType = 'default',
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder: string; keyboardType?: 'default' | 'numeric';
}) {
  return (
    <View className="gap-1.5">
      <Text className="text-xs font-semibold uppercase text-slate-500">{label}</Text>
      <TextInput
        className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-950"
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        value={value}
      />
    </View>
  );
}

export function DriverOwnProfileScreen() {
  const { user } = useAuth();
  const setUser = useAuthStore((state) => state.setUser);
  const toast = useToast();

  const [isAvailable, setIsAvailable] = useState(user?.driverProfile?.isAvailable ?? false);
  const [pricePerDay, setPricePerDay] = useState(String(user?.driverProfile?.pricePerDay ?? ''));
  const [experienceYears, setExperienceYears] = useState(String(user?.driverProfile?.experienceYears ?? ''));
  const [photoUrl, setPhotoUrl] = useState(user?.driverProfile?.profilePhotoUrl ?? '');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);

  async function pickPhoto() {
    if (!user) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      hapticWarning(); toast.warning('Autorisez la galerie pour changer la photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true, aspect: [1, 1], mediaTypes: ['images' as const], quality: 0.8,
    });
    if (result.canceled) return;
    try {
      setUploadingPhoto(true);
      const url = await uploadDriverProfilePhoto(user.id, result.assets[0].uri);
      setPhotoUrl(url);
    } catch {
      hapticError(); toast.error("La photo n'a pas pu être envoyée.");
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function save() {
    if (!user) return;
    if (pricePerDay && Number(pricePerDay) < 1000) {
      hapticWarning(); toast.warning('Le tarif minimum est de 1 000 FCFA/jour.');
      return;
    }
    const updated: AppUser = {
      ...user,
      driverProfile: {
        ...user.driverProfile,
        isAvailable,
        pricePerDay: pricePerDay ? Number(pricePerDay) : undefined,
        experienceYears: experienceYears ? Number(experienceYears) : undefined,
        profilePhotoUrl: photoUrl,
      },
    };
    try {
      setSaving(true);
      await updateUserProfile(user.id, { driverProfile: updated.driverProfile });
      setUser(updated);
      hapticSuccess(); toast.success('Profil mis à jour avec succès.');
    } catch {
      hapticError(); toast.error("Le profil n'a pas pu être sauvegardé.");
    } finally {
      setSaving(false);
    }
  }

  const initials = user?.fullName?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() ?? '';

  return (
    <Screen topSafeArea>
      <View className="gap-5 px-5 pt-4">
        {/* Header */}
        <View className="gap-3">
          <View className="flex-row items-center justify-between">
            <BrandLogo variant="xs" />
            <TouchableOpacity
              className="h-10 w-10 items-center justify-center rounded-full bg-red-50"
              onPress={logout}
              style={{ borderWidth: 1, borderColor: '#fecaca', elevation: 1 }}
            >
              <Ionicons color="#b91c1c" name="log-out-outline" size={18} />
            </TouchableOpacity>
          </View>
          <View>
            <Text className="text-xs font-medium text-slate-400">Mon profil chauffeur</Text>
            <Text className="mt-0.5 text-2xl font-black text-slate-950">
              {user?.fullName?.split(' ')[0]} 👋
            </Text>
          </View>
        </View>

        {/* Photo + KYC badge */}
        <View className="items-center gap-3">
          <TouchableOpacity activeOpacity={0.85} onPress={pickPhoto}>
            {photoUrl ? (
              <Image className="h-24 w-24 rounded-full bg-slate-200" resizeMode="cover" source={{ uri: photoUrl }} />
            ) : (
              <View className="h-24 w-24 items-center justify-center rounded-full bg-brand-blue">
                <Text className="text-2xl font-black text-white">{initials}</Text>
              </View>
            )}
            <View className="absolute bottom-0 right-0 h-8 w-8 items-center justify-center rounded-full bg-brand-blue">
              <Ionicons color="white" name={uploadingPhoto ? 'hourglass-outline' : 'camera-outline'} size={14} />
            </View>
          </TouchableOpacity>
          <Text className="text-base font-black text-slate-950">{user?.fullName}</Text>
          <View className={`rounded-full px-3 py-1 ${user?.kycStatus === 'approved' ? 'bg-green-50' : 'bg-amber-50'}`}>
            <Text className={`text-xs font-bold ${user?.kycStatus === 'approved' ? 'text-green-700' : 'text-amber-700'}`}>
              {user?.kycStatus === 'approved' ? 'KYC validé' : 'KYC en attente'}
            </Text>
          </View>
          {user?.ratingAverage ? (
            <View className="flex-row items-center gap-1">
              <Ionicons color="#ca8a04" name="star" size={14} />
              <Text className="text-sm font-bold text-slate-700">
                {user.ratingAverage}/5 · {user.missionsCount ?? 0} missions
              </Text>
            </View>
          ) : null}
        </View>

        {/* Availability toggle */}
        <View
          className="flex-row items-center justify-between rounded-2xl bg-white p-4"
          style={{ elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } }}
        >
          <View className="flex-row items-center gap-3">
            <View className={`h-10 w-10 items-center justify-center rounded-xl ${isAvailable ? 'bg-green-50' : 'bg-slate-100'}`}>
              <Ionicons color={isAvailable ? '#16a34a' : '#94a3b8'} name="radio-button-on-outline" size={20} />
            </View>
            <View>
              <Text className="font-bold text-slate-950">Disponibilité</Text>
              <Text className="text-xs text-slate-400">{isAvailable ? 'Visible pour les clients' : 'Non visible'}</Text>
            </View>
          </View>
          <Switch
            onValueChange={setIsAvailable}
            thumbColor={isAvailable ? '#3B63D4' : '#f4f3f4'}
            trackColor={{ false: '#e2e8f0', true: '#bfdbfe' }}
            value={isAvailable}
          />
        </View>

        {/* Editable fields */}
        <Field
          keyboardType="numeric"
          label="Tarif journalier (FCFA)"
          onChangeText={setPricePerDay}
          placeholder="Ex: 15000"
          value={pricePerDay}
        />
        {pricePerDay ? (
          <Text className="-mt-2 text-xs text-slate-400">
            Tarif affiché aux clients : {formatFcfa(Number(pricePerDay) || 0)}/jour
          </Text>
        ) : null}
        <Field
          keyboardType="numeric"
          label="Années d'expérience"
          onChangeText={setExperienceYears}
          placeholder="Ex: 5"
          value={experienceYears}
        />

        {/* Info rows */}
        <View className="rounded-2xl bg-white p-4" style={{ elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } }}>
          <InfoRow label="Email" value={user?.email} />
          <InfoRow label="Téléphone" value={user?.phone} />
          <InfoRow label="Ville" value={user?.city} />
          <InfoRow label="Permis" value={user?.driverProfile?.licenseNumber} last />
        </View>

        <PrimaryButton loading={saving || uploadingPhoto} onPress={save}>
          Sauvegarder
        </PrimaryButton>
      </View>
    </Screen>
  );
}

function InfoRow({ label, value, last }: { label: string; value?: string; last?: boolean }) {
  return (
    <View className={`flex-row items-center gap-3 py-3 ${last ? '' : 'border-b border-slate-100'}`}>
      <Text className="w-24 text-sm font-semibold text-slate-500">{label}</Text>
      <Text className="flex-1 text-right text-sm text-slate-800">{value ?? '—'}</Text>
    </View>
  );
}
