import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useMemo, useState } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CitySearchInput } from '../../components/CitySearchInput';
import { DatePickerField } from '../../components/DatePickerField';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Screen } from '../../components/Screen';
import { DriverCardSkeleton, EmptyState, useBottomSheet, useToast } from '../../components/ui';
import { hapticError, hapticSuccess, hapticWarning } from '../../utils/haptics';
import EmptyDriversIllustration from '../../../assets/illustrations/empty-drivers.svg';
import ErrorIllustration from '../../../assets/illustrations/state-error.svg';
import { createIndependentDriverByAdmin, subscribeToAllUsers, updateUserAdminStatus } from '../../services/adminService';
import { isOfflineError } from '../../services/networkGuard';
import { uploadDriverProfilePhoto, uploadUserDocument } from '../../services/storageService';
import { useAuth } from '../../hooks/useAuth';
import type { AppUser, CameroonCity } from '../../types/models';

type DriverFilter = 'all' | 'independent' | 'owner';
type DriverDocumentKey = 'profilePhoto' | 'nationalId' | 'nationalIdBack' | 'driverLicense' | 'criminalRecord';

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

function DriverRow({ driver, selected, onPress }: { driver: AppUser; selected: boolean; onPress: () => void }) {
  const { t } = useTranslation();
  const blocked = driver.status === 'suspended' || driver.status === 'banned';

  function statusLabel(status?: AppUser['status']) {
    if (status === 'suspended') return t('admin.driver_status_suspended');
    if (status === 'banned') return t('admin.driver_status_banned');
    if (status === 'pending_validation') return t('admin.driver_status_pending');
    return t('admin.driver_status_active');
  }

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
            {driver.city} - {driver.phone || t('admin.phone_missing')}
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
  const { t } = useTranslation();
  return (
    <View className="flex-row items-center justify-between border-b border-slate-100 py-3">
      <Text className="text-sm text-slate-500">{label}</Text>
      <Text className="max-w-[60%] text-right text-sm font-bold text-slate-900">{value || t('common.not_provided')}</Text>
    </View>
  );
}

