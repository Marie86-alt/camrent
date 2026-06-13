import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useMemo, useState } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { TextInput } from 'react-native';

import { CitySearchInput } from '../../components/CitySearchInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Screen } from '../../components/Screen';
import { DriverCardSkeleton, EmptyState, useBottomSheet, useToast } from '../../components/ui';
import { hapticError, hapticSuccess, hapticWarning } from '../../utils/haptics';
import EmptyDriversIllustration from '../../../assets/illustrations/empty-drivers.svg';
import { createIndependentDriverByAdmin, subscribeToAllUsers, updateUserAdminStatus } from '../../services/adminService';
import { uploadDriverProfilePhoto, uploadUserDocument } from '../../services/storageService';
import { useAuth } from '../../hooks/useAuth';
import type { AppUser, CameroonCity } from '../../types/models';

type DriverFilter = 'all' | 'independent' | 'owner';
type DriverDocumentKey = 'profilePhoto' | 'nationalId' | 'nationalIdBack' | 'driverLicense';

const SKELETON_ITEMS = [0, 1, 2];

async function pickImage(): Promise<{ uri: string | null; permissionDenied: boolean }> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return { uri: null, permissionDenied: true };

  const result = await ImagePicker.launchImageLibraryAsync({
    allowsEditing: true,
    mediaTypes: ['images' as const],
    quality: 0.8,
  });

  return { uri: result.canceled ? null : result.assets[0].uri, permissionDenied: false };
}

function statusLabel(status?: AppUser['status']) {
  if (status === 'suspended') return 'Suspendu';
  if (status === 'banned') return 'Banni';
  if (status === 'pending_validation') return 'En validation';
  return 'Actif';
}

function kycLabel(status?: AppUser['kycStatus']) {
  if (status === 'approved') return 'KYC valide';
  if (status === 'rejected') return 'KYC refuse';
  return 'KYC en attente';
}

