import { FieldValue } from 'firebase-admin/firestore';

import { db } from '../firebase';
import type { BookingDocument, PaymentProvider, PaymentStatus } from '../types';

export async function getOwnedBooking(bookingId: string, uid: string) {
  const bookingRef = db.collection('bookings').doc(bookingId);
  const bookingSnapshot = await bookingRef.get();

  if (!bookingSnapshot.exists) {
    throw new Error('Booking not found');
  }

  const booking = bookingSnapshot.data() as BookingDocument;

  if (booking.clientId !== uid) {
    throw new Error('Forbidden');
  }

  if (booking.paymentStatus !== 'unpaid' && booking.paymentStatus !== 'failed') {
    throw new Error('Booking is not payable');
  }

  return { booking, bookingRef };
}

export async function createPaymentRecord(params: {
  amount: number;
  bookingId: string;
  clientId: string;
  currency: 'XAF';
  method: string;
  phone?: string;
  provider: PaymentProvider;
  reference: string;
}) {
  const paymentRef = db.collection('payments').doc(params.reference);

  await paymentRef.set({
    ...params,
    createdAt: FieldValue.serverTimestamp(),
    status: 'pending',
    updatedAt: FieldValue.serverTimestamp(),
  });

  return paymentRef;
}

export async function getUserPaymentProfile(uid: string) {
  const userSnapshot = await db.collection('users').doc(uid).get();
  const user = userSnapshot.data() as { email?: string; fullName?: string; phone?: string } | undefined;

  return {
    email: user?.email ?? `client-${uid}@camrent.local`,
    fullName: user?.fullName ?? 'Client CamRent',
    phone: user?.phone,
  };
}

export async function markBookingPaymentPending(bookingId: string) {
  await db.collection('bookings').doc(bookingId).update({
    paymentStatus: 'pending',
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function updatePaymentFromProvider(params: {
  provider: PaymentProvider;
  reference: string;
  status: PaymentStatus;
  raw: unknown;
}) {
  const paymentRef = db.collection('payments').doc(params.reference);
  const paymentSnapshot = await paymentRef.get();

  if (!paymentSnapshot.exists) {
    throw new Error('Payment not found');
  }

  const payment = paymentSnapshot.data() as { bookingId: string; provider: PaymentProvider };

  if (payment.provider !== params.provider) {
    throw new Error('Payment provider mismatch');
  }

  const bookingRef = db.collection('bookings').doc(payment.bookingId);

  await db.runTransaction(async (transaction) => {
    transaction.update(paymentRef, {
      providerStatus: params.status,
      rawCallback: params.raw,
      status: params.status,
      updatedAt: FieldValue.serverTimestamp(),
    });

    if (params.status === 'success') {
      transaction.update(bookingRef, {
        paymentStatus: 'paid',
        status: 'confirmed',
        updatedAt: FieldValue.serverTimestamp(),
      });
      return;
    }

    if (params.status === 'failed') {
      transaction.update(bookingRef, {
        paymentStatus: 'failed',
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  });
}
