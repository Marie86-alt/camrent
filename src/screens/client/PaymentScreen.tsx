import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Linking, Text, View } from 'react-native';

import { PAYMENT_PROVIDER_BY_METHOD } from '../../constants/cameroon';
import { BackButton } from '../../components/BackButton';
import { PaymentModal } from '../../components/PaymentModal';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Screen } from '../../components/Screen';
import { isOfflineError } from '../../services/networkGuard';
import { requestMobileMoneyPayment } from '../../services/paymentService';
import type { PaymentMethod } from '../../types/models';
import type { PaymentScreenProps } from '../../types/navigation';
import { formatFcfa } from '../../utils/currency';
import { isValidCameroonPhone } from '../../utils/validation';
import { useToast } from '../../components/ui';
import { hapticSuccess, hapticWarning, hapticError } from '../../utils/haptics';

export function PaymentScreen({ navigation, route }: PaymentScreenProps) {
  const { amount, bookingId, paymentMethod } = route.params;
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const submit = async (method: PaymentMethod, phone?: string) => {
    if (method !== 'Carte bancaire' && !isValidCameroonPhone(phone ?? '')) {
      hapticWarning();
      toast.warning('Numéro invalide — utilisez le format +237XXXXXXXXX.');
      return;
    }

    try {
      setLoading(true);
      const payment = await requestMobileMoneyPayment({
        amount,
        bookingId,
        method,
        phone,
        provider: PAYMENT_PROVIDER_BY_METHOD[method],
      });
      setModalVisible(false);

      if (payment.checkoutUrl) {
        await Linking.openURL(payment.checkoutUrl);
      }

      hapticSuccess();
      toast.success(`Paiement initié · Réf : ${payment.reference}`);
      navigation.popToTop();
    } catch (error) {
      if (isOfflineError(error)) {
        hapticWarning();
        toast.warning(error.message);
        return;
      }

      hapticError();
      toast.error(error instanceof Error ? error.message : 'Impossible de lancer le paiement.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen topSafeArea>
      <View className="gap-6">
        <BackButton navigation={navigation} />
        <View
          className="items-center gap-3 rounded-xl bg-white py-8"
          style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}
        >
          <View className="h-14 w-14 items-center justify-center rounded-full bg-blue-50">
            <Ionicons color="#3B63D4" name="shield-checkmark-outline" size={28} />
          </View>
          <Text className="text-sm text-slate-500">Montant a regler</Text>
          <Text className="text-4xl font-black text-brand-blue">{formatFcfa(amount)}</Text>
          <View className="flex-row items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1">
            <Ionicons color="#64748b" name={paymentMethod === 'Carte bancaire' ? 'card-outline' : 'phone-portrait-outline'} size={14} />
            <Text className="text-sm text-slate-600">{paymentMethod}</Text>
          </View>
        </View>

        <View className="gap-2 rounded-xl bg-amber-50 p-4">
          <View className="flex-row items-center gap-2">
            <Ionicons color="#92400e" name="information-circle-outline" size={16} />
            <Text className="text-sm font-semibold text-amber-900">Instructions</Text>
          </View>
          <Text className="text-sm leading-5 text-amber-800">
            Avec Mobile Money, vous recevrez une notification sur votre telephone. Avec la carte bancaire,
            vous serez redirige vers une page de paiement securisee.
          </Text>
        </View>

        <PrimaryButton onPress={() => setModalVisible(true)}>
          Proceder au paiement
        </PrimaryButton>
      </View>

      <PaymentModal
        amount={amount}
        loading={loading}
        onClose={() => setModalVisible(false)}
        onSubmit={submit}
        visible={modalVisible}
      />
    </Screen>
  );
}
