import { Ionicons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';

import { BrandLogo } from '../../components/BrandLogo';
import { ProfilePhotoPicker } from '../../components/ProfilePhotoPicker';
import { Screen } from '../../components/Screen';
import { useBottomSheet, useToast } from '../../components/ui';
import { deleteAccount, logout } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';
import { hapticError } from '../../utils/haptics';

type InfoRowProps = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value?: string;
  last?: boolean;
};

function InfoRow({ icon, label, value, last }: InfoRowProps) {
  return (
    <View
      className={`flex-row items-center gap-3 px-4 py-3 ${last ? '' : 'border-b border-slate-100'}`}
    >
      <Ionicons color="#64748b" name={icon} size={18} />
      <Text className="w-24 text-sm font-semibold text-slate-500">{label}</Text>
      <Text className="flex-1 text-right text-sm text-slate-800">{value ?? '—'}</Text>
    </View>
  );
}

export function ProfileScreen() {
  const { user } = useAuth();
  const toast = useToast();
  const bottomSheet = useBottomSheet();

  const confirmDeleteAccount = () => {
    if (!user) return;

    bottomSheet.show({
      title: 'Supprimer le compte',
      subtitle: 'Cette action supprimera votre profil Autofix Pro de façon irréversible.',
      actions: [
        {
          label: 'Supprimer définitivement',
          variant: 'danger',
          icon: 'trash-outline',
          onPress: async () => {
            try {
              await deleteAccount(user.id);
            } catch {
              hapticError();
              toast.error('Reconnectez-vous puis réessayez la suppression du compte.');
            }
          },
        },
      ],
    });
  };

  return (
    <Screen topSafeArea>
      <View className="gap-5 px-5 pt-4">

        {/* ─── Header ─── */}
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
            <Text className="text-xs font-medium text-slate-400">Mon compte</Text>
            <Text className="mt-0.5 text-2xl font-black text-slate-950">
              {user?.fullName?.split(' ')[0] ?? 'Profil'} 👋
            </Text>
          </View>
        </View>

        <ProfilePhotoPicker roleLabel="Client" user={user} />

        {/* ─── Infos ─── */}
        <View
          className="overflow-hidden rounded-2xl bg-white"
          style={{
            shadowColor: '#000',
            shadowOpacity: 0.05,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 1 },
            elevation: 1,
          }}
        >
          <InfoRow icon="mail-outline" label="Email" value={user?.email} />
          <InfoRow icon="call-outline" label="Téléphone" value={user?.phone} />
          <InfoRow icon="location-outline" label="Ville" value={user?.city} last />
        </View>

        {/* ─── Actions ─── */}
        <TouchableOpacity
          activeOpacity={0.8}
          className="flex-row items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4"
          onPress={confirmDeleteAccount}
        >
          <Ionicons color="#b91c1c" name="trash-outline" size={20} />
          <Text className="font-semibold text-red-700">Supprimer mon compte</Text>
        </TouchableOpacity>

      </View>
    </Screen>
  );
}
