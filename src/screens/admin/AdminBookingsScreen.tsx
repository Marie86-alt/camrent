import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';

import { PrimaryButton } from '../../components/PrimaryButton';
import { Screen } from '../../components/Screen';
import { subscribeToAllBookings, updateBookingAdminFields } from '../../services/adminService';
import type { Booking, BookingStatus } from '../../types/models';
import { formatFcfa } from '../../utils/currency';
import { formatDate } from '../../utils/dates';
import { toJsDate } from '../../utils/firestoreDate';

const filters: Array<{ label: string; value: 'all' | BookingStatus }> = [
  { label: 'Toutes', value: 'all' },
  { label: 'En attente', value: 'pending' },
  { label: 'Confirmees', value: 'confirmed' },
  { label: 'Annulees', value: 'cancelled' },
  { label: 'Terminees', value: 'completed' },
];

function toReadableDate(value: Booking['startDate']) {
  if (!value) return 'Non renseigne';
  return formatDate(toJsDate(value));
}

function statusLabel(status: BookingStatus) {
  if (status === 'confirmed') return 'Confirmee';
  if (status === 'cancelled') return 'Annulee';
  if (status === 'completed') return 'Terminee';
  return 'En attente';
}

function BookingRow({ booking, selected, onPress }: { booking: Booking; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      className={`mb-3 rounded-xl border bg-white p-4 ${selected ? 'border-brand-blue' : 'border-slate-100'}`}
      onPress={onPress}
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-base font-black text-slate-950">
            {booking.carBrand} {booking.carModel}
          </Text>
          <Text className="mt-1 text-sm text-slate-500">
            {toReadableDate(booking.startDate)} - {toReadableDate(booking.endDate)}
          </Text>
          <Text className="mt-1 text-xs font-semibold text-slate-400">{booking.clientId}</Text>
        </View>
        <View className="items-end">
          <Text className="text-sm font-black text-slate-950">{formatFcfa(booking.totalPrice)}</Text>
          <Text className="mt-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
            {statusLabel(booking.status)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function DetailLine({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <View className="flex-row items-center justify-between border-b border-slate-100 py-3">
      <Text className="text-sm text-slate-500">{label}</Text>
      <Text className="max-w-[60%] text-right text-sm font-bold text-slate-900">{value || 'Non renseigne'}</Text>
    </View>
  );
}

export function AdminBookingsScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | BookingStatus>('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAllBookings(
      (items) => {
        setBookings(items);
        setSelectedId((current) => current ?? items[0]?.id ?? null);
        setLoading(false);
        setError(null);
      },
      () => {
        setError('Impossible de charger les reservations.');
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  const visibleBookings = useMemo(
    () => (filter === 'all' ? bookings : bookings.filter((booking) => booking.status === filter)),
    [bookings, filter],
  );

  const selectedBooking = useMemo(
    () => bookings.find((booking) => booking.id === selectedId) ?? visibleBookings[0],
    [bookings, selectedId, visibleBookings],
  );

  async function updateSelected(payload: Partial<Booking>, successMessage: string) {
    if (!selectedBooking) return;

    try {
      setSaving(true);
      await updateBookingAdminFields(selectedBooking.id, payload);
      Alert.alert('Action enregistree', successMessage);
    } catch {
      Alert.alert('Erreur', "L'action admin n'a pas pu etre enregistree.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen topSafeArea>
      <View className="gap-5">
        <View>
          <Text className="text-xs font-bold uppercase text-brand-blue">Module 5</Text>
          <Text className="text-3xl font-black text-slate-950">Reservations & litiges</Text>
          <Text className="mt-1 text-sm text-slate-500">Suivi complet des reservations, paiements, documents et litiges.</Text>
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1 rounded-xl bg-white p-4">
            <Text className="text-2xl font-black text-slate-950">{bookings.length}</Text>
            <Text className="text-xs font-semibold text-slate-500">Reservations</Text>
          </View>
          <View className="flex-1 rounded-xl bg-white p-4">
            <Text className="text-2xl font-black text-amber-600">
              {bookings.filter((booking) => booking.paymentStatus === 'pending').length}
            </Text>
            <Text className="text-xs font-semibold text-slate-500">Paiements attente</Text>
          </View>
          <View className="flex-1 rounded-xl bg-white p-4">
            <Text className="text-2xl font-black text-red-600">
              {bookings.filter((booking) => booking.disputeStatus === 'open').length}
            </Text>
            <Text className="text-xs font-semibold text-slate-500">Litiges ouverts</Text>
          </View>
        </View>

        <View className="flex-row flex-wrap gap-2">
          {filters.map((item) => (
            <TouchableOpacity
              className={`rounded-full px-4 py-2 ${filter === item.value ? 'bg-slate-950' : 'bg-white'}`}
              key={item.value}
              onPress={() => setFilter(item.value)}
            >
              <Text className={`text-xs font-bold ${filter === item.value ? 'text-white' : 'text-slate-600'}`}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View className="items-center justify-center py-16">
            <ActivityIndicator color="#3B63D4" size="large" />
          </View>
        ) : error ? (
          <View className="rounded-xl bg-red-50 p-4">
            <Text className="font-semibold text-red-700">{error}</Text>
          </View>
        ) : (
          <View className="gap-5">
            <View>
              <Text className="mb-3 text-lg font-black text-slate-950">Tableau des reservations</Text>
              {visibleBookings.map((booking) => (
                <BookingRow
                  booking={booking}
                  key={booking.id}
                  onPress={() => setSelectedId(booking.id)}
                  selected={selectedBooking?.id === booking.id}
                />
              ))}
            </View>

            {selectedBooking ? (
              <View className="gap-4 rounded-xl bg-white p-4">
                <View className="flex-row items-center gap-2">
                  <Ionicons color="#3B63D4" name="receipt-outline" size={22} />
                  <Text className="flex-1 text-xl font-black text-slate-950">Fiche reservation</Text>
                </View>

                <DetailLine label="Vehicule" value={`${selectedBooking.carBrand} ${selectedBooking.carModel}`} />
                <DetailLine label="Client" value={selectedBooking.clientId} />
                <DetailLine label="Proprietaire" value={selectedBooking.ownerId} />
                <DetailLine label="Debut" value={toReadableDate(selectedBooking.startDate)} />
                <DetailLine label="Fin" value={toReadableDate(selectedBooking.endDate)} />
                <DetailLine label="Montant" value={formatFcfa(selectedBooking.totalPrice)} />
                <DetailLine label="Paiement" value={`${selectedBooking.paymentMethod} - ${selectedBooking.paymentStatus}`} />
                <DetailLine label="Statut" value={statusLabel(selectedBooking.status)} />
                <DetailLine label="Litige" value={selectedBooking.disputeStatus ?? 'none'} />
                <DetailLine label="Caution" value={selectedBooking.depositStatus ?? 'held'} />
                <DetailLine label="Permis" value={selectedBooking.driverLicense?.licenseNumber} />
                <DetailLine label="Expiration permis" value={selectedBooking.driverLicense?.expiryDate} />

                <View className="gap-3 pt-2">
                  <PrimaryButton
                    loading={saving}
                    onPress={() => updateSelected({ disputeStatus: 'open' }, 'Un dossier litige est ouvert.')}
                  >
                    Ouvrir litige
                  </PrimaryButton>
                  <PrimaryButton
                    loading={saving}
                    onPress={() => updateSelected({ disputeStatus: 'resolved' }, 'Le litige est marque comme resolu.')}
                  >
                    Resoudre litige
                  </PrimaryButton>
                  <PrimaryButton
                    loading={saving}
                    onPress={() => updateSelected({ refundStatus: 'approved' }, 'Le remboursement manuel est valide.')}
                  >
                    Valider remboursement
                  </PrimaryButton>
                  <PrimaryButton
                    loading={saving}
                    onPress={() => updateSelected({ depositStatus: 'released' }, 'La caution est liberee.')}
                  >
                    Liberer caution
                  </PrimaryButton>
                </View>
              </View>
            ) : null}
          </View>
        )}
      </View>
    </Screen>
  );
}
