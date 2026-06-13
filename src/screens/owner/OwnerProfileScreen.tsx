import { Ionicons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

import { ProfilePhotoPicker } from '../../components/ProfilePhotoPicker';
import { Screen } from '../../components/Screen';
import { useBottomSheet, useToast } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { deleteAccount, logout } from '../../services/authService';
import type { OwnerTabParamList } from '../../types/navigation';
import { hapticError } from '../../utils/haptics';

type Props = BottomTabScreenProps<OwnerTabParamList, 'OwnerProfile'>;

const TEXT = {
  deleteAccount: 'Supprimer mon compte',
  deleteConfirm: 'Votre profil sera supprime. Reconnectez-vous si Firebase demande une authentification recente.',
  deleteError: 'Reconnectez-vous puis reessayez la suppression du compte.',
  deleteErrorTitle: 'Suppression impossible',
  deleteTitle: 'Supprimer le compte proprietaire',
  email: 'Email',
  logout: 'Se deconnecter',
  phone: 'Telephone',
  role: 'Proprietaire',
  unknown: '-',
};

type InfoRowProps = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  last?: boolean;
  value?: string;
};

function InfoRow({ icon, label, last, value }: InfoRowProps) {
  return (
    <View className={`flex-row items-center gap-3 px-4 py-3 ${last ? '' : 'border-b border-slate-100'}`}>
      <Ionicons color="#64748b" name={icon} size={18} />
      <Text className="w-24 text-sm font-semibold text-slate-500">{label}</Text>
      <Text className="flex-1 text-right text-sm text-slate-800">{value ?? TEXT.unknown}</Text>
    </View>
  );
}

export function OwnerProfileScreen({}: Props) {
  const { user } = useAuth();
  const toast = useToast();
  const bottomSheet = useBottomSheet();

  const confirmDeleteAccount = () => {
    if (!user) return;
    bottomSheet.show({
      title: TEXT.deleteTitle,
      subtitle: TEXT.deleteConfirm,
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
              toast.error(TEXT.deleteError);
            }
          },
        },
      ],
    });
  };

  return (
    <Screen topSafeArea>
      <View className="gap-5 px-5 pt-4">
        <ProfilePhotoPicker roleLabel={TEXT.role} user={user} />

        <View
          className="overflow-hidden rounded-2xl bg-white"
          style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}
        >
          <InfoRow icon="mail-outline" label={TEXT.email} value={user?.email} />
          <InfoRow icon="call-outline" label={TEXT.phone} value={user?.phone} />
          <InfoRow icon="location-outline" label="Ville" value={user?.city} last />
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          className="flex-row items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white p-4"
          onPress={logout}
          style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}
        >
          <Ionicons color="#334155" name="log-out-outline" size={20} />
          <Text className="font-semibold text-slate-700">{TEXT.logout}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          className="flex-row items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4"
          onPress={confirmDeleteAccount}
        >
          <Ionicons color="#b91c1c" name="trash-outline" size={20} />
          <Text className="font-semibold text-red-700">{TEXT.deleteAccount}</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}
