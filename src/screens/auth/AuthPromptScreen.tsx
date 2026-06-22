import { Ionicons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BrandLogo } from '../../components/BrandLogo';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Screen } from '../../components/Screen';

type Props = {
  navigation: {
    navigate: (screen: 'Login' | 'Register') => void;
    goBack: () => void;
    canGoBack: () => boolean;
  };
};

export function AuthPromptScreen({ navigation }: Props) {
  const { t } = useTranslation();

  const BENEFITS = [
    {
      icon: 'calendar-outline' as const,
      title: t('auth.benefit1_title'),
      desc: t('auth.benefit1_desc'),
    },
    {
      icon: 'location-outline' as const,
      title: t('auth.benefit2_title'),
      desc: t('auth.benefit2_desc'),
    },
    {
      icon: 'people-outline' as const,
      title: t('auth.benefit3_title'),
      desc: t('auth.benefit3_desc'),
    },
  ];

  return (
    <Screen topSafeArea>
      <View className="flex-1 px-5 pt-4">
        <View className="flex-row items-center justify-between">
          <BrandLogo variant="xs" />
          {navigation.canGoBack() && (
            <TouchableOpacity
              className="h-10 w-10 items-center justify-center rounded-full bg-white"
              onPress={() => navigation.goBack()}
              style={{
                elevation: 1,
                shadowColor: '#000',
                shadowOpacity: 0.06,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 1 },
              }}
            >
              <Ionicons color="#334155" name="close" size={20} />
            </TouchableOpacity>
          )}
        </View>

        <View className="mt-10 items-center gap-3">
          <View className="h-20 w-20 items-center justify-center rounded-3xl bg-brand-blue">
            <Ionicons color="white" name="car-sport-outline" size={40} />
          </View>
          <Text className="mt-2 text-center text-3xl font-black text-slate-950">
            {t('auth.prompt_title')}
          </Text>
          <Text className="text-center text-base text-slate-500">
            {t('auth.prompt_subtitle')}
          </Text>
        </View>

        <View className="mt-10 gap-3">
          {BENEFITS.map((b) => (
            <View
              key={b.title}
              className="flex-row items-center gap-4 rounded-2xl bg-white p-4"
              style={{
                elevation: 1,
                shadowColor: '#000',
                shadowOpacity: 0.05,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 1 },
              }}
            >
              <View className="h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                <Ionicons color="#3B63D4" name={b.icon} size={22} />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-slate-950">{b.title}</Text>
                <Text className="mt-0.5 text-xs leading-4 text-slate-500">{b.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <View className="mt-auto gap-3 pb-4 pt-8">
          <PrimaryButton onPress={() => navigation.navigate('Register')}>
            {t('auth.register_cta_free')}
          </PrimaryButton>
          <TouchableOpacity
            activeOpacity={0.7}
            className="items-center py-3"
            onPress={() => navigation.navigate('Login')}
          >
            <Text className="text-sm font-semibold text-slate-500">
              {t('auth.already_account')}{' '}
              <Text className="font-bold text-brand-blue">{t('auth.sign_in_link')}</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Screen>
  );
}
