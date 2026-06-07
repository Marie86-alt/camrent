import { collection, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';

import { auth, db } from './firebase';
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

function getCreateBookingEndpoint() {
  const explicit = process.env.EXPO_PUBLIC_CREATE_BOOKING_API_URL;
  if (explicit) return explicit;

  const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
  return projectId ? `https://us-central1-${projectId}.cloudfunctions.net/createBooking` : undefined;
}

export async function createBooking(payload: CreateBookingPayload) {
  const endpoint = getCreateBookingEndpoint();
  if (!endpoint) {
    throw new Error('Endpoint createBooking manquant.');
  }

  const token = await auth.currentUser?.getIdToken();
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      carId: payload.car.id,
      driverId: payload.driverId,
      driverLicense: payload.driverLicense,
      endDate: payload.endDate.toISOString(),
      paymentMethod: payload.paymentMethod,
      startDate: payload.startDate.toISOString(),
      withDriver: payload.withDriver ?? false,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Reservation impossible.');
  }

  const body = (await response.json()) as { bookingId: string; totalPrice: number };

  return {
    id: body.bookingId,
    totalPrice: body.totalPrice,
  };
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
