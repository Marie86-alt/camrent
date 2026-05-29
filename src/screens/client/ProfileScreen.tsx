import { Ionicons } from '@expo/vector-icons';
import { Alert, Text, TouchableOpacity, View } from 'react-native';

import { Screen } from '../../components/Screen';
import { deleteAccount, logout } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';

type InfoRowProps = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  value?: string;
  last?: boolean;
};

function InfoRow({ icon, value, last }: InfoRowProps) {
  if (!value) return null;
  return (
    <View className={`flex-row items-center gap-3 px-4 py-3 ${last ? '' : 'border-b border-slate-100'}`}>
      <Ionicons color="#64748b" name={icon} size={18} />
      <Text className="flex-1 text-slate-700">{value}</Text>
    </View>
  );
}

export function ProfileScreen() {
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
      'Supprimer le compte',
      'Cette action supprimera votre profil CamRent. Elle est irreversible.',
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
    <Screen>
      <View className="gap-5 pt-4">
        <View className="items-center gap-3 py-4">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-cameroonGreen">
            <Text className="text-2xl font-black text-white">{initials}</Text>
          </View>
          <Text className="text-xl font-bold text-slate-950">{user?.fullName}</Text>
          <View className="rounded-full bg-green-50 px-3 py-1">
            <Text className="text-xs font-semibold text-cameroonGreen">
              {user?.role === 'owner' ? 'Proprietaire' : 'Client'}
            </Text>
          </View>
        </View>

        <View
          className="overflow-hidden rounded-xl bg-white"
          style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}
        >
          <InfoRow icon="mail-outline" value={user?.email} />
          <InfoRow icon="call-outline" value={user?.phone} />
          <InfoRow icon="location-outline" value={user?.city} last />
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          className="flex-row items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 p-4"
          onPress={logout}
        >
          <Ionicons color="#b91c1c" name="log-out-outline" size={20} />
          <Text className="font-semibold text-red-700">Se deconnecter</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          className="flex-row items-center justify-center gap-2 rounded-xl border border-red-200 bg-white p-4"
          onPress={confirmDeleteAccount}
        >
          <Ionicons color="#b91c1c" name="trash-outline" size={20} />
          <Text className="font-semibold text-red-700">Supprimer mon compte</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}
