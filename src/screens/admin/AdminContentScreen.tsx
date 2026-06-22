import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { doc, onSnapshot } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

import { CitySearchInput } from '../../components/CitySearchInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Screen } from '../../components/Screen';
import { EmptyState, SkeletonBlock, SkeletonLine, useToast } from '../../components/ui';
import { hapticError, hapticSuccess, hapticWarning } from '../../utils/haptics';
import ErrorIllustration from '../../../assets/illustrations/state-error.svg';
import {
  createAdminNotification,
  createPromoBanner,
  sendAdminNotification,
  subscribeToPromoBanners,
  updateCoveredCities,
  updatePromoBanner,
} from '../../services/adminService';
import { db } from '../../services/firebase';
import { isOfflineError } from '../../services/networkGuard';
import type { CameroonCity, PromoBanner } from '../../types/models';

const SKELETON_ITEMS = [0, 1, 2];

export function AdminContentScreen() {
  const { t } = useTranslation();
  const [banners, setBanners] = useState<PromoBanner[]>([]);
  const [title, setTitle] = useState('Promotion Autofix Pro');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState<'all' | 'clients' | 'owners' | 'drivers'>('all');
  const [selectedCities, setSelectedCities] = useState<CameroonCity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const toast = useToast();

  const audiences: Array<{ label: string; value: 'all' | 'clients' | 'owners' | 'drivers' }> = [
    { label: t('admin.audience_all'), value: 'all' },
    { label: t('admin.audience_clients'), value: 'clients' },
    { label: t('admin.audience_owners'), value: 'owners' },
    { label: t('admin.audience_drivers'), value: 'drivers' },
  ];

  useEffect(() => {
    setLoading(true);
    setError(null);
    const unsubscribe = subscribeToPromoBanners(
      (items) => {
        setBanners(items);
        setLoading(false);
        setError(null);
      },
      () => {
        setError(t('admin.load_banners_error'));
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [retryToken, t]);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'adminSettings', 'coverage'), (snapshot) => {
      const cities = snapshot.data()?.cities;

      if (Array.isArray(cities)) {
        setSelectedCities(cities.filter((city): city is string => typeof city === 'string'));
      }
    });

    return unsubscribe;
  }, []);

  async function sendNotification() {
    try {
      setSaving(true);
      const notificationRef = await createAdminNotification({ audience, message, title });
      const result = await sendAdminNotification(notificationRef.id);
      hapticSuccess(); toast.success(t('admin.send_success', { sent: result.sentCount, failed: result.failedCount }));
    } catch (err) {
      if (isOfflineError(err)) {
        hapticWarning(); toast.warning((err as Error).message);
        return;
      }

      hapticError(); toast.error(t('admin.send_error'));
    } finally {
      setSaving(false);
    }
  }

  async function saveBanner() {
    try {
      setSaving(true);
      await createPromoBanner({ title, message, isActive: true });
      hapticSuccess(); toast.success(t('admin.banner_created'));
    } catch {
      hapticError(); toast.error(t('admin.banner_create_error'));
    } finally {
      setSaving(false);
    }
  }

  async function saveCities() {
    try {
      setSaving(true);
      await updateCoveredCities(selectedCities);
      hapticSuccess(); toast.success(t('admin.cities_saved'));
    } catch {
      hapticError(); toast.error(t('admin.cities_save_error'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <View className="gap-5">
        <View>
          <Text className="text-xs font-bold uppercase text-brand-blue">Module 8</Text>
          <Text className="text-3xl font-black text-slate-950">{t('admin.content_title')}</Text>
          <Text className="mt-1 text-sm text-slate-500">{t('admin.content_subtitle')}</Text>
        </View>

        <View className="rounded-xl bg-white p-4">
          <View className="mb-4 flex-row items-center gap-2">
            <Ionicons color="#3B63D4" name="notifications-outline" size={22} />
            <Text className="text-lg font-black text-slate-950">{t('admin.notification_group')}</Text>
          </View>

          <View className="gap-3">
            <TextInput
              className="h-12 rounded-lg border border-slate-200 px-4 text-slate-950"
              onChangeText={setTitle}
              placeholder={t('admin.content_title')}
              placeholderTextColor="#94a3b8"
              value={title}
            />
            <TextInput
              className="min-h-20 rounded-lg border border-slate-200 px-4 py-3 text-slate-950"
              multiline
              onChangeText={setMessage}
              placeholder={t('admin.notification_group')}
              placeholderTextColor="#94a3b8"
              value={message}
            />
            <View className="flex-row flex-wrap gap-2">
              {audiences.map((item) => (
                <TouchableOpacity
                  className={`rounded-full px-4 py-2 ${audience === item.value ? 'bg-slate-950' : 'bg-slate-100'}`}
                  key={item.value}
                  onPress={() => setAudience(item.value)}
                >
                  <Text className={`text-xs font-bold ${audience === item.value ? 'text-white' : 'text-slate-600'}`}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <PrimaryButton loading={saving} onPress={sendNotification}>
              {t('admin.send_notification_cta')}
            </PrimaryButton>
          </View>
        </View>

        <View className="rounded-xl bg-white p-4">
          <View className="mb-4 flex-row items-center gap-2">
            <Ionicons color="#3B63D4" name="megaphone-outline" size={22} />
            <Text className="text-lg font-black text-slate-950">{t('admin.banners_title')}</Text>
          </View>
          <PrimaryButton loading={saving} onPress={saveBanner}>
            {t('admin.add_banner_cta')}
          </PrimaryButton>

          {loading ? (
            <View className="mt-4 gap-3">
              {SKELETON_ITEMS.map((item) => (
                <View className="rounded-lg border border-slate-100 p-3" key={`banner-skeleton-${item}`}>
                  <SkeletonLine width="45%" />
                  <SkeletonBlock className="mt-3" height={14} rounded="sm" width="80%" />
                </View>
              ))}
            </View>
          ) : error ? (
            <EmptyState
              ctaLabel={t('common.retry')}
              icon="cloud-offline-outline"
              illustration={ErrorIllustration}
              onCta={() => setRetryToken((value) => value + 1)}
              subtitle={t('errors.connection_retry')}
              title={error}
            />
          ) : banners.length === 0 ? (
            <EmptyState
              icon="megaphone-outline"
              subtitle={t('admin.empty_banners_subtitle')}
              title={t('admin.empty_banners')}
            />
          ) : (
            <View className="mt-4 gap-3">
              {banners.map((banner) => (
                <View className="rounded-lg border border-slate-100 p-3" key={banner.id}>
                  <View className="flex-row items-start justify-between gap-3">
                    <View className="flex-1">
                      <Text className="font-black text-slate-950">{banner.title}</Text>
                      <Text className="mt-1 text-sm text-slate-500">{banner.message}</Text>
                    </View>
                    <TouchableOpacity
                      className={`rounded-full px-3 py-1 ${banner.isActive ? 'bg-blue-50' : 'bg-slate-100'}`}
                      onPress={() => updatePromoBanner(banner.id, { isActive: !banner.isActive })}
                    >
                      <Text className={`text-xs font-bold ${banner.isActive ? 'text-blue-700' : 'text-slate-500'}`}>
                        {banner.isActive ? t('admin.banner_active') : t('admin.banner_inactive')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View className="rounded-xl bg-white p-4">
          <Text className="mb-3 text-lg font-black text-slate-950">{t('admin.cities_title')}</Text>
          <CitySearchInput
            label={t('admin.cities_add_label')}
            onSelectCity={(city) => {
              if (city && !selectedCities.includes(city)) {
                setSelectedCities((current) => [...current, city]);
              }
            }}
            placeholder={t('admin.cities_search_placeholder')}
            value={null}
          />
          <View className="mt-3 flex-row items-center justify-between gap-3">
            <Text className="flex-1 text-sm font-semibold text-slate-500">
              {t('admin.cities_count', { count: selectedCities.length })}
            </Text>
            {selectedCities.length > 0 ? (
              <TouchableOpacity onPress={() => setSelectedCities([])}>
                <Text className="text-sm font-bold text-red-600">{t('admin.cities_clear')}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          <View className="mt-4">
            <PrimaryButton loading={saving} onPress={saveCities}>
              {t('admin.cities_save_cta')}
            </PrimaryButton>
          </View>
        </View>
      </View>
    </Screen>
  );
}
