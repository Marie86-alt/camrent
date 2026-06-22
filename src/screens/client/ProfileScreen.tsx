import { Ionicons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BrandLogo } from '../../components/BrandLogo';
import { ProfilePhotoPicker } from '../../components/ProfilePhotoPicker';
import { Screen } from '../../components/Screen';
import { useBottomSheet, useToast } from '../../components/ui';
import { deleteAccount, logout } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
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
  const { t } = useTranslation();
  const { user } = useAuth();
  const toast = useToast();
  const bottomSheet = useBottomSheet();
  const { current, setLanguage } = useLanguage();

  const confirmDeleteAccount = () => {
    if (!user) return;

    bottomSheet.show({
      title: t('profile.delete_account_confirm'),
      subtitle: t('profile.delete_account_subtitle'),
      actions: [
        {
          label: t('profile.delete_account_cta'),
          variant: 'danger',
          icon: 'trash-outline',
          onPress: async () => {
            try {
              await deleteAccount(user.id);
            } catch {
              hapticError();
              toast.error(t('profile.delete_error'));
            }
          },
        },
      ],
    });
  };

  return (
    <Screen topSafeArea>
      <View className="gap-5 px-5 pt-4">

        {/* Header */}
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
            <Text className="text-xs font-medium text-slate-400">{t('profile.my_account')}</Text>
            <Text className="mt-0.5 text-2xl font-black text-slate-950">
              {user?.fullName?.split(' ')[0] ?? t('profile.title')} 👋
            </Text>
          </View>
        </View>

        <ProfilePhotoPicker roleLabel={t('profile.role_client')} user={user} />

        {/* Infos */}
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
          <InfoRow icon="mail-outline" label={t('profile.email')} value={user?.email} />
          <InfoRow icon="call-outline" label={t('profile.phone')} value={user?.phone} />
          <InfoRow icon="location-outline" label={t('profile.city')} value={user?.city} last />
        </View>

        {/* Language selector */}
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
          <View className="flex-row items-center gap-3 px-4 py-3">
            <Ionicons color="#64748b" name="language-outline" size={18} />
            <Text className="w-24 text-sm font-semibold text-slate-500">{t('profile.language')}</Text>
            <View className="ml-auto flex-row gap-2">
              {(['fr', 'en'] as const).map((lang) => (
                <TouchableOpacity
                  key={lang}
                  activeOpacity={0.8}
                  onPress={() => setLanguage(lang)}
                  className={`rounded-lg px-3 py-1.5 ${current === lang ? 'bg-brand-blue' : 'bg-slate-100'}`}
                >
                  <Text className={`text-sm font-bold ${current === lang ? 'text-white' : 'text-slate-500'}`}>
                    {lang.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Delete account */}
        <TouchableOpacity
          activeOpacity={0.8}
          className="flex-row items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4"
          onPress={confirmDeleteAccount}
        >
          <Ionicons color="#b91c1c" name="trash-outline" size={20} />
          <Text className="font-semibold text-red-700">{t('profile.delete_account')}</Text>
        </TouchableOpacity>

      </View>
    </Screen>
  );
}