function DriverRow({ driver, selected, onPress }: { driver: AppUser; selected: boolean; onPress: () => void }) {
  const blocked = driver.status === 'suspended' || driver.status === 'banned';

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      className={`mb-3 rounded-xl border bg-white p-4 ${selected ? 'border-brand-blue' : 'border-slate-100'}`}
      onPress={onPress}
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-base font-black text-slate-950">{driver.fullName}</Text>
          <Text className="mt-1 text-sm text-slate-500">
            {driver.city} - {driver.phone || 'Telephone absent'}
          </Text>
          <Text className="mt-1 text-xs font-semibold text-slate-400">{driver.email}</Text>
        </View>
        <View className={`rounded-full px-3 py-1 ${blocked ? 'bg-red-50' : 'bg-blue-50'}`}>
          <Text className={`text-xs font-bold ${blocked ? 'text-red-700' : 'text-blue-700'}`}>
            {statusLabel(driver.status)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function DetailLine({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <View className="flex-row items-center justify-between border-b border-slate-100 py-3">
      <Text className="text-sm text-slate-500">{label}</Text>
      <Text className="max-w-[60%] text-right text-sm font-bold text-slate-900">{value || 'Non renseigne'}</Text>
    </View>
  );
}

export function AdminDriversScreen() {
  const { user } = useAuth();
  const [drivers, setDrivers] = useState<AppUser[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<DriverFilter>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCity, setNewCity] = useState<CameroonCity>('Yaounde');
  const [newEmail, setNewEmail] = useState('');
  const [newExperienceYears, setNewExperienceYears] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newLicenseCategories, setNewLicenseCategories] = useState('');
  const [newLicenseExpiryDate, setNewLicenseExpiryDate] = useState('');
  const [newLicenseNumber, setNewLicenseNumber] = useState('');
  const [newNationalIdNumber, setNewNationalIdNumber] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPhone, setNewPhone] = useState('+237');
  const [newPricePerDay, setNewPricePerDay] = useState('');
  const [newDocuments, setNewDocuments] = useState<Record<DriverDocumentKey, string | null>>({
    driverLicense: null,
    nationalId: null,
    nationalIdBack: null,
    profilePhoto: null,
  });
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const bottomSheet = useBottomSheet();

  useEffect(() => {
    const unsubscribe = subscribeToAllUsers(
      (items) => {
        const driverLikeUsers = items.filter((user) => user.role === 'driver');
        setDrivers(driverLikeUsers);
        setSelectedId((current) => current ?? driverLikeUsers[0]?.id ?? null);
        setLoading(false);
        setError(null);
      },
      () => {
        setError('Impossible de charger les chauffeurs.');
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  const visibleDrivers = useMemo(
    () =>
      drivers.filter((driver) => {
        if (filter === 'independent') return driver.driverProfile?.isIndependent === true;
        if (filter === 'owner') return driver.driverProfile?.isIndependent !== true;
        return true;
      }),
    [drivers, filter],
  );
  const selectedDriver = useMemo(
    () => visibleDrivers.find((driver) => driver.id === selectedId) ?? visibleDrivers[0],
    [selectedId, visibleDrivers],
  );
  const selectedDriverPhotoUrl = selectedDriver?.driverProfile?.profilePhotoUrl ?? selectedDriver?.photoUrl;

  const pendingCount = drivers.filter((driver) => driver.status === 'pending_validation' || driver.kycStatus === 'pending').length;
  const suspendedCount = drivers.filter((driver) => driver.status === 'suspended' || driver.status === 'banned').length;

  async function selectNewDocument(key: DriverDocumentKey) {
    const result = await pickImage();
    if (result.permissionDenied) { toast.info("Autorisez l'acces aux photos pour ajouter le document."); return; }
    const { uri } = result;
    if (!uri) return;
    setNewDocuments((current) => ({ ...current, [key]: uri }));
  }

  function resetCreateForm() {
    setNewCity('Yaounde');
    setNewEmail('');
    setNewExperienceYears('');
    setNewFullName('');
    setNewLicenseCategories('');
    setNewLicenseExpiryDate('');
    setNewLicenseNumber('');
    setNewNationalIdNumber('');
    setNewPassword('');
    setNewPhone('+237');
    setNewPricePerDay('');
    setNewDocuments({
      driverLicense: null,
      nationalId: null,
      nationalIdBack: null,
      profilePhoto: null,
    });
  }

  async function createIndependentDriver() {
    if (!user) return;

    const missingDocument = Object.values(newDocuments).some((value) => !value);
    if (
      missingDocument ||
      !newEmail.trim() ||
      !newFullName.trim() ||
      !newLicenseCategories.trim() ||
      !newLicenseExpiryDate.trim() ||
      !newLicenseNumber.trim() ||
      !newNationalIdNumber.trim() ||
      !newPassword.trim() ||
      !newPhone.trim() ||
      !newPricePerDay.trim()
    ) {
      hapticWarning(); toast.warning('Formulaire incomplet — renseignez toutes les informations et ajoutez les documents.');
      return;
    }

    try {
      setCreating(true);
      const [profilePhotoUrl, nationalIdUrl, nationalIdBackUrl, driverLicenseUrl] = await Promise.all([
        uploadDriverProfilePhoto(user.id, newDocuments.profilePhoto as string),
        uploadUserDocument(user.id, newDocuments.nationalId as string, 'admin-independent-national-id-front'),
        uploadUserDocument(user.id, newDocuments.nationalIdBack as string, 'admin-independent-national-id-back'),
        uploadUserDocument(user.id, newDocuments.driverLicense as string, 'admin-independent-driver-license'),
      ]);

      await createIndependentDriverByAdmin({
        city: newCity,
        driverLicenseUrl,
        email: newEmail.trim(),
        experienceYears: Number(newExperienceYears) || 0,
        fullName: newFullName.trim(),
        licenseCategories: newLicenseCategories.trim().toUpperCase(),
        licenseExpiryDate: newLicenseExpiryDate.trim(),
        licenseNumber: newLicenseNumber.trim(),
        nationalIdBackUrl,
        nationalIdNumber: newNationalIdNumber.trim(),
        nationalIdUrl,
        password: newPassword.trim(),
        phone: newPhone.trim(),
        pricePerDay: Number(newPricePerDay) || 10000,
        profilePhotoUrl,
      });

      hapticSuccess(); toast.success('Chauffeur independant cree — en attente de validation KYC.');
      resetCreateForm();
      setShowCreateForm(false);
    } catch {
      hapticError(); toast.error("Impossible d'ajouter le chauffeur independant.");
    } finally {
      setCreating(false);
    }
  }

  async function updateSelected(payload: Partial<AppUser>, successMessage: string) {
    if (!selectedDriver) return;

    const missingDriverDocuments =
      !selectedDriver.driverProfile?.profilePhotoUrl ||
      !selectedDriver.documents?.nationalIdUrl ||
      !selectedDriver.documents?.nationalIdBackUrl ||
      !selectedDriver.documents?.driverLicenseUrl;

    if (payload.kycStatus === 'approved' && missingDriverDocuments) {
      toast.warning("Ajoutez la photo, la CNI recto/verso et le permis du chauffeur avant de valider le KYC.");
      return;
    }

    try {
      setSaving(true);
      await updateUserAdminStatus(selectedDriver.id, payload);
      hapticSuccess(); toast.success(successMessage);
    } catch {
      hapticError(); toast.error("L'action admin n'a pas pu etre enregistree.");
    } finally {
      setSaving(false);
    }
  }

  function confirmAction(
    title: string,
    message: string,
    payload: Partial<AppUser>,
    successMessage: string,
  ) {
    bottomSheet.show({
      title,
      subtitle: message,
      actions: [
        {
          label: 'Confirmer',
          variant: 'danger',
          icon: 'checkmark-outline',
          onPress: () => updateSelected(payload, successMessage),
        },
      ],
    });
  }

  function confirmKycApproval() {
    if (!selectedDriver) return;

    if (!selectedDriver.driverProfile?.profilePhotoUrl) {
      toast.info("Ajoutez une photo de profil chauffeur avant de valider le KYC.");
      return;
    }

    confirmAction(
      'Valider le KYC',
      `Confirmez-vous la validation du KYC de ${selectedDriver.fullName} ?`,
      { kycStatus: 'approved', status: 'active', adminLastActionReason: 'KYC chauffeur valide par admin' },
      'Le KYC du chauffeur est valide.',
    );
  }

  return (
    <Screen topSafeArea>
      <View className="gap-5">
        <View>
          <Text className="text-xs font-bold uppercase text-brand-blue">Module 4</Text>
          <Text className="text-3xl font-black text-slate-950">Gestion des chauffeurs</Text>
          <Text className="mt-1 text-sm text-slate-500">Validation KYC, suspension et suivi des comptes conducteurs.</Text>
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1 rounded-xl bg-white p-4">
            <Text className="text-2xl font-black text-slate-950">{drivers.length}</Text>
            <Text className="text-xs font-semibold text-slate-500">Chauffeurs</Text>
          </View>
          <View className="flex-1 rounded-xl bg-white p-4">
            <Text className="text-2xl font-black text-amber-600">{pendingCount}</Text>
            <Text className="text-xs font-semibold text-slate-500">A valider</Text>
          </View>
          <View className="flex-1 rounded-xl bg-white p-4">
            <Text className="text-2xl font-black text-red-600">{suspendedCount}</Text>
            <Text className="text-xs font-semibold text-slate-500">Bloques</Text>
          </View>
        </View>

        <View className="flex-row flex-wrap gap-2">
          {[
            { label: 'Tous', value: 'all' as const },
            { label: 'Ind\u00e9pendants', value: 'independent' as const },
            { label: 'Propri\u00e9taires', value: 'owner' as const },
          ].map((item) => (
            <TouchableOpacity
              className={`rounded-full px-4 py-2 ${filter === item.value ? 'bg-slate-950' : 'bg-white'}`}
              key={item.value}
              onPress={() => setFilter(item.value)}
            >
              <Text className={`text-xs font-bold ${filter === item.value ? 'text-white' : 'text-slate-600'}`}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View className="rounded-xl bg-white p-4">
          <TouchableOpacity
            activeOpacity={0.85}
            className="flex-row items-center justify-between"
            onPress={() => setShowCreateForm((value) => !value)}
          >
            <View>
              <Text className="text-lg font-black text-slate-950">Ajouter un chauffeur independant</Text>
              <Text className="mt-1 text-xs text-slate-500">
                Creation manuelle par l'admin. Le KYC restera a valider.
              </Text>
            </View>
            <Ionicons color="#3B63D4" name={showCreateForm ? 'chevron-up' : 'add-circle-outline'} size={24} />
          </TouchableOpacity>

          {showCreateForm ? (
            <View className="mt-4 gap-3">
              <TextInput
                className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-slate-950"
                onChangeText={setNewFullName}
                placeholder="Nom complet"
                placeholderTextColor="#94a3b8"
                value={newFullName}
              />
              <TextInput
                autoCapitalize="none"
                className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-slate-950"
                keyboardType="email-address"
                onChangeText={setNewEmail}
                placeholder="Email"
                placeholderTextColor="#94a3b8"
                value={newEmail}
              />
              <TextInput
                className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-slate-950"
                keyboardType="phone-pad"
                onChangeText={setNewPhone}
                placeholder="+237 6XX XXX XXX"
                placeholderTextColor="#94a3b8"
                value={newPhone}
              />
              <TextInput
                className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-slate-950"
                onChangeText={setNewPassword}
                placeholder="Mot de passe provisoire"
                placeholderTextColor="#94a3b8"
                secureTextEntry
                value={newPassword}
              />
              <CitySearchInput label="Ville" onSelectCity={setNewCity} value={newCity} />
              <TextInput
                className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-slate-950"
                onChangeText={setNewLicenseNumber}
                placeholder="Numero de permis"
                placeholderTextColor="#94a3b8"
                value={newLicenseNumber}
              />
              <TextInput
                className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-slate-950"
                onChangeText={setNewLicenseCategories}
                placeholder="Categories permis, ex: B"
                placeholderTextColor="#94a3b8"
                value={newLicenseCategories}
              />
              <TextInput
                className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-slate-950"
                onChangeText={setNewLicenseExpiryDate}
                placeholder="Expiration permis, ex: 03/06/2027"
                placeholderTextColor="#94a3b8"
                value={newLicenseExpiryDate}
              />
              <TextInput
                className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-slate-950"
                onChangeText={setNewNationalIdNumber}
                placeholder="Numero CNI"
                placeholderTextColor="#94a3b8"
                value={newNationalIdNumber}
              />
              <TextInput
                className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-slate-950"
                keyboardType="numeric"
                onChangeText={setNewExperienceYears}
                placeholder="Annees d'experience"
                placeholderTextColor="#94a3b8"
                value={newExperienceYears}
              />
              <TextInput
                className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-slate-950"
                keyboardType="numeric"
                onChangeText={setNewPricePerDay}
                placeholder="Tarif par jour en FCFA"
                placeholderTextColor="#94a3b8"
                value={newPricePerDay}
              />

              <View className="flex-row flex-wrap gap-3">
                {[
                  { key: 'profilePhoto' as const, label: 'Photo profil' },
                  { key: 'nationalId' as const, label: 'CNI recto' },
                  { key: 'nationalIdBack' as const, label: 'CNI verso' },
                  { key: 'driverLicense' as const, label: 'Permis' },
                ].map((item) => {
                  const uri = newDocuments[item.key];
                  return (
                    <TouchableOpacity
                      activeOpacity={0.85}
                      key={item.key}
                      onPress={() => selectNewDocument(item.key)}
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

              <PrimaryButton loading={creating} onPress={createIndependentDriver}>
                Creer le chauffeur independant
              </PrimaryButton>
            </View>
          ) : null}
        </View>

        {loading ? (
          <View>
            {SKELETON_ITEMS.map((item) => (
              <DriverCardSkeleton key={`admin-driver-skeleton-${item}`} />
            ))}
          </View>
        ) : error ? (
          <View className="rounded-xl bg-red-50 p-4">
            <Text className="font-semibold text-red-700">{error}</Text>
          </View>
        ) : (
          <View className="gap-5">
            <View>
              <Text className="mb-3 text-lg font-black text-slate-950">Liste des chauffeurs</Text>
              {visibleDrivers.length === 0 ? (
                <EmptyState
                  icon="people-outline"
                  illustration={EmptyDriversIllustration}
                  subtitle="Changez le filtre ou ajoutez un chauffeur independant depuis le formulaire."
                  title="Aucun chauffeur"
                />
              ) : (
                visibleDrivers.map((driver) => (
                  <DriverRow
                    driver={driver}
                    key={driver.id}
                    onPress={() => setSelectedId(driver.id)}
                    selected={selectedDriver?.id === driver.id}
                  />
                ))
              )}
            </View>

            {selectedDriver ? (
              <View className="gap-4 rounded-xl bg-white p-4">
                <View className="flex-row items-center gap-2">
                  <Ionicons color="#3B63D4" name="person-circle-outline" size={24} />
                  <Text className="flex-1 text-xl font-black text-slate-950">Fiche chauffeur</Text>
                </View>

                {selectedDriverPhotoUrl ? (
                  <Image
                    className="h-28 w-28 self-center rounded-full bg-slate-100"
                    resizeMode="cover"
                    source={{ uri: selectedDriverPhotoUrl }}
                  />
                ) : null}

                <DetailLine label="Nom" value={selectedDriver.fullName} />
                <DetailLine label="Email" value={selectedDriver.email} />
                <DetailLine label="Telephone" value={selectedDriver.phone} />
                <DetailLine label="Ville" value={selectedDriver.city} />
                <DetailLine
                  label="Type"
                  value={selectedDriver.driverProfile?.isIndependent ? 'Chauffeur ind\u00e9pendant' : 'Chauffeur du propri\u00e9taire'}
                />
                <DetailLine label="Statut" value={statusLabel(selectedDriver.status)} />
                <DetailLine label="KYC" value={kycLabel(selectedDriver.kycStatus)} />
                <DetailLine label="Numero permis" value={selectedDriver.driverProfile?.licenseNumber} />
                <DetailLine label="Expiration permis" value={selectedDriver.driverProfile?.licenseExpiryDate} />
                <DetailLine label="Categories permis" value={selectedDriver.driverProfile?.licenseCategories} />
                <DetailLine label="Numero CNI" value={selectedDriver.driverProfile?.nationalIdNumber} />
                <DetailLine label="Experience" value={selectedDriver.driverProfile?.experienceYears ? `${selectedDriver.driverProfile.experienceYears} ans` : undefined} />
                <DetailLine label="Disponibilite" value={selectedDriver.driverProfile?.isAvailable ? 'Disponible' : 'Non renseigne'} />
                <DetailLine label="Note moyenne" value={selectedDriver.ratingAverage ? `${selectedDriver.ratingAverage}/5` : undefined} />
                <DetailLine label="Missions" value={selectedDriver.missionsCount ?? 0} />
                <DetailLine label="Photo chauffeur" value={selectedDriver.driverProfile?.profilePhotoUrl ? 'Photo fournie' : undefined} />
                <DetailLine label="CNI" value={selectedDriver.documents?.nationalIdUrl ? 'Document fourni' : undefined} />
                <DetailLine label="CNI verso" value={selectedDriver.documents?.nationalIdBackUrl ? 'Document fourni' : undefined} />
                <DetailLine label="Permis" value={selectedDriver.documents?.driverLicenseUrl ? 'Document fourni' : undefined} />
                <DetailLine label="Derniere action admin" value={selectedDriver.adminLastActionReason} />

                <View className="gap-3 pt-2">
                  <PrimaryButton
                    loading={saving}
                    onPress={confirmKycApproval}
                  >
                    Valider KYC
                  </PrimaryButton>
                  <PrimaryButton
                    loading={saving}
                    onPress={() =>
                      confirmAction(
                        'Suspendre le compte',
                        `Voulez-vous suspendre le compte de ${selectedDriver.fullName} ?`,
                        { status: 'suspended', adminLastActionReason: 'Suspension manuelle par admin' },
                        'Le chauffeur est suspendu.',
                      )
                    }
                  >
                    Suspendre
                  </PrimaryButton>
                  <PrimaryButton
                    loading={saving}
                    onPress={() =>
                      confirmAction(
                        'Débloquer le compte',
                        `Voulez-vous débloquer le compte de ${selectedDriver.fullName} ?`,
                        { status: 'active', adminLastActionReason: 'Déblocage manuel après investigation' },
                        'Le chauffeur est débloqué.',
                      )
                    }
                  >
                    Débloquer
                  </PrimaryButton>
                </View>
              </View>
            ) : null}
          </View>
        )}
      </View>
    </Screen>
  );
}
