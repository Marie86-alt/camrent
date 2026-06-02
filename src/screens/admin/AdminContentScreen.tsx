import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { doc, onSnapshot } from 'firebase/firestore';

import { CitySearchInput } from '../../components/CitySearchInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Screen } from '../../components/Screen';
import {
  createAdminNotification,
  createPromoBanner,
  sendAdminNotification,
  subscribeToPromoBanners,
  updateCoveredCities,
  updatePromoBanner,
} from '../../services/adminService';
import { db } from '../../services/firebase';
import type { CameroonCity, PromoBanner } from '../../types/models';

const audiences: Array<{ label: string; value: 'all' | 'clients' | 'owners' | 'drivers' }> = [
  { label: 'Tous', value: 'all' },
  { label: 'Clients', value: 'clients' },
  { label: 'Proprietaires', value: 'owners' },
  { label: 'Chauffeurs', value: 'drivers' },
];

export function AdminContentScreen() {
  const [banners, setBanners] = useState<PromoBanner[]>([]);
  const [title, setTitle] = useState('Promotion Autofix Pro');
  const [message, setMessage] = useState('Nouvelle offre disponible pour vos locations.');
  const [audience, setAudience] = useState<'all' | 'clients' | 'owners' | 'drivers'>('all');
  const [selectedCities, setSelectedCities] = useState<CameroonCity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToPromoBanners(
      (items) => {
        setBanners(items);
        setLoading(false);
        setError(null);
      },
      () => {
        setError('Impossible de charger les bannieres.');
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'adminSettings', 'coverage'), (snapshot) => {
      const cities = snapshot.data()?.cities;

      if (Array.isArray(cities)) {
        setSelectedCities(cities.filter((city): city is string => typeof city === 'string'));
      }
    });

    return unsubscribe;
  }, []);

  function toggleCity(city: CameroonCity) {
    setSelectedCities((current) =>
      current.includes(city) ? current.filter((item) => item !== city) : [...current, city],
    );
  }

  async function sendNotification() {
    try {
      setSaving(true);
      const notificationRef = await createAdminNotification({ audience, message, title });
      const result = await sendAdminNotification(notificationRef.id);
      Alert.alert(
        'Notification envoyee',
        `${result.sentCount} destinataire(s), ${result.failedCount} echec(s).`,
      );
    } catch (error) {
      Alert.alert(
        'Erreur',
        error instanceof Error ? error.message : "La notification n'a pas pu etre envoyee.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveBanner() {
    try {
      setSaving(true);
      await createPromoBanner({ title, message, isActive: true });
      Alert.alert('Banniere creee', "La banniere promotionnelle est ajoutee a l'administration.");
    } catch {
      Alert.alert('Erreur', "La banniere n'a pas pu etre creee.");
    } finally {
      setSaving(false);
    }
  }

  async function saveCities() {
    try {
      setSaving(true);
      await updateCoveredCities(selectedCities);
      Alert.alert('Villes sauvegardees', 'La couverture de la plateforme est mise a jour.');
    } catch {
      Alert.alert('Erreur', "Les villes couvertes n'ont pas pu etre sauvegardees.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <View className="gap-5">
        <View>
          <Text className="text-xs font-bold uppercase text-brand-blue">Module 8</Text>
          <Text className="text-3xl font-black text-slate-950">Contenu & communication</Text>
          <Text className="mt-1 text-sm text-slate-500">Notifications, bannieres et villes couvertes.</Text>
        </View>

        <View className="rounded-xl bg-white p-4">
          <View className="mb-4 flex-row items-center gap-2">
            <Ionicons color="#3B63D4" name="notifications-outline" size={22} />
            <Text className="text-lg font-black text-slate-950">Notification groupee</Text>
          </View>

          <View className="gap-3">
            <TextInput
              className="h-12 rounded-lg border border-slate-200 px-4 text-slate-950"
              onChangeText={setTitle}
              placeholder="Titre"
              value={title}
            />
            <TextInput
              className="min-h-20 rounded-lg border border-slate-200 px-4 py-3 text-slate-950"
              multiline
              onChangeText={setMessage}
              placeholder="Message"
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
              Envoyer la notification
            </PrimaryButton>
          </View>
        </View>

        <View className="rounded-xl bg-white p-4">
          <View className="mb-4 flex-row items-center gap-2">
            <Ionicons color="#3B63D4" name="megaphone-outline" size={22} />
            <Text className="text-lg font-black text-slate-950">Bannieres promotionnelles</Text>
          </View>
          <PrimaryButton loading={saving} onPress={saveBanner}>
            Ajouter une banniere active
          </PrimaryButton>

          {loading ? (
            <View className="items-center py-8">
              <ActivityIndicator color="#3B63D4" />
            </View>
          ) : error ? (
            <Text className="mt-4 font-semibold text-red-700">{error}</Text>
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
                        {banner.isActive ? 'Active' : 'Inactive'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View className="rounded-xl bg-white p-4">
          <Text className="mb-3 text-lg font-black text-slate-950">Villes couvertes</Text>
          <CitySearchInput
            label="Ajouter une ville couverte"
            onSelectCity={(city) => {
              if (city && !selectedCities.includes(city)) {
                setSelectedCities((current) => [...current, city]);
              }
            }}
            placeholder="Rechercher une ville"
            value={null}
          />
          <View className="mt-3 flex-row items-center justify-between gap-3">
            <Text className="flex-1 text-sm font-semibold text-slate-500">
              {selectedCities.length} ville(s) selectionnee(s)
            </Text>
            {selectedCities.length > 0 ? (
              <TouchableOpacity onPress={() => setSelectedCities([])}>
                <Text className="text-sm font-bold text-red-600">Tout supprimer</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          <View className="mt-4">
            <PrimaryButton loading={saving} onPress={saveCities}>
              Sauvegarder les villes
            </PrimaryButton>
          </View>
        </View>
      </View>
    </Screen>
  );
}
