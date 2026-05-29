import { Text, View } from 'react-native';

import type { Booking, BookingStatus } from '../types/models';
import { formatFcfa } from '../utils/currency';
import { formatDate } from '../utils/dates';

type BookingCardProps = {
  booking: Booking;
};

type StatusStyle = { label: string; textColor: string; bgColor: string };

const STATUS_MAP: Record<BookingStatus, StatusStyle> = {
  pending: { label: 'En attente', textColor: 'text-yellow-700', bgColor: 'bg-yellow-50' },
  confirmed: { label: 'Confirmée', textColor: 'text-green-700', bgColor: 'bg-green-50' },
  cancelled: { label: 'Annulée', textColor: 'text-cameroonRed', bgColor: 'bg-red-50' },
  completed: { label: 'Terminée', textColor: 'text-slate-600', bgColor: 'bg-slate-100' },
};

function toDate(value: Date): Date {
  return typeof (value as any).toDate === 'function' ? (value as any).toDate() : value;
}

export function BookingCard({ booking }: BookingCardProps) {
  const status = STATUS_MAP[booking.status] ?? STATUS_MAP.pending;
  const carLabel =
    booking.carBrand && booking.carModel
      ? `${booking.carBrand} ${booking.carModel}`
      : 'Véhicule réservé';

  return (
    <View
      className="mb-3 rounded-xl bg-white p-4"
      style={{
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      }}
    >
      <View className="flex-row items-center justify-between gap-3">
        <Text className="flex-1 text-base font-bold text-slate-950">{carLabel}</Text>
        <Text
          className={`rounded-full px-3 py-1 text-xs font-semibold ${status.bgColor} ${status.textColor}`}
        >
          {status.label}
        </Text>
      </View>

      <Text className="mt-3 text-sm text-slate-500">
        {formatDate(toDate(booking.startDate))} → {formatDate(toDate(booking.endDate))}
      </Text>

      <View className="mt-1 flex-row items-center justify-between">
        <Text className="text-sm text-slate-500">
          {booking.totalDays} jour{booking.totalDays > 1 ? 's' : ''} · {booking.paymentMethod}
        </Text>
        <Text className="text-lg font-black text-cameroonGreen">
          {formatFcfa(booking.totalPrice)}
        </Text>
      </View>

      {booking.driverLicense ? (
        <Text className="mt-2 text-xs text-slate-400">
          Permis {booking.driverLicense.licenseNumber} - Cat. {booking.driverLicense.categories}
        </Text>
      ) : null}
    </View>
  );
}
