import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';

import { PrimaryButton } from '../../components/PrimaryButton';
import { Screen } from '../../components/Screen';
import { subscribeToAllBookings, subscribeToPaymentFlows, updatePlatformFinanceSettings } from '../../services/adminService';
import type { Booking, PaymentFlow, PaymentMethod } from '../../types/models';
import { formatFcfa } from '../../utils/currency';

const methods: PaymentMethod[] = ['MTN MoMo', 'Orange Money', 'Carte bancaire'];

function methodTotal(bookings: Booking[], method: PaymentMethod) {
  return bookings
    .filter((booking) => booking.paymentMethod === method && booking.paymentStatus === 'paid')
    .reduce((sum, booking) => sum + booking.totalPrice, 0);
}

function paymentStatusLabel(status?: PaymentFlow['status']) {
  if (status === 'success') return 'Succes';
  if (status === 'failed') return 'Echec';
  return 'En attente';
}

function PaymentRow({ payment }: { payment: PaymentFlow }) {
  return (
    <View className="mb-3 rounded-xl border border-slate-100 bg-white p-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-base font-black text-slate-950">{payment.reference ?? payment.id}</Text>
          <Text className="mt-1 text-sm text-slate-500">
            {payment.method ?? payment.provider ?? 'Methode inconnue'} - {payment.phone ?? 'Telephone absent'}
          </Text>
          <Text className="mt-1 text-xs font-semibold text-slate-400">{payment.bookingId ?? 'Reservation non liee'}</Text>
        </View>
        <View className="items-end">
          <Text className="text-sm font-black text-slate-950">{formatFcfa(payment.amount || 0)}</Text>
          <Text className="mt-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
            {paymentStatusLabel(payment.status)}
          </Text>
        </View>
      </View>
    </View>
  );
}

