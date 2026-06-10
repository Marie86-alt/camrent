import { Ionicons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';

import type { Booking, BookingStatus } from '../types/models';
import { formatFcfa } from '../utils/currency';
import { formatDateRange } from '../utils/dates';
import { toJsDate } from '../utils/firestoreDate';

type BookingCardProps = {
  booking: Booking;
  onCancel?: () => void;
  onSignContract?: () => void;
  onReview?: () => void;
};

type StatusStyle = {
  label: string;
  color: string;
  bg: string;
  border: string;
};

const TEXT = {
  carFallback: 'V\u00e9hicule r\u00e9serv\u00e9',
  contractSigned: 'Contrat sign\u00e9',
  dot: '\u00b7',
};

const STATUS_MAP: Record<BookingStatus, StatusStyle> = {
  pending: { label: 'En attente', color: '#ca8a04', bg: '#fefce8', border: '#facc15' },
  confirmed: { label: 'Confirm\u00e9e', color: '#3B63D4', bg: '#eff6ff', border: '#bfdbfe' },
  cancelled: { label: 'Annul\u00e9e', color: '#b91c1c', bg: '#fef2f2', border: '#fca5a5' },
  completed: { label: 'Termin\u00e9e', color: '#64748b', bg: '#f8fafc', border: '#cbd5e1' },
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

export function BookingCard({ booking, onCancel, onSignContract, onReview }: BookingCardProps) {
  const status = STATUS_MAP[booking.status] ?? STATUS_MAP.pending;
  const carLabel =
    booking.carBrand && booking.carModel
      ? `${booking.carBrand} ${booking.carModel}`
      : TEXT.carFallback;
  const paymentIcon = PAYMENT_ICONS[booking.paymentMethod] ?? 'cash-outline';
  const paymentColor = PAYMENT_COLORS[booking.paymentMethod] ?? '#64748b';
  const canCancel = booking.status === 'pending' || booking.status === 'confirmed';
  const cancellationFee = booking.cancellationFee ?? 0;

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
      <View className="gap-3 p-4">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="text-base font-bold text-slate-950">{carLabel}</Text>
            <Text className="mt-0.5 text-xs text-slate-500">
              {formatDateRange(toJsDate(booking.startDate), toJsDate(booking.endDate))}
            </Text>
          </View>
          <View className="rounded-full px-3 py-1" style={{ backgroundColor: status.bg }}>
            <Text className="text-xs font-bold" style={{ color: status.color }}>
              {status.label}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-1.5">
            <Ionicons color={paymentColor} name={paymentIcon} size={14} />
            <Text className="text-xs text-slate-500">
              {booking.totalDays} jour{booking.totalDays > 1 ? 's' : ''} {TEXT.dot}{' '}
              {booking.paymentMethod}
            </Text>
          </View>
          <Text className="text-base font-black text-brand-blue">
            {formatFcfa(booking.totalPrice)}
          </Text>
        </View>

        {booking.driverLicense ? (
          <View className="flex-row items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-2">
            <Ionicons color="#64748b" name="id-card-outline" size={13} />
            <Text className="text-xs text-slate-400">
              Permis {booking.driverLicense.licenseNumber} {TEXT.dot} Cat.{' '}
              {booking.driverLicense.categories}
            </Text>
          </View>
        ) : null}

        {booking.status === 'confirmed' &&
          (booking.contractStatus === 'client_signed' ? (
            <View className="flex-row items-center gap-2 rounded-xl bg-blue-50 px-3 py-2.5">
              <Ionicons color="#3B63D4" name="shield-checkmark" size={15} />
              <Text className="text-xs font-bold text-brand-blue">{TEXT.contractSigned}</Text>
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
          ) : null)}

        {canCancel && onCancel ? (
          <TouchableOpacity
            activeOpacity={0.85}
            className="flex-row items-center justify-center gap-2 rounded-xl bg-red-50 py-2.5"
            style={{ borderWidth: 1, borderColor: '#fecaca' }}
            onPress={onCancel}
          >
            <Ionicons color="#b91c1c" name="close-circle-outline" size={15} />
            <Text className="text-xs font-bold text-red-700">Annuler la réservation</Text>
          </TouchableOpacity>
        ) : null}

        {booking.status === 'cancelled' && booking.cancellationPolicy ? (
          <View className="rounded-xl bg-slate-50 px-3 py-2">
            <Text className="text-xs font-semibold text-slate-500">
              {booking.cancellationPolicy === 'free_before_48h'
                ? 'Annulation sans frais'
                : `Frais d'annulation : ${formatFcfa(cancellationFee)}`}
            </Text>
          </View>
        ) : null}

        {booking.status === 'completed' && !booking.reviewSubmitted && onReview ? (
          <TouchableOpacity
            activeOpacity={0.85}
            className="flex-row items-center justify-center gap-2 rounded-xl bg-amber-50 py-2.5"
            style={{ borderWidth: 1, borderColor: '#fde68a' }}
            onPress={onReview}
          >
            <Ionicons color="#ca8a04" name="star-outline" size={15} />
            <Text className="text-xs font-bold text-yellow-700">Laisser un avis</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}
