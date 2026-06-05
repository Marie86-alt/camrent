import { addDoc, collection, doc, onSnapshot, query, serverTimestamp, Timestamp, updateDoc, where } from 'firebase/firestore';

import { db } from './firebase';
import type { Booking, BookingStatus, Car, DriverLicense, PaymentMethod } from '../types/models';

export type CreateBookingPayload = {
  car: Car;
  clientId: string;
  endDate: Date;
  driverLicense: DriverLicense;
  paymentMethod: PaymentMethod;
  startDate: Date;
  totalDays: number;
  totalPrice: number;
  withDriver?: boolean;
  driverId?: string;
  driverName?: string;
  driverPhotoUrl?: string;
  driverPricePerDay?: number;
};

export async function createBooking(payload: CreateBookingPayload) {
  const driverFields = payload.driverId
    ? {
        driverId: payload.driverId,
        driverName: payload.driverName ?? '',
        driverPricePerDay: payload.driverPricePerDay ?? 0,
        ...(payload.driverPhotoUrl ? { driverPhotoUrl: payload.driverPhotoUrl } : {}),
      }
    : {};

  const ref = await addDoc(collection(db, 'bookings'), {
    carId: payload.car.id,
    carBrand: payload.car.brand,
    carModel: payload.car.model,
    ownerId: payload.car.ownerId,
    clientId: payload.clientId,
    startDate: Timestamp.fromDate(payload.startDate),
    endDate: Timestamp.fromDate(payload.endDate),
    totalDays: payload.totalDays,
    totalPrice: payload.totalPrice,
    paymentMethod: payload.paymentMethod,
    paymentStatus: 'unpaid',
    driverLicense: payload.driverLicense,
    status: 'pending',
    createdAt: serverTimestamp(),
    withDriver: payload.withDriver ?? false,
    ...driverFields,
  });

  if (payload.driverId) {
    import('./notificationService')
      .then(({ sendPushNotificationToUser }) =>
        sendPushNotificationToUser(
          payload.driverId!,
          'Nouvelle mission 🚗',
          `Demande pour ${payload.car.brand} ${payload.car.model} — ${payload.totalDays} jour${payload.totalDays > 1 ? 's' : ''}`,
        ),
      )
      .catch(() => {});
  }

  return ref;
}

export function subscribeToDriverBookings(driverId: string, onData: (bookings: Booking[]) => void, onError: () => void) {
  const q = query(collection(db, 'bookings'), where('driverId', '==', driverId));
  return onSnapshot(
    q,
    (snapshot) => onData(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Booking)),
    onError,
  );
}

export function subscribeToClientBookings(clientId: string, onData: (bookings: Booking[]) => void, onError: () => void) {
  const bookingsQuery = query(collection(db, 'bookings'), where('clientId', '==', clientId));

  return onSnapshot(
    bookingsQuery,
    (snapshot) => onData(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Booking)),
    onError,
  );
}

export function subscribeToOwnerBookings(ownerId: string, onData: (bookings: Booking[]) => void, onError: () => void) {
  const bookingsQuery = query(collection(db, 'bookings'), where('ownerId', '==', ownerId));

  return onSnapshot(
    bookingsQuery,
    (snapshot) => onData(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Booking)),
    onError,
  );
}

export function updateBookingStatus(bookingId: string, status: Extract<BookingStatus, 'cancelled' | 'confirmed'>) {
  return updateDoc(doc(db, 'bookings', bookingId), { status });
}