export function AdminFinanceScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<PaymentFlow[]>([]);
  const [commissionRate, setCommissionRate] = useState(10);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeBookings = subscribeToAllBookings(
      (items) => {
        setBookings(items);
        setLoadingBookings(false);
        setError(null);
      },
      () => {
        setError('Impossible de charger les reservations.');
        setLoadingBookings(false);
      },
    );

    const unsubscribePayments = subscribeToPaymentFlows(
      (items) => {
        setPayments(items);
        setLoadingPayments(false);
        setError(null);
      },
      () => {
        setError('Impossible de charger les paiements.');
        setLoadingPayments(false);
      },
    );

    return () => {
      unsubscribeBookings();
      unsubscribePayments();
    };
  }, []);

  const paidRevenue = useMemo(
    () => bookings.filter((booking) => booking.paymentStatus === 'paid').reduce((sum, booking) => sum + booking.totalPrice, 0),
    [bookings],
  );
  const pendingRevenue = useMemo(
    () => bookings.filter((booking) => booking.paymentStatus === 'pending').reduce((sum, booking) => sum + booking.totalPrice, 0),
    [bookings],
  );
  const failedCount = bookings.filter((booking) => booking.paymentStatus === 'failed').length;
  const platformCommission = Math.round((paidRevenue * commissionRate) / 100);

  async function saveCommission() {
    try {
      setSaving(true);
      await updatePlatformFinanceSettings({ commissionRate });
      Alert.alert('Parametres sauvegardes', `Commission plateforme: ${commissionRate}%.`);
    } catch {
      Alert.alert('Erreur', "Le taux de commission n'a pas pu etre sauvegarde.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <View className="gap-5">
        <View>
          <Text className="text-xs font-bold uppercase text-brand-blue">Module 6</Text>
          <Text className="text-3xl font-black text-slate-950">Paiements & finances</Text>
          <Text className="mt-1 text-sm text-slate-500">Suivi des encaissements, echecs et commissions plateforme.</Text>
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1 rounded-xl bg-white p-4">
            <Text className="text-xl font-black text-slate-950">{formatFcfa(paidRevenue)}</Text>
            <Text className="text-xs font-semibold text-slate-500">Encaisse</Text>
          </View>
          <View className="flex-1 rounded-xl bg-white p-4">
            <Text className="text-xl font-black text-amber-600">{formatFcfa(pendingRevenue)}</Text>
            <Text className="text-xs font-semibold text-slate-500">En attente</Text>
          </View>
          <View className="flex-1 rounded-xl bg-white p-4">
            <Text className="text-xl font-black text-red-600">{failedCount}</Text>
            <Text className="text-xs font-semibold text-slate-500">Echecs</Text>
          </View>
        </View>

        {loadingBookings || loadingPayments ? (
          <View className="items-center justify-center py-16">
            <ActivityIndicator color="#3B63D4" size="large" />
          </View>
        ) : error ? (
          <View className="rounded-xl bg-red-50 p-4">
            <Text className="font-semibold text-red-700">{error}</Text>
          </View>
        ) : (
          <View className="gap-5">
            <View className="rounded-xl bg-white p-4">
              <View className="mb-3 flex-row items-center gap-2">
                <Ionicons color="#3B63D4" name="analytics-outline" size={22} />
                <Text className="text-lg font-black text-slate-950">Suivi par methode</Text>
              </View>
              {methods.map((method) => (
                <View className="flex-row items-center justify-between border-b border-slate-100 py-3" key={method}>
                  <Text className="text-sm font-bold text-slate-700">{method}</Text>
                  <Text className="text-sm font-black text-slate-950">{formatFcfa(methodTotal(bookings, method))}</Text>
                </View>
              ))}
            </View>

            <View className="rounded-xl bg-white p-4">
              <View className="mb-3 flex-row items-center gap-2">
                <Ionicons color="#3B63D4" name="cash-outline" size={22} />
                <Text className="text-lg font-black text-slate-950">Commission plateforme</Text>
              </View>
              <Text className="text-sm text-slate-500">Taux actuel</Text>
              <View className="mt-3 flex-row items-center justify-between">
                <TouchableOpacity
                  className="h-10 w-10 items-center justify-center rounded-full bg-slate-100"
                  onPress={() => setCommissionRate((value) => Math.max(0, value - 1))}
                >
                  <Ionicons color="#334155" name="remove" size={20} />
                </TouchableOpacity>
                <View className="items-center">
                  <Text className="text-3xl font-black text-slate-950">{commissionRate}%</Text>
                  <Text className="text-xs font-semibold text-slate-500">{formatFcfa(platformCommission)} sur l'encaisse</Text>
                </View>
                <TouchableOpacity
                  className="h-10 w-10 items-center justify-center rounded-full bg-slate-100"
                  onPress={() => setCommissionRate((value) => Math.min(50, value + 1))}
                >
                  <Ionicons color="#334155" name="add" size={20} />
                </TouchableOpacity>
              </View>
              <View className="mt-4">
                <PrimaryButton loading={saving} onPress={saveCommission}>
                  Sauvegarder le taux
                </PrimaryButton>
              </View>
            </View>

            <View>
              <View className="mb-3 flex-row items-center justify-between">
                <Text className="text-lg font-black text-slate-950">Flux financiers</Text>
                <TouchableOpacity
                  className="rounded-full bg-slate-950 px-4 py-2"
                  onPress={() => Alert.alert('Export', 'Export CSV / Excel a brancher sur le back-office web.')}
                >
                  <Text className="text-xs font-bold text-white">Export</Text>
                </TouchableOpacity>
              </View>
              {payments.length === 0 ? (
                <View className="rounded-xl bg-white p-4">
                  <Text className="font-semibold text-slate-500">Aucun flux paiement pour le moment.</Text>
                </View>
              ) : (
                payments.map((payment) => <PaymentRow key={payment.id} payment={payment} />)
              )}
            </View>
          </View>
        )}
      </View>
    </Screen>
  );
}
