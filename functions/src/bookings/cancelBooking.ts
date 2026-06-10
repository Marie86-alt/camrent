import { FieldValue } from 'firebase-admin/firestore';
import type { Request, Response } from 'express';

import { db } from '../firebase';
import { getAuthenticatedUid, sendJson } from '../http';
import type { BookingDocument } from '../types';

type CancelBookingRequest = {
  bookingId?: string;
};

function assertString(value: unknown, field: string) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${field} est requis.`);
  }

  return value.trim();
}

function toDate(value: unknown) {
  if (typeof (value as { toDate?: () => Date })?.toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }

  return new Date(String(value));
}

function calculateCancellation(totalPrice: number, startDate: Date, now: Date) {
  const msBeforeStart = startDate.getTime() - now.getTime();
  const hoursBeforeStart = msBeforeStart / (1000 * 60 * 60);
  const isFree = hoursBeforeStart >= 48;
  const cancellationFee = isFree ? 0 : Math.round(totalPrice * 0.1);

  return {
    cancellationFee,
    cancellationPolicy: isFree ? 'free_before_48h' : 'late_10_percent',
    refundAmount: Math.max(0, totalPrice - cancellationFee),
  } as const;
}

export async function handleCancelBooking(request: Request, response: Response) {
  const uid = await getAuthenticatedUid(request);
  if (!uid) {
    sendJson(response, 401, { error: 'Unauthorized' });
    return;
  }

  const body = request.body as CancelBookingRequest;
  const bookingId = assertString(body.bookingId, 'bookingId');
  const bookingRef = db.collection('bookings').doc(bookingId);
  const now = new Date();

  const result = await db.runTransaction(async (transaction) => {
    const bookingSnapshot = await transaction.get(bookingRef);

    if (!bookingSnapshot.exists) {
      throw new Error('Reservation introuvable.');
    }

    const booking = bookingSnapshot.data() as BookingDocument & {
      startDate?: unknown;
    };

    if (booking.clientId !== uid) {
      throw new Error('Vous ne pouvez annuler que vos propres reservations.');
    }

    if (booking.status !== 'pending' && booking.status !== 'confirmed') {
      throw new Error("Cette reservation ne peut plus etre annulee.");
    }

    const startDate = toDate(booking.startDate);
    if (Number.isNaN(startDate.getTime())) {
      throw new Error('Date de reservation invalide.');
    }

    const cancellation = calculateCancellation(booking.totalPrice, startDate, now);
    const refundStatus = booking.paymentStatus === 'paid' ? 'requested' : 'none';

    transaction.update(bookingRef, {
      cancelledAt: FieldValue.serverTimestamp(),
      cancellationFee: cancellation.cancellationFee,
      cancellationPolicy: cancellation.cancellationPolicy,
      refundAmount: cancellation.refundAmount,
      refundStatus,
      status: 'cancelled',
    });

    return cancellation;
  });

  sendJson(response, 200, result);
}
