import { Ionicons } from '@expo/vector-icons';
import { Alert, Text, TouchableOpacity, View } from 'react-native';

import { ProfilePhotoPicker } from '../../components/ProfilePhotoPicker';
import { Screen } from '../../components/Screen';
import { deleteAccount, logout } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';

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

  const confirmDeleteAccount = () => {
    if (!user) return;

    Alert.alert(
      'Supprimer le compte',
      'Cette action supprimera votre profil Autofix Pro de façon irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount(user.id);
            } catch {
              Alert.alert(
                'Suppression impossible',
                'Reconnectez-vous puis réessayez la suppression du compte.',
              );
            }
          },
        },
      ],
    );
  };

  return (
    <Screen topSafeArea>
      <View className="gap-5 px-5 pt-4">

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
          className="flex-row items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white p-4"
          onPress={logout}
          style={{
            shadowColor: '#000',
            shadowOpacity: 0.04,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 1 },
            elevation: 1,
          }}
        >
          <Ionicons color="#334155" name="log-out-outline" size={20} />
          <Text className="font-semibold text-slate-700">Se déconnecter</Text>
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
