import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Screen } from '../../components/Screen';
import type { AdminStackParamList } from '../../types/navigation';

type MoreNavProp = NativeStackNavigationProp<AdminStackParamList>;

type ScreenKey = keyof Pick<
  AdminStackParamList,
  'AdminFinanceDetail' | 'AdminReviewsDetail' | 'AdminContentDetail' | 'AdminSecurityDetail'
>;

type Module = {
  description: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  screen: ScreenKey;
};

export function AdminMoreScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<MoreNavProp>();

  const modules: Module[] = [
    { description: t('admin.module_finance_desc'), icon: 'wallet-outline', label: t('admin.module_finance'), screen: 'AdminFinanceDetail' },
    { description: t('admin.module_reviews_desc'), icon: 'star-outline', label: t('admin.module_reviews'), screen: 'AdminReviewsDetail' },
    { description: t('admin.module_communication_desc'), icon: 'megaphone-outline', label: t('admin.module_communication'), screen: 'AdminContentDetail' },
    { description: t('admin.module_security_desc'), icon: 'shield-checkmark-outline', label: t('admin.module_security'), screen: 'AdminSecurityDetail' },
  ];

  return (
    <Screen topSafeArea>
      <View className="gap-5">
        <View>
          <Text className="text-xs font-bold uppercase text-brand-blue">{t('admin.dashboard')}</Text>
          <Text className="text-3xl font-black text-slate-950">{t('admin.more_title')}</Text>
          <Text className="mt-1 text-sm text-slate-500">{t('admin.more_subtitle')}</Text>
        </View>

        <View className="gap-3">
          {modules.map((item) => (
            <TouchableOpacity
              activeOpacity={0.85}
              className="flex-row items-center gap-4 rounded-xl border border-slate-100 bg-white p-4"
              key={item.screen}
              onPress={() => navigation.navigate(item.screen)}
              style={{
                shadowColor: '#000',
                shadowOpacity: 0.04,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 1 },
                elevation: 1,
              }}
            >
              <View className="h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                <Ionicons color="#334155" name={item.icon} size={22} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-black text-slate-950">{item.label}</Text>
                <Text className="mt-0.5 text-xs text-slate-500">{item.description}</Text>
              </View>
              <Ionicons color="#94a3b8" name="chevron-forward" size={18} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Screen>
  );
}
