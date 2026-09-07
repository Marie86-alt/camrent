import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { doc, onSnapshot } from 'firebase/firestore';

import { PAYMENT_PROVIDER_BY_METHOD } from '../../constants/cameroon';
import { BackButton } from '../../components/BackButton';
import { PaymentModal } from '../../components/PaymentModal';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Screen } from '../../components/Screen';
import { SuccessOverlay } from '../../components/ui';
import { db } from '../../services/firebase';
import { isOfflineError } from '../../services/networkGuard';
import { requestMobileMoneyPayment } from '../../services/paymentService';
import type { PaymentMethod } from '../../types/models';
import type { PaymentScreenProps } from '../../types/navigation';
import { formatFcfa } from '../../utils/currency';
import { isValidCameroonPhone } from '../../utils/validation';
import { useToast } from '../../components/ui';
import { hapticWarning, hapticError } from '../../utils/haptics';

export function PaymentScreen({ navigation, route }: PaymentScreenProps) {
  const { t } = useTranslation();
  const { amount, bookingId, paymentMethod } = route.params;
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [waitingForConfirmation, setWaitingForConfirmation] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const toast = useToast();

  const handlePaymentReturn = useCallback((url: string | null) => {
    if (!url || !url.startsWith('autofixpro://payment-return')) {
      return;
    }

    toast.info('Retour du paiement reçu. Vérification de la confirmation...');
    setWaitingForConfirmation(true);
  }, [toast]);

  useEffect(() => {
    const subscription = Linking.addEventListener('url', ({ url }) => handlePaymentReturn(url));

    Linking.getInitialURL()
      .then(handlePaymentReturn)
      .catch(() => undefined);

    return () => subscription.remove();
  }, [handlePaymentReturn]);

  useEffect(() => {
    if (!waitingForConfirmation) {
      return undefined;
    }

    return onSnapshot(doc(db, 'bookings', bookingId), (snapshot) => {
      const paymentStatus = snapshot.data()?.paymentStatus;

      if (paymentStatus === 'paid') {
        setWaitingForConfirmation(false);
        toast.success('Paiement confirmé. Votre location est confirmée.');
        setSuccessMessage('Paiement confirmé. Votre location est confirmée.');
      }

      if (paymentStatus === 'failed') {
        setWaitingForConfirmation(false);
        hapticError();
        toast.error('Le paiement a échoué. Réessayez avec un autre moyen de paiement.');
      }
    });
  }, [bookingId, toast, waitingForConfirmation]);

  const submit = async (method: PaymentMethod, phone?: string) => {
    if (method !== 'Carte bancaire' && !isValidCameroonPhone(phone ?? '')) {
      hapticWarning();
      toast.warning(t('auth.phone_invalid'));
      return;
    }

    try {
      setLoading(true);
      const payment = await requestMobileMoneyPayment({
        amount,
        bookingId,
        failureReturnUrl: `autofixpro://payment-return?bookingId=${encodeURIComponent(bookingId)}&status=failed`,
        method,
        phone,
        provider: PAYMENT_PROVIDER_BY_METHOD[method],
        returnUrl: `autofixpro://payment-return?bookingId=${encodeURIComponent(bookingId)}&status=success`,
      });
      setModalVisible(false);
      setWaitingForConfirmation(true);

      if (payment.checkoutUrl) {
        await Linking.openURL(payment.checkoutUrl);
      }

      toast.success(t('payment.success_ref', { ref: payment.reference }));
    } catch (error) {
      if (isOfflineError(error)) {
        hapticWarning();
        toast.warning(error.message);
        return;
      }
      hapticError();
      toast.error(error instanceof Error ? error.message : t('payment.error'));
    } finally {
      setLoading(false);
    }
  };

  const finishSuccess = useCallback(() => {
    setSuccessMessage('');
    navigation.popToTop();
  }, [navigation]);

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
          <Text className="text-sm text-slate-500">{t('payment.amount_label')}</Text>
          <Text className="text-4xl font-black text-brand-blue">{formatFcfa(amount)}</Text>
          <View className="flex-row items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1">
            <Ionicons color="#64748b" name={paymentMethod === 'Carte bancaire' ? 'card-outline' : 'phone-portrait-outline'} size={14} />
            <Text className="text-sm text-slate-600">{paymentMethod}</Text>
          </View>
        </View>

        <View className="gap-2 rounded-xl bg-amber-50 p-4">
          <View className="flex-row items-center gap-2">
            <Ionicons color="#92400e" name="information-circle-outline" size={16} />
            <Text className="text-sm font-semibold text-amber-900">{t('payment.instructions_title')}</Text>
          </View>
          <Text className="text-sm leading-5 text-amber-800">{t('payment.instructions')}</Text>
        </View>

        <PrimaryButton onPress={() => setModalVisible(true)}>
          {t('payment.proceed_cta')}
        </PrimaryButton>
      </View>

      <PaymentModal
        amount={amount}
        loading={loading}
        onClose={() => setModalVisible(false)}
        onSubmit={submit}
        visible={modalVisible}
      />
      <SuccessOverlay
        message={successMessage}
        onDone={finishSuccess}
        visible={Boolean(successMessage)}
      />
    </Screen>
  );
}
