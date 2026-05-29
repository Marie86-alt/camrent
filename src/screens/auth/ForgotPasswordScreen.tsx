import { useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { BackButton } from '../../components/BackButton';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Screen } from '../../components/Screen';
import { resetPassword } from '../../services/authService';
import type { ForgotPasswordScreenProps } from '../../types/navigation';

export function ForgotPasswordScreen({ navigation }: ForgotPasswordScreenProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    try {
      setLoading(true);
      await resetPassword(email);
      Alert.alert('Email envoyé', 'Consultez votre boîte mail pour réinitialiser votre mot de passe.');
      navigation.goBack();
    } catch {
      Alert.alert('Erreur', "Impossible d'envoyer le lien de réinitialisation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View className="gap-6 pt-12">
        <BackButton navigation={navigation} />
        <View>
          <Text className="text-3xl font-black text-slate-950">Mot de passe oublié</Text>
          <Text className="mt-2 text-base text-slate-600">
            Entrez votre email pour recevoir un lien de réinitialisation.
          </Text>
        </View>

        <View className="gap-1.5">
          <Text className="text-sm font-semibold text-slate-700">Adresse email</Text>
          <TextInput
            autoCapitalize="none"
            className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-slate-950"
            keyboardType="email-address"
            onChangeText={setEmail}
            onSubmitEditing={submit}
            placeholder="exemple@email.com"
            placeholderTextColor="#94a3b8"
            returnKeyType="done"
            value={email}
          />
        </View>

        <PrimaryButton disabled={!email} loading={loading} onPress={submit}>
          Envoyer le lien
        </PrimaryButton>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text className="text-center font-semibold text-cameroonGreen">Retour à la connexion</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}
