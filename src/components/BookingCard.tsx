import { Ionicons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';

import type { Booking, BookingStatus } from '../types/models';
import { formatFcfa } from '../utils/currency';
import { formatDate } from '../utils/dates';

type BookingCardProps = {
  booking: Booking;
  onSignContract?: () => void;
};

type StatusStyle = {
  label: string;
  color: string;
  bg: string;
  border: string;
};

const STATUS_MAP: Record<BookingStatus, StatusStyle> = {
  pending: { label: 'En attente', color: '#ca8a04', bg: '#fefce8', border: '#facc15' },
  confirmed: { label: 'Confirmée', color: '#3B63D4', bg: '#eff6ff', border: '#bfdbfe' },
  cancelled: { label: 'Annulée', color: '#b91c1c', bg: '#fef2f2', border: '#fca5a5' },
  completed: { label: 'Terminée', color: '#64748b', bg: '#f8fafc', border: '#cbd5e1' },
};

const PAYMENT_ICONS: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  'MTN MoMo': 'phone-portrait-outline',
  'Orange Money': 'phone-landscape-outline',
  'Carte bancaire': 'card-outline',
};

const PAYMENT_COLORS: Record<string, string> = {
  'MTN MoMo': '#eab308',
  'Orange Money': '#f97316',
  'Carte bancaire': '#3b82f6',
};

function toDate(value: Date): Date {
  return typeof (value as any).toDate === 'function' ? (value as any).toDate() : value;
}

export function BookingCard({ booking, onSignContract }: BookingCardProps) {
  const status = STATUS_MAP[booking.status] ?? STATUS_MAP.pending;
  const carLabel =
    booking.carBrand && booking.carModel
      ? `${booking.carBrand} ${booking.carModel}`
      : 'Véhicule réservé';
  const paymentIcon = PAYMENT_ICONS[booking.paymentMethod] ?? 'cash-outline';
  const paymentColor = PAYMENT_COLORS[booking.paymentMethod] ?? '#64748b';

  return (
    <View
      className="mb-3 overflow-hidden rounded-2xl bg-white"
      style={{
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
        borderLeftWidth: 4,
        borderLeftColor: status.border,
      }}
    >
      <View className="p-4 gap-3">
        {/* ─── Header ─── */}
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="text-base font-bold text-slate-950">{carLabel}</Text>
            <Text className="mt-0.5 text-xs text-slate-500">
              {formatDate(toDate(booking.startDate))} → {formatDate(toDate(booking.endDate))}
            </Text>
          </View>
          <View
            className="rounded-full px-3 py-1"
            style={{ backgroundColor: status.bg }}
          >
            <Text className="text-xs font-bold" style={{ color: status.color }}>
              {status.label}
            </Text>
          </View>
        </View>

        {/* ─── Footer ─── */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-1.5">
            <Ionicons color={paymentColor} name={paymentIcon} size={14} />
            <Text className="text-xs text-slate-500">
              {booking.totalDays} jour{booking.totalDays > 1 ? 's' : ''} · {booking.paymentMethod}
            </Text>
          </View>
          <Text className="text-base font-black text-brand-blue">
            {formatFcfa(booking.totalPrice)}
          </Text>
        </View>

        {/* ─── Permis ─── */}
        {booking.driverLicense ? (
          <View className="flex-row items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-2">
            <Ionicons color="#64748b" name="id-card-outline" size={13} />
            <Text className="text-xs text-slate-400">
              Permis {booking.driverLicense.licenseNumber} · Cat. {booking.driverLicense.categories}
            </Text>
          </View>
        ) : null}

        {/* ─── Contrat ─── */}
        {booking.status === 'confirmed' && (
          booking.contractStatus === 'client_signed' ? (
            <View className="flex-row items-center gap-2 rounded-xl bg-blue-50 px-3 py-2.5">
              <Ionicons color="#3B63D4" name="shield-checkmark" size={15} />
              <Text className="text-xs font-bold text-brand-blue">Contrat signé</Text>
            </View>
          ) : onSignContract ? (
            <TouchableOpacity
              activeOpacity={0.85}
              className="flex-row items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5"
              onPress={onSignContract}
            >
              <Ionicons color="white" name="document-text-outline" size={15} />
              <Text className="text-xs font-bold text-white">Signer le contrat</Text>
            </TouchableOpacity>
          ) : null
        )}
      </View>
    </View>
  );
}
