import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Text, TouchableOpacity, View } from 'react-native';

import { PrimaryButton } from '../../components/PrimaryButton';
import { Screen } from '../../components/Screen';
import { subscribeToAllUsers, updateUserAdminStatus } from '../../services/adminService';
import type { AppUser } from '../../types/models';

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
  const [drivers, setDrivers] = useState<AppUser[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAllUsers(
      (items) => {
        const driverLikeUsers = items.filter((user) => user.role === 'owner' || user.role === 'driver');
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

  const selectedDriver = useMemo(
    () => drivers.find((driver) => driver.id === selectedId) ?? drivers[0],
    [drivers, selectedId],
  );

  const pendingCount = drivers.filter((driver) => driver.status === 'pending_validation' || driver.kycStatus === 'pending').length;
  const suspendedCount = drivers.filter((driver) => driver.status === 'suspended' || driver.status === 'banned').length;

  async function updateSelected(payload: Partial<AppUser>, successMessage: string) {
    if (!selectedDriver) return;

    try {
      setSaving(true);
      await updateUserAdminStatus(selectedDriver.id, payload);
      Alert.alert('Action enregistrée', successMessage);
    } catch {
      Alert.alert('Erreur', "L'action admin n'a pas pu être enregistrée.");
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
    Alert.alert(title, message, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Confirmer',
        style: 'destructive',
        onPress: () => updateSelected(payload, successMessage),
      },
    ]);
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

        {loading ? (
          <View className="items-center justify-center py-16">
            <ActivityIndicator color="#3B63D4" size="large" />
          </View>
        ) : error ? (
          <View className="rounded-xl bg-red-50 p-4">
            <Text className="font-semibold text-red-700">{error}</Text>
          </View>
        ) : (
          <View className="gap-5">
            <View>
              <Text className="mb-3 text-lg font-black text-slate-950">Liste des chauffeurs</Text>
              {drivers.map((driver) => (
                <DriverRow
                  driver={driver}
                  key={driver.id}
                  onPress={() => setSelectedId(driver.id)}
                  selected={selectedDriver?.id === driver.id}
                />
              ))}
            </View>

            {selectedDriver ? (
              <View className="gap-4 rounded-xl bg-white p-4">
                <View className="flex-row items-center gap-2">
                  <Ionicons color="#3B63D4" name="person-circle-outline" size={24} />
                  <Text className="flex-1 text-xl font-black text-slate-950">Fiche chauffeur</Text>
                </View>

                {selectedDriver.photoUrl ? (
                  <Image
                    className="h-28 w-28 self-center rounded-full bg-slate-100"
                    resizeMode="cover"
                    source={{ uri: selectedDriver.photoUrl }}
                  />
                ) : null}

                <DetailLine label="Nom" value={selectedDriver.fullName} />
                <DetailLine label="Email" value={selectedDriver.email} />
                <DetailLine label="Telephone" value={selectedDriver.phone} />
                <DetailLine label="Ville" value={selectedDriver.city} />
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
                <DetailLine label="Photo chauffeur" value={selectedDriver.photoUrl ? 'Photo fournie' : undefined} />
                <DetailLine label="CNI" value={selectedDriver.documents?.nationalIdUrl ? 'Document fourni' : undefined} />
                <DetailLine label="CNI verso" value={selectedDriver.documents?.nationalIdBackUrl ? 'Document fourni' : undefined} />
                <DetailLine label="Permis" value={selectedDriver.documents?.driverLicenseUrl ? 'Document fourni' : undefined} />
                <DetailLine label="Derniere action admin" value={selectedDriver.adminLastActionReason} />

                <View className="gap-3 pt-2">
                  <PrimaryButton
                    loading={saving}
                    onPress={() =>
                      confirmAction(
                        'Valider le KYC',
                        `Confirmez-vous la validation du KYC de ${selectedDriver.fullName} ?`,
                        { kycStatus: 'approved', status: 'active', adminLastActionReason: 'KYC chauffeur validé par admin' },
                        'Le KYC du chauffeur est validé.',
                      )
                    }
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