export function AdminDriversScreen() {
  const { t } = useTranslation();
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
    criminalRecord: null,
    driverLicense: null,
    nationalId: null,
    nationalIdBack: null,
    profilePhoto: null,
  });
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const toast = useToast();
  const bottomSheet = useBottomSheet();
  const minLicenseExpiryDate = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const unsubscribe = subscribeToAllUsers(
      (items) => {
        const driverLikeUsers = items.filter((u) => u.role === 'driver');
        setDrivers(driverLikeUsers);
        setSelectedId((current) => current ?? driverLikeUsers[0]?.id ?? null);
        setLoading(false);
        setError(null);
      },
      () => {
        setError(t('admin.load_drivers_error'));
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [retryToken, t]);

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

  function kycLabel(status?: AppUser['kycStatus']) {
    if (status === 'approved') return t('admin.kyc_validated_label');
    if (status === 'rejected') return t('admin.kyc_rejected_label');
    return t('admin.kyc_pending_status');
  }

  function statusLabel(status?: AppUser['status']) {
    if (status === 'suspended') return t('admin.driver_status_suspended');
    if (status === 'banned') return t('admin.driver_status_banned');
    if (status === 'pending_validation') return t('admin.driver_status_pending');
    return t('admin.driver_status_active');
  }

  async function selectNewDocument(key: DriverDocumentKey) {
    const result = await pickImage();
    if (result.permissionDenied) { toast.info(t('admin.photo_permission')); return; }
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
      criminalRecord: null,
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
      hapticWarning(); toast.warning(t('admin.form_incomplete'));
      return;
    }

    try {
      setCreating(true);
      const [profilePhotoUrl, nationalIdUrl, nationalIdBackUrl, driverLicenseUrl, criminalRecordUrl] = await Promise.all([
        uploadDriverProfilePhoto(user.id, newDocuments.profilePhoto as string),
        uploadUserDocument(user.id, newDocuments.nationalId as string, 'admin-independent-national-id-front'),
        uploadUserDocument(user.id, newDocuments.nationalIdBack as string, 'admin-independent-national-id-back'),
        uploadUserDocument(user.id, newDocuments.driverLicense as string, 'admin-independent-driver-license'),
        uploadUserDocument(user.id, newDocuments.criminalRecord as string, 'admin-independent-criminal-record'),
      ]);

      await createIndependentDriverByAdmin({
        city: newCity,
        criminalRecordUrl,
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

      hapticSuccess(); toast.success(t('admin.driver_created'));
      resetCreateForm();
      setShowCreateForm(false);
    } catch (err) {
      if (isOfflineError(err)) {
        hapticWarning(); toast.warning((err as Error).message);
        return;
      }

      hapticError(); toast.error(t('admin.driver_create_error'));
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
      toast.warning(t('admin.kyc_docs_warning'));
      return;
    }

    try {
      setSaving(true);
      await updateUserAdminStatus(selectedDriver.id, payload);
      hapticSuccess(); toast.success(successMessage);
    } catch {
      hapticError(); toast.error(t('admin.action_error'));
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
          label: t('admin.action_confirm'),
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
      toast.info(t('admin.photo_missing_warning'));
      return;
    }

    confirmAction(
      t('admin.kyc_validate_title'),
      t('admin.kyc_validate_confirm', { name: selectedDriver.fullName }),
      { kycStatus: 'approved', status: 'active', adminLastActionReason: 'KYC chauffeur valide par admin' },
      t('admin.kyc_validated_success'),
    );
  }

  const docItems: Array<{ key: DriverDocumentKey; label: string }> = [
    { key: 'profilePhoto', label: t('admin.doc_photo') },
    { key: 'nationalId', label: t('admin.doc_cni_front') },
    { key: 'nationalIdBack', label: t('admin.doc_cni_back') },
    { key: 'driverLicense', label: t('admin.doc_license') },
    { key: 'criminalRecord', label: t('admin.doc_criminal_record') },
  ];

  const filterItems = [
    { label: t('common.all'), value: 'all' as const },
    { label: t('admin.filter_independent'), value: 'independent' as const },
    { label: t('admin.filter_owners_type'), value: 'owner' as const },
  ];

  return (
    <Screen topSafeArea>
      <View className="gap-5">
        <View>
          <Text className="text-xs font-bold uppercase text-brand-blue">Module 4</Text>
          <Text className="text-3xl font-black text-slate-950">{t('admin.drivers_title')}</Text>
          <Text className="mt-1 text-sm text-slate-500">{t('admin.drivers_subtitle')}</Text>
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1 rounded-xl bg-white p-4">
            <Text className="text-2xl font-black text-slate-950">{drivers.length}</Text>
            <Text className="text-xs font-semibold text-slate-500">{t('admin.drivers_total')}</Text>
          </View>
          <View className="flex-1 rounded-xl bg-white p-4">
            <Text className="text-2xl font-black text-amber-600">{pendingCount}</Text>
            <Text className="text-xs font-semibold text-slate-500">{t('admin.drivers_to_validate')}</Text>
          </View>
          <View className="flex-1 rounded-xl bg-white p-4">
            <Text className="text-2xl font-black text-red-600">{suspendedCount}</Text>
            <Text className="text-xs font-semibold text-slate-500">{t('admin.drivers_blocked')}</Text>
          </View>
        </View>

        <View className="flex-row flex-wrap gap-2">
          {filterItems.map((item) => (
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
              <Text className="text-lg font-black text-slate-950">{t('admin.add_independent_driver')}</Text>
              <Text className="mt-1 text-xs text-slate-500">{t('admin.add_driver_notice')}</Text>
            </View>
            <Ionicons color="#3B63D4" name={showCreateForm ? 'chevron-up' : 'add-circle-outline'} size={24} />
          </TouchableOpacity>

          {showCreateForm ? (
            <View className="mt-4 gap-3">
              <TextInput
                className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-slate-950"
                onChangeText={setNewFullName}
                placeholder={t('auth.full_name')}
                placeholderTextColor="#94a3b8"
                value={newFullName}
              />
              <TextInput
                autoCapitalize="none"
                className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-slate-950"
                keyboardType="email-address"
                onChangeText={setNewEmail}
                placeholder={t('auth.email')}
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
                placeholder={t('auth.password_temp')}
                placeholderTextColor="#94a3b8"
                secureTextEntry
                value={newPassword}
              />
              <CitySearchInput label={t('common.city')} onSelectCity={setNewCity} value={newCity} />
              <TextInput
                className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-slate-950"
                onChangeText={setNewLicenseNumber}
                placeholder={t('auth.license_number')}
                placeholderTextColor="#94a3b8"
                value={newLicenseNumber}
              />
              <TextInput
                className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-slate-950"
                onChangeText={setNewLicenseCategories}
                placeholder={t('auth.license_categories')}
                placeholderTextColor="#94a3b8"
                value={newLicenseCategories}
              />
              <DatePickerField
                label={t('auth.license_expiry')}
                minimumDate={minLicenseExpiryDate}
                onChange={setNewLicenseExpiryDate}
                placeholder="Ex: 03/06/2027"
                value={newLicenseExpiryDate}
              />
              <TextInput
                className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-slate-950"
                onChangeText={setNewNationalIdNumber}
                placeholder={t('auth.national_id')}
                placeholderTextColor="#94a3b8"
                value={newNationalIdNumber}
              />
              <TextInput
                className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-slate-950"
                keyboardType="numeric"
                onChangeText={setNewExperienceYears}
                placeholder={t('driver.experience_label')}
                placeholderTextColor="#94a3b8"
                value={newExperienceYears}
              />
              <TextInput
                className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-slate-950"
                keyboardType="numeric"
                onChangeText={setNewPricePerDay}
                placeholder={t('driver.daily_rate_label')}
                placeholderTextColor="#94a3b8"
                value={newPricePerDay}
              />

              <View className="flex-row flex-wrap gap-3">
                {docItems.map((item) => {
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
                {t('admin.add_independent_driver')}
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
          <EmptyState
            ctaLabel={t('common.retry')}
            icon="cloud-offline-outline"
            illustration={ErrorIllustration}
            onCta={() => setRetryToken((value) => value + 1)}
            subtitle={t('errors.connection_retry')}
            title={error}
          />
        ) : (
          <View className="gap-5">
            <View>
              <Text className="mb-3 text-lg font-black text-slate-950">{t('admin.driver_list_title')}</Text>
              {visibleDrivers.length === 0 ? (
                <EmptyState
                  icon="people-outline"
                  illustration={EmptyDriversIllustration}
                  subtitle={t('admin.empty_drivers_subtitle')}
                  title={t('admin.empty_drivers')}
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
                  <Text className="flex-1 text-xl font-black text-slate-950">{t('admin.driver_detail_title')}</Text>
                </View>

                {selectedDriverPhotoUrl ? (
                  <Image
                    className="h-28 w-28 self-center rounded-full bg-slate-100"
                    resizeMode="cover"
                    source={{ uri: selectedDriverPhotoUrl }}
                  />
                ) : null}

                <DetailLine label={t('admin.detail_name')} value={selectedDriver.fullName} />
                <DetailLine label={t('admin.detail_email')} value={selectedDriver.email} />
                <DetailLine label={t('admin.detail_phone')} value={selectedDriver.phone} />
                <DetailLine label={t('admin.detail_type')} value={selectedDriver.driverProfile?.isIndependent ? t('admin.driver_type_independent') : t('admin.driver_type_owner')} />
                <DetailLine label={t('admin.detail_status')} value={statusLabel(selectedDriver.status)} />
                <DetailLine label={t('admin.detail_kyc')} value={kycLabel(selectedDriver.kycStatus)} />
                <DetailLine label={t('admin.detail_license_no')} value={selectedDriver.driverProfile?.licenseNumber} />
                <DetailLine label={t('admin.detail_license_expiry')} value={selectedDriver.driverProfile?.licenseExpiryDate} />
                <DetailLine label={t('admin.detail_license_cats')} value={selectedDriver.driverProfile?.licenseCategories} />
                <DetailLine label={t('admin.detail_national_id')} value={selectedDriver.driverProfile?.nationalIdNumber} />
                <DetailLine
                  label={t('admin.detail_experience')}
                  value={selectedDriver.driverProfile?.experienceYears
                    ? t('admin.detail_experience_years', { count: selectedDriver.driverProfile.experienceYears })
                    : undefined}
                />
                <DetailLine label={t('admin.detail_availability')} value={selectedDriver.driverProfile?.isAvailable ? t('admin.detail_available') : undefined} />
                <DetailLine label={t('admin.detail_rating')} value={selectedDriver.ratingAverage ? `${selectedDriver.ratingAverage}/5` : undefined} />
                <DetailLine label={t('admin.detail_missions')} value={selectedDriver.missionsCount ?? 0} />
                <DetailLine label={t('admin.detail_driver_photo')} value={selectedDriver.driverProfile?.profilePhotoUrl ? t('admin.detail_provided') : undefined} />
                <DetailLine label={t('admin.detail_cni')} value={selectedDriver.documents?.nationalIdUrl ? t('admin.detail_provided') : undefined} />
                <DetailLine label={t('admin.detail_cni_back')} value={selectedDriver.documents?.nationalIdBackUrl ? t('admin.detail_provided') : undefined} />
                <DetailLine label={t('admin.detail_license_doc')} value={selectedDriver.documents?.driverLicenseUrl ? t('admin.detail_provided') : undefined} />
                <DetailLine label={t('admin.detail_criminal_record')} value={selectedDriver.documents?.criminalRecordUrl ? t('admin.detail_provided') : undefined} />
                <DetailLine label={t('admin.detail_last_action')} value={selectedDriver.adminLastActionReason} />

                <View className="gap-3 pt-2">
                  <PrimaryButton loading={saving} onPress={confirmKycApproval}>
                    {t('admin.validate_kyc_cta')}
                  </PrimaryButton>
                  <PrimaryButton
                    loading={saving}
                    onPress={() =>
                      confirmAction(
                        t('admin.suspend_title'),
                        t('admin.suspend_confirm', { name: selectedDriver.fullName }),
                        { status: 'suspended', adminLastActionReason: 'Suspension manuelle par admin' },
                        t('admin.driver_suspended'),
                      )
                    }
                  >
                    {t('admin.suspend_cta')}
                  </PrimaryButton>
                  <PrimaryButton
                    loading={saving}
                    onPress={() =>
                      confirmAction(
                        t('admin.unblock_title'),
                        t('admin.unblock_confirm', { name: selectedDriver.fullName }),
                        { status: 'active', adminLastActionReason: 'Déblocage manuel après investigation' },
                        t('admin.driver_unblocked'),
                      )
                    }
                  >
                    {t('admin.unblock_cta')}
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
