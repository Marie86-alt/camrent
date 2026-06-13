import { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

import { BackButton } from '../../components/BackButton';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Screen } from '../../components/Screen';
import { useToast } from '../../components/ui';
import { resetPassword } from '../../services/authService';
import type { ForgotPasswordScreenProps } from '../../types/navigation';
import { hapticSuccess, hapticError } from '../../utils/haptics';

export function ForgotPasswordScreen({ navigation }: ForgotPasswordScreenProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const submit = async () => {
    try {
      setLoading(true);
      await resetPassword(email);
      hapticSuccess(); toast.success('Email envoyé — consultez votre boîte mail.');
      navigation.goBack();
    } catch {
      hapticError(); toast.error("Impossible d'envoyer le lien de réinitialisation.");
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
          <Text className="text-center font-semibold text-brand-blue">Retour à la connexion</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}
