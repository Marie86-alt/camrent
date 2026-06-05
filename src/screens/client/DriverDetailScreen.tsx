import { Ionicons } from '@expo/vector-icons';
import { Image, Text, TouchableOpacity, View } from 'react-native';

import { BrandLogo } from '../../components/BrandLogo';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Screen } from '../../components/Screen';
import { useAuthStore } from '../../store/authStore';
import { useBookingDraftStore } from '../../store/bookingDraftStore';
import type { AppUser } from '../../types/models';
import { formatFcfa } from '../../utils/currency';

type Props = {
  navigation: any;
  route: {
    params: {
      driver: AppUser;
    };
  };
};

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value?: string;
}) {
  return (
    <View className="flex-row items-center gap-3 rounded-2xl bg-white p-4">
      <View className="h-10 w-10 items-center justify-center rounded-full bg-blue-50">
        <Ionicons color="#3B63D4" name={icon} size={20} />
      </View>
      <View className="flex-1">
        <Text className="text-xs font-semibold uppercase text-slate-400">{label}</Text>
        <Text className="mt-0.5 text-base font-bold text-slate-950">{value ?? 'Non renseigné'}</Text>
      </View>
    </View>
  );
}

function StarRow({ rating }: { rating?: number }) {
  const rounded = Math.round(rating ?? 0);
  return (
    <View className="flex-row items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          color={star <= rounded ? '#ca8a04' : '#cbd5e1'}
          name={star <= rounded ? 'star' : 'star-outline'}
          size={18}
        />
      ))}
      <Text className="ml-1 text-sm font-bold text-slate-700">
        {rating ? `${rating}/5` : 'Pas encore noté'}
      </Text>
    </View>
  );
}

export function DriverDetailScreen({ navigation, route }: Props) {
  const { driver } = route.params;
  const user = useAuthStore((state) => state.user);
  const { setSelectedDriver } = useBookingDraftStore();

  const photoUrl = driver.driverProfile?.profilePhotoUrl ?? driver.photoUrl;
  const initials = driver.fullName
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const pricePerDay = driver.driverProfile?.pricePerDay;

  function handleSelect() {
    if (!user) {
      navigation.navigate('AuthPrompt');
      return;
    }
    setSelectedDriver(driver);
    navigation.goBack();
  }

  return (
    <Screen topSafeArea>
      <View className="gap-5 px-5 pt-4">
        {/* Header */}
        <View className="flex-row items-center justify-between">
          <BrandLogo variant="xs" />
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
            <Ionicons color="#334155" name="arrow-back" size={20} />
          </TouchableOpacity>
        </View>

        {/* Profile card */}
        <View className="items-center gap-3 rounded-3xl bg-white p-6"
          style={{ elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}
        >
          {photoUrl ? (
            <Image
              className="h-28 w-28 rounded-full bg-slate-200"
              resizeMode="cover"
              source={{ uri: photoUrl }}
            />
          ) : (
            <View className="h-28 w-28 items-center justify-center rounded-full bg-brand-blue">
              <Text className="text-3xl font-black text-white">{initials}</Text>
            </View>
          )}

          <View className="items-center">
            <Text className="text-2xl font-black text-slate-950">{driver.fullName}</Text>
            <View className="mt-1 flex-row items-center gap-1.5 rounded-full bg-green-50 px-3 py-1">
              <View className="h-2 w-2 rounded-full bg-green-500" />
              <Text className="text-xs font-bold text-green-700">
                Chauffeur certifié · {driver.city}
              </Text>
            </View>
          </View>

          <StarRow rating={driver.ratingAverage} />

          {driver.missionsCount ? (
            <Text className="text-xs text-slate-400">{driver.missionsCount} mission{driver.missionsCount > 1 ? 's' : ''} effectuée{driver.missionsCount > 1 ? 's' : ''}</Text>
          ) : null}
        </View>

        {/* Info rows */}
        <View className="gap-3">
          <InfoRow
            icon="briefcase-outline"
            label="Expérience"
            value={driver.driverProfile?.experienceYears ? `${driver.driverProfile.experienceYears} ans` : undefined}
          />
          <InfoRow
            icon="card-outline"
            label="Catégories permis"
            value={driver.driverProfile?.licenseCategories}
          />
          {pricePerDay ? (
            <InfoRow
              icon="cash-outline"
              label="Tarif chauffeur"
              value={`${formatFcfa(pricePerDay)} / jour`}
            />
          ) : null}
        </View>

        {/* CTA */}
        {user ? (
          <PrimaryButton onPress={handleSelect}>
            Choisir ce chauffeur
          </PrimaryButton>
        ) : (
          <View className="gap-3">
            <View className="flex-row items-start gap-2 rounded-xl bg-blue-50 px-3 py-3">
              <Ionicons color="#3B63D4" name="information-circle-outline" size={16} />
              <Text className="flex-1 text-xs leading-4 text-blue-700">
                Créez un compte pour ajouter ce chauffeur à votre réservation.
              </Text>
            </View>
            <PrimaryButton onPress={handleSelect}>
              Créer un compte pour réserver
            </PrimaryButton>
          </View>
        )}
      </View>
    </Screen>
  );
}
