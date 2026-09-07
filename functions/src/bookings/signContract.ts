import { FieldValue } from 'firebase-admin/firestore';
import type { Request, Response } from 'express';

import { db } from '../firebase';
import { getAuthenticatedUid, sendJson } from '../http';

function buildContractRef(bookingId: string) {
  const year = new Date().getFullYear();
  return `CR-${year}-${bookingId.slice(-6).toUpperCase()}`;
}

function assertSignatureDataUrl(value: unknown) {
  if (typeof value !== 'string' || !value.startsWith('data:image/png;base64,')) {
    throw new Error('Signature invalide.');
  }

  if (value.length > 900_000) {
    throw new Error('Signature trop lourde.');
  }

  return value;
}

export async function handleSignContract(request: Request, response: Response) {
  const uid = await getAuthenticatedUid(request);

  if (!uid) {
    sendJson(response, 401, { error: 'Unauthorized' });
    return;
  }

  const bookingId = request.body?.bookingId;

  if (typeof bookingId !== 'string' || bookingId.trim().length === 0) {
    throw new Error('bookingId est requis.');
  }

  const signatureDataUrl = assertSignatureDataUrl(request.body?.signatureDataUrl);
  const bookingRef = db.collection('bookings').doc(bookingId);
  const contractRef = buildContractRef(bookingId);

  await db.runTransaction(async (transaction) => {
    const bookingSnapshot = await transaction.get(bookingRef);

    if (!bookingSnapshot.exists) {
      throw new Error('Reservation introuvable.');
    }

    const booking = bookingSnapshot.data() as {
      clientId?: string;
      contractStatus?: string;
      status?: string;
    };

    if (booking.clientId !== uid) {
      throw new Error('Signature non autorisee pour cette reservation.');
    }

    if (booking.status === 'cancelled') {
      throw new Error('Une reservation annulee ne peut pas etre signee.');
    }

    transaction.update(bookingRef, {
      clientSignatureUrl: signatureDataUrl,
      contractRef,
      contractSignedAt: FieldValue.serverTimestamp(),
      contractStatus: 'client_signed',
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  sendJson(response, 200, { contractRef });
}
