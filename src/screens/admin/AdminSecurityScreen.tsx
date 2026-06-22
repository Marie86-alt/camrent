import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { PrimaryButton } from '../../components/PrimaryButton';
import { Screen } from '../../components/Screen';
import { EmptyState, SkeletonBlock, SkeletonLine, useToast } from '../../components/ui';
import { hapticError, hapticSuccess, hapticWarning } from '../../utils/haptics';
import ErrorIllustration from '../../../assets/illustrations/state-error.svg';
import { subscribeToAllUsers, updatePlatformSecuritySettings, updateUserAdminStatus } from '../../services/adminService';
import type { AdminRole, AppUser } from '../../types/models';
import { formatFcfa } from '../../utils/currency';

const adminRoles: AdminRole[] = ['super_admin', 'moderator', 'accountant'];
const SKELETON_ITEMS = [0, 1, 2];

export function AdminSecurityScreen() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null);
  const [commission, setCommission] = useState('10');
  const [deposit, setDeposit] = useState('100000');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const toast = useToast();

  function roleLabel(role?: AdminRole) {
    if (role === 'super_admin') return t('admin.role_super_admin');
    if (role === 'accountant') return t('admin.role_accountant');
    return t('admin.role_moderator');
  }

  useEffect(() => {
    setLoading(true);
    setError(null);
    const unsubscribe = subscribeToAllUsers(
      (items) => {
        const admins = items.filter((user) => user.role === 'admin');
        setUsers(admins);
        setSelectedAdminId((current) => current ?? admins[0]?.id ?? null);
        setLoading(false);
        setError(null);
      },
      () => {
        setError(t('admin.load_admins_error'));
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [retryToken, t]);

  const selectedAdmin = useMemo(
    () => users.find((user) => user.id === selectedAdminId) ?? users[0],
    [selectedAdminId, users],
  ) as (AppUser & { adminRole?: AdminRole }) | undefined;

  async function setAdminRole(adminRole: AdminRole) {
    if (!selectedAdmin) return;

    try {
      setSaving(true);
      await updateUserAdminStatus(selectedAdmin.id, { adminRole } as Partial<AppUser>);
      hapticSuccess(); toast.success(t('admin.role_set_success', { name: selectedAdmin.fullName, role: roleLabel(adminRole) }));
    } catch {
      hapticError(); toast.error(t('admin.role_set_error'));
    } finally {
      setSaving(false);
    }
  }

  async function disableAdmin() {
    if (!selectedAdmin) return;

    try {
      setSaving(true);
      await updateUserAdminStatus(selectedAdmin.id, { status: 'suspended', adminLastActionReason: 'Compte admin desactive' });
      hapticSuccess(); toast.success(t('admin.disable_admin_success'));
    } catch {
      hapticError(); toast.error(t('admin.disable_admin_error'));
    } finally {
      setSaving(false);
    }
  }

  async function saveSettings() {
    const rentalCommissionRate = Number(commission);
    const defaultDepositAmount = Number(deposit);

    if (!Number.isFinite(rentalCommissionRate) || !Number.isFinite(defaultDepositAmount)) {
      hapticWarning(); toast.warning(t('admin.numeric_warning'));
      return;
    }

    try {
      setSaving(true);
      await updatePlatformSecuritySettings({ defaultDepositAmount, rentalCommissionRate });
      hapticSuccess(); toast.success(t('admin.save_settings_success'));
    } catch {
      hapticError(); toast.error(t('admin.save_settings_error'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <View className="gap-5">
        <View>
          <Text className="text-xs font-bold uppercase text-brand-blue">Module 9</Text>
          <Text className="text-3xl font-black text-slate-950">{t('admin.security_title')}</Text>
          <Text className="mt-1 text-sm text-slate-500">{t('admin.security_subtitle')}</Text>
        </View>

        {loading ? (
          <View className="gap-3">
            {SKELETON_ITEMS.map((item) => (
              <View className="rounded-xl bg-white p-4" key={`security-skeleton-${item}`}>
                <SkeletonLine width="55%" />
                <SkeletonBlock className="mt-3" height={14} rounded="sm" width="75%" />
              </View>
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
            <View className="rounded-xl bg-white p-4">
              <View className="mb-4 flex-row items-center gap-2">
                <Ionicons color="#3B63D4" name="shield-checkmark-outline" size={22} />
                <Text className="text-lg font-black text-slate-950">{t('admin.admin_accounts')}</Text>
              </View>

              {users.map((admin) => (
                <TouchableOpacity
                  className={`mb-3 rounded-lg border p-3 ${selectedAdmin?.id === admin.id ? 'border-brand-blue' : 'border-slate-100'}`}
                  key={admin.id}
                  onPress={() => setSelectedAdminId(admin.id)}
                >
                  <Text className="font-black text-slate-950">{admin.fullName}</Text>
                  <Text className="mt-1 text-sm text-slate-500">{admin.email}</Text>
                  <Text className="mt-1 text-xs font-bold text-slate-400">{admin.status ?? 'active'}</Text>
                </TouchableOpacity>
              ))}

              {users.length === 0 ? (
                <EmptyState
                  icon="shield-checkmark-outline"
                  subtitle={t('admin.no_admins_subtitle')}
                  title={t('admin.no_admins')}
                />
              ) : null}

              {selectedAdmin ? (
                <View className="gap-3 pt-2">
                  <Text className="text-sm font-semibold text-slate-500">
                    {t('admin.role_current', { role: roleLabel(selectedAdmin.adminRole) })}
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {adminRoles.map((item) => (
                      <TouchableOpacity
                        className="rounded-full bg-slate-100 px-4 py-2"
                        key={item}
                        onPress={() => setAdminRole(item)}
                      >
                        <Text className="text-xs font-bold text-slate-700">{roleLabel(item)}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <PrimaryButton loading={saving} onPress={disableAdmin}>
                    {t('admin.disable_admin_cta')}
                  </PrimaryButton>
                </View>
              ) : null}
            </View>

            <View className="rounded-xl bg-white p-4">
              <View className="mb-4 flex-row items-center gap-2">
                <Ionicons color="#3B63D4" name="settings-outline" size={22} />
                <Text className="text-lg font-black text-slate-950">{t('admin.finance_settings')}</Text>
              </View>

              <View className="gap-3">
                <View>
                  <Text className="mb-2 text-sm font-semibold text-slate-500">{t('admin.commission_type_label')}</Text>
                  <TextInput
                    className="h-12 rounded-lg border border-slate-200 px-4 text-slate-950"
                    keyboardType="numeric"
                    onChangeText={setCommission}
                    value={commission}
                  />
                </View>
                <View>
                  <Text className="mb-2 text-sm font-semibold text-slate-500">{t('admin.deposit_default_label')}</Text>
                  <TextInput
                    className="h-12 rounded-lg border border-slate-200 px-4 text-slate-950"
                    keyboardType="numeric"
                    onChangeText={setDeposit}
                    value={deposit}
                  />
                  <Text className="mt-2 text-xs font-semibold text-slate-400">{formatFcfa(Number(deposit) || 0)}</Text>
                </View>
                <PrimaryButton loading={saving} onPress={saveSettings}>
                  {t('admin.save_settings_cta')}
                </PrimaryButton>
              </View>
            </View>

            <View className="rounded-xl bg-white p-4">
              <Text className="text-lg font-black text-slate-950">{t('admin.activity_logs')}</Text>
              <Text className="mt-2 text-sm text-slate-500">{t('admin.activity_logs_subtitle')}</Text>
            </View>
          </View>
        )}
      </View>
    </Screen>
  );
}
