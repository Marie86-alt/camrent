import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';

import { SignaturePad } from '../../components/SignaturePad';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Screen } from '../../components/Screen';
import { useAuth } from '../../hooks/useAuth';
import { buildContractText, signContract } from '../../services/contractService';
import { hasFirebaseConfig } from '../../services/firebase';
import type { ContractScreenProps } from '../../types/navigation';

export function ContractScreen({ navigation, route }: ContractScreenProps) {
  const { booking } = route.params;
  const { user } = useAuth();
  const [signatureBase64, setSignatureBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const clientName = user?.fullName ?? booking.driverLicense.fullName;
  const contractText = buildContractText(booking, clientName);
  const contractRef = booking.contractRef ?? `CR-${new Date().getFullYear()}-${booking.id.slice(-6).toUpperCase()}`;

  const handleSign = async () => {
    if (!signatureBase64) {
      Alert.alert('Signature requise', 'Veuillez apposer votre signature avant de valider.');
      return;
    }

    try {
      setLoading(true);

      if (!hasFirebaseConfig) {
        Alert.alert(
          'Contrat signé (démo)',
          'En mode démo, la signature n\'est pas enregistrée. Configurez Firebase pour activer les contrats.',
          [{ text: 'OK', onPress: () => navigation.goBack() }],
        );
        return;
      }

      await signContract(booking, signatureBase64);

      Alert.alert(
        'Contrat signé',
        `Votre signature électronique a été enregistrée.\nRéférence : ${contractRef}`,
        [{ text: 'Terminer', onPress: () => navigation.goBack() }],
      );
    } catch {
      Alert.alert('Erreur', 'Impossible d\'enregistrer la signature. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll={false} topSafeArea={false}>
      <View className="flex-1">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20, paddingBottom: 8 }}
        >
          {/* ─── En-tête ─── */}
          <View className="mb-6 items-center gap-3">
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-brand-blue">
              <Ionicons color="white" name="document-text" size={26} />
            </View>
            <View className="items-center gap-1">
              <Text className="text-xl font-black text-slate-950">Contrat de location</Text>
              <Text className="text-xs font-semibold text-slate-400">{contractRef}</Text>
            </View>

            {booking.contractStatus === 'client_signed' ? (
              <View className="flex-row items-center gap-2 rounded-full bg-blue-50 px-4 py-2">
                <Ionicons color="#3B63D4" name="shield-checkmark" size={16} />
                <Text className="text-sm font-bold text-brand-blue">Contrat déjà signé</Text>
              </View>
            ) : (
              <View className="flex-row items-center gap-2 rounded-full bg-amber-50 px-4 py-2">
                <Ionicons color="#ca8a04" name="time-outline" size={16} />
                <Text className="text-sm font-bold text-amber-700">En attente de votre signature</Text>
              </View>
            )}
          </View>

          {/* ─── Corps du contrat ─── */}
          <View
            className="mb-6 rounded-2xl bg-white p-5"
            style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}
          >
            <Text
              className="text-xs leading-6 text-slate-700"
              style={{ fontFamily: 'monospace' }}
              selectable
            >
              {contractText}
            </Text>
          </View>

          {/* ─── Bloc signature ─── */}
          {booking.contractStatus !== 'client_signed' ? (
            <View className="gap-4">
              <View className="flex-row items-center gap-2">
                <View className="flex-1 h-px bg-slate-200" />
                <Text className="text-xs font-bold text-slate-400">SIGNATURE ÉLECTRONIQUE</Text>
                <View className="flex-1 h-px bg-slate-200" />
              </View>

              <Text className="text-center text-xs text-slate-500">
                En signant, vous acceptez les conditions ci-dessus et reconnaissez que cette signature électronique a valeur contractuelle.
              </Text>

              {signatureBase64 ? (
                <View
                  className="items-center gap-3 rounded-2xl bg-blue-50 p-4"
                  style={{ borderWidth: 1.5, borderColor: '#bfdbfe' }}
                >
                  <Ionicons color="#3B63D4" name="checkmark-circle" size={28} />
                  <Text className="font-bold text-brand-blue">Signature apposée</Text>
                  <Text className="text-xs text-slate-500">
                    Appuyez sur "Signer le contrat" pour finaliser.
                  </Text>
                </View>
              ) : (
                <View
                  className="rounded-2xl overflow-hidden"
                  style={{ shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 }}
                >
                  <SignaturePad
                    onSignature={(base64) => setSignatureBase64(base64)}
                    onClear={() => setSignatureBase64(null)}
                    onEmpty={() =>
                      Alert.alert('Signature vide', 'Tracez votre signature avant de valider.')
                    }
                  />
                </View>
              )}

              <PrimaryButton loading={loading} onPress={handleSign}>
                Signer le contrat
              </PrimaryButton>
            </View>
          ) : (
            <View className="items-center gap-3 rounded-2xl bg-blue-50 p-6 mb-4" style={{ borderWidth: 1, borderColor: '#bfdbfe' }}>
              <Ionicons color="#3B63D4" name="shield-checkmark" size={32} />
              <Text className="font-black text-brand-blue">Contrat signé électroniquement</Text>
              <Text className="text-center text-xs text-slate-500">
                Votre signature a été enregistrée et archivée de façon sécurisée.
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Screen>
  );
}
