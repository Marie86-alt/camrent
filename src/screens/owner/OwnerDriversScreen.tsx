import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Text, TouchableOpacity, View } from 'react-native';

import { BackButton } from '../../components/BackButton';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Screen } from '../../components/Screen';
import { useAuth } from '../../hooks/useAuth';
import { subscribeToOwnerDrivers } from '../../services/ownerDriverListService';
import type { AppUser } from '../../types/models';
import type { OwnerStackParamList } from '../../types/navigation';
import { formatFcfa } from '../../utils/currency';

type Props = {
  navigation: NativeStackNavigationProp<OwnerStackParamList, 'OwnerDrivers'>;
};

function statusLabel(driver: AppUser) {
  if (driver.status === 'active' && driver.kycStatus === 'approved') return 'Actif';
  if (driver.status === 'suspended') return 'Suspendu';
  if (driver.status === 'banned') return 'Banni';
  if (driver.kycStatus === 'rejected') return 'KYC refusé';
  return 'En validation';
}

function statusColor(driver: AppUser) {
  if (driver.status === 'active' && driver.kycStatus === 'approved') return ['#dcfce7', '#166534'];
  if (driver.status === 'suspended' || driver.status === 'banned' || driver.kycStatus === 'rejected') {
    return ['#fee2e2', '#991b1b'];
  }
  return ['#fef3c7', '#92400e'];
}

function documentCount(driver: AppUser) {
  return [
    driver.driverProfile?.profilePhotoUrl,
    driver.documents?.nationalIdUrl,
    driver.documents?.nationalIdBackUrl,
    driver.documents?.driverLicenseUrl,
  ].filter(Boolean).length;
}

function DriverCard({ driver }: { driver: AppUser }) {
  const photoUrl = driver.driverProfile?.profilePhotoUrl ?? driver.photoUrl;
  const initials = driver.fullName
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const [backgroundColor, color] = statusColor(driver);
  const docs = documentCount(driver);

  return (
    <View
      className="mb-4 rounded-2xl bg-white p-4"
      style={{ elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } }}
    >
      <View className="flex-row items-start gap-3">
        {photoUrl ? (
          <Image
            className="h-16 w-16 rounded-full bg-slate-200"
            resizeMode="cover"
            source={{ uri: photoUrl }}
          />
        ) : (
          <View className="h-16 w-16 items-center justify-center rounded-full bg-blue-50">
            <Text className="text-lg font-black text-brand-blue">{initials}</Text>
          </View>
        )}

        <View className="flex-1">
          <View className="flex-row items-start justify-between gap-2">
            <View className="flex-1">
              <Text className="text-base font-black text-slate-950">{driver.fullName}</Text>
              <Text className="mt-0.5 text-sm text-slate-500">{driver.city} · {driver.phone}</Text>
              <Text className="mt-0.5 text-xs font-semibold text-slate-400">{driver.email}</Text>
            </View>
            <View className="rounded-full px-2.5 py-1" style={{ backgroundColor }}>
              <Text className="text-xs font-bold" style={{ color }}>{statusLabel(driver)}</Text>
            </View>
          </View>

          <View className="mt-3 flex-row flex-wrap gap-2">
            <InfoPill icon="card-outline" label={`Permis ${driver.driverProfile?.licenseNumber || '-'}`} />
            <InfoPill
              icon="briefcase-outline"
              label={
                driver.driverProfile?.experienceYears
                  ? `${driver.driverProfile.experienceYears} ans`
                  : 'Exp. non renseignée'
              }
            />
            <InfoPill
              icon="cash-outline"
              label={formatFcfa(driver.driverProfile?.pricePerDay ?? 0)}
            />
          </View>

          <View className="mt-3 rounded-xl bg-slate-50 p-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-bold text-slate-700">Documents KYC</Text>
              <Text className="text-sm font-black text-brand-blue">{docs}/4</Text>
            </View>
            <View className="mt-2 gap-1.5">
              <DocLine label="Photo" ok={Boolean(driver.driverProfile?.profilePhotoUrl)} />
              <DocLine label="CNI recto" ok={Boolean(driver.documents?.nationalIdUrl)} />
              <DocLine label="CNI verso" ok={Boolean(driver.documents?.nationalIdBackUrl)} />
              <DocLine label="Permis" ok={Boolean(driver.documents?.driverLicenseUrl)} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

function InfoPill({ icon, label }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string }) {
  return (
    <View className="flex-row items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1">
      <Ionicons color="#3B63D4" name={icon} size={12} />
      <Text className="text-xs font-semibold text-brand-blue">{label}</Text>
    </View>
  );
}

function DocLine({ label, ok }: { label: string; ok: boolean }) {
  return (
    <View className="flex-row items-center gap-2">
      <Ionicons
        color={ok ? '#16a34a' : '#ca8a04'}
        name={ok ? 'checkmark-circle-outline' : 'alert-circle-outline'}
        size={14}
      />
      <Text className={`text-xs font-semibold ${ok ? 'text-green-700' : 'text-amber-700'}`}>
        {label} {ok ? 'fourni' : 'manquant'}
      </Text>
    </View>
  );
}

export function OwnerDriversScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [drivers, setDrivers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.id) return undefined;

    const unsubscribe = subscribeToOwnerDrivers(
      user.id,
      (items) => {
        setDrivers(items);
        setError('');
        setLoading(false);
      },
      () => {
        setError('Impossible de charger vos chauffeurs.');
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [user?.id]);

  return (
    <Screen>
      <View className="gap-5">
        <BackButton navigation={navigation} />

        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="text-xs font-bold uppercase text-brand-blue">Espace propriétaire</Text>
            <Text className="text-3xl font-black text-slate-950">Mes chauffeurs</Text>
            <Text className="mt-1 text-sm text-slate-500">
              Suivez les chauffeurs rattachés à votre activité.
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.85}
            className="h-11 w-11 items-center justify-center rounded-full bg-brand-blue"
            onPress={() => navigation.navigate('DriverProfile')}
          >
            <Ionicons color="white" name="add" size={22} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View className="items-center justify-center py-16">
            <ActivityIndicator color="#3B63D4" size="large" />
          </View>
        ) : error ? (
          <View className="rounded-2xl bg-red-50 p-4">
            <Text className="font-semibold text-red-700">{error}</Text>
          </View>
        ) : drivers.length === 0 ? (
          <View className="items-center gap-4 rounded-2xl bg-white p-6">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-blue-50">
              <Ionicons color="#3B63D4" name="people-outline" size={30} />
            </View>
            <View className="items-center">
              <Text className="text-lg font-black text-slate-950">Aucun chauffeur ajouté</Text>
              <Text className="mt-1 text-center text-sm text-slate-500">
                Créez un chauffeur pour le faire valider par l’admin.
              </Text>
            </View>
            <PrimaryButton onPress={() => navigation.navigate('DriverProfile')}>
              Ajouter un chauffeur
            </PrimaryButton>
          </View>
        ) : (
          <View>
            <Text className="mb-3 text-sm font-bold text-slate-500">
              {drivers.length} chauffeur{drivers.length > 1 ? 's' : ''}
            </Text>
            {drivers.map((driver) => (
              <DriverCard driver={driver} key={driver.id} />
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}
