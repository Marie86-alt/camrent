import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { BackButton } from '../../components/BackButton';
import { CitySearchInput } from '../../components/CitySearchInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Screen } from '../../components/Screen';
import { registerWithEmail } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import type { CameroonCity, UserRole } from '../../types/models';
import type { RegisterScreenProps } from '../../types/navigation';
import { isValidCameroonPhone } from '../../utils/validation';

const roles: { label: string; value: UserRole; icon: string }[] = [
  { label: 'Client', value: 'client', icon: 'person-outline' },
  { label: 'Propriétaire', value: 'owner', icon: 'car-outline' },
];

export function RegisterScreen({ navigation }: RegisterScreenProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+237');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('client');
  const [city, setCity] = useState<CameroonCity>('Yaounde');
  const [loading, setLoading] = useState(false);
  const setUser = useAuthStore((state) => state.setUser);

  const register = async () => {
    if (!isValidCameroonPhone(phone)) {
      Alert.alert(
        'Numéro invalide',
        'Utilisez un numéro camerounais au format +237XXXXXXXXX.',
      );
      return;
    }

    try {
      setLoading(true);
      const user = await registerWithEmail({ city, email, fullName, password, phone, role });
      setUser(user);
    } catch {
      Alert.alert('Inscription impossible', 'Vérifiez les informations et réessayez.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View className="gap-6 pt-8">
        <BackButton navigation={navigation} />
        <View>
          <Text className="text-3xl font-black text-slate-950">Créer un compte</Text>
          <Text className="mt-2 text-base text-slate-600">
            Rejoignez Autofix Pro comme client ou propriétaire.
          </Text>
        </View>

        <View className="gap-4">
          <View className="gap-1.5">
            <Text className="text-sm font-semibold text-slate-700">Nom complet</Text>
            <TextInput
              className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-slate-950"
              onChangeText={setFullName}
              placeholder="Jean Dupont"
              placeholderTextColor="#94a3b8"
              returnKeyType="next"
              value={fullName}
            />
          </View>

          <View className="gap-1.5">
            <Text className="text-sm font-semibold text-slate-700">Adresse email</Text>
            <TextInput
              autoCapitalize="none"
              className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-slate-950"
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="exemple@email.com"
              placeholderTextColor="#94a3b8"
              returnKeyType="next"
              value={email}
            />
          </View>

          <View className="gap-1.5">
            <Text className="text-sm font-semibold text-slate-700">Téléphone</Text>
            <TextInput
              className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-slate-950"
              keyboardType="phone-pad"
              onChangeText={setPhone}
              placeholder="+237 6XX XXX XXX"
              placeholderTextColor="#94a3b8"
              returnKeyType="next"
              value={phone}
            />
          </View>

          <View className="gap-1.5">
            <Text className="text-sm font-semibold text-slate-700">Mot de passe</Text>
            <View className="relative">
              <TextInput
                className="h-12 rounded-xl border border-slate-200 bg-white px-4 pr-12 text-slate-950"
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#94a3b8"
                returnKeyType="done"
                secureTextEntry={!showPassword}
                value={password}
              />
              <TouchableOpacity
                className="absolute right-4 top-3"
                onPress={() => setShowPassword((v) => !v)}
              >
                <Ionicons
                  color="#94a3b8"
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View className="gap-3">
          <Text className="font-semibold text-slate-800">Profil</Text>
          <View className="flex-row gap-2">
            {roles.map((item) => (
              <TouchableOpacity
                className={`flex-1 flex-row items-center justify-center gap-2 rounded-xl border px-4 py-3 ${
                  role === item.value
                    ? 'border-brand-blue bg-blue-50'
                    : 'border-slate-200 bg-white'
                }`}
                key={item.value}
                onPress={() => setRole(item.value)}
              >
                <Ionicons
                  color={role === item.value ? '#3B63D4' : '#64748b'}
                  name={item.icon as React.ComponentProps<typeof Ionicons>['name']}
                  size={18}
                />
                <Text
                  className={`font-semibold ${
                    role === item.value ? 'text-brand-blue' : 'text-slate-600'
                  }`}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <CitySearchInput label="Ville" onSelectCity={setCity} value={city} />

        <PrimaryButton disabled={!fullName || !email || !password} loading={loading} onPress={register}>
          S'inscrire
        </PrimaryButton>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text className="text-center font-semibold text-brand-blue">J'ai déjà un compte</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}
