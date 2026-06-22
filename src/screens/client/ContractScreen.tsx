import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BackButton } from '../../components/BackButton';
import { SignaturePad } from '../../components/SignaturePad';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Screen } from '../../components/Screen';
import { useToast } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { buildContractText, signContract } from '../../services/contractService';
import { hasFirebaseConfig } from '../../services/firebase';
import type { ContractScreenProps } from '../../types/navigation';
import { hapticSuccess, hapticWarning, hapticError } from '../../utils/haptics';

export function ContractScreen({ navigation, route }: ContractScreenProps) {
  const { t } = useTranslation();
  const { booking } = route.params;
  const { user } = useAuth();
  const toast = useToast();
  const [signatureBase64, setSignatureBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const clientName = user?.fullName ?? booking.driverLicense.fullName;
  const contractText = buildContractText(booking, clientName);
  const contractRef = booking.contractRef ?? `CR-${new Date().getFullYear()}-${booking.id.slice(-6).toUpperCase()}`;

  const handleSign = async () => {
    if (!signatureBase64) {
      hapticWarning(); toast.warning(t('contract.empty_warning'));
      return;
    }

    try {
      setLoading(true);

      if (!hasFirebaseConfig) {
        toast.info('Mode démo — signature non enregistrée. Configurez Firebase pour activer les contrats.');
        navigation.goBack();
        return;
      }

      await signContract(booking, signatureBase64);

      hapticSuccess();
      toast.success(t('contract.sign_success', { ref: contractRef }));
      navigation.goBack();
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : t('contract.sign_error');

      console.warn('Contract signature failed', error);
      hapticError();
      toast.error(
        message.toLowerCase().includes('permission')
          ? 'Autorisation Firebase manquante. Déployez les règles Firestore et Storage.'
          : message,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll={false} topSafeArea>
      <View className="flex-1">
        <View className="px-5 pt-4 pb-1">
          <BackButton navigation={navigation} />
        </View>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20, paddingBottom: 8 }}
        >
          {/* Header */}
          <View className="mb-6 items-center gap-3">
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-brand-blue">
              <Ionicons color="white" name="document-text" size={26} />
            </View>
            <View className="items-center gap-1">
              <Text className="text-xl font-black text-slate-950">{t('contract.title')}</Text>
              <Text className="text-xs font-semibold text-slate-400">{contractRef}</Text>
            </View>

            {booking.contractStatus === 'client_signed' ? (
              <View className="flex-row items-center gap-2 rounded-full bg-blue-50 px-4 py-2">
                <Ionicons color="#3B63D4" name="shield-checkmark" size={16} />
                <Text className="text-sm font-bold text-brand-blue">{t('contract.already_signed')}</Text>
              </View>
            ) : (
              <View className="flex-row items-center gap-2 rounded-full bg-amber-50 px-4 py-2">
                <Ionicons color="#ca8a04" name="time-outline" size={16} />
                <Text className="text-sm font-bold text-amber-700">{t('contract.pending_signature')}</Text>
              </View>
            )}
          </View>

          {/* Contract body */}
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

          {/* Signature block */}
          {booking.contractStatus !== 'client_signed' ? (
            <View className="gap-4">
              <View className="flex-row items-center gap-2">
                <View className="flex-1 h-px bg-slate-200" />
                <Text className="text-xs font-bold text-slate-400">{t('contract.signature_section')}</Text>
                <View className="flex-1 h-px bg-slate-200" />
              </View>

              <Text className="text-center text-xs text-slate-500">
                {t('contract.signature_consent')}
              </Text>

              {signatureBase64 ? (
                <View
                  className="items-center gap-3 rounded-2xl bg-blue-50 p-4"
                  style={{ borderWidth: 1.5, borderColor: '#bfdbfe' }}
                >
                  <Ionicons color="#3B63D4" name="checkmark-circle" size={28} />
                  <Text className="font-bold text-brand-blue">{t('contract.signature_done')}</Text>
                  <Text className="text-xs text-slate-500">
                    {t('contract.signature_done_hint')}
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
                    onEmpty={() => { hapticWarning(); toast.warning(t('contract.draw_warning')); }}
                  />
                </View>
              )}

              <PrimaryButton loading={loading} onPress={handleSign}>
                {t('contract.sign_cta')}
              </PrimaryButton>
            </View>
          ) : (
            <View className="items-center gap-3 rounded-2xl bg-blue-50 p-6 mb-4" style={{ borderWidth: 1, borderColor: '#bfdbfe' }}>
              <Ionicons color="#3B63D4" name="shield-checkmark" size={32} />
              <Text className="font-black text-brand-blue">{t('contract.signed_title')}</Text>
              <Text className="text-center text-xs text-slate-500">
                {t('contract.signed_subtitle')}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Screen>
  );
}
