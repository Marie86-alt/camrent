import { Ionicons } from '@expo/vector-icons';
import { Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useState } from 'react';

import { PAYMENT_METHODS } from '../constants/cameroon';
import type { PaymentMethod } from '../types/models';
import { formatFcfa } from '../utils/currency';
import { PrimaryButton } from './PrimaryButton';

type PaymentModalProps = {
  amount: number;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (method: PaymentMethod, phone?: string) => void;
  visible: boolean;
};

export function PaymentModal({ amount, loading, onClose, onSubmit, visible }: PaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethod>('MTN MoMo');
  const [phone, setPhone] = useState('+237');
  const requiresPhone = method !== 'Carte bancaire';

  return (
    <Modal animationType="slide" transparent visible={visible}>
      <View className="flex-1 justify-end bg-black/50">
        <View className="gap-5 rounded-t-3xl bg-white p-5 pb-8">
          <View className="flex-row items-center justify-between">
            <Text className="text-xl font-black text-slate-950">Confirmer le paiement</Text>
            <TouchableOpacity
              className="h-8 w-8 items-center justify-center rounded-full bg-slate-100"
              onPress={onClose}
            >
              <Ionicons color="#64748b" name="close" size={18} />
            </TouchableOpacity>
          </View>

          <View className="items-center rounded-xl bg-blue-50 py-4">
            <Text className="text-sm text-slate-500">Total</Text>
            <Text className="text-3xl font-black text-brand-blue">{formatFcfa(amount)}</Text>
          </View>

          <View className="gap-2">
            <Text className="text-sm font-semibold text-slate-700">Moyen de paiement</Text>
            <View className="flex-row flex-wrap gap-2">
              {PAYMENT_METHODS.map((item) => (
                <TouchableOpacity
                  className={`min-w-[30%] flex-1 rounded-xl border px-3 py-3 ${
                    method === item ? 'border-brand-blue bg-blue-50' : 'border-slate-200 bg-white'
                  }`}
                  key={item}
                  onPress={() => setMethod(item)}
                >
                  <Text
                    className={`text-center text-sm font-semibold ${
                      method === item ? 'text-brand-blue' : 'text-slate-600'
                    }`}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {requiresPhone ? (
            <View className="gap-1.5">
              <Text className="text-sm font-semibold text-slate-700">Numero Mobile Money</Text>
              <View className="flex-row items-center gap-2 rounded-xl border border-slate-200 bg-white px-4">
                <Ionicons color="#94a3b8" name="phone-portrait-outline" size={18} />
                <TextInput
                  className="h-12 flex-1 text-slate-950"
                  keyboardType="phone-pad"
                  onChangeText={setPhone}
                  placeholder="+237 6XX XXX XXX"
                  placeholderTextColor="#94a3b8"
                  value={phone}
                />
              </View>
            </View>
          ) : (
            <View className="rounded-xl bg-blue-50 p-4">
              <Text className="text-sm leading-5 text-blue-800">
                Vous serez redirige vers une page bancaire securisee pour finaliser le paiement par carte.
              </Text>
            </View>
          )}

          <PrimaryButton loading={loading} onPress={() => onSubmit(method, requiresPhone ? phone : undefined)}>
            Payer maintenant
          </PrimaryButton>
        </View>
      </View>
    </Modal>
  );
}
