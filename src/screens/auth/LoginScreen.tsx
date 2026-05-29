import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '../../components/PrimaryButton';
import { DEMO_PASSWORD } from '../../services/demoData';
import { loginWithEmail } from '../../services/authService';
import { hasFirebaseConfig } from '../../services/firebase';
import { useAuthStore } from '../../store/authStore';
import type { AppUser } from '../../types/models';
import type { LoginScreenProps } from '../../types/navigation';

const CAR_BG_URI =
  'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&h=1300&fit=crop&crop=center&q=85';

export function LoginScreen({ navigation }: LoginScreenProps) {
  const passwordRef = useRef<TextInput>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const setUser = useAuthStore((state) => state.setUser);

  const login = async () => {
    try {
      setLoading(true);
      const credentials = await loginWithEmail(email, password);
      if (!hasFirebaseConfig) {
        setUser(credentials.user as AppUser);
      }
    } catch {
      Alert.alert('Connexion impossible', 'Vérifiez votre email et votre mot de passe.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#030f07' }}>
      <StatusBar style="light" />

      {/* ─── Fond plein écran ─── */}
      <Image
        resizeMode="cover"
        source={{ uri: CAR_BG_URI }}
        style={{ position: 'absolute', width: '100%', height: '100%' }}
      />

      {/* ─── Overlay sombre ─── */}
      <View
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(3, 14, 8, 0.62)',
        }}
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              paddingHorizontal: 22,
              paddingBottom: 24,
              justifyContent: 'space-between',
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ─── Branding ─── */}
            <View style={{ paddingTop: 28, paddingBottom: 32 }}>
              <Text
                style={{
                  color: '#ffffff',
                  fontSize: 46,
                  fontWeight: '900',
                  letterSpacing: -1.5,
                  lineHeight: 50,
                }}
              >
                CamRent
              </Text>

              {/* Drapeau */}
              <View
                style={{
                  flexDirection: 'row',
                  height: 4,
                  width: 100,
                  borderRadius: 99,
                  overflow: 'hidden',
                  marginTop: 10,
                }}
              >
                <View style={{ flex: 1, backgroundColor: '#15803d' }} />
                <View style={{ flex: 1, backgroundColor: '#b91c1c' }} />
                <View style={{ flex: 1, backgroundColor: '#facc15' }} />
              </View>

              <Text
                style={{
                  color: 'rgba(255,255,255,0.72)',
                  marginTop: 12,
                  fontSize: 15,
                  lineHeight: 22,
                }}
              >
                Louez une voiture au Cameroun{'\n'}en quelques minutes.
              </Text>
            </View>

            {/* ─── Carte formulaire (verre fumé) ─── */}
            <View
              style={{
                backgroundColor: 'rgba(3, 14, 8, 0.62)',
                borderRadius: 28,
                padding: 24,
                gap: 18,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.14)',
              }}
            >
              <Text
                style={{ fontSize: 22, fontWeight: '900', color: '#ffffff' }}
              >
                Se connecter
              </Text>

              {/* Bandeau démo */}
              {!hasFirebaseConfig ? (
                <View
                  style={{
                    backgroundColor: 'rgba(253,230,138,0.12)',
                    borderRadius: 14,
                    padding: 14,
                    gap: 4,
                    borderWidth: 1,
                    borderColor: 'rgba(253,230,138,0.3)',
                  }}
                >
                  <Text style={{ fontWeight: '700', color: '#fde68a', fontSize: 13 }}>
                    Mode démo
                  </Text>
                  <Text style={{ color: 'rgba(253,230,138,0.8)', fontSize: 12 }}>
                    Client : client@camrent.cm
                  </Text>
                  <Text style={{ color: 'rgba(253,230,138,0.8)', fontSize: 12 }}>
                    Propriétaire : owner@camrent.cm
                  </Text>
                  <Text style={{ color: 'rgba(253,230,138,0.8)', fontSize: 12 }}>
                    Mot de passe : {DEMO_PASSWORD}
                  </Text>
                </View>
              ) : null}

              {/* Champs */}
              <View style={{ gap: 14 }}>
                {/* Email */}
                <View style={{ gap: 6 }}>
                  <Text
                    style={{ fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.8)' }}
                  >
                    Adresse email
                  </Text>
                  <TextInput
                    autoCapitalize="none"
                    keyboardType="email-address"
                    onChangeText={setEmail}
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    placeholder="exemple@email.com"
                    placeholderTextColor="rgba(255,255,255,0.35)"
                    returnKeyType="next"
                    style={{
                      height: 50,
                      borderRadius: 14,
                      borderWidth: 1.5,
                      borderColor: 'rgba(255,255,255,0.2)',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      paddingHorizontal: 16,
                      color: '#ffffff',
                      fontSize: 15,
                    }}
                    value={email}
                  />
                </View>

                {/* Mot de passe */}
                <View style={{ gap: 6 }}>
                  <Text
                    style={{ fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.8)' }}
                  >
                    Mot de passe
                  </Text>
                  <View style={{ position: 'relative' }}>
                    <TextInput
                      ref={passwordRef}
                      onChangeText={setPassword}
                      onSubmitEditing={login}
                      placeholder="••••••••"
                      placeholderTextColor="rgba(255,255,255,0.35)"
                      returnKeyType="done"
                      secureTextEntry={!showPassword}
                      style={{
                        height: 50,
                        borderRadius: 14,
                        borderWidth: 1.5,
                        borderColor: 'rgba(255,255,255,0.2)',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        paddingHorizontal: 16,
                        paddingRight: 50,
                        color: '#ffffff',
                        fontSize: 15,
                      }}
                      value={password}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword((v) => !v)}
                      style={{ position: 'absolute', right: 14, top: 14 }}
                    >
                      <Ionicons
                        color="rgba(255,255,255,0.5)"
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={22}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Bouton connexion */}
                <PrimaryButton
                  disabled={!email || !password}
                  loading={loading}
                  onPress={login}
                >
                  Se connecter
                </PrimaryButton>
              </View>

              {/* Raccourcis démo */}
              {!hasFirebaseConfig ? (
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => {
                      setEmail('client@camrent.cm');
                      setPassword(DEMO_PASSWORD);
                    }}
                    style={{
                      flex: 1,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.2)',
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      paddingVertical: 10,
                    }}
                  >
                    <Text
                      style={{
                        textAlign: 'center',
                        fontWeight: '600',
                        color: 'rgba(255,255,255,0.75)',
                        fontSize: 13,
                      }}
                    >
                      Compte client
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setEmail('owner@camrent.cm');
                      setPassword(DEMO_PASSWORD);
                    }}
                    style={{
                      flex: 1,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.2)',
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      paddingVertical: 10,
                    }}
                  >
                    <Text
                      style={{
                        textAlign: 'center',
                        fontWeight: '600',
                        color: 'rgba(255,255,255,0.75)',
                        fontSize: 13,
                      }}
                    >
                      Compte proprio
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {/* Liens */}
              <View style={{ gap: 4 }}>
                <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                  <Text
                    style={{
                      textAlign: 'center',
                      fontWeight: '600',
                      color: 'rgba(255,255,255,0.5)',
                      fontSize: 14,
                    }}
                  >
                    Mot de passe oublié ?
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                  <Text
                    style={{
                      textAlign: 'center',
                      fontWeight: '700',
                      color: '#4ade80',
                      fontSize: 14,
                    }}
                  >
                    Créer un compte
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
