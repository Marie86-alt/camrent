import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BackButton } from '../../components/BackButton';
import { Screen } from '../../components/Screen';
import { DriverCardSkeleton, EmptyState } from '../../components/ui';
import EmptyDriversIllustration from '../../../assets/illustrations/empty-drivers.svg';
import ErrorIllustration from '../../../assets/illustrations/state-error.svg';
import { useAuth } from '../../hooks/useAuth';
import { subscribeToOwnerDrivers } from '../../services/ownerDriverListService';
import type { AppUser } from '../../types/models';
import type { OwnerStackParamList } from '../../types/navigation';
import { formatFcfa } from '../../utils/currency';

const SKELETON_ITEMS = [0, 1, 2];

type Props = {
  navigation: NativeStackNavigationProp<OwnerStackParamList, 'OwnerDrivers'>;
};

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

function InfoPill({ icon, label }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string }) {
  return (
    <View className="flex-row items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1">
      <Ionicons color="#3B63D4" name={icon} size={12} />
      <Text className="text-xs font-semibold text-brand-blue">{label}</Text>
    </View>
  );
}

function DocLine({ label, ok }: { label: string; ok: boolean }) {
  const { t } = useTranslation();
  return (
    <View className="flex-row items-center gap-2">
      <Ionicons
        color={ok ? '#16a34a' : '#ca8a04'}
        name={ok ? 'checkmark-circle-outline' : 'alert-circle-outline'}
        size={14}
      />
      <Text className={`text-xs font-semibold ${ok ? 'text-green-700' : 'text-amber-700'}`}>
        {label} {ok ? t('owner.doc_provided') : t('owner.doc_missing')}
      </Text>
    </View>
  );
}

function DriverCard({ driver }: { driver: AppUser }) {
  const { t } = useTranslation();
  const photoUrl = driver.driverProfile?.profilePhotoUrl ?? driver.photoUrl;
  const initials = driver.fullName
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const [backgroundColor, color] = statusColor(driver);
  const docs = documentCount(driver);

  function getStatusLabel() {
    if (driver.status === 'active' && driver.kycStatus === 'approved') return t('owner.status_active');
    if (driver.status === 'suspended') return t('owner.status_suspended');
    if (driver.status === 'banned') return t('owner.status_banned');
    if (driver.kycStatus === 'rejected') return t('owner.kyc_rejected');
    return t('owner.status_pending_validation');
  }

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
              <Text className="text-xs font-bold" style={{ color }}>{getStatusLabel()}</Text>
            </View>
          </View>

          <View className="mt-3 flex-row flex-wrap gap-2">
            <InfoPill icon="card-outline" label={`${t('owner.license_section')} ${driver.driverProfile?.licenseNumber || '-'}`} />
            <InfoPill
              icon="briefcase-outline"
              label={
                driver.driverProfile?.experienceYears
                  ? `${driver.driverProfile.experienceYears} ans`
                  : t('owner.exp_unknown')
              }
            />
            <InfoPill
              icon="cash-outline"
              label={formatFcfa(driver.driverProfile?.pricePerDay ?? 0)}
            />
          </View>

          <View className="mt-3 rounded-xl bg-slate-50 p-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-bold text-slate-700">{t('owner.kyc_docs')}</Text>
              <Text className="text-sm font-black text-brand-blue">{docs}/4</Text>
            </View>
            <View className="mt-2 gap-1.5">
              <DocLine label={t('admin.doc_photo')} ok={Boolean(driver.driverProfile?.profilePhotoUrl)} />
              <DocLine label={t('admin.doc_cni_front')} ok={Boolean(driver.documents?.nationalIdUrl)} />
              <DocLine label={t('admin.doc_cni_back')} ok={Boolean(driver.documents?.nationalIdBackUrl)} />
              <DocLine label={t('admin.doc_license')} ok={Boolean(driver.documents?.driverLicenseUrl)} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

export function OwnerDriversScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [drivers, setDrivers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    if (!user?.id) return undefined;

    setLoading(true);
    setError('');
    const unsubscribe = subscribeToOwnerDrivers(
      user.id,
      (items) => {
        setDrivers(items);
        setError('');
        setLoading(false);
      },
      () => {
        setError(t('owner.driver_load_error'));
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [retryToken, user?.id, t]);

  return (
    <Screen>
      <View className="gap-5">
        <BackButton navigation={navigation} />

        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="text-xs font-bold uppercase text-brand-blue">{t('owner.space_label')}</Text>
            <Text className="text-3xl font-black text-slate-950">{t('owner.my_drivers')}</Text>
            <Text className="mt-1 text-sm text-slate-500">{t('owner.drivers_subtitle')}</Text>
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
          <View>
            {SKELETON_ITEMS.map((item) => (
              <DriverCardSkeleton key={`owner-driver-skeleton-${item}`} />
            ))}
          </View>
        ) : error ? (
          <EmptyState
            ctaLabel={t('common.retry')}
            icon="cloud-offline-outline"
            illustration={ErrorIllustration}
            onCta={() => setRetryToken((value) => value + 1)}
            subtitle={t('errors.connection_retry')}
            title={error}
          />
        ) : drivers.length === 0 ? (
          <EmptyState
            ctaLabel={t('owner.add_driver_short')}
            icon="people-outline"
            illustration={EmptyDriversIllustration}
            onCta={() => navigation.navigate('DriverProfile')}
            subtitle={t('owner.no_drivers_subtitle')}
            title={t('owner.no_drivers_added')}
          />
        ) : (
          <View>
            <Text className="mb-3 text-sm font-bold text-slate-500">
              {drivers.length > 1
                ? t('owner.drivers_count_other', { count: drivers.length })
                : t('owner.drivers_count_one', { count: drivers.length })}
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
