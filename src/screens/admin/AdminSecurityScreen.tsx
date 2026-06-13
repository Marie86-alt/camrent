import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

import { PrimaryButton } from '../../components/PrimaryButton';
import { Screen } from '../../components/Screen';
import { EmptyState, SkeletonBlock, SkeletonLine, useToast } from '../../components/ui';
import { hapticError, hapticSuccess, hapticWarning } from '../../utils/haptics';
import { subscribeToAllUsers, updatePlatformSecuritySettings, updateUserAdminStatus } from '../../services/adminService';
import type { AdminRole, AppUser } from '../../types/models';
import { formatFcfa } from '../../utils/currency';

const adminRoles: AdminRole[] = ['super_admin', 'moderator', 'accountant'];
const SKELETON_ITEMS = [0, 1, 2];

function roleLabel(role?: AdminRole) {
  if (role === 'super_admin') return 'Super admin';
  if (role === 'accountant') return 'Comptable';
  return 'Moderateur';
}

export function AdminSecurityScreen() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null);
  const [commission, setCommission] = useState('10');
  const [deposit, setDeposit] = useState('100000');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    const unsubscribe = subscribeToAllUsers(
      (items) => {
        const admins = items.filter((user) => user.role === 'admin');
        setUsers(admins);
        setSelectedAdminId((current) => current ?? admins[0]?.id ?? null);
        setLoading(false);
        setError(null);
      },
      () => {
        setError('Impossible de charger les administrateurs.');
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  const selectedAdmin = useMemo(
    () => users.find((user) => user.id === selectedAdminId) ?? users[0],
    [selectedAdminId, users],
  ) as (AppUser & { adminRole?: AdminRole }) | undefined;

  async function setAdminRole(adminRole: AdminRole) {
    if (!selectedAdmin) return;

    try {
      setSaving(true);
      await updateUserAdminStatus(selectedAdmin.id, { adminRole } as Partial<AppUser>);
      hapticSuccess(); toast.success(`${selectedAdmin.fullName} est maintenant ${roleLabel(adminRole)}.`);
    } catch {
      hapticError(); toast.error("Le role admin n'a pas pu etre modifie.");
    } finally {
      setSaving(false);
    }
  }

  async function disableAdmin() {
    if (!selectedAdmin) return;

    try {
      setSaving(true);
      await updateUserAdminStatus(selectedAdmin.id, { status: 'suspended', adminLastActionReason: 'Compte admin desactive' });
      hapticSuccess(); toast.success('Le compte administrateur est suspendu.');
    } catch {
      hapticError(); toast.error("Le compte admin n'a pas pu etre desactive.");
    } finally {
      setSaving(false);
    }
  }

  async function saveSettings() {
    const rentalCommissionRate = Number(commission);
    const defaultDepositAmount = Number(deposit);

    if (!Number.isFinite(rentalCommissionRate) || !Number.isFinite(defaultDepositAmount)) {
      hapticWarning(); toast.warning('Renseignez des montants numeriques.');
      return;
    }

    try {
      setSaving(true);
      await updatePlatformSecuritySettings({ defaultDepositAmount, rentalCommissionRate });
      hapticSuccess(); toast.success('Parametres de securite mis a jour.');
    } catch {
      hapticError(); toast.error("Les parametres n'ont pas pu etre sauvegardes.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <View className="gap-5">
        <View>
          <Text className="text-xs font-bold uppercase text-brand-blue">Module 9</Text>
          <Text className="text-3xl font-black text-slate-950">Parametres & securite</Text>
          <Text className="mt-1 text-sm text-slate-500">Comptes admin, roles, audit et parametres de risque.</Text>
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
          <View className="rounded-xl bg-red-50 p-4">
            <Text className="font-semibold text-red-700">{error}</Text>
          </View>
        ) : (
          <View className="gap-5">
            <View className="rounded-xl bg-white p-4">
              <View className="mb-4 flex-row items-center gap-2">
                <Ionicons color="#3B63D4" name="shield-checkmark-outline" size={22} />
                <Text className="text-lg font-black text-slate-950">Comptes administrateurs</Text>
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
                  subtitle="Creez ou promouvez un compte admin pour gerer les permissions."
                  title="Aucun administrateur"
                />
              ) : null}

              {selectedAdmin ? (
                <View className="gap-3 pt-2">
                  <Text className="text-sm font-semibold text-slate-500">
                    Role actuel: {roleLabel(selectedAdmin.adminRole)}
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
                    Desactiver ce compte admin
                  </PrimaryButton>
                </View>
              ) : null}
            </View>

            <View className="rounded-xl bg-white p-4">
              <View className="mb-4 flex-row items-center gap-2">
                <Ionicons color="#3B63D4" name="settings-outline" size={22} />
                <Text className="text-lg font-black text-slate-950">Parametres financiers de securite</Text>
              </View>

              <View className="gap-3">
                <View>
                  <Text className="mb-2 text-sm font-semibold text-slate-500">Commission par type de location (%)</Text>
                  <TextInput
                    className="h-12 rounded-lg border border-slate-200 px-4 text-slate-950"
                    keyboardType="numeric"
                    onChangeText={setCommission}
                    value={commission}
                  />
                </View>
                <View>
                  <Text className="mb-2 text-sm font-semibold text-slate-500">Caution par defaut</Text>
                  <TextInput
                    className="h-12 rounded-lg border border-slate-200 px-4 text-slate-950"
                    keyboardType="numeric"
                    onChangeText={setDeposit}
                    value={deposit}
                  />
                  <Text className="mt-2 text-xs font-semibold text-slate-400">{formatFcfa(Number(deposit) || 0)}</Text>
                </View>
                <PrimaryButton loading={saving} onPress={saveSettings}>
                  Sauvegarder les parametres
                </PrimaryButton>
              </View>
            </View>

            <View className="rounded-xl bg-white p-4">
              <Text className="text-lg font-black text-slate-950">Logs d'activite admin</Text>
              <Text className="mt-2 text-sm text-slate-500">
                La structure est prete pour brancher une collection adminLogs depuis les actions sensibles.
              </Text>
            </View>
          </View>
        )}
      </View>
    </Screen>
  );
}
