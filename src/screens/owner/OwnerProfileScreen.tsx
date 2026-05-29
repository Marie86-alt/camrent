import { Ionicons } from '@expo/vector-icons';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

import { Screen } from '../../components/Screen';
import { useAuth } from '../../hooks/useAuth';
import { deleteAccount, logout } from '../../services/authService';
import type { OwnerTabParamList } from '../../types/navigation';

type Props = BottomTabScreenProps<OwnerTabParamList, 'OwnerProfile'>;

type SettingRowProps = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value?: string;
};

function SettingRow({ icon, label, value }: SettingRowProps) {
  return (
    <View className="flex-row items-center gap-3 border-b border-slate-100 px-4 py-3">
      <Ionicons color="#64748b" name={icon} size={19} />
      <Text className="flex-1 font-semibold text-slate-800">{label}</Text>
      {value ? <Text className="text-sm text-slate-500">{value}</Text> : null}
    </View>
  );
}

export function OwnerProfileScreen(_props: Props) {
  const { user } = useAuth();

  const initials = user?.fullName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const confirmDeleteAccount = () => {
    if (!user) return;

    Alert.alert(
      'Supprimer le compte proprietaire',
      'Votre profil sera supprime. Reconnectez-vous si Firebase demande une authentification recente.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount(user.id);
            } catch {
              Alert.alert('Suppression impossible', 'Reconnectez-vous puis reessayez la suppression du compte.');
            }
          },
        },
      ],
    );
  };

  return (
    <Screen topSafeArea>
      <View className="gap-5">
        <View className="items-center gap-3 py-3">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-cameroonGreen">
            <Text className="text-2xl font-black text-white">{initials}</Text>
          </View>
          <Text className="text-xl font-bold text-slate-950">{user?.fullName}</Text>
          <View className="rounded-full bg-green-50 px-3 py-1">
            <Text className="text-xs font-semibold text-cameroonGreen">Proprietaire</Text>
          </View>
        </View>

        <View className="overflow-hidden rounded-xl bg-white">
          <SettingRow icon="mail-outline" label="Email" value={user?.email} />
          <SettingRow icon="call-outline" label="Telephone" value={user?.phone} />
          <SettingRow icon="location-outline" label="Ville" value={user?.city} />
          <SettingRow icon="notifications-outline" label="Notifications reservations" value="Activees" />
          <SettingRow icon="card-outline" label="Paiements" value="MTN, Orange, Carte" />
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          className="flex-row items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white p-4"
          onPress={logout}
        >
          <Ionicons color="#334155" name="log-out-outline" size={20} />
          <Text className="font-semibold text-slate-700">Se deconnecter</Text>
        </TouchableOpacity>

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
