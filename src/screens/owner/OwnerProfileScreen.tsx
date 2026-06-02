import { Ionicons } from '@expo/vector-icons';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

import { ProfilePhotoPicker } from '../../components/ProfilePhotoPicker';
import { Screen } from '../../components/Screen';
import { useAuth } from '../../hooks/useAuth';
import { deleteAccount, logout } from '../../services/authService';
import type { KycStatus } from '../../types/models';
import type { OwnerTabParamList } from '../../types/navigation';

type KycKey = KycStatus | 'none';

type Props = BottomTabScreenProps<OwnerTabParamList, 'OwnerProfile'>;

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

const KYC_CONFIG: Record<
  KycKey,
  { bg: string; border: string; color: string; icon: React.ComponentProps<typeof Ionicons>['name']; title: string; subtitle: string }
> = {
  approved: {
    bg: '#eff6ff',
    border: '#bfdbfe',
    color: '#3B63D4',
    icon: 'shield-checkmark',
    title: 'KYC validé',
    subtitle: 'Votre profil chauffeur est approuvé par l\'administration.',
  },
  pending: {
    bg: '#fffbeb',
    border: '#fde68a',
    color: '#ca8a04',
    icon: 'time-outline',
    title: 'Vérification en cours',
    subtitle: 'L\'administration examine vos documents. Vous serez notifié.',
  },
  rejected: {
    bg: '#fef2f2',
    border: '#fecaca',
    color: '#b91c1c',
    icon: 'close-circle-outline',
    title: 'KYC refusé',
    subtitle: 'Corrigez vos informations et resoumettez le profil chauffeur.',
  },
  none: {
    bg: '#f8fafc',
    border: '#e2e8f0',
    color: '#64748b',
    icon: 'id-card-outline',
    title: 'Profil chauffeur à compléter',
    subtitle: 'Ajoutez votre permis, CNI et photo pour être validé.',
  },
};

function KycCard({
  kycStatus,
  onPress,
}: {
  kycStatus?: string | null;
  onPress: () => void;
}) {
  const key = (kycStatus ?? 'none') as KycKey;
  const cfg = KYC_CONFIG[key] ?? KYC_CONFIG.none;
  const showCta = key === 'none' || key === 'rejected';

  return (
    <TouchableOpacity
      activeOpacity={showCta ? 0.8 : 1}
      className="rounded-2xl p-4"
      onPress={showCta ? onPress : undefined}
      style={{ backgroundColor: cfg.bg, borderWidth: 1, borderColor: cfg.border }}
    >
      <View className="flex-row items-center gap-3">
        <View
          className="h-11 w-11 items-center justify-center rounded-full"
          style={{ backgroundColor: cfg.color + '20' }}
        >
          <Ionicons color={cfg.color} name={cfg.icon} size={22} />
        </View>
        <View className="flex-1">
          <Text className="font-black" style={{ color: cfg.color }}>
            {cfg.title}
          </Text>
          <Text className="mt-0.5 text-xs text-slate-500">{cfg.subtitle}</Text>
        </View>
        {showCta ? (
          <Ionicons color={cfg.color} name="chevron-forward" size={18} />
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

export function OwnerProfileScreen(_props: Props) {
  const { user } = useAuth();
  const { navigation } = _props;

  const confirmDeleteAccount = () => {
    if (!user) return;

    Alert.alert(
      'Supprimer le compte propriétaire',
      'Votre profil sera supprimé. Reconnectez-vous si Firebase demande une authentification récente.',
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

        <ProfilePhotoPicker roleLabel="Propriétaire" user={user} />

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

        {/* ─── KYC ─── */}
        <KycCard
          kycStatus={user?.kycStatus}
          onPress={() => navigation.getParent()?.navigate('DriverProfile')}
        />

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
