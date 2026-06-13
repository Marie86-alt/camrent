import { FieldValue } from 'firebase-admin/firestore';
import type { Request, Response } from 'express';

import { db } from '../firebase';
import { getAuthenticatedUid, sendJson } from '../http';
import type { BookingDocument } from '../types';
import { sendExpoPush } from './bookingNotifications';

type OwnerCancelBookingRequest = {
  bookingId?: string;
};

function assertString(value: unknown, field: string) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${field} est requis.`);
  }

  return value.trim();
}

export async function handleOwnerCancelBooking(request: Request, response: Response) {
  const uid = await getAuthenticatedUid(request);
  if (!uid) {
    sendJson(response, 401, { error: 'Unauthorized' });
    return;
  }

  const body = request.body as OwnerCancelBookingRequest;
  const bookingId = assertString(body.bookingId, 'bookingId');
  const bookingRef = db.collection('bookings').doc(bookingId);

  const result = await db.runTransaction(async (transaction) => {
    const bookingSnapshot = await transaction.get(bookingRef);

    if (!bookingSnapshot.exists) {
      throw new Error('Reservation introuvable.');
    }

    const booking = bookingSnapshot.data() as BookingDocument;

    if (booking.ownerId !== uid) {
      throw new Error('Vous ne pouvez annuler que vos propres reservations.');
    }

    if (booking.status !== 'pending' && booking.status !== 'confirmed') {
      throw new Error("Cette reservation ne peut plus etre annulee.");
    }

    const refundStatus = booking.paymentStatus === 'paid' ? 'requested' : 'none';
    const refundAmount = booking.paymentStatus === 'paid' ? booking.totalPrice : 0;

    transaction.update(bookingRef, {
      cancelledAt: FieldValue.serverTimestamp(),
      cancelledBy: 'owner',
      cancellationFee: 0,
      cancellationPolicy: 'owner_cancelled',
      refundAmount,
      refundStatus,
      status: 'cancelled',
    });

    return {
      refundAmount,
      refundStatus,
    };
  });

  const bookingSnapshot = await bookingRef.get();
  const booking = bookingSnapshot.data() as BookingDocument | undefined;
  if (booking?.clientId) {
    await sendExpoPush(
      booking.clientId,
      'Reservation annulee',
      "Le proprietaire a annule votre reservation. Si le paiement est deja effectue, le remboursement integral est demande.",
      { bookingId, type: 'booking_owner_cancelled' },
    );
  }

  sendJson(response, 200, result);
}
