import { collection, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';

import { auth, db } from './firebase';
import { assertOnlineForAction } from './networkGuard';
import type { Booking, BookingInspection, BookingStatus, Car, DriverLicense, PaymentMethod } from '../types/models';

export type CreateBookingPayload = {
  car: Car;
  clientId: string;
  endDate: Date;
  endTime?: string;
  driverLicense: DriverLicense | null;
  paymentMethod: PaymentMethod;
  startDate: Date;
  startTime?: string;
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

function getCancelBookingEndpoint() {
  const explicit = process.env.EXPO_PUBLIC_CANCEL_BOOKING_API_URL;
  if (explicit) return explicit;

  const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
  return projectId ? `https://us-central1-${projectId}.cloudfunctions.net/cancelBooking` : undefined;
}

function getOwnerCancelBookingEndpoint() {
  const explicit = process.env.EXPO_PUBLIC_OWNER_CANCEL_BOOKING_API_URL;
  if (explicit) return explicit;

  const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
  return projectId ? `https://us-central1-${projectId}.cloudfunctions.net/ownerCancelBooking` : undefined;
}

function cleanBookingError(body: string) {
  try {
    const parsed = JSON.parse(body) as { error?: unknown };
    if (typeof parsed.error === 'string') return parsed.error;
  } catch {
    // Keep the raw response fallback below.
  }

  return body;
}

async function authFetch(endpoint: string, body: unknown) {
  await assertOnlineForAction();

  const token = await auth.currentUser?.getIdToken();
  return fetch(endpoint, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

export async function createBooking(payload: CreateBookingPayload) {
  const endpoint = getCreateBookingEndpoint();
  if (!endpoint) {
    throw new Error('Endpoint createBooking manquant.');
  }

  const response = await authFetch(endpoint, {
      carId: payload.car.id,
      driverId: payload.driverId,
      driverLicense: payload.driverLicense,
      endDate: payload.endDate.toISOString(),
      endTime: payload.endTime,
      paymentMethod: payload.paymentMethod,
      startDate: payload.startDate.toISOString(),
      startTime: payload.startTime,
      withDriver: payload.withDriver ?? false,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(cleanBookingError(message) || 'Réservation impossible.');
  }

  const body = (await response.json()) as { bookingId: string; totalPrice: number };

  return {
    id: body.bookingId,
    totalPrice: body.totalPrice,
  };
}

export async function cancelBooking(bookingId: string) {
  const endpoint = getCancelBookingEndpoint();
  if (!endpoint) {
    throw new Error('Endpoint cancelBooking manquant.');
  }

  const response = await authFetch(endpoint, { bookingId });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(cleanBookingError(message) || 'Annulation impossible.');
  }

  return response.json() as Promise<{
    cancellationFee: number;
    cancellationPolicy: 'free_before_48h' | 'late_10_percent';
    refundAmount: number;
  }>;
}

export async function ownerCancelBooking(bookingId: string) {
  const endpoint = getOwnerCancelBookingEndpoint();
  if (!endpoint) {
    throw new Error('Endpoint ownerCancelBooking manquant.');
  }

  const response = await authFetch(endpoint, { bookingId });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(cleanBookingError(message) || 'Annulation proprietaire impossible.');
  }

  return response.json() as Promise<{
    refundAmount: number;
    refundStatus: 'none' | 'requested';
  }>;
}

export type DateRange = {
  startDate: Date;
  endDate: Date;
};

function timestampToDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (value !== null && typeof value === 'object' && typeof (value as { toDate?: unknown }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  return new Date(String(value));
}

export function subscribeToCarBookings(
  carId: string,
  onData: (ranges: DateRange[]) => void,
  onError: () => void,
) {
  const q = query(
    collection(db, 'bookings'),
    where('carId', '==', carId),
    where('status', 'in', ['pending', 'confirmed']),
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const ranges = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          startDate: timestampToDate(data.startDate),
          endDate: timestampToDate(data.endDate),
        };
      });
      onData(ranges);
    },
    onError,
  );
}

export function bookingRangesToOccupiedDates(
  ranges: DateRange[],
  blockedDates: string[] = [],
): Set<string> {
  const occupied = new Set<string>(blockedDates);
  for (const { startDate, endDate } of ranges) {
    const current = new Date(startDate);
    current.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    while (current <= end) {
      occupied.add(current.toISOString().slice(0, 10));
      current.setDate(current.getDate() + 1);
    }
  }
  return occupied;
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

export async function updateBookingStatus(bookingId: string, status: Extract<BookingStatus, 'confirmed' | 'completed'>) {
  await assertOnlineForAction();
  return updateDoc(doc(db, 'bookings', bookingId), { status });
}

export async function saveBookingInspection(bookingId: string, inspection: BookingInspection) {
  await assertOnlineForAction();
  return updateDoc(doc(db, 'bookings', bookingId), { inspection });
}
