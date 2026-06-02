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

import { BrandLogo } from '../../components/BrandLogo';
import { PrimaryButton } from '../../components/PrimaryButton';
import { DEMO_PASSWORD } from '../../services/demoData';
import { loginWithEmail } from '../../services/authService';
import { hasFirebaseConfig } from '../../services/firebase';
import { useAuthStore } from '../../store/authStore';
import type { AppUser } from '../../types/models';
import type { LoginScreenProps } from '../../types/navigation';

const CAR_BG_URI =
  'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&h=1300&fit=crop&crop=center&q=85';

function getLoginErrorMessage(error: unknown) {
  const code = (error as { code?: string; message?: string }).code;
  const message = (error as { message?: string }).message;

  if (code === 'auth/user-not-found' || code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
    return 'Aucun compte Firebase Auth ne correspond a cet email/mot de passe.';
  }

  if (code === 'auth/invalid-email') {
    return "L'adresse email est invalide.";
  }

  if (message === 'user-profile-not-found') {
    return "Connexion Auth reussie, mais le profil Firestore users/{uid} est introuvable.";
  }

  return message || 'Verifiez votre email et votre mot de passe.';
}

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
      setUser(credentials.user as AppUser);
    } catch (error) {
      Alert.alert('Connexion impossible', getLoginErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#08122d' }}>
      <StatusBar style="light" />
      <Image
        resizeMode="cover"
        source={{ uri: CAR_BG_URI }}
        style={{ position: 'absolute', width: '100%', height: '100%' }}
      />
      <View
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(8, 18, 45, 0.68)',
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
            <View style={{ alignItems: 'flex-start', paddingTop: 18, paddingBottom: 32 }}>
              <BrandLogo variant="mini" dark />
              <Text
                style={{
                  color: 'rgba(255,255,255,0.72)',
                  marginTop: 18,
                  fontSize: 15,
                  lineHeight: 22,
                }}
              >
                Louez une voiture au Cameroun{'\n'}en quelques minutes.
              </Text>
            </View>
            <View
              style={{
                backgroundColor: 'rgba(8, 18, 45, 0.62)',
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
                    Mode demo
                  </Text>
                  <Text style={{ color: 'rgba(253,230,138,0.8)', fontSize: 12 }}>
                    Client : client@autofixpro.cm
                  </Text>
                  <Text style={{ color: 'rgba(253,230,138,0.8)', fontSize: 12 }}>
                    Proprietaire : owner@autofixpro.cm
                  </Text>
                  <Text style={{ color: 'rgba(253,230,138,0.8)', fontSize: 12 }}>
                    Mot de passe : {DEMO_PASSWORD}
                  </Text>
                </View>
              ) : null}
              <View style={{ gap: 14 }}>
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
                      placeholder="........"
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
                <PrimaryButton
                  disabled={!email || !password}
                  loading={loading}
                  onPress={login}
                >
                  Se connecter
                </PrimaryButton>
              </View>
              {!hasFirebaseConfig ? (
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => {
                      setEmail('client@autofixpro.cm');
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
                      setEmail('owner@autofixpro.cm');
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
                    Mot de passe oublie ?
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                  <Text
                    style={{
                      textAlign: 'center',
                      fontWeight: '700',
                      color: '#93c5fd',
                      fontSize: 14,
                    }}
                  >
                    Creer un compte
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
