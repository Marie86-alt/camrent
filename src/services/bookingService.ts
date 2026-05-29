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
};

export function createBooking(payload: CreateBookingPayload) {
  return addDoc(collection(db, 'bookings'), {
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
  });
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
